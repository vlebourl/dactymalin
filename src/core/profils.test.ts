import { beforeEach, describe, expect, it } from 'vitest';
import {
  CLE_CHOISIR,
  CLE_PROFILS,
  activerProfil,
  chargerIndex,
  cleDe,
  creerProfil,
  effacerDemandeDeChoix,
  profilInitial,
} from './profils';
import { CLE, DEFAUTS, charger, sauver } from './storage';

/** Faux stockage : `core/` doit rester testable en env node (cf. storage.test.ts). */
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

describe('multi-profils locaux', () => {
  beforeEach(() => {
    globalThis.localStorage = new FauxStockage() as unknown as Storage;
    globalThis.sessionStorage = new FauxStockage() as unknown as Storage;
  });

  it('le premier profil garde la clé historique : une progression d\'avant les profils devient Joueur 1', () => {
    // sauvegarde d'avant les profils
    sauver({ ...DEFAUTS, palier: 3, dispositionChoisieALaMain: true });
    const ix = chargerIndex();
    expect(ix.liste).toEqual([{ id: 'p1', nom: 'Joueur 1' }]);
    expect(cleDe('p1')).toBe(CLE);
    expect(charger(cleDe('p1')).palier).toBe(3);
  });

  it('un seul joueur : on entre directement, sans écran de choix', () => {
    expect(profilInitial()).toBe('p1');
  });

  it('deux joueurs : l\'écran « Qui joue ? » décide', () => {
    creerProfil(chargerIndex(), 'Zoé');
    expect(profilInitial()).toBeNull();
  });

  it('le drapeau « changer de joueur » force l\'écran, sans être consommé à la lecture (StrictMode)', () => {
    sessionStorage.setItem(CLE_CHOISIR, '1');
    expect(profilInitial()).toBeNull();
    expect(profilInitial()).toBeNull();
    effacerDemandeDeChoix();
    expect(profilInitial()).toBe('p1');
  });

  it('chaque joueur a sa progression, isolée de l\'autre', () => {
    const [, id2] = creerProfil(chargerIndex(), 'Zoé');
    sauver({ ...DEFAUTS, palier: 5 }, cleDe('p1'));
    sauver({ ...DEFAUTS, palier: 1 }, cleDe(id2));
    expect(cleDe(id2)).not.toBe(cleDe('p1'));
    expect(charger(cleDe('p1')).palier).toBe(5);
    expect(charger(cleDe(id2)).palier).toBe(1);
  });

  it('creerProfil active le nouveau ; activerProfil rebascule ; un nom vide reçoit un défaut', () => {
    const [ix, id2] = creerProfil(chargerIndex(), '   ');
    expect(ix.actif).toBe(id2);
    expect(ix.liste[1].nom).toBe('Joueur 2');
    activerProfil('p1');
    expect(chargerIndex().actif).toBe('p1');
  });

  it('un index corrompu est recréé sans casser la progression du premier joueur', () => {
    sauver({ ...DEFAUTS, palier: 4 });
    localStorage.setItem(CLE_PROFILS, '{"version":9,"liste":"nope"}');
    const ix = chargerIndex();
    expect(ix.liste.map((p) => p.id)).toEqual(['p1']);
    expect(charger(cleDe('p1')).palier).toBe(4);
  });
});
