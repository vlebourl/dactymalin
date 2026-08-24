import { describe, expect, it } from 'vitest';
import { ensembleTouches, libellesEnsemble, PALIER_MAJUSCULES, touchesAValider } from './paliers';
import { exigeMaj, mainDe, toucheDe } from './layouts';

const DISPOS = ['fr-FR', 'fr-CH'] as const;

describe('bandeau des touches de la leçon', () => {
  /* Régression itération 003, point 3 : le bandeau n'annonçait que les
     NOUVELLES touches (« O L D B M ») alors que l'item était « melon ». */
  it("annonce l'ensemble cumulé, pas les seules nouveautés", () => {
    const p3 = libellesEnsemble('fr-FR', 3);
    for (const c of [...touchesAValider('fr-FR', 1), ...touchesAValider('fr-FR', 3)]) {
      expect(p3).toContain(c.toUpperCase());
    }
  });

  /* Régression itération 003, point 4 : le palier 5 imprimait « É È À Ç ». */
  it('aucune capitale accentuée, à aucun palier', () => {
    for (const id of DISPOS) {
      for (let palier = 1; palier <= 7; palier++) {
        const ligne = libellesEnsemble(id, palier).join(' ');
        expect(ligne).not.toMatch(/[ÉÈÀÙÇŒ]/);
        expect(ligne).not.toContain(' '.repeat(2));
      }
    }
  });

  it('les lettres passent avant les chiffres, la ponctuation ferme la marche', () => {
    const p7 = libellesEnsemble('fr-FR', 7);
    expect(p7[p7.length - 1]).toBe('.');
    expect(p7.indexOf('0')).toBeGreaterThan(p7.indexOf('Z'));
  });

  it("n'affiche jamais l'espace ni un doublon de capitale", () => {
    const p7 = libellesEnsemble('fr-FR', 7);
    expect(p7).not.toContain(' ');
    expect(new Set(p7).size).toBe(p7.length);
  });
});

describe('palier de la touche Majuscule', () => {
  it('ouvre les capitales ASCII des lettres déjà acquises, jamais les accentuées', () => {
    for (const id of DISPOS) {
      const avant = ensembleTouches(id, PALIER_MAJUSCULES - 1);
      const apres = ensembleTouches(id, PALIER_MAJUSCULES);
      expect(avant.has('C')).toBe(false);
      expect(apres.has('C')).toBe(true);
      expect(apres.has('É')).toBe(false);
    }
  });

  it('une capitale a une touche porteuse, exige Maj, et garde la main de sa minuscule', () => {
    expect(exigeMaj('fr-FR', 'C')).toBe(true);
    expect(toucheDe('fr-FR', 'C')?.code).toBe('KeyC');
    expect(mainDe('fr-FR', 'C')).toBe(mainDe('fr-FR', 'c'));
    expect(exigeMaj('fr-FR', 'c')).toBe(false);
  });
});
