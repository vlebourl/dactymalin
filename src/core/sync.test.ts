import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CLE_FILE,
  CLE_MAJ,
  deconnecter,
  enAttente,
  pousser,
  synchroniserProfils,
  viderLaFile,
} from './sync';
import { CLE_PROFILS, chargerIndex, cleDe } from './profils';
import { DEFAUTS, charger, sauver, type Sauvegarde } from './storage';

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

type Distant = { id: string; prenom: string; etat: Sauvegarde | null; majLe: string | null };

const rep = (corps: unknown, status = 200) =>
  new Response(JSON.stringify(corps), { status, headers: { 'Content-Type': 'application/json' } });

/**
 * Faux serveur minimal : la liste des profils et le PUT de progression, avec
 * la règle qui compte — un état plus ANCIEN que celui en base est refusé (409).
 */
function serveur(distants: Distant[]) {
  const puts: { id: string; etat: Sauvegarde; majLe: string }[] = [];
  let horsLigne = false;
  const fetchFaux = vi.fn(async (url: string, init?: RequestInit) => {
    if (horsLigne) throw new TypeError('Failed to fetch');
    const progression = url.match(/^\/api\/profils\/(.+)\/progression$/);
    if (progression && init?.method === 'PUT') {
      const id = progression[1];
      const corps = JSON.parse(String(init.body)) as { etat: Sauvegarde; majLe: string };
      const cible = distants.find((d) => d.id === id)!;
      if (cible.majLe && Date.parse(cible.majLe) > Date.parse(corps.majLe)) {
        return rep({ erreur: 'version plus récente en base' }, 409);
      }
      puts.push({ id, ...corps });
      cible.etat = corps.etat;
      cible.majLe = corps.majLe;
      return rep({ majLe: corps.majLe });
    }
    if (url === '/api/profils' && init?.method === 'POST') {
      const { prenom } = JSON.parse(String(init.body)) as { prenom: string };
      const cree = { id: `d${distants.length + 1}`, prenom, etat: null, majLe: null };
      distants.push(cree);
      return rep({ id: cree.id, prenom }, 201);
    }
    if (url === '/api/profils') return rep({ profils: distants });
    return rep({ ok: true });
  });
  vi.stubGlobal('fetch', fetchFaux);
  return {
    puts,
    fetchFaux,
    couper: () => void (horsLigne = true),
    rebrancher: () => void (horsLigne = false),
  };
}

beforeEach(() => {
  globalThis.localStorage = new FauxStockage() as unknown as Storage;
  globalThis.sessionStorage = new FauxStockage() as unknown as Storage;
});
afterEach(() => vi.unstubAllGlobals());

describe('file d’attente des progressions', () => {
  it('un envoi part tout de suite et la file se vide', async () => {
    const s = serveur([{ id: 'a', prenom: 'Timo', etat: null, majLe: null }]);
    await pousser('a', { ...DEFAUTS, palier: 3 });
    expect(s.puts.map((p) => p.etat.palier)).toEqual([3]);
    expect(enAttente()).toBe(0);
  });

  it('hors ligne, l’envoi ATTEND ; au retour du réseau il part une seule fois', async () => {
    const s = serveur([{ id: 'a', prenom: 'Timo', etat: null, majLe: null }]);
    s.couper();
    await pousser('a', { ...DEFAUTS, palier: 3 });
    expect(enAttente()).toBe(1);
    expect(s.puts).toHaveLength(0);

    s.rebrancher();
    await viderLaFile();
    await viderLaFile();
    expect(s.puts).toHaveLength(1);
    expect(enAttente()).toBe(0);
  });

  it('une seule entrée par profil : le rejeu n’envoie que le plus récent', async () => {
    const s = serveur([{ id: 'a', prenom: 'Timo', etat: null, majLe: null }]);
    s.couper();
    await pousser('a', { ...DEFAUTS, palier: 2 });
    await pousser('a', { ...DEFAUTS, palier: 4 });
    expect(enAttente()).toBe(1);

    s.rebrancher();
    await viderLaFile();
    expect(s.puts.map((p) => p.etat.palier)).toEqual([4]);
  });

  it('un état corrompu n’entre jamais dans la file', async () => {
    const s = serveur([{ id: 'a', prenom: 'Timo', etat: null, majLe: null }]);
    await pousser('a', { ...DEFAUTS, palier: 99 } as unknown as Sauvegarde);
    expect(enAttente()).toBe(0);
    expect(s.puts).toHaveLength(0);
  });
});

describe('conflit de version', () => {
  it('un 409 est rejoué UNE fois, fusionné, et la file se vide', async () => {
    const plusRecent = new Date(Date.now() + 60_000).toISOString();
    const s = serveur([
      { id: 'a', prenom: 'Timo', etat: { ...DEFAUTS, palier: 5 }, majLe: plusRecent },
    ]);
    await pousser('a', { ...DEFAUTS, palier: 3, guideDoigtVu: true });

    /* Un seul rejeu, et il porte la FUSION : le palier du serveur (plus
       avancé) et l'acquis local, aucun des deux perdu. */
    expect(s.puts).toHaveLength(1);
    expect(s.puts[0].etat.palier).toBe(5);
    expect(s.puts[0].etat.guideDoigtVu).toBe(true);
    expect(enAttente()).toBe(0);
  });

  it('un second 409 ne relance PAS de boucle : l’envoi reste en attente', async () => {
    const s = serveur([{ id: 'a', prenom: 'Timo', etat: { ...DEFAUTS, palier: 5 }, majLe: null }]);
    /* Le serveur refuse tout, même le rejeu : c'est le cas pathologique. */
    s.fetchFaux.mockImplementation(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'PUT') return rep({ erreur: 'conflit' }, 409);
      return rep({
        profils: [
          { id: 'a', prenom: 'Timo', etat: { ...DEFAUTS, palier: 5 }, majLe: new Date().toISOString() },
        ],
      });
    });

    await pousser('a', { ...DEFAUTS, palier: 3 });
    const puts = s.fetchFaux.mock.calls.filter(([, i]) => (i as RequestInit)?.method === 'PUT');
    expect(puts).toHaveLength(2); // l'envoi, puis UN rejeu — pas davantage
    expect(enAttente()).toBe(1);
  });
});

describe('les profils viennent du compte', () => {
  it('le cache local reprend la liste du serveur, identifiants compris', async () => {
    serveur([
      { id: 'd1', prenom: 'Timo', etat: null, majLe: null },
      { id: 'd2', prenom: 'Zoé', etat: null, majLe: null },
    ]);
    await synchroniserProfils();
    expect(chargerIndex().liste).toEqual([
      { id: 'd1', nom: 'Timo' },
      { id: 'd2', nom: 'Zoé' },
    ]);
  });

  it('deux enfants du même prénom restent deux profils, avec deux progressions', async () => {
    serveur([
      { id: 'd1', prenom: 'Timo', etat: { ...DEFAUTS, palier: 6 }, majLe: new Date().toISOString() },
      { id: 'd2', prenom: 'Timo', etat: { ...DEFAUTS, palier: 1 }, majLe: new Date().toISOString() },
    ]);
    await synchroniserProfils();
    expect(chargerIndex().liste).toHaveLength(2);
    expect(charger(cleDe('d1')).palier).toBe(6);
    expect(charger(cleDe('d2')).palier).toBe(1);
  });

  it('un profil connu du serveur mais absent d’ici arrive avec sa progression', async () => {
    serveur([
      { id: 'd1', prenom: 'Timo', etat: { ...DEFAUTS, palier: 4 }, majLe: new Date().toISOString() },
    ]);
    await synchroniserProfils();
    expect(charger(cleDe('d1')).palier).toBe(4);
  });

  it('deux appels concurrents ne lisent le compte qu’une fois', async () => {
    const s = serveur([{ id: 'd1', prenom: 'Timo', etat: null, majLe: null }]);
    await Promise.all([synchroniserProfils(), synchroniserProfils()]);
    const listes = s.fetchFaux.mock.calls.filter(
      ([u, i]) => u === '/api/profils' && (i as RequestInit)?.method === undefined,
    );
    expect(listes).toHaveLength(1);
  });
});

describe('réconciliation : l’appareil local ne gagne plus par principe', () => {
  const local: Sauvegarde = {
    ...DEFAUTS,
    palier: 3,
    reglages: { sons: true, texteEspace: false, animationsDouces: true },
  };
  const distant: Sauvegarde = {
    ...DEFAUTS,
    palier: 3,
    reglages: { sons: false, texteEspace: true, animationsDouces: false },
  };

  it('les préférences du serveur gagnent quand elles sont plus récentes', async () => {
    sauver(local, cleDe('d1'));
    localStorage.setItem(CLE_MAJ, JSON.stringify({ d1: '2026-08-01T10:00:00.000Z' }));
    serveur([{ id: 'd1', prenom: 'Timo', etat: distant, majLe: '2026-08-02T10:00:00.000Z' }]);

    await synchroniserProfils();
    expect(charger(cleDe('d1')).reglages).toEqual(distant.reglages);
  });

  it('les préférences locales gagnent quand ce sont elles les plus récentes', async () => {
    sauver(local, cleDe('d1'));
    localStorage.setItem(CLE_MAJ, JSON.stringify({ d1: '2026-08-03T10:00:00.000Z' }));
    const s = serveur([
      { id: 'd1', prenom: 'Timo', etat: distant, majLe: '2026-08-02T10:00:00.000Z' },
    ]);

    await synchroniserProfils();
    expect(charger(cleDe('d1')).reglages).toEqual(local.reglages);
    /* et la fusion repart vers le serveur : l'autre appareil la verra */
    expect(s.puts).toHaveLength(1);
  });

  it('rien à dire de neuf : aucun envoi inutile', async () => {
    sauver(distant, cleDe('d1'));
    localStorage.setItem(CLE_MAJ, JSON.stringify({ d1: '2026-08-01T10:00:00.000Z' }));
    const s = serveur([
      { id: 'd1', prenom: 'Timo', etat: distant, majLe: '2026-08-02T10:00:00.000Z' },
    ]);

    await synchroniserProfils();
    expect(s.puts).toHaveLength(0);
  });

  it('une progression locale que le serveur ignore encore lui est envoyée', async () => {
    sauver({ ...DEFAUTS, palier: 7 }, cleDe('d1'));
    localStorage.setItem(CLE_MAJ, JSON.stringify({ d1: '2026-08-01T10:00:00.000Z' }));
    const s = serveur([{ id: 'd1', prenom: 'Timo', etat: null, majLe: null }]);

    await synchroniserProfils();
    expect(s.puts.map((p) => p.etat.palier)).toEqual([7]);
  });
});

describe('déconnexion', () => {
  it('efface le cache des profils, les progressions et la file', async () => {
    const s = serveur([{ id: 'd1', prenom: 'Timo', etat: null, majLe: null }]);
    await synchroniserProfils();
    await pousser('d1', { ...DEFAUTS, palier: 2 });
    s.couper();
    await pousser('d1', { ...DEFAUTS, palier: 3 });
    expect(enAttente()).toBe(1);

    s.rebrancher();
    await deconnecter();
    expect(localStorage.getItem(CLE_PROFILS)).toBeNull();
    expect(localStorage.getItem(cleDe('d1'))).toBeNull();
    expect(localStorage.getItem(CLE_FILE)).toBeNull();
    expect(localStorage.getItem(CLE_MAJ)).toBeNull();
    expect(enAttente()).toBe(0);
  });
});
