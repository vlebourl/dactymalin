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
   pastilles figées. Elle compte désormais les MOTS de l'exercice servi. */
describe('avancement dans l\'exercice en cours (#76)', () => {
  it('autant de pastilles que l\'exercice a de mots, jamais douze par principe', () => {
    expect(avancementLecon({ series: [9], i: 0 }).pastilles).toBe(9);
    expect(avancementLecon({ series: [12], i: 0 }).pastilles).toBe(12);
    expect(avancementLecon({ series: [8], i: 0 }).pastilles).toBe(8);
  });

  it('une pastille se remplit par mot terminé', () => {
    expect(avancementLecon({ series: [9], i: 0 }).pleines).toBe(0);
    expect(avancementLecon({ series: [9], i: 3 }).pleines).toBe(3);
    expect(avancementLecon({ series: [9], i: 9 }).pleines).toBe(9);
  });

  it('un nouvel exercice repart à zéro, sur SA taille', () => {
    const a = avancementLecon({ series: [9, 12], i: 9 });
    expect([a.pastilles, a.pleines]).toEqual([12, 0]);
    const b = avancementLecon({ series: [9, 12], i: 11 });
    expect([b.pastilles, b.pleines]).toEqual([12, 2]);
    // tant qu'on reste dans le premier, c'est lui qu'on montre
    const c = avancementLecon({ series: [9, 12], i: 8 });
    expect([c.pastilles, c.pleines]).toEqual([9, 8]);
  });

  it('aucune pastille ne se remplit sans frappe', () => {
    const e = { series: [9], i: 2 };
    // le temps n'entre plus dans le calcul : même état, même rangée
    expect(avancementLecon(e)).toEqual(avancementLecon({ ...e }));
    expect(avancementLecon(e).pleines).toBe(2);
  });

  it('rien à jouer ne dessine rien, et la fin ne déborde pas', () => {
    const vide = avancementLecon({ series: [], i: 0 });
    expect([vide.pastilles, vide.pleines]).toEqual([0, 0]);
    const fin = avancementLecon({ series: [9], i: 99 });
    expect([fin.pastilles, fin.pleines]).toEqual([9, 9]);
  });
});

/* Régression #107 : la rangée se remplissait puis se vidait sans que rien
   d'autre ne bouge. Un enfant pouvait la finir deux fois de suite en lisant
   « Leçon 1 sur 7 » figé : les points ne comptaient vers rien. L'exercice est
   l'échelon manquant, et il a maintenant son compteur. */
describe('l\'exercice, échelon entre le mot et la leçon (#107)', () => {
  it('le rang d\'exercice avance quand la rangée se vide', () => {
    expect(avancementLecon({ series: [12], i: 11 }, 5).exercice).toBe(1);
    // le douzième mot fini, on n'est plus dans le premier exercice
    expect(avancementLecon({ series: [12, 12], i: 12 }, 5).exercice).toBe(2);
    expect(avancementLecon({ series: [12, 12, 12], i: 30 }, 5).exercice).toBe(3);
  });

  it('le dénominateur est celui de la leçon, pas celui des vagues déjà servies', () => {
    // la file se remplit AVANT de se vider : annoncer `series.length` ferait
    // monter le total sous les yeux de l'enfant, exercice après exercice.
    expect(avancementLecon({ series: [12], i: 0 }, 5).exercices).toBe(5);
    expect(avancementLecon({ series: [12, 12], i: 12 }, 5).exercices).toBe(5);
  });

  it('sans quota — la liste de la maison — le total est ce qui a été servi', () => {
    const a = avancementLecon({ series: [12], i: 3 });
    expect([a.exercice, a.exercices]).toEqual([1, 1]);
  });

  it('un exercice vide ne mange pas un rang', () => {
    // un tirage peut retomber en entier sur du déjà servi : cette vague-là ne
    // s'est jamais vue à l'écran.
    expect(avancementLecon({ series: [12, 0, 12], i: 12 }, 4).exercice).toBe(2);
  });

  it('le compteur ne dépasse jamais son dénominateur annoncé', () => {
    const fin = avancementLecon({ series: [12, 12], i: 99 }, 2);
    expect([fin.exercice, fin.exercices]).toEqual([2, 2]);
  });
});
