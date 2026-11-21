import { afterEach, describe, expect, it, vi } from 'vitest';
import { grammaireDisponible } from './grammaire';

describe('grammaireDisponible', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('vrai quand le serveur dit disponible', async () => {
    const fetchSimule = vi.fn(async () => new Response(JSON.stringify({ disponible: true })));
    vi.stubGlobal('fetch', fetchSimule);
    expect(await grammaireDisponible()).toBe(true);
    expect(fetchSimule).toHaveBeenCalledWith('/api/grammaire/etat');
  });

  it('faux sur un statut non-OK (401)', async () => {
    vi.stubGlobal('fetch', async () => new Response('{}', { status: 401 }));
    expect(await grammaireDisponible()).toBe(false);
  });

  it('faux sur une erreur réseau', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new TypeError('réseau');
    });
    expect(await grammaireDisponible()).toBe(false);
  });
});
