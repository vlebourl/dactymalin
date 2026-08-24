import { describe, expect, it } from 'vitest';
import {
  estMaitrisee,
  noterOccurrence,
  palierFranchi,
  PLAFOND_BLOCS,
  type Maitrise,
} from './progression';
import { touchesAValider } from './paliers';

const noter = (m: Maitrise, c: string, blocs: number[]) =>
  blocs.reduce((acc, b) => noterOccurrence(acc, c, b), m);

describe('critère de passage de palier', () => {
  it('3 occurrences réparties sur au moins 2 blocs', () => {
    expect(estMaitrisee(noter({}, 's', [1, 1]), 's')).toBe(false);
    expect(estMaitrisee(noter({}, 's', [1, 1, 1]), 's')).toBe(false);
    expect(estMaitrisee(noter({}, 's', [1, 1, 2]), 's')).toBe(true);
    expect(estMaitrisee(noter({}, 's', [1, 2, 3]), 's')).toBe(true);
  });

  it('l\'espace n\'est jamais un critère', () => {
    expect(noterOccurrence({}, ' ', 1)).toEqual({});
  });

  it('le palier s\'ouvre quand TOUTES ses touches sont maîtrisées', () => {
    let m: Maitrise = {};
    const cles = touchesAValider('fr-FR', 1);
    for (const c of cles.slice(0, -1)) m = noter(m, c, [1, 1, 2]);
    expect(palierFranchi('fr-FR', 1, m, 2)).toBe(false);
    m = noter(m, cles[cles.length - 1], [1, 1, 2]);
    expect(palierFranchi('fr-FR', 1, m, 2)).toBe(true);
  });

  it('plafond anti-mur : après 6 blocs le palier suivant s\'ouvre quand même', () => {
    expect(palierFranchi('fr-FR', 1, {}, PLAFOND_BLOCS - 1)).toBe(false);
    expect(palierFranchi('fr-FR', 1, {}, PLAFOND_BLOCS)).toBe(true);
  });

  it('aucun quota de volume ni de temps : 3 occurrences suffisent', () => {
    const m = noter({}, 'e', [1, 2, 3]);
    expect(m.e).toHaveLength(3);
    expect(estMaitrisee(m, 'e')).toBe(true);
  });

  it('le palier 7 est le dernier du MVP : il ne se franchit pas', () => {
    expect(palierFranchi('fr-FR', 7, {}, 99)).toBe(false);
  });

  it('CH-FR doit aussi maîtriser ses chiffres de palier 1', () => {
    expect(touchesAValider('fr-CH', 1)).toEqual(expect.arrayContaining(['4', '5', '6', '7']));
    expect(touchesAValider('fr-FR', 1)).not.toContain('4');
  });
});
