import { describe, expect, it } from 'vitest';
import {
  composerBloc,
  COUVERTURE_MIN,
  couvertureCible,
  pouceDeLEspace,

  TAILLE_BLOC_MAX,
  TAILLE_BLOC_MIN,
} from './generator';
/* Le générateur a migré vers `parcours` (#36). Les invariants n'ont pas changé,
   leur source de vérité si. */
import { ensembleTouches, nouvellesTouches } from './parcours';
import { OCCURRENCES_REQUISES } from './progression';

const graines = [1, 2, 3, 7, 11, 42, 99, 1234];

describe('générateur de bloc', () => {
  it('compose 8 à 12 items, jamais un caractère hors ensemble (P5)', () => {
    for (const id of ['fr-FR', 'fr-CH'] as const) {
      for (let palier = 1; palier <= 6; palier++) {
        const ensemble = ensembleTouches('decouverte', id, palier);
        for (const graine of graines) {
          const bloc = composerBloc({ id, parcours: 'decouverte', etape: palier, graine });
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
  /* La v1 ouvrait les chiffres dès le palier 1 en CH-FR, parce qu'ils y sont
     directs : l'enfant suisse devait valider onze touches contre sept pour
     l'enfant français, avec le même plafond. La v2 aligne les deux dispositions
     sur une étape « chiffres » commune (#45) — l'asymétrie était un défaut, pas
     une fonctionnalité. */
  it('aucune des deux dispositions n’ouvre de chiffre à la première étape', () => {
    for (const id of ['fr-FR', 'fr-CH'] as const) {
      for (const graine of graines) {
        const bloc = composerBloc({ id, parcours: 'decouverte', etape: 1, graine });
        expect(bloc.filter((i) => i.genre === 'nombre')).toHaveLength(0);
      }
    }
  });

  it('aucun nombre avant l’étape des chiffres, sur les deux dispositions', () => {
    for (const graine of graines) {
      const bloc = composerBloc({ id: 'fr-FR', parcours: 'decouverte', etape: 1, graine });
      expect(bloc.some((i) => i.genre === 'nombre')).toBe(false);
    }
  });

  it('les items restent majoritairement de vrais mots', () => {
    for (const graine of graines) {
      const bloc = composerBloc({ id: 'fr-CH', parcours: 'decouverte', etape: 1, graine });
      expect(bloc.filter((i) => i.genre === 'mot').length).toBeGreaterThan(bloc.length / 2);
    }
  });

  it('aucun item dupliqué dans un bloc', () => {
    for (const graine of graines) {
      const bloc = composerBloc({ id: 'fr-CH', parcours: 'decouverte', etape: 3, graine });
      expect(new Set(bloc.map((i) => i.texte)).size).toBe(bloc.length);
    }
  });

  /* Régression itération 003, point 1 : `f` ne vivait que dans « fut » et
     n'apparaissait que dans 1 bloc sur 6. Le critère de maîtrise était
     inatteignable et le palier ne s'ouvrait plus que par le plafond. */
  it('chaque touche du palier est couverte au moins deux fois par bloc', () => {
    for (const id of ['fr-FR', 'fr-CH'] as const) {
      for (let palier = 1; palier <= 7; palier++) {
        for (const graine of graines) {
          const bloc = composerBloc({ id, parcours: 'decouverte', etape: palier, graine });
          const texte = bloc.map((i) => i.texte).join('').toLowerCase();
          const cible = couvertureCible('decouverte', id, palier);
          for (const c of nouvellesTouches('decouverte', id, palier)) {
            const n = [...texte].filter((x) => x === c).length;
            /* Le palier 7 ouvre 11 touches d'un coup (point + 10 chiffres) :
               deux occurrences de chacune ne tiennent pas dans 12 items. Il est
               aussi le dernier du MVP, donc jamais soumis au critère de
               passage — une occurrence par bloc y suffit. */
            const attendu = Math.min(cible.get(c) ?? 0, palier === 7 ? 1 : COUVERTURE_MIN);
            expect(
              n,
              `${id} palier ${palier} graine ${graine} : « ${c} » vu ${n} fois`,
            ).toBeGreaterThanOrEqual(attendu);
          }
        }
      }
    }
  });

  it('3 blocs suffisent à atteindre les 3 occurrences exigées, sur toutes les graines', () => {
    for (const id of ['fr-FR', 'fr-CH'] as const) {
      for (let palier = 1; palier <= 6; palier++) {
        for (const graine of graines) {
          const texte = [0, 1, 2]
            .map((k) => composerBloc({ id, parcours: 'decouverte', etape: palier, graine: graine + k * 1000 }))
            .flat()
            .map((i) => i.texte)
            .join('')
            .toLowerCase();
          for (const c of nouvellesTouches('decouverte', id, palier)) {
            expect([...texte].filter((x) => x === c).length).toBeGreaterThanOrEqual(
              OCCURRENCES_REQUISES,
            );
          }
        }
      }
    }
  });

  /* Régression itération 003, point 5 : le palier 7 ne servait que des chiffres
     alors que V6 promet « les nombres ET les majuscules ».
     Régression #38 bis : en migrant vers `parcours`, les étapes 7 à 10 se sont
     retrouvées sans aucune touche — un enfant déjà arrivé là perdait les
     majuscules, les phrases et les nombres. Une étape sans touche n'est pas une
     étape en attente, c'est une régression. */
  it('étape Majuscule : les phrases à capitale et point apparaissent', () => {
    for (const id of ['fr-FR', 'fr-CH'] as const) {
      for (const graine of graines) {
        const bloc = composerBloc({ id, parcours: 'decouverte', etape: 7, graine });
        expect(bloc.some((i) => /[A-Z]/.test(i.texte))).toBe(true);
        expect(bloc.some((i) => i.texte.includes('.'))).toBe(true);
        // aucune capitale accentuée, jamais (cahier 4.7)
        expect(bloc.some((i) => /[ÉÈÀÇŒ]/.test(i.texte))).toBe(false);
      }
    }
  });

  it("l'espace se frappe du pouce de la main opposée (P8)", () => {
    expect(pouceDeLEspace('gauche')).toBe('droite');
    expect(pouceDeLEspace('droite')).toBe('gauche');
    expect(pouceDeLEspace(undefined)).toBe('gauche');
  });
});
