import { describe, expect, it } from 'vitest';
import type { Auth } from '../../auth';
import type { Base } from '../../db/client';
import { routesProfils } from '../profils';

describe('taille de la progression', () => {
  it('refuse un état trop volumineux avant tout accès à la base', async () => {
    const auth = { api: { getSession: async () => ({ user: { id: 'parent' } }) } } as unknown as Auth;
    const app = routesProfils({} as Base, auth);
    const r = await app.request('/enfant/progression', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ etat: { contenu: 'x'.repeat(33 * 1024) }, majLe: new Date().toISOString() }),
    });
    expect(r.status).toBe(413);
    expect((await r.json()).code).toBe('ETAT_TROP_GRAND');
  });
});
