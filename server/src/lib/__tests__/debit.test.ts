import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { limiterDebit } from '../debit';
import type { AvecCompte } from '../session';
import { creerApp } from '../../app';
import { lireEnv } from '../../env';
import type { Base } from '../../db/client';
import type { Auth } from '../../auth';

describe('limite de débit par compte', () => {
  it('isole les comptes, renvoie Retry-After et libère la fenêtre expirée', async () => {
    let maintenant = 1000;
    const app = new Hono<AvecCompte>();
    app.use('*', async (c, suivant) => { c.set('userId', c.req.header('x-test-user') ?? 'a'); await suivant(); });
    app.use('*', limiterDebit(2, 10_000, () => maintenant));
    app.get('/', (c) => c.json({ ok: true }));
    const appel = (id: string) => app.request('/', { headers: { 'x-test-user': id } });
    expect((await appel('a')).status).toBe(200);
    expect((await appel('a')).status).toBe(200);
    const refus = await appel('a');
    expect(refus.status).toBe(429);
    expect(refus.headers.get('Retry-After')).toBe('10');
    expect((await refus.json()).code).toBe('DEBIT_DEPASSE');
    expect((await appel('b')).status).toBe(200);
    maintenant = 11_001;
    expect((await appel('a')).status).toBe(200);
  });
});

describe('limites montées sur les routes', () => {
  it('limite les écritures de listes et les appels voix par compte', async () => {
    const auth = { api: { getSession: async ({ headers }: { headers: Headers }) => ({
      user: { id: headers.get('x-test-user') ?? 'a' },
    }) } } as unknown as Auth;
    const env = lireEnv({ NODE_ENV: 'test' } as NodeJS.ProcessEnv);
    const app = creerApp({ env, auth, base: {} as Base });
    const liste = (id: string) => app.request('/api/listes', {
      method: 'POST', headers: { 'x-test-user': id, 'content-type': 'application/json' }, body: '{}',
    });
    for (let i = 0; i < 40; i++) expect((await liste('a')).status).toBe(400);
    expect((await liste('a')).status).toBe(429);
    expect((await liste('b')).status).toBe(400);
    const etat = (id: string) => app.request('/api/voix/etat', { headers: { 'x-test-user': id } });
    for (let i = 0; i < 120; i++) expect((await etat('a')).status).toBe(200);
    expect((await etat('a')).status).toBe(429);
    expect((await etat('b')).status).toBe(200);
  });
});
