import { describe, expect, it } from 'vitest';
import { creerApp } from '../app';
import { lireEnv } from '../env';

/**
 * #7 — « Sans les variables d'environnement du fournisseur, le bouton ne
 * s'affiche pas et tout le reste fonctionne. »
 *
 * C'est la moitié du ticket qui se vérifie sans Google : le fournisseur est
 * déclaré SI ET SEULEMENT SI ses deux variables sont là. L'autre moitié — le
 * parcours réel — ne se vérifie que sur le vrai Google, à la main, et le
 * runbook la consigne.
 */
const app = (env: Record<string, string | undefined>) =>
  creerApp({
    env: lireEnv({ NODE_ENV: 'test', ...env } as NodeJS.ProcessEnv),
  });

const google = async (env: Record<string, string | undefined>) =>
  ((await (await app(env).request('/api/config')).json()) as { google: boolean }).google;

describe('le fournisseur Google, déclaré ou non', () => {
  it('est absent quand aucune variable n’est posée', async () => {
    expect(await google({})).toBe(false);
  });

  /* Une seule des deux ne suffit PAS : un secret oublié donnerait un bouton
     qui mène à une erreur, ce qui est pire qu'un bouton absent. */
  it('est absent quand une seule des deux est posée', async () => {
    expect(await google({ GOOGLE_CLIENT_ID: 'x.apps.googleusercontent.com' })).toBe(false);
    expect(await google({ GOOGLE_CLIENT_SECRET: 'GOCSPX-x' })).toBe(false);
  });

  it('est présent quand les deux sont là', async () => {
    expect(
      await google({
        GOOGLE_CLIENT_ID: 'x.apps.googleusercontent.com',
        GOOGLE_CLIENT_SECRET: 'GOCSPX-x',
      }),
    ).toBe(true);
  });

  /* Et sans elles, tout le reste fonctionne : l'application démarre, et ses
     autres routes répondent comme avant. */
  it('l’application démarre et répond sans ces variables', async () => {
    const r = await app({}).request('/api/health');
    expect(r.status).toBe(200);
    expect((await r.json()) as { ok: boolean }).toMatchObject({ ok: true });
  });
});
