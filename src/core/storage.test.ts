import { beforeEach, describe, expect, it } from 'vitest';
import { charger, CLE, CLE_SECOURS, DEFAUTS, sauver, valider } from './storage';

/** Faux localStorage : `core/` doit rester testable en env node. */
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

beforeEach(() => {
  globalThis.localStorage = new FauxStockage() as unknown as Storage;
});

describe('gardes de chargement', () => {
  it('un objet vide retombe entièrement sur les défauts', () => {
    expect(valider({})).toEqual(DEFAUTS);
  });

  it('une disposition inconnue retombe sur fr-FR', () => {
    expect(valider({ disposition: 'de-DE' }).disposition).toBe('fr-FR');
  });

  it('un palier hors domaine est borné', () => {
    expect(valider({ palier: 0 }).palier).toBe(1);
    expect(valider({ palier: 42 }).palier).toBe(1);
    expect(valider({ palier: 3.5 }).palier).toBe(1);
    expect(valider({ palier: 5 }).palier).toBe(5);
  });

  it('des réglages partiels sont complétés sans crash', () => {
    expect(valider({ reglages: { sons: false } }).reglages).toEqual({
      sons: false,
      texteEspace: false,
      animationsDouces: true,
    });
  });

  it('une maîtrise corrompue est nettoyée, pas rejetée', () => {
    expect(valider({ maitrise: { e: [1, 'x', 2], toto: [1], s: 'non' } }).maitrise).toEqual({
      e: [1, 2],
    });
  });

  it('null, un tableau ou une chaîne ne font pas crasher', () => {
    for (const brut of [null, undefined, [], 'zut', 42]) {
      expect(() => valider(brut)).not.toThrow();
      expect(valider(brut).palier).toBe(1);
    }
  });
});

describe('persistance et clé de secours', () => {
  it('recharge à l\'identique', () => {
    const etat = { ...DEFAUTS, palier: 3, disposition: 'fr-CH' as const, maitrise: { e: [1, 2, 3] } };
    sauver(etat);
    expect(charger()).toEqual(etat);
  });

  it('une corruption du principal ne remet jamais à zéro', () => {
    sauver({ ...DEFAUTS, palier: 4 });
    sauver({ ...DEFAUTS, palier: 5 });
    localStorage.setItem(CLE, '{ ceci n\'est pas du JSON');
    expect(charger().palier).toBe(4); // dernière progression valide
    expect(localStorage.getItem(CLE_SECOURS)).toBeTruthy();
  });

  it('sans rien en mémoire, on démarre sur les défauts', () => {
    expect(charger()).toEqual(DEFAUTS);
  });
});
