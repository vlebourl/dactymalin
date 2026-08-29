import { describe, expect, it } from 'vitest';
import { fusionner, fusionnerMaitrise } from './fusion';
import { DEFAUTS, type Sauvegarde } from './storage';

const etat = (p: Partial<Sauvegarde>): Sauvegarde => ({ ...DEFAUTS, ...p });
const A = (e: Partial<Sauvegarde>, t = 1000) => ({ etat: etat(e), majLe: t });

describe('fusion de deux progressions du même enfant', () => {
  it('garde le palier le plus AVANCÉ, même s\'il est le plus ancien', () => {
    const r = fusionner(A({ palier: 5 }, 1000), A({ palier: 2 }, 9000));
    expect(r.palier).toBe(5);
  });

  it('à palier égal, garde le plus grand nombre de blocs faits', () => {
    const r = fusionner(A({ palier: 3, blocsSurPalier: 1 }), A({ palier: 3, blocsSurPalier: 2 }));
    expect(r.blocsSurPalier).toBe(2);
  });

  it('à paliers différents, prend les blocs du palier gagnant', () => {
    const r = fusionner(A({ palier: 4, blocsSurPalier: 0 }), A({ palier: 2, blocsSurPalier: 5 }));
    expect(r.palier).toBe(4);
    expect(r.blocsSurPalier).toBe(0);
  });

  it('le compteur de blocs ne redescend jamais', () => {
    expect(fusionner(A({ bloc: 42 }), A({ bloc: 7 })).bloc).toBe(42);
  });

  it('unit les maîtrises, caractère par caractère, sans doublon', () => {
    const r = fusionner(A({ maitrise: { e: [1, 2], f: [3] } }), A({ maitrise: { e: [2, 5], j: [1] } }));
    expect(r.maitrise).toEqual({ e: [1, 2, 5], f: [3], j: [1] });
  });

  it('le guide des doigts reste vu dès qu\'il l\'a été une fois', () => {
    expect(fusionner(A({ guideDoigtVu: true }), A({ guideDoigtVu: false })).guideDoigtVu).toBe(true);
  });

  it('réglages et clavier suivent le choix le plus RÉCENT', () => {
    const r = fusionner(
      A({ disposition: 'fr-FR', reglages: { ...DEFAUTS.reglages, sons: true } }, 1000),
      A({ disposition: 'fr-CH', reglages: { ...DEFAUTS.reglages, sons: false } }, 2000),
    );
    expect(r.disposition).toBe('fr-CH');
    expect(r.reglages.sons).toBe(false);
  });

  it('est commutative : l\'ordre des appareils ne change rien', () => {
    const a = A({ palier: 3, maitrise: { e: [1] }, bloc: 4 }, 1000);
    const b = A({ palier: 5, maitrise: { f: [2] }, bloc: 7 }, 2000);
    expect(fusionner(a, b)).toEqual(fusionner(b, a));
  });

  it('est idempotente : fusionner deux fois ne bouge plus rien', () => {
    const a = A({ palier: 3, maitrise: { e: [1, 4] }, bloc: 9 }, 1000);
    const b = A({ palier: 4, maitrise: { e: [2] }, bloc: 11 }, 2000);
    const une = fusionner(a, b);
    expect(fusionner({ etat: une, majLe: 3000 }, { etat: une, majLe: 3000 })).toEqual(une);
  });

  it('la main gauche ne perd rien quand un appareil part de zéro', () => {
    const joue = A({ palier: 6, maitrise: { e: [1, 2, 3] }, bloc: 20, guideDoigtVu: true }, 1000);
    const neuf = A({}, 5000);
    const r = fusionner(joue, neuf);
    expect(r.palier).toBe(6);
    expect(r.maitrise).toEqual({ e: [1, 2, 3] });
    expect(r.bloc).toBe(20);
  });
});

describe('fusion des maîtrises', () => {
  it('trie les numéros de bloc', () => {
    expect(fusionnerMaitrise({ e: [5, 1] }, { e: [3] })).toEqual({ e: [1, 3, 5] });
  });
});
