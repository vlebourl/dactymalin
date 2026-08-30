import { beforeEach, describe, expect, it } from 'vitest';
import { charger, CLE, CLE_SECOURS, DEFAUTS, estIntact, sauver, valider } from './storage';

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
    /* `valider` : la relecture MIGRE toujours ce qu'elle lit — comparer à
       l'objet brut testerait l'absence de migration, pas la persistance. */
    const etat = valider({ ...DEFAUTS, palier: 3, disposition: 'fr-CH' as const, maitrise: { e: [1, 2, 3] } });
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

/* Gate Codex n°7 : `estIntact()` ne contrôlait que trois champs. Un objet
   STRUCTURELLEMENT valide mais faux sur le reste (`palier: 42`, réglages
   absents…) était jugé sain, puis `valider()` l'écrasait vers les défauts sans
   jamais consulter le backup — pourtant intact. */
describe('corruption structurellement valide', () => {
  const sain = { ...DEFAUTS, palier: 5, maitrise: { e: [1, 2, 3] } };

  it('estIntact refuse un palier hors domaine', () => {
    expect(estIntact({ ...sain, palier: 42 })).toBe(false);
    expect(estIntact({ ...sain, palier: 3.5 })).toBe(false);
    expect(estIntact(sain)).toBe(true);
  });

  it('estIntact refuse des réglages absents ou incomplets', () => {
    expect(estIntact({ ...sain, reglages: undefined })).toBe(false);
    expect(estIntact({ ...sain, reglages: { sons: true } })).toBe(false);
  });

  it('estIntact refuse une maîtrise mal formée', () => {
    expect(estIntact({ ...sain, maitrise: { e: 'non' } })).toBe(false);
    expect(estIntact({ ...sain, maitrise: { toto: [1] } })).toBe(false);
    expect(estIntact({ ...sain, maitrise: [] })).toBe(false);
  });

  it('estIntact refuse une version ou une disposition inconnue', () => {
    expect(estIntact({ ...sain, version: 2 })).toBe(false);
    expect(estIntact({ ...sain, disposition: 'de-DE' })).toBe(false);
  });

  it('un principal faussement sain ne détruit pas la progression du backup', () => {
    sauver(sain);
    sauver({ ...sain, palier: 6 }); // le sain d'origine part au backup
    // corruption non détectable par un contrôle à trois champs
    localStorage.setItem(CLE, JSON.stringify({ version: 1, disposition: 'fr-FR', palier: 42 }));
    expect(charger().palier).toBe(5);
    expect(charger().maitrise).toEqual({ e: [1, 2, 3] });
  });
});

/* Gate Codex n°7 (2ᵉ volet) : les deux écritures partageaient un seul `try`.
   Un quota dépassé sur le BACKUP empêchait l'écriture de la clé principale —
   la progression du moment était perdue à cause d'une copie de secours. */
describe('quota et échec partiel d’écriture', () => {
  it('la clé principale est écrite même si le backup échoue', () => {
    sauver({ ...DEFAUTS, palier: 2 });
    const vrai = localStorage.setItem.bind(localStorage);
    localStorage.setItem = (cle: string, val: string) => {
      if (cle === CLE_SECOURS) throw new DOMException('quota', 'QuotaExceededError');
      vrai(cle, val);
    };
    expect(() => sauver({ ...DEFAUTS, palier: 3 })).not.toThrow();
    expect(charger().palier).toBe(3);
  });

  it('un quota total ne fait pas crasher la leçon', () => {
    localStorage.setItem = () => {
      throw new DOMException('quota', 'QuotaExceededError');
    };
    expect(() => sauver({ ...DEFAUTS, palier: 4 })).not.toThrow();
  });
});
