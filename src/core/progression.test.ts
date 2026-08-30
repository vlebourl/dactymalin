import { describe, expect, it } from 'vitest';
import { avancementEtape, estMaitrisee, noterOccurrence, type Maitrise } from './progression';
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
