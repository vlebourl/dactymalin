import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { associerEtFusionner, CLE_LIENS } from './sync';
import { CLE_PROFILS } from './profils';
import { CLE, DEFAUTS } from './storage';

/** Faux stockage : `core/` doit rester testable en env node (cf. profils.test.ts). */
class FauxStockage {
  private m = new Map<string, string>();
  getItem = (k: string) => this.m.get(k) ?? null;
  setItem = (k: string, v: string) => void this.m.set(k, v);
  removeItem = (k: string) => void this.m.delete(k);
  clear = () => this.m.clear();
  key = (i: number) => [...this.m.keys()][i] ?? null;
  get length() {
    return this.m.size;
  }
}

/**
 * Régression (2026-08-29) : le portail de connexion appelle l'appariement au
 * démarrage, et le montage double de `StrictMode` le lançait DEUX fois en
 * parallèle. Les deux exécutions lisaient une liste distante vide et créaient
 * chacune « Joueur 1 » : deux profils sur le serveur pour un seul enfant.
 */
describe('associerEtFusionner : un seul vol', () => {
  let creations: number;

  beforeEach(() => {
    globalThis.localStorage = new FauxStockage() as unknown as Storage;
    creations = 0;
    localStorage.setItem(
      CLE_PROFILS,
      JSON.stringify({ version: 1, actif: 'p1', liste: [{ id: 'p1', nom: 'Timo' }] }),
    );
    localStorage.setItem(CLE, JSON.stringify(DEFAUTS));

    const distants: { id: string; prenom: string; etat: null; majLe: null }[] = [];
    const rep = (corps: unknown) =>
      new Response(JSON.stringify(corps), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url === '/api/profils' && init?.method === 'POST') {
          creations++;
          distants.push({ id: `d${creations}`, prenom: 'Timo', etat: null, majLe: null });
          return rep({ id: `d${creations}`, prenom: 'Timo' });
        }
        if (url === '/api/profils') return rep({ profils: distants });
        return rep({ ok: true }); // PUT de la progression
      }),
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  it('deux appels concurrents ne créent QU’UN profil distant', async () => {
    await Promise.all([associerEtFusionner(), associerEtFusionner()]);
    expect(creations).toBe(1);
    expect(JSON.parse(localStorage.getItem(CLE_LIENS)!)).toEqual({ p1: 'd1' });
  });

  it('un appel ultérieur réapparie sans recréer', async () => {
    await associerEtFusionner();
    await associerEtFusionner();
    expect(creations).toBe(1);
  });
});
