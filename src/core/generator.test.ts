import { describe, expect, it } from 'vitest';
import {
  composerBloc,
  COUVERTURE_MIN,
  couvertureCible,
  type GenreItem,
  LECONS_SANS_REPETITION,
  ORDRE_PREFERENCE,
  pouceDeLEspace,
  TAILLE_BLOC_MAX,
  TAILLE_BLOC_MIN,
  vivierPrefere,
} from './generator';
/* Le générateur a migré vers `parcours` (#36). Les invariants n'ont pas changé,
   leur source de vérité si. */
import { ensembleTouches, nouvellesTouches } from './parcours';
import { type Maitrise, OCCURRENCES_REQUISES } from './progression';

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

/* #39 — La maîtrise ne commande plus aucun passage : elle PONDÈRE le tirage.
   Une touche mal acquise doit revenir plus souvent dans les leçons suivantes
   de la même étape, sans qu'aucun seuil ni aucun affichage n'existe. */
describe('pondération par la maîtrise (#39)', () => {
  const toutesSauf = (id: 'fr-FR' | 'fr-CH', etape: number, faible: string): Maitrise => {
    const m: Maitrise = {};
    for (const c of ensembleTouches('decouverte', id, etape)) {
      if (c === ' ' || c === faible) continue;
      m[c] = [1, 1, 2]; // 3 occurrences sur 2 blocs distincts
    }
    return m;
  };
  const occurrences = (etape: number, c: string, maitrise?: Maitrise) =>
    grainesLongues
      .map((graine) =>
        composerBloc({ id: 'fr-FR', parcours: 'decouverte', etape, graine, maitrise })
          .map((i) => i.texte)
          .join('')
          .toLowerCase(),
      )
      .join('')
      .split('')
      .filter((x) => x === c).length;

  const grainesLongues = Array.from({ length: 40 }, (_, k) => k * 37 + 1);

  it('une touche mal acquise revient plus souvent que les touches acquises', () => {
    let cumulFaible = 0;
    let cumulAcquis = 0;
    for (const etape of [2, 3, 4]) {
      for (const c of nouvellesTouches('decouverte', 'fr-FR', etape)) {
        const faible = occurrences(etape, c, toutesSauf('fr-FR', etape, c));
        const acquis = occurrences(etape, c, toutesSauf('fr-FR', etape, ''));
        /* Jamais moins : une touche faible ne peut pas être servie plus
           rarement. Pas toujours plus : « à » n'a que trois porteurs dans tout
           le lexique de l'âge, la couverture les sert déjà tous. */
        expect(faible, `étape ${etape}, « ${c} »`).toBeGreaterThanOrEqual(acquis);
        cumulFaible += faible;
        cumulAcquis += acquis;
      }
    }
    expect(cumulFaible).toBeGreaterThan(cumulAcquis);
  });

  it('sans maîtrise mesurée, aucune touche n’est favorisée', () => {
    for (const graine of graines) {
      const sans = composerBloc({ id: 'fr-FR', parcours: 'decouverte', etape: 3, graine });
      const vide = composerBloc({ id: 'fr-FR', parcours: 'decouverte', etape: 3, graine, maitrise: {} });
      expect(sans.map((i) => i.texte)).toEqual(vide.map((i) => i.texte));
    }
  });

  it('la maîtrise ne change ni la taille du bloc ni la couverture des touches', () => {
    for (const graine of graines) {
      const bloc = composerBloc({
        id: 'fr-FR',
        parcours: 'decouverte',
        etape: 3,
        graine,
        maitrise: toutesSauf('fr-FR', 3, 'b'),
      });
      expect(bloc.length).toBeGreaterThanOrEqual(TAILLE_BLOC_MIN);
      const texte = bloc.map((i) => i.texte).join('').toLowerCase();
      const cible = couvertureCible('decouverte', 'fr-FR', 3);
      for (const c of nouvellesTouches('decouverte', 'fr-FR', 3)) {
        expect([...texte].filter((x) => x === c).length).toBeGreaterThanOrEqual(cible.get(c) ?? 0);
      }
    }
  });
});

/* #39 — Garde-fou §7.2 : « pas deux fois le même exercice dans une leçon, au
   moins trois leçons d'écart entre deux occurrences ». */
describe('non-répétition (#39)', () => {
  it('aucun exercice deux fois dans une même leçon, à toutes les étapes', () => {
    for (const id of ['fr-FR', 'fr-CH'] as const) {
      for (let etape = 1; etape <= 10; etape++) {
        for (const graine of graines) {
          const bloc = composerBloc({ id, parcours: 'decouverte', etape, graine });
          expect(new Set(bloc.map((i) => i.texte)).size, `${id} étape ${etape}`).toBe(bloc.length);
        }
      }
    }
  });

  /* Cinq leçons enchaînées, chacune connaissant les deux précédentes. Deux
     affirmations, et la seconde est une exception assumée : quand une touche
     neuve n'a que deux porteurs dans tout le lexique de l'âge (« à » ne vit que
     dans « là », « voilà », « déjà » à l'étape 5), couvrir la touche l'emporte
     sur l'écart — on ne comble jamais avec un pseudo-mot. */
  const cinqLecons = (id: 'fr-FR' | 'fr-CH', etape: number, graine: number) => {
    const histoire: string[][] = [];
    const repetes: string[] = [];
    for (let lecon = 0; lecon < 5; lecon++) {
      const recemmentVus = histoire.slice(-(LECONS_SANS_REPETITION - 1)).flat();
      const bloc = composerBloc({
        id,
        parcours: 'decouverte',
        etape,
        graine: graine + lecon * 1000,
        recemmentVus,
      }).map((i) => i.texte);
      repetes.push(...bloc.filter((t) => recemmentVus.includes(t)));
      histoire.push(bloc);
    }
    return repetes;
  };

  it('un exercice qui revient trop tôt porte forcément une touche neuve', () => {
    for (const id of ['fr-FR', 'fr-CH'] as const) {
      for (let etape = 1; etape <= 10; etape++) {
        const neuves = nouvellesTouches('decouverte', id, etape);
        for (const graine of graines) {
          for (const t of cinqLecons(id, etape, graine)) {
            expect(
              neuves.some((c) => t.toLowerCase().includes(c)),
              `${id} étape ${etape} : « ${t} » revient sans porter de touche neuve`,
            ).toBe(true);
          }
        }
      }
    }
  });

  it('là où le corpus est large, aucun exercice ne revient avant trois leçons', () => {
    for (const id of ['fr-FR', 'fr-CH'] as const) {
      for (let etape = 1; etape <= 4; etape++) {
        for (const graine of graines) {
          expect(cinqLecons(id, etape, graine), `${id} étape ${etape}`).toEqual([]);
        }
      }
    }
  });
});

/* #39 — L'ordre de préférence du cahier (P5) est « visible et fixe » : vrai mot
   ou groupe nominal > nombre > phrase. */
describe('ordre de préférence du générateur (P5)', () => {
  it('le vivier sert mots et groupes, puis nombres, puis phrases', () => {
    const ensemble = ensembleTouches('decouverte', 'fr-FR', 9);
    const rangs = vivierPrefere(ensemble).map((i) => ORDRE_PREFERENCE.indexOf(i.genre));
    expect(rangs.length).toBeGreaterThan(0);
    for (let k = 1; k < rangs.length; k++) expect(rangs[k]).toBeGreaterThanOrEqual(rangs[k - 1]);
    expect(new Set(rangs).size).toBe(ORDRE_PREFERENCE.length); // les trois genres sont là
  });

  it('à l’étape de la ponctuation, le remplissage sert des mots, jamais des phrases en surnombre', () => {
    for (const graine of graines) {
      const bloc = composerBloc({ id: 'fr-FR', parcours: 'decouverte', etape: 9, graine });
      const compte = (g: GenreItem) => bloc.filter((i) => i.genre === g).length;
      /* Toutes les touches sont ouvertes : mots, nombres et phrases sont tous
         jouables. Le remplissage sert alors les vrais mots — nombres et
         phrases ne restent que par la couverture des touches neuves et par
         leurs planchers. */
      expect(compte('mot')).toBeGreaterThan(compte('nombre') + compte('phrase'));
    }
  });

  it('la syllabe de remplissage n’existe plus comme type d’item', () => {
    for (const graine of graines) {
      for (let etape = 1; etape <= 10; etape++) {
        for (const item of composerBloc({ id: 'fr-FR', parcours: 'decouverte', etape, graine })) {
          expect(ORDRE_PREFERENCE).toContain(item.genre);
        }
      }
    }
  });
});
