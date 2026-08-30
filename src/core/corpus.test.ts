import { describe, expect, it } from 'vitest';
import { CORPUS, motsDisponibles, motsNouveaux, chiffresDisponibles } from './corpus';
import { ensembleTouches, PALIER_MAX, PALIER_MAX_DEBUTANT } from './paliers';
/* Le générateur a migré vers `parcours` (#36) ; `corpus` et `paliers` vivent
   encore côte à côte jusqu'à la contraction finale (#48). Les tests qui portent
   sur le GÉNÉRATEUR interrogent donc la nouvelle source de vérité, ceux qui
   portent sur l'ancien corpus gardent l'ancienne. */
import { ensembleTouches as ensembleEtape } from './parcours';
import { groupesTypables, motsTypables } from './contenu';
import { toucheDirecte, toucheMaj } from './layouts';
import { composerBloc, TAILLE_BLOC_MAX, TAILLE_BLOC_MIN } from './generator';

const DISPOS = ['fr-FR', 'fr-CH'] as const;
const PALIERS_JOUABLES = [1, 2, 3, 4, 5, 6, 7];
/* Les étapes 7 à 10 ne portent encore aucune touche : Majuscule et le point
   arrivent en #44, les chiffres et la ponctuation en #45. */
const ETAPES_LETTRES = [1, 2, 3, 4, 5, 6];

describe('invariant corpus × palier (P5, aucune exception)', () => {
  it.each(DISPOS.flatMap((id) => PALIERS_JOUABLES.map((p) => [id, p] as const)))(
    '%s palier %i : aucun item ne contient un caractère hors ensemble',
    (id, p) => {
      const ensemble = ensembleTouches(id, p);
      for (const mot of motsDisponibles(id, p)) {
        for (const c of mot) expect(ensemble.has(c), `${mot} → ${c}`).toBe(true);
      }
    },
  );

  it.each(DISPOS.flatMap((id) => ETAPES_LETTRES.map((p) => [id, p] as const)))(
    '%s étape %i : le générateur ne sort jamais de l\'ensemble',
    (id, p) => {
      const ensemble = ensembleEtape('decouverte', id, p);
      for (let graine = 0; graine < 30; graine++) {
        for (const item of composerBloc({ id, parcours: 'decouverte', etape: p, graine })) {
          for (const c of item.texte) expect(ensemble.has(c), `${item.texte} → ${c}`).toBe(true);
        }
      }
    },
  );

  it.each(DISPOS.flatMap((id) => [1, 2, 3, 4, 5, 6].map((p) => [id, p] as const)))(
    '%s palier %i (sas débutant) : tout est typable SANS modificateur (P2)',
    (id, p) => {
      for (const c of ensembleTouches(id, p)) {
        if (c === ' ') continue;
        expect(toucheDirecte(id, c), `${c} doit être direct en ${id}`).toBeDefined();
      }
    },
  );

  it('palier 7 : les caractères shiftés existent bien sous Maj', () => {
    expect(toucheMaj('fr-FR', '.')).toBeDefined();
    for (const c of '0123456789') expect(toucheMaj('fr-FR', c)).toBeDefined();
    expect(toucheMaj('fr-CH', 'ç')).toBeDefined();
  });

  it('un palier sans vrais mots = build cassé', () => {
    for (const id of DISPOS) {
      for (let p = 1; p <= PALIER_MAX; p++) {
        const mots = motsDisponibles(id, p);
        expect(mots.length, `${id} palier ${p} n'a pas assez de vrais mots`).toBeGreaterThanOrEqual(
          TAILLE_BLOC_MAX,
        );
      }
    }
  });

  it('chaque palier du sas apporte de nouveaux mots', () => {
    for (const id of DISPOS) {
      for (let p = 2; p <= PALIER_MAX_DEBUTANT; p++) {
        expect(motsNouveaux(id, p).length, `${id} palier ${p}`).toBeGreaterThan(0);
      }
    }
  });

  it('le corpus est en minuscules, sans majuscule accentuée ni caractère AltGr', () => {
    for (const mot of CORPUS) {
      expect(mot).toBe(mot.toLowerCase());
      expect(mot).not.toMatch(/[’@#€[\]{}\\|~]/);
    }
  });

  /* Les items multi-mots servent à entraîner l'espace : groupes nominaux et,
     depuis la demande du 2026-08-28, PETITES PHRASES (sujet + verbe). Ils
     restent courts (2 à 4 mots) et démarrent sur un déterminant, un pronom
     sujet, ou un nom déjà présent seul dans le corpus (« papa chante »). */
  it('les items multi-mots sont de petits groupes ou de petites phrases', () => {
    const debuts = new Set([
      'un', 'une', 'le', 'la', 'les', 'du', 'de', 'mon', 'ma', 'mes',
      'je', 'tu', 'il', 'elle', 'on',
    ]);
    for (const m of CORPUS.filter((x) => x.includes(' '))) {
      const mots = m.split(' ');
      expect(mots.length, m).toBeGreaterThanOrEqual(2);
      expect(mots.length, m).toBeLessThanOrEqual(4);
      expect(debuts.has(mots[0]) || CORPUS.includes(mots[0]), m).toBe(true);
    }
  });

  /* La règle n'a pas changé — aucun item inventé — mais la référence, si : le
     générateur sert désormais le lexique gradué et non plus la liste écrite à
     la main. */
  it('aucun pseudo-mot : tout item de genre « mot » vient du lexique', () => {
    for (const id of DISPOS) {
      const attendus = new Set([
        ...motsTypables(ensembleEtape('decouverte', id, 3)),
        ...groupesTypables(ensembleEtape('decouverte', id, 3)),
      ]);
      for (const item of composerBloc({ id, parcours: 'decouverte', etape: 3, graine: 7 })) {
        if (item.genre === 'mot') expect(attendus.has(item.texte), item.texte).toBe(true);
      }
    }
  });

  it('garçon et français : palier 5 en FR-FR, palier 7 en CH-FR', () => {
    expect(motsDisponibles('fr-FR', 5)).toContain('garçon');
    expect(motsDisponibles('fr-CH', 5)).not.toContain('garçon');
    expect(motsDisponibles('fr-CH', 6)).not.toContain('français');
    expect(motsDisponibles('fr-CH', 7)).toContain('garçon');
  });

  it('« où » n\'existe qu\'en FR-FR (ù touche morte en CH-FR)', () => {
    expect(motsDisponibles('fr-FR', 6)).toContain('où');
    expect(motsDisponibles('fr-CH', PALIER_MAX)).not.toContain('où');
  });

  it('les chiffres : aucun avant le palier 7 en FR-FR, dès le palier 1 en CH-FR', () => {
    expect(chiffresDisponibles('fr-FR', 6)).toEqual([]);
    expect(chiffresDisponibles('fr-FR', 7)).toHaveLength(10);
    expect(chiffresDisponibles('fr-CH', 1)).toEqual(['4', '5', '6', '7']);
  });
});

describe('générateur', () => {
  it('produit des blocs de 8 à 12 items uniques', () => {
    for (let graine = 0; graine < 20; graine++) {
      const bloc = composerBloc({ id: 'fr-FR', parcours: 'decouverte', etape: 1, graine });
      expect(bloc.length).toBeGreaterThanOrEqual(TAILLE_BLOC_MIN);
      expect(bloc.length).toBeLessThanOrEqual(TAILLE_BLOC_MAX);
      expect(new Set(bloc.map((i) => i.texte)).size).toBe(bloc.length);
    }
  });

  it('privilégie les vrais mots avant les nombres et les syllabes', () => {
    const bloc = composerBloc({ id: 'fr-CH', parcours: 'decouverte', etape: 1, graine: 3 });
    expect(bloc.filter((i) => i.genre === 'mot').length).toBeGreaterThan(
      bloc.filter((i) => i.genre !== 'mot').length,
    );
  });

  it('réinjecte les items aidés comme contenu ordinaire', () => {
    /* « sur » est typable dès l'étape 1 de Découverte (`e a s i r t u p`) ;
       « sujet » ne l'est plus, faute de `j`. */
    const bloc = composerBloc({ id: 'fr-FR', parcours: 'decouverte', etape: 1, graine: 5, aReinjecter: ['sur'] });
    expect(bloc.map((i) => i.texte)).toContain('sur');
  });

  it('est déterministe à graine égale', () => {
    const a = composerBloc({ id: 'fr-FR', parcours: 'decouverte', etape: 2, graine: 42 });
    const b = composerBloc({ id: 'fr-FR', parcours: 'decouverte', etape: 2, graine: 42 });
    expect(a).toEqual(b);
  });
});
