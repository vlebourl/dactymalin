import { describe, expect, it } from 'vitest';
import {
  ETAPE_MAX,
  LECONS_PAR_ETAPE,
  doigtDe,
  doigtsOuverts,
  ensembleTouches,
  etape,
  etapeFinie,
  etapeSuivante,
  etapes,
  nouvellesTouches,
  type IdParcours,
} from './parcours';
import { mainDe, type IdDisposition } from './layouts';

const PARCOURS: IdParcours[] = ['decouverte', 'dactylo'];
const DISPOS: IdDisposition[] = ['fr-FR', 'fr-CH'];

describe('la forme du parcours', () => {
  it('a dix étapes dans les quatre combinaisons', () => {
    for (const p of PARCOURS) {
      for (const d of DISPOS) {
        expect(etapes(p, d).map((e) => e.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      }
    }
  });

  it('ouvre huit lettres à la première étape, sur les deux dispositions', () => {
    for (const p of PARCOURS) {
      for (const d of DISPOS) {
        expect(nouvellesTouches(p, d, 1)).toHaveLength(8);
      }
    }
  });

  /* Le défaut mesuré de la v1 : les étapes 8, 9 et 10 déclaraient `nouvelles: []`
     et n'étaient donc jamais atteignables. Ici une étape sans lettre a un rôle. */
  it("aucune étape n'est vide de sens", () => {
    for (const p of PARCOURS) {
      for (const d of DISPOS) {
        for (const e of etapes(p, d)) {
          expect(e.nouvelles.length > 0 || e.genre !== 'lettres').toBe(true);
        }
      }
    }
  });

  it('enchaîne les étapes jusqu’à la dixième, puis s’arrête', () => {
    expect(etapeSuivante(1)).toBe(2);
    expect(etapeSuivante(ETAPE_MAX)).toBeUndefined();
  });

  it("l'étape est finie après sept leçons, pas avant", () => {
    expect(LECONS_PAR_ETAPE).toBe(7);
    expect(etapeFinie(6)).toBe(false);
    expect(etapeFinie(7)).toBe(true);
    expect(etapeFinie(9)).toBe(true);
  });
});

describe("l'ensemble des touches ouvertes", () => {
  it('cumule les étapes précédentes', () => {
    const e1 = ensembleTouches('decouverte', 'fr-FR', 1);
    const e2 = ensembleTouches('decouverte', 'fr-FR', 2);
    for (const c of e1) expect(e2.has(c)).toBe(true);
    expect(e2.size).toBeGreaterThan(e1.size);
  });

  it("contient l'espace dès la première étape des deux parcours", () => {
    for (const p of PARCOURS) {
      for (const d of DISPOS) {
        expect(ensembleTouches(p, d, 1).has(' ')).toBe(true);
      }
    }
  });

  it('couvre les vingt-six lettres à la dernière étape', () => {
    for (const p of PARCOURS) {
      for (const d of DISPOS) {
        const tout = ensembleTouches(p, d, ETAPE_MAX);
        for (const c of 'abcdefghijklmnopqrstuvwxyz') {
          expect(tout.has(c), `${p}/${d} : ${c}`).toBe(true);
        }
      }
    }
  });

  /* En v1, `k` n'était enseigné sur aucune des deux dispositions : l'enfant
     terminait le parcours sans avoir tapé une lettre de l'alphabet. */
  it('enseigne le k', () => {
    for (const p of PARCOURS) {
      for (const d of DISPOS) {
        expect(ensembleTouches(p, d, ETAPE_MAX).has('k')).toBe(true);
      }
    }
  });
});

describe('le doigt montré, qui est la seule vraie différence entre les parcours', () => {
  /* Découverte n'enseigne pas le doigt mais la MAIN : l'index de chaque main
     couvre toute sa moitié de clavier. */
  it('Découverte montre toujours un index, du côté de la touche', () => {
    for (const d of DISPOS) {
      for (const c of ensembleTouches('decouverte', d, ETAPE_MAX)) {
        if (c === ' ') continue;
        const attendu = mainDe(d, c) === 'gauche' ? 'index_gauche' : 'index_droit';
        expect(doigtDe('decouverte', d, c), `${d} : ${c}`).toBe(attendu);
      }
    }
  });

  it('Dactylo montre le doigt définitif, qui n’est pas toujours un index', () => {
    expect(doigtDe('dactylo', 'fr-FR', 'e')).toBe('majeur_gauche');
    expect(doigtDe('dactylo', 'fr-FR', 'a')).toBe('auriculaire_gauche');
    expect(doigtDe('dactylo', 'fr-FR', 'r')).toBe('index_gauche');
    expect(doigtDe('dactylo', 'fr-FR', 'o')).toBe('annulaire_droit');
  });

  /* Le `m` est la seule lettre qui change de doigt d'une disposition à l'autre,
     et elle passe d'une extrémité à l'autre. */
  it('le m change de doigt entre AZERTY et QWERTZ suisse', () => {
    expect(doigtDe('dactylo', 'fr-FR', 'm')).toBe('auriculaire_droit');
    expect(doigtDe('dactylo', 'fr-CH', 'm')).toBe('index_droit');
  });

  it('ne connaît pas une touche qui n’est pas au parcours', () => {
    expect(doigtDe('dactylo', 'fr-FR', 'ß')).toBeUndefined();
  });
});

describe('le budget de doigts', () => {
  it("Découverte n'en déclare aucun", () => {
    for (const d of DISPOS) {
      for (let n = 1; n <= ETAPE_MAX; n++) {
        expect(doigtsOuverts('decouverte', d, n)).toBeNull();
      }
    }
  });

  it('Dactylo ouvre index et majeurs à la première étape', () => {
    for (const d of DISPOS) {
      expect(doigtsOuverts('dactylo', d, 1)).toEqual(
        expect.arrayContaining(['index_gauche', 'index_droit', 'majeur_gauche', 'majeur_droit']),
      );
      expect(doigtsOuverts('dactylo', d, 1)).toHaveLength(4);
    }
  });

  it("n'ouvre jamais une touche dont le doigt est encore fermé", () => {
    for (const d of DISPOS) {
      for (const e of etapes('dactylo', d)) {
        for (const c of e.nouvelles) {
          expect(e.doigtsOuverts, `${d} étape ${e.n} : ${c}`).toContain(doigtDe('dactylo', d, c));
        }
      }
    }
  });

  it('ne referme jamais un doigt', () => {
    for (const d of DISPOS) {
      let precedent = 0;
      for (const e of etapes('dactylo', d)) {
        const n = e.doigtsOuverts?.length ?? 0;
        expect(n).toBeGreaterThanOrEqual(precedent);
        precedent = n;
      }
    }
  });

  /* L'auriculaire entre d'abord comme porteur du modificateur : maintenir une
     touche est moteurement moins exigeant que frapper une lettre. */
  it("l'étape Majuscule précède les lettres d'auriculaire", () => {
    for (const d of DISPOS) {
      const liste = etapes('dactylo', d);
      const maj = liste.find((e) => e.genre === 'majuscule')!;
      expect(maj.doigtsModificateur).toContain('auriculaire_gauche');
      expect(maj.doigtsOuverts).not.toContain('auriculaire_gauche');
      const premieresLettres = liste.find(
        (e) =>
          e.genre === 'lettres' &&
          e.nouvelles.some((c) => doigtDe('dactylo', d, c) === 'auriculaire_gauche'),
      )!;
      expect(premieresLettres.n).toBeGreaterThan(maj.n);
    }
  });

  it('place la Majuscule tôt en Dactylo et tard en Découverte', () => {
    for (const d of DISPOS) {
      const maj = (p: IdParcours) => etapes(p, d).find((e) => e.genre === 'majuscule')!.n;
      expect(maj('dactylo')).toBeLessThan(maj('decouverte'));
    }
  });
});

describe('une étape se décrit', () => {
  it('porte un titre pour les étapes qui n’ouvrent pas de lettres', () => {
    for (const p of PARCOURS) {
      for (const e of etapes(p, 'fr-FR')) {
        if (e.genre === 'lettres') continue;
        expect(e.titre).toBeTruthy();
      }
    }
  });

  it('refuse un numéro d’étape hors des dix', () => {
    expect(() => etape('decouverte', 'fr-FR', 0)).toThrow();
    expect(() => etape('decouverte', 'fr-FR', 11)).toThrow();
  });
});
