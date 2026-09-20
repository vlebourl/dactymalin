import { beforeAll, describe, expect, it } from 'vitest';
import { creerApp } from '../../app';
import { creerAuth } from '../../auth';
import { creerBase } from '../../db/client';
import { lireEnv } from '../../env';
import { LENTEUR_DICTEE, type Synthese } from '../../lib/voix';

/**
 * #124 — la voix du serveur. Un VRAI PostgreSQL, comme pour les listes : la
 * règle qui compte ici — on ne fait dire au serveur que les mots de SES
 * listes — se vérifie sur la base. Sans `TEST_DATABASE_URL`, sautés.
 */
const URL_TEST = process.env.TEST_DATABASE_URL;
const d = URL_TEST ? describe : describe.skip;

d('voix du serveur', () => {
  let avecVoix: ReturnType<typeof creerApp>;
  let sansVoix: ReturnType<typeof creerApp>;
  const synthetises: string[] = [];
  const lenteurs: number[] = [];
  const synthese: Synthese = async (mot, lenteur) => {
    synthetises.push(mot);
    lenteurs.push(lenteur ?? LENTEUR_DICTEE);
    return mot === 'panne' ? null : Buffer.from(`RIFF${mot}`);
  };

  const inscrire = async (email: string) => {
    const r = await avecVoix.request('/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'motdepasse-solide', name: 'Parent' }),
    });
    expect(r.status).toBe(200);
    return { Cookie: r.headers.get('set-cookie')!.split(';')[0], 'Content-Type': 'application/json' };
  };
  const creerListe = (h: HeadersInit, mots: string[]) =>
    avecVoix.request('/api/listes', {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ nom: 'Semaine', mots }),
    });
  const mot = (app: typeof avecVoix, h: HeadersInit | undefined, m: string) =>
    app.request(`/api/voix/mot?mot=${encodeURIComponent(m)}`, { headers: h });
  const courriel = () => `voix-${Date.now()}-${Math.random().toString(36).slice(2)}@exemple.fr`;

  beforeAll(() => {
    const env = lireEnv({
      NODE_ENV: 'test',
      DATABASE_URL: URL_TEST,
      BETTER_AUTH_SECRET: 'x'.repeat(40),
    } as NodeJS.ProcessEnv);
    const base = creerBase(URL_TEST!);
    const auth = creerAuth(base, env);
    avecVoix = creerApp({ env, base, auth, synthese });
    sansVoix = creerApp({ env, base, auth });
  });

  it('refuse tout accès sans session', async () => {
    expect((await mot(avecVoix, undefined, 'chat')).status).toBe(401);
    expect((await avecVoix.request('/api/voix/etat')).status).toBe(401);
  });

  it('dit si la voix du serveur existe', async () => {
    const h = await inscrire(courriel());
    expect(await (await avecVoix.request('/api/voix/etat', { headers: h })).json()).toEqual({ disponible: true });
    expect(await (await sansVoix.request('/api/voix/etat', { headers: h })).json()).toEqual({ disponible: false });
  });

  it('rend le son d’un mot de la bibliothèque du compte', async () => {
    const h = await inscrire(courriel());
    await creerListe(h, ['papillon', 'un temps']);
    const r = await mot(avecVoix, h, 'un temps');
    expect(r.status).toBe(200);
    expect(r.headers.get('content-type')).toBe('audio/wav');
    expect(r.headers.get('cache-control')).toContain('private');
    expect(Buffer.from(await r.arrayBuffer()).toString()).toBe('RIFFun temps');
  });

  it('ne dit RIEN d’autre : ni un mot libre, ni le mot d’un autre foyer', async () => {
    const nous = await inscrire(courriel());
    const voisins = await inscrire(courriel());
    await creerListe(nous, ['chat']);
    await creerListe(voisins, ['girafe']);
    const avant = synthetises.length;
    expect((await mot(avecVoix, nous, 'anticonstitutionnellement')).status).toBe(404);
    expect((await mot(avecVoix, nous, 'girafe')).status).toBe(404);
    expect((await mot(avecVoix, nous, '')).status).toBe(404);
    expect(synthetises.slice(avant).filter((m) => m !== 'chat')).toEqual([]);
  });

  /* #126 — le nom de la lettre, au barreau 3. Un ensemble FERMÉ : le serveur
     ne dit que ce que `nomDeLettre` sait nommer. */
  describe('nom de lettre', () => {
    const lettre = (app: typeof avecVoix, h: HeadersInit | undefined, c: string) =>
      app.request(`/api/voix/lettre?c=${encodeURIComponent(c)}`, { headers: h });

    it('refuse tout accès sans session', async () => {
      expect((await lettre(avecVoix, undefined, 'a')).status).toBe(401);
    });

    it('dit le NOM du caractère, pas le caractère : « ? » serait muet', async () => {
      const h = await inscrire(courriel());
      const r = await lettre(avecVoix, h, '?');
      expect(r.status).toBe(200);
      expect(r.headers.get('content-type')).toBe('audio/wav');
      expect(Buffer.from(await r.arrayBuffer()).toString()).toBe("RIFFpoint d'interrogation");
    });

    it('ne dit que ce qui a un nom : ni un mot, ni un caractère inconnu', async () => {
      const h = await inscrire(courriel());
      const avant = synthetises.length;
      expect((await lettre(avecVoix, h, 'bonjour')).status).toBe(404);
      expect((await lettre(avecVoix, h, '€')).status).toBe(404);
      expect((await lettre(avecVoix, h, '')).status).toBe(404);
      expect(synthetises.length).toBe(avant);
    });

    it('répond 503 sans Piper', async () => {
      const h = await inscrire(courriel());
      expect((await lettre(sansVoix, h, 'a')).status).toBe(503);
    });
  });

  /* #126 — les consignes lues à voix haute (choix du clavier, guide des
     doigts). Ensemble FERMÉ, lui aussi : les phrases de `consignes.ts`. */
  describe('consigne', () => {
    const consigne = (h: HeadersInit | undefined, t: string) =>
      avecVoix.request(`/api/voix/consigne?t=${encodeURIComponent(t)}`, { headers: h });

    it('dit une consigne de l’app, à un débit de phrase', async () => {
      const h = await inscrire(courriel());
      const r = await consigne(h, 'Appuie sur la touche A');
      expect(r.status).toBe(200);
      expect(Buffer.from(await r.arrayBuffer()).toString()).toBe('RIFFAppuie sur la touche A');
      expect(lenteurs.at(-1)).toBeLessThan(lenteurs[0] ?? 1.35);
    });

    it('ne dit aucune autre phrase, et rien sans session', async () => {
      const h = await inscrire(courriel());
      expect((await consigne(h, 'Dis ce que je veux, gratuitement.')).status).toBe(404);
      expect((await consigne(undefined, 'Appuie sur la touche A')).status).toBe(401);
    });
  });

  it('répond 503 sans Piper, et quand la synthèse échoue', async () => {
    const h = await inscrire(courriel());
    await creerListe(h, ['chat', 'panne']);
    expect((await mot(sansVoix, h, 'chat')).status).toBe(503);
    expect((await mot(avecVoix, h, 'panne')).status).toBe(503);
  });

  it('préchauffe les mots dès que la liste est enregistrée', async () => {
    const h = await inscrire(courriel());
    await creerListe(h, ['hibou', 'genou']);
    await expect.poll(() => synthetises).toEqual(expect.arrayContaining(['hibou', 'genou']));
  });
});
