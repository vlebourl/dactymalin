import { describe, expect, it } from 'vitest';
import { composerBloc, pouceDeLEspace, QUOTA_NOMBRES, TAILLE_BLOC_MAX, TAILLE_BLOC_MIN } from './generator';
import { ensembleTouches } from './paliers';
import { chiffresDisponibles } from './corpus';

const graines = [1, 2, 3, 7, 11, 42, 99, 1234];

describe('générateur de bloc', () => {
  it('compose 8 à 12 items, jamais un caractère hors ensemble (P5)', () => {
    for (const id of ['fr-FR', 'fr-CH'] as const) {
      for (let palier = 1; palier <= 6; palier++) {
        const ensemble = ensembleTouches(id, palier);
        for (const graine of graines) {
          const bloc = composerBloc({ id, palier, graine });
          expect(bloc.length).toBeGreaterThanOrEqual(TAILLE_BLOC_MIN);
          expect(bloc.length).toBeLessThanOrEqual(TAILLE_BLOC_MAX);
          for (const item of bloc) {
            for (const c of item.texte) expect(ensemble.has(c)).toBe(true);
          }
        }
      }
    }
  });

  /* Régression itération 001 : un bloc CH-FR de palier 1 ne contenait AUCUN
     nombre — la préférence « vrai mot > nombre » les évinçait tous, alors que
     V2 promet des nombres dès la première leçon. */
  it('CH-FR palier 1 : au moins deux nombres par bloc', () => {
    for (const graine of graines) {
      const bloc = composerBloc({ id: 'fr-CH', palier: 1, graine });
      const nombres = bloc.filter((i) => i.genre === 'nombre');
      expect(nombres.length).toBeGreaterThanOrEqual(QUOTA_NOMBRES);
      for (const n of nombres) expect(n.texte).toMatch(/^[4-7]{1,3}$/);
    }
  });

  it('FR-FR sous le palier 7 : aucun nombre, les chiffres ne sont pas ouverts', () => {
    expect(chiffresDisponibles('fr-FR', 6)).toEqual([]);
    for (const graine of graines) {
      const bloc = composerBloc({ id: 'fr-FR', palier: 1, graine });
      expect(bloc.some((i) => i.genre === 'nombre')).toBe(false);
    }
  });

  it('les items restent majoritairement de vrais mots', () => {
    for (const graine of graines) {
      const bloc = composerBloc({ id: 'fr-CH', palier: 1, graine });
      expect(bloc.filter((i) => i.genre === 'mot').length).toBeGreaterThan(bloc.length / 2);
    }
  });

  it('aucun item dupliqué dans un bloc', () => {
    for (const graine of graines) {
      const bloc = composerBloc({ id: 'fr-CH', palier: 3, graine });
      expect(new Set(bloc.map((i) => i.texte)).size).toBe(bloc.length);
    }
  });

  it("l'espace se frappe du pouce de la main opposée (P8)", () => {
    expect(pouceDeLEspace('gauche')).toBe('droite');
    expect(pouceDeLEspace('droite')).toBe('gauche');
    expect(pouceDeLEspace(undefined)).toBe('gauche');
  });
});
