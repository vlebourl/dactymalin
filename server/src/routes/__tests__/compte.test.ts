import { describe, expect, it, beforeAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { creerApp } from '../../app';
import { creerAuth } from '../../auth';
import { creerBase } from '../../db/client';
import { liste, profil, progression, user } from '../../db/schema';
import { lireEnv } from '../../env';
import { DEFAUTS } from '../../../../src/core/storage';

/**
 * « Partir sans laisser de trace » (#6). Tant que le compte était facultatif,
 * s'en passer était tenable ; obligatoire, il n'y a plus de porte de sortie
 * sans ce bouton.
 *
 * Ces tests parlent à un VRAI PostgreSQL : ce qui est vérifié ici, c'est que
 * les lignes ont DISPARU, et une cascade ne se vérifie pas sur un bouchon.
 */
const URL_TEST = process.env.TEST_DATABASE_URL;
const d = URL_TEST ? describe : describe.skip;

d('suppression du compte', () => {
  let app: ReturnType<typeof creerApp>;
  let base: ReturnType<typeof creerBase>;

  const MDP = 'motdepasse-solide';

  const inscrire = async (email: string) => {
    const r = await app.request('/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: MDP, name: 'Parent' }),
    });
    expect(r.status).toBe(200);
    return { Cookie: r.headers.get('set-cookie')!.split(';')[0], 'Content-Type': 'application/json' };
  };

  /**
   * Un foyer complet : un enfant, sa progression, et une liste. CHAQUE écriture
   * est vérifiée — sans quoi « 0 ligne après suppression » serait vrai d'un
   * foyer qui n'a jamais rien contenu, et le test ne prouverait rien.
   */
  const foyerGarni = async (h: HeadersInit) => {
    const cree = await app.request('/api/profils', {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ prenom: 'Timo' }),
    });
    expect(cree.status).toBe(201);
    const { id } = (await cree.json()) as { id: string };

    const pousse = await app.request(`/api/profils/${id}/progression`, {
      method: 'PUT',
      headers: h,
      body: JSON.stringify({ etat: { ...DEFAUTS, palier: 3 }, majLe: new Date().toISOString() }),
    });
    expect(pousse.status).toBe(200);

    const listeCreee = await app.request('/api/listes', {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ nom: 'Dictée', mots: ['papa'] }),
    });
    expect(listeCreee.status).toBe(201);
    return id;
  };

  const idDuCompte = async (email: string) =>
    (await base.select({ id: user.id }).from(user).where(eq(user.email, email)))[0]?.id;

  beforeAll(() => {
    const env = lireEnv({
      NODE_ENV: 'test',
      DATABASE_URL: URL_TEST,
      BETTER_AUTH_SECRET: 'x'.repeat(40),
    } as NodeJS.ProcessEnv);
    base = creerBase(URL_TEST!);
    app = creerApp({ env, base, auth: creerAuth(base, env) });
  });

  /**
   * #7 — « aucune liaison automatique entre un compte Google et un compte mot
   * de passe de même adresse ». La moitié observable sans Google : une adresse
   * n'ouvre JAMAIS deux comptes. La colonne est unique en base, et le serveur
   * refuse — c'est ce refus qui empêche un tiers d'attirer à lui le titulaire
   * légitime d'une adresse Gmail qu'il ne possède pas.
   */
  it('une adresse déjà prise n’ouvre pas un second compte', async () => {
    const email = `w${Date.now()}@exemple.fr`;
    await inscrire(email);

    const second = await app.request('/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: MDP, name: 'Un autre' }),
    });
    expect(second.status).toBeGreaterThanOrEqual(400);
    expect(((await second.json()) as { code?: string }).code).toMatch(/USER_ALREADY_EXISTS/);
  });

  it('refuse la suppression sans session', async () => {
    expect((await app.request('/api/compte', { method: 'DELETE' })).status).toBe(401);
  });

  it('supprime le compte, et tout ce qu’il contenait part avec lui', async () => {
    const email = `s${Date.now()}@exemple.fr`;
    const h = await inscrire(email);
    const idProfil = await foyerGarni(h);
    const idUser = (await idDuCompte(email))!;
    expect(idUser).toBeTruthy();

    /* Le foyer est bien GARNI avant qu'on le supprime : c'est ce qui donne son
       sens aux « zéro ligne » d'après. */
    expect(await base.select().from(profil).where(eq(profil.userId, idUser))).toHaveLength(1);
    expect(
      await base.select().from(progression).where(eq(progression.profilId, idProfil)),
    ).toHaveLength(1);
    expect(await base.select().from(liste).where(eq(liste.userId, idUser))).toHaveLength(1);

    expect((await app.request('/api/compte', { method: 'DELETE', headers: h })).status).toBe(200);

    // le compte lui-même
    expect(await idDuCompte(email)).toBeUndefined();
    // et sa descendance, par cascade
    expect(await base.select().from(profil).where(eq(profil.userId, idUser))).toHaveLength(0);
    expect(
      await base.select().from(progression).where(eq(progression.profilId, idProfil)),
    ).toHaveLength(0);
    expect(await base.select().from(liste).where(eq(liste.userId, idUser))).toHaveLength(0);
  });

  it('après suppression, les mêmes identifiants ne rouvrent rien', async () => {
    const email = `t${Date.now()}@exemple.fr`;
    const h = await inscrire(email);
    await app.request('/api/compte', { method: 'DELETE', headers: h });

    const reconnexion = await app.request('/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: MDP }),
    });
    /* 401 précisément : « au moins 400 » passerait sur un 500, c'est-à-dire
       sur un serveur cassé pris pour un refus. */
    expect(reconnexion.status).toBe(401);

    /* Et le cookie d'avant ne vaut plus rien : la session est partie avec le
       compte, sinon une page restée ouverte continuerait de servir. */
    expect((await app.request('/api/profils', { headers: h })).status).toBe(401);
  });

  /* Un compte ne supprime QUE le sien : la route ne prend pas d'identifiant,
     elle lit celui de la session. Le voisin doit être intact. */
  it('ne touche jamais au compte d’un autre', async () => {
    const emailA = `u${Date.now()}@exemple.fr`;
    const emailB = `v${Date.now()}@exemple.fr`;
    const a = await inscrire(emailA);
    const b = await inscrire(emailB);
    await foyerGarni(b);
    const idB = (await idDuCompte(emailB))!;

    expect((await app.request('/api/compte', { method: 'DELETE', headers: a })).status).toBe(200);

    expect(await idDuCompte(emailB)).toBe(idB);
    expect(await base.select().from(profil).where(eq(profil.userId, idB))).toHaveLength(1);
    expect(await base.select().from(liste).where(eq(liste.userId, idB))).toHaveLength(1);
    const listeB = (await (await app.request('/api/listes', { headers: b })).json()) as {
      listes: unknown[];
    };
    expect(listeB.listes).toHaveLength(1);
  });
});
