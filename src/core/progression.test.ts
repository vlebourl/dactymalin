import { describe, expect, it } from 'vitest';
import {
  avancementEtape,
  avancementLecon,
  estMaitrisee,
  noterOccurrence,
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

/* Régression #76 : la rangée de l'entête comptait le TEMPS écoulé sur douze
   pastilles figées. Elle compte désormais les exercices de la série servie. */
describe('avancement dans la série en cours (#76)', () => {
  it('autant de pastilles que la série a d\'exercices, jamais douze par principe', () => {
    expect(avancementLecon({ series: [9], i: 0 }).pastilles).toBe(9);
    expect(avancementLecon({ series: [12], i: 0 }).pastilles).toBe(12);
    expect(avancementLecon({ series: [8], i: 0 }).pastilles).toBe(8);
  });

  it('une pastille se remplit par exercice terminé', () => {
    expect(avancementLecon({ series: [9], i: 0 }).pleines).toBe(0);
    expect(avancementLecon({ series: [9], i: 3 }).pleines).toBe(3);
    expect(avancementLecon({ series: [9], i: 9 }).pleines).toBe(9);
  });

  it('une nouvelle série repart à zéro, sur SA taille', () => {
    // 9 servis, puis une vague de 12 : au premier exercice de la seconde série
    expect(avancementLecon({ series: [9, 12], i: 9 })).toEqual({ pastilles: 12, pleines: 0 });
    expect(avancementLecon({ series: [9, 12], i: 11 })).toEqual({ pastilles: 12, pleines: 2 });
    // tant qu'on reste dans la première, c'est elle qu'on montre
    expect(avancementLecon({ series: [9, 12], i: 8 })).toEqual({ pastilles: 9, pleines: 8 });
  });

  it('aucune pastille ne se remplit sans frappe', () => {
    const e = { series: [9], i: 2 };
    // le temps n'entre plus dans le calcul : même état, même rangée
    expect(avancementLecon(e)).toEqual(avancementLecon({ ...e }));
    expect(avancementLecon(e).pleines).toBe(2);
  });

  it('rien à jouer ne dessine rien, et la fin ne déborde pas', () => {
    expect(avancementLecon({ series: [], i: 0 })).toEqual({ pastilles: 0, pleines: 0 });
    expect(avancementLecon({ series: [9], i: 99 })).toEqual({ pastilles: 9, pleines: 9 });
  });
});
