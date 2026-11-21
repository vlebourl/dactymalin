import { courrielUnique } from '../../../../tests/helpers/courriel';
import { beforeAll, describe, expect, it } from 'vitest';
import { creerApp } from '../../app';
import { creerAuth } from '../../auth';
import { creerBase } from '../../db/client';
import { lireEnv } from '../../env';
import type { Generateur } from '../../lib/grammaire';

/**
 * Mode grammaire — la route des phrases. Un VRAI PostgreSQL, comme pour la
 * voix : la session passe par Better Auth. Sans `TEST_DATABASE_URL`, sautés.
 */
const URL_TEST = process.env.TEST_DATABASE_URL;
const d = URL_TEST ? describe : describe.skip;

d('route /api/grammaire', () => {
  let avec: ReturnType<typeof creerApp>;
  let sans: ReturnType<typeof creerApp>;
  let enPanne: ReturnType<typeof creerApp>;
  const generateur: Generateur = async () => ({ phrase: 'Le chat dort.', categorie: 'present' });

  const inscrire = async (email: string) => {
    const r = await avec.request('/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'motdepasse-solide', name: 'Parent' }),
    });
    expect(r.status).toBe(200);
    return { Cookie: r.headers.get('set-cookie')!.split(';')[0] };
  };

  beforeAll(() => {
    const env = lireEnv({
      NODE_ENV: 'test',
      DATABASE_URL: URL_TEST,
      BETTER_AUTH_SECRET: 'x'.repeat(40),
    } as NodeJS.ProcessEnv);
    const base = creerBase(URL_TEST!);
    const auth = creerAuth(base, env);
    avec = creerApp({ env, base, auth, grammaire: generateur });
    sans = creerApp({ env, base, auth });
    enPanne = creerApp({ env, base, auth, grammaire: async () => null });
  });

  it('refuse tout accès sans session', async () => {
    expect((await avec.request('/api/grammaire/etat')).status).toBe(401);
    expect((await avec.request('/api/grammaire/phrase')).status).toBe(401);
  });

  it('rend une phrase, sans cache', async () => {
    const h = await inscrire(courrielUnique());
    const r = await avec.request('/api/grammaire/phrase', { headers: h });
    expect(r.status).toBe(200);
    expect(r.headers.get('cache-control')).toBe('no-store');
    expect(await r.json()).toEqual({ phrase: 'Le chat dort.', categorie: 'present' });
    expect(await (await avec.request('/api/grammaire/etat', { headers: h })).json()).toEqual({ disponible: true });
  });

  it('répond 503 sans générateur', async () => {
    const h = await inscrire(courrielUnique());
    expect(await (await sans.request('/api/grammaire/etat', { headers: h })).json()).toEqual({ disponible: false });
    const r = await sans.request('/api/grammaire/phrase', { headers: h });
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
