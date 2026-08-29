import { describe, expect, it } from 'vitest';
import {
  avancementPalier,
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

/* L'en-tête de la leçon montre où on en est DANS le palier. La barre doit
   atteindre 1 exactement quand `palierFranchi` bascule — sinon elle promet
   une progression que le franchissement dément, ou saute sans prévenir. */
describe('avancement dans le palier', () => {
  const cles = touchesAValider('fr-FR', 1);
  const toutMaitriser = (n: number) =>
    cles.slice(0, n).reduce<Maitrise>((m, c) => noter(m, c, [1, 1, 2]), {});

  it('vaut 0 sur un palier tout juste ouvert', () => {
    expect(avancementPalier('fr-FR', 1, {}, 0).part).toBe(0);
  });

  it('suit la part de touches maîtrisées', () => {
    const a = avancementPalier('fr-FR', 1, toutMaitriser(1), 0);
    expect(a.part).toBeCloseTo(1 / cles.length);
    expect(a.maitrisees).toBe(1);
    expect(a.total).toBe(cles.length);
  });

  /* Un enfant qui enchaîne les blocs sans rien maîtriser monte quand même au
     bout de 6. Une barre qui n'écouterait que la maîtrise resterait basse
     puis sauterait : c'est le chemin le PLUS avancé qui la commande. */
  it('suit le plafond de blocs quand il devance la maîtrise', () => {
    const a = avancementPalier('fr-FR', 1, {}, 3);
    expect(a.part).toBeCloseTo(3 / PLAFOND_BLOCS);
    expect(a.chemin).toBe('blocs');
  });

  it('nomme le chemin de la maîtrise quand elle devance les blocs', () => {
    expect(avancementPalier('fr-FR', 1, toutMaitriser(cles.length - 1), 0).chemin)
      .toBe('touches');
  });

  it('atteint 1 exactement quand le palier est franchi, par les deux chemins', () => {
    const parMaitrise = toutMaitriser(cles.length);
    expect(palierFranchi('fr-FR', 1, parMaitrise, 0)).toBe(true);
    expect(avancementPalier('fr-FR', 1, parMaitrise, 0).part).toBe(1);

    expect(palierFranchi('fr-FR', 1, {}, PLAFOND_BLOCS)).toBe(true);
    expect(avancementPalier('fr-FR', 1, {}, PLAFOND_BLOCS).part).toBe(1);
  });

  /* Le dernier palier ne mène nulle part : annoncer une progression vers un
     palier 8 inexistant serait une promesse en l'air. */
  it('reste plein sur le dernier palier, qui n\'ouvre sur rien', () => {
    const a = avancementPalier('fr-FR', 7, {}, 0);
    expect(a.part).toBe(1);
    expect(a.chemin).toBe('dernier');
  });
});
