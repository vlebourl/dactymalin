import { courrielUnique } from '../../../../tests/helpers/courriel';
import { beforeAll, describe, expect, it } from 'vitest';
import { creerApp } from '../../app';
import { creerAuth } from '../../auth';
import { creerBase } from '../../db/client';
import { lireEnv } from '../../env';
import { cleAnthropic, user } from '../../db/schema';
import { chiffrer } from '../../lib/chiffrement';
import type { Generateur } from '../../lib/grammaire';
import { eq } from 'drizzle-orm';

/**
 * Mode grammaire — la route des phrases. Un VRAI PostgreSQL, comme pour la
 * voix : la session passe par Better Auth. Sans `TEST_DATABASE_URL`, sautés.
 */
const URL_TEST = process.env.TEST_DATABASE_URL;
const d = URL_TEST ? describe : describe.skip;

d('route /api/grammaire', () => {
  let avec: ReturnType<typeof creerApp>;
  let enPanne: ReturnType<typeof creerApp>;
  let base: ReturnType<typeof creerBase>;
  const SECRET = 'x'.repeat(40);
  let niveauxRecus: unknown = 'jamais appelé';
  const generateur: Generateur = async (niveaux) => {
    niveauxRecus = niveaux;
    return { phrase: 'Le chat dort.', categorie: 'present' };
  };

  /* `avecCle` : le compte reçoit une clé (factice) chiffrée, posée en base comme
     la route PUT le ferait — la vérification est testée dans cle-anthropic. */
  const inscrire = async (email: string, avecCle = true) => {
    const r = await avec.request('/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'motdepasse-solide', name: 'Parent' }),
    });
    expect(r.status).toBe(200);
    if (avecCle) {
      const id = (await base.select({ id: user.id }).from(user).where(eq(user.email, email)))[0]!.id;
      await base.insert(cleAnthropic).values({ userId: id, chiffre: chiffrer('sk-ant-exemple-factice-0000000000ab12', SECRET), fin: 'ab12' });
    }
    return { Cookie: r.headers.get('set-cookie')!.split(';')[0] };
  };

  beforeAll(() => {
    const env = lireEnv({
      NODE_ENV: 'test',
      DATABASE_URL: URL_TEST,
      BETTER_AUTH_SECRET: SECRET,
    } as NodeJS.ProcessEnv);
    base = creerBase(URL_TEST!);
    const auth = creerAuth(base, env);
    avec = creerApp({ env, base, auth, fabriqueGrammaire: () => generateur });
    enPanne = creerApp({ env, base, auth, fabriqueGrammaire: () => async () => null });
  });

  it('refuse tout accès sans session', async () => {
    expect((await avec.request('/api/grammaire/etat')).status).toBe(401);
    expect((await avec.request('/api/grammaire/phrase')).status).toBe(401);
  });

  it('transmet les niveaux connus au générateur, ignore les autres', async () => {
    const h = await inscrire(courrielUnique());
    await avec.request('/api/grammaire/phrase?niveaux=marqueurs,inconnu,imparfait,marqueurs', { headers: h });
    expect(niveauxRecus).toEqual(['marqueurs', 'imparfait']);
    await avec.request('/api/grammaire/phrase?niveaux=inconnu', { headers: h });
    expect(niveauxRecus).toBeUndefined();
  });

  it('rend une phrase, sans cache', async () => {
    const h = await inscrire(courrielUnique());
    const r = await avec.request('/api/grammaire/phrase', { headers: h });
    expect(r.status).toBe(200);
    expect(r.headers.get('cache-control')).toBe('no-store');
    expect(await r.json()).toEqual({ phrase: 'Le chat dort.', categorie: 'present' });
    expect(await (await avec.request('/api/grammaire/etat', { headers: h })).json()).toEqual({ disponible: true });
  });

  it('répond 503 sans clé sur le compte', async () => {
    const h = await inscrire(courrielUnique(), false);
    expect(await (await avec.request('/api/grammaire/etat', { headers: h })).json()).toEqual({ disponible: false });
    const r = await avec.request('/api/grammaire/phrase', { headers: h });
    expect(r.status).toBe(503);
    expect(await r.json()).toEqual({ erreur: 'phrases indisponibles', code: 'GRAMMAIRE_INDISPONIBLE' });
  });

  it('répond 503 quand le générateur ne rend rien', async () => {
    const h = await inscrire(courrielUnique());
    expect((await enPanne.request('/api/grammaire/phrase', { headers: h })).status).toBe(503);
  });

  it('limite le débit : le 31e appel en une minute reçoit 429', async () => {
    const h = await inscrire(courrielUnique());
    for (let i = 0; i < 30; i++) {
      expect((await avec.request('/api/grammaire/phrase', { headers: h })).status).toBe(200);
    }
    expect((await avec.request('/api/grammaire/phrase', { headers: h })).status).toBe(429);
  });
});
