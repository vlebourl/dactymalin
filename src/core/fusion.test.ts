import { describe, expect, it } from 'vitest';
import { fusionner, fusionnerMaitrise } from './fusion';
import {
  avecProgression,
  DEFAUTS,
  progressionDe,
  valider,
  type Sauvegarde,
} from './storage';

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

describe('fusion des progressions par parcours et disposition', () => {
  it('unit les couples : chacun garde le plus avancé', () => {
    const salon = avecProgression(valider(DEFAUTS), 'dactylo', 'fr-FR', {
      etape: 4,
      leconsSurEtape: 1,
    });
    const tablette = avecProgression(valider(DEFAUTS), 'dactylo', 'fr-FR', {
      etape: 2,
      leconsSurEtape: 6,
    });
    const r = fusionner({ etat: salon, majLe: 1000 }, { etat: tablette, majLe: 9000 });
    expect(progressionDe(r, 'dactylo', 'fr-FR')).toEqual({ etape: 4, leconsSurEtape: 1 });
  });

  it('à étape égale, garde le plus grand nombre de leçons faites', () => {
    const a = avecProgression(valider(DEFAUTS), 'dactylo', 'fr-CH', { etape: 3, leconsSurEtape: 1 });
    const b = avecProgression(valider(DEFAUTS), 'dactylo', 'fr-CH', { etape: 3, leconsSurEtape: 5 });
    const r = fusionner({ etat: a, majLe: 1000 }, { etat: b, majLe: 2000 });
    expect(progressionDe(r, 'dactylo', 'fr-CH')).toEqual({ etape: 3, leconsSurEtape: 5 });
  });

  it('un parcours joué sur un seul appareil arrive intact sur l\'autre', () => {
    const joue = avecProgression(valider(DEFAUTS), 'dactylo', 'fr-FR', {
      etape: 5,
      leconsSurEtape: 2,
    });
    const r = fusionner({ etat: joue, majLe: 1000 }, A({}, 9000));
    expect(progressionDe(r, 'dactylo', 'fr-FR')).toEqual({ etape: 5, leconsSurEtape: 2 });
  });

  it('reprend le palier d\'un appareil resté à l\'ancien modèle', () => {
    /* Cet état-là n'a AUCUNE progression : c'est tout ce qu'un ancien bundle
       sait écrire. Son palier est pourtant la progression Découverte. */
    const ancien: Sauvegarde = { ...DEFAUTS, palier: 6, blocsSurPalier: 2, progressions: undefined };
    const r = fusionner({ etat: ancien, majLe: 9000 }, A({}, 1000));
    expect(progressionDe(r, 'decouverte', 'fr-FR')).toEqual({ etape: 6, leconsSurEtape: 2 });
  });

  it('le miroir ne verse jamais une avance dans l\'autre disposition', () => {
    const frFR = avecProgression(valider(DEFAUTS), 'decouverte', 'fr-FR', {
      etape: 5,
      leconsSurEtape: 0,
    });
    const frCH = avecProgression(
      valider({ ...DEFAUTS, disposition: 'fr-CH' }),
      'decouverte',
      'fr-CH',
      { etape: 1, leconsSurEtape: 3 },
    );
    /* fr-CH est le choix le plus RÉCENT : c'est lui que le miroir doit
       refléter, sinon l'enfant se retrouverait à l'étape 5 d'un clavier où il
       n'a jamais joué. */
    const r = fusionner({ etat: frFR, majLe: 1000 }, { etat: frCH, majLe: 9000 });
    expect(r.disposition).toBe('fr-CH');
    expect(r.palier).toBe(1);
    expect(progressionDe(r, 'decouverte', 'fr-FR').etape).toBe(5);
    expect(progressionDe(r, 'decouverte', 'fr-CH')).toEqual({ etape: 1, leconsSurEtape: 3 });
  });

  it('reste idempotente et commutative avec les progressions', () => {
    const a = avecProgression(valider(DEFAUTS), 'dactylo', 'fr-FR', { etape: 3, leconsSurEtape: 1 });
    const b = avecProgression(valider(DEFAUTS), 'decouverte', 'fr-FR', {
      etape: 4,
      leconsSurEtape: 2,
    });
    const une = fusionner({ etat: a, majLe: 1000 }, { etat: b, majLe: 2000 });
    expect(fusionner({ etat: b, majLe: 2000 }, { etat: a, majLe: 1000 })).toEqual(une);
    expect(fusionner({ etat: une, majLe: 3000 }, { etat: une, majLe: 3000 })).toEqual(une);
  });
});
