import { describe, expect, it } from 'vitest';
import {
  avancementEtape,
  avancementLecon,
  estMaitrisee,
  noterOccurrence,
  PASTILLES_LECON,
  type EtatAvancement,
  type Maitrise,
} from './progression';
import { LECONS_PAR_ETAPE } from './parcours';

const noter = (m: Maitrise, c: string, blocs: number[]) =>
  blocs.reduce((acc, b) => noterOccurrence(acc, c, b), m);

/* La maîtrise ne commande plus aucun passage (#38). Elle définit ce qu'est une
   touche acquise, ce qui sert à composer les leçons suivantes : une touche mal
   acquise revient plus souvent. */
describe('ce qui compte comme touche acquise', () => {
  it('3 occurrences réparties sur au moins 2 leçons', () => {
    expect(estMaitrisee(noter({}, 's', [1, 1]), 's')).toBe(false);
    expect(estMaitrisee(noter({}, 's', [1, 1, 1]), 's')).toBe(false);
    expect(estMaitrisee(noter({}, 's', [1, 1, 2]), 's')).toBe(true);
    expect(estMaitrisee(noter({}, 's', [1, 2, 3]), 's')).toBe(true);
  });

  it("l'espace n'est jamais un critère", () => {
    expect(noterOccurrence({}, ' ', 1)).toEqual({});
  });

  it('aucun quota de volume ni de temps', () => {
    const m = noter({}, 'e', [1, 2, 3]);
    expect(m.e).toHaveLength(3);
    expect(estMaitrisee(m, 'e')).toBe(true);
  });
});

/* L'en-tête de la leçon montre où on en est DANS l'étape. Le quota étant fixe,
   la barre est lisible d'avance — c'est tout l'intérêt du changement. */
describe("avancement dans l'étape", () => {
  it('sept leçons remplissent la barre, et pas une de moins', () => {
    expect(avancementEtape(0).part).toBe(0);
    expect(avancementEtape(LECONS_PAR_ETAPE - 1).part).toBeLessThan(1);
    expect(avancementEtape(LECONS_PAR_ETAPE).part).toBe(1);
  });

  it('la barre ne dépasse jamais son plein', () => {
    expect(avancementEtape(99).part).toBe(1);
    expect(avancementEtape(99).leconsFaites).toBe(LECONS_PAR_ETAPE);
  });

  /* Régression #38 : la v1 suivait le plus avancé de deux chemins — touches
     maîtrisées ou plafond de blocs — et la barre pouvait sauter sans prévenir
     quand le plafond prenait la main. Un seul chemin, plus de saut. */
  it("l'avancement ne dépend que du nombre de leçons faites", () => {
    for (let n = 0; n <= LECONS_PAR_ETAPE; n++) {
      expect(avancementEtape(n).part).toBeCloseTo(n / LECONS_PAR_ETAPE);
    }
  });
});

describe("avancement d'une leçon", () => {
  const parcours = (finLe: number, maintenant: number): EtatAvancement => ({
    items: [],
    i: 0,
    finLe,
    maintenant,
  });
  const liste = (i: number, total: number): EtatAvancement => ({
    items: Array.from({ length: total }, (_, k) => k),
    i,
    finLe: null,
    maintenant: 0,
  });

  /* Mode PARCOURS : la leçon dure un temps, l'avancement est celui du chrono. */
  it('en parcours, les pastilles suivent le temps écoulé', () => {
    const duree = 12000;
    expect(avancementLecon(parcours(12000, 0), duree).part).toBe(0);
    expect(avancementLecon(parcours(12000, 6000), duree).part).toBeCloseTo(0.5);
    expect(avancementLecon(parcours(12000, 12000), duree).part).toBe(1);
  });

  /* Mode LISTE de la maison : elle a une fin connue, on suit les items. */
  it('en liste de la maison, les pastilles suivent la position dans les items', () => {
    expect(avancementLecon(liste(0, 4)).part).toBe(0);
    expect(avancementLecon(liste(2, 4)).part).toBe(0.5);
    expect(avancementLecon(liste(4, 4)).part).toBe(1);
  });

  it('une liste vide ne divise pas par zéro', () => {
    expect(avancementLecon(liste(0, 0)).part).toBe(0);
  });

  it("l'avancement reste borné entre 0 et 1", () => {
    // chrono dépassé (le tic arrive après la fin) et chrono pas commencé
    expect(avancementLecon(parcours(12000, 30000), 12000).part).toBe(1);
    expect(avancementLecon(parcours(12000, -5000), 12000).part).toBe(0);
    // liste jouée au-delà de son dernier item
    expect(avancementLecon(liste(9, 4)).part).toBe(1);
  });

  it('les pastilles dérivent de la part, pleines en tête de rangée', () => {
    const a = avancementLecon(liste(2, 4));
    expect(a.pastilles).toBe(PASTILLES_LECON);
    expect(a.pleines).toBe(PASTILLES_LECON / 2);
    expect(avancementLecon(liste(0, 4)).pleines).toBe(0);
    expect(avancementLecon(liste(4, 4)).pleines).toBe(PASTILLES_LECON);
  });
});
