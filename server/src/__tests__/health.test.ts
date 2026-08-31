import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { creerApp, IDENTIFIANT } from '../app';
import { lireEnv } from '../env';

const env = lireEnv({ NODE_ENV: 'test' } as NodeJS.ProcessEnv);

describe('healthcheck', () => {
  it("répond 200 avec l'identifiant de construction, sans base branchée", async () => {
    const r = await creerApp({ env }).request('/api/health');
    expect(r.status).toBe(200);
    await expect(r.json()).resolves.toEqual({
      ok: true,
      status: 'healthy',
      ...IDENTIFIANT,
      db: 'absente',
    });
  });

  it('dit « degraded » quand la base ne répond pas, sans tomber', async () => {
    const app = creerApp({ env, pingBase: () => Promise.reject(new Error('coupée')) });
    const r = await app.request('/api/health');
    expect(r.status).toBe(200);
    expect((await r.json()).status).toBe('degraded');
  });
});

describe('routage', () => {
  it("une route /api inconnue ne rend JAMAIS l'index du client", async () => {
    const r = await creerApp({ env, racineClient: 'dist' }).request('/api/nawak');
    expect(r.status).toBe(404);
    expect(r.headers.get('content-type')).toContain('application/json');
  });
});

describe('fichiers du client', () => {
  /* Régression : le repli SPA était enregistré AVANT le middleware statique et
     répondait l'index.html pour /doigts/index_gauche.png — les photos de
     doigts et les polices arrivaient en text/html. */
  it('un fichier existant est servi par le statique, pas par le repli SPA', async () => {
    const racineClient = mkdtempSync(join(tmpdir(), 'tapeavecmoi-'));
    writeFileSync(join(racineClient, 'index.html'), '<!doctype html><html lang="fr"></html>');
    const app = creerApp({
      env,
      racineClient,
      statique: async (c, suivant) => {
        if (c.req.path === '/doigts/index_gauche.png') return c.body('PNG', 200, {
          'content-type': 'image/png',
        });
        await suivant();
      },
    });
    const image = await app.request('/doigts/index_gauche.png');
    expect(image.headers.get('content-type')).toBe('image/png');
    // …et un chemin sans fichier retombe bien sur l'index de la SPA
    const vue = await app.request('/notre-lecon');
    expect(vue.status).toBe(200);
    expect(vue.headers.get('content-type')).toContain('text/html');
  });
});

describe('environnement', () => {
  it('refuse de démarrer en production sans base ni secret', () => {
    expect(() => lireEnv({ NODE_ENV: 'production' } as NodeJS.ProcessEnv)).toThrow(
      /DATABASE_URL, BETTER_AUTH_SECRET/,
    );
  });

  it('accepte une production complète', () => {
    const env = lireEnv({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://u:p@db:5432/tapeavecmoi',
      BETTER_AUTH_SECRET: 'x'.repeat(32),
    } as NodeJS.ProcessEnv);
    expect(env.PORT).toBe(3000);
  });
});
