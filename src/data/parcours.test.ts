import { describe, expect, it } from 'vitest';
import parcours from './parcours.json';
import lexique from './lexique-v3.json';
import { toucheDe } from '../core/layouts';

/* Les invariants du cahier v2 §4.5 et §4.9, vérifiés sur les données
   générées par `scripts/analyse/generer-lecons.py`. Ce fichier n'existe pas
   pour tester du code : il existe pour qu'une régénération fautive du corpus
   soit rattrapée par le build plutôt que par un enfant de huit ans. */

const PARCOURS = ['decouverte', 'dactylo'] as const;
const DISPOS = ['fr-FR', 'fr-CH'] as const;
const PLANCHER = 60;

type Etape = {
  n: number;
  genre: string;
  nouvelles: string[];
  doigts: Record<string, string>;
  doigtsOuverts: string[] | null;
  doigtsModificateur?: string[];
  items: { mots: number; groupes: number; total: number } | null;
};
const etapesDe = (p: string, d: string): Etape[] =>
  (parcours as never as Record<string, Record<string, { etapes: Etape[] }>>)[p][d].etapes;

describe('structure des parcours', () => {
  it('dix étapes numérotées 1 à 10, dans les quatre combinaisons', () => {
    for (const p of PARCOURS) {
      for (const d of DISPOS) {
        const et = etapesDe(p, d);
        expect(et.map((e) => e.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      }
    }
  });

  it('aucune étape vide : chacune ouvre des lettres ou a un rôle nommé', () => {
    for (const p of PARCOURS) {
      for (const d of DISPOS) {
        for (const e of etapesDe(p, d)) {
          const utile = e.nouvelles.length > 0 || e.genre !== 'lettres';
          expect(utile, `${p}/${d} étape ${e.n}`).toBe(true);
        }
      }
    }
  });

  it('aucune touche ouverte deux fois', () => {
    for (const p of PARCOURS) {
      for (const d of DISPOS) {
        const toutes = etapesDe(p, d).flatMap((e) => e.nouvelles);
        expect(new Set(toutes).size).toBe(toutes.length);
      }
    }
  });

  it('chaque touche existe en frappe directe sur sa disposition', () => {
    for (const p of PARCOURS) {
      for (const d of DISPOS) {
        for (const e of etapesDe(p, d)) {
          for (const c of e.nouvelles) {
            expect(toucheDe(d, c), `${p}/${d} : ${c}`).toBeTruthy();
          }
        }
      }
    }
  });
});

describe('budget de doigts', () => {
  /* Cahier v2 §4.5 : en Dactylo une touche n'est ouvrable qu'une fois son
     doigt définitif ouvert. C'est l'invariant qui distingue les deux
     parcours ; s'il tombe, Dactylo n'enseigne plus rien de particulier. */
  it("Dactylo n'ouvre jamais une touche dont le doigt est encore fermé", () => {
    for (const d of DISPOS) {
      for (const e of etapesDe('dactylo', d)) {
        if (e.genre !== 'lettres') continue;
        for (const [c, doigt] of Object.entries(e.doigts)) {
          expect(e.doigtsOuverts, `${d} étape ${e.n} : ${c}`).toContain(doigt);
        }
      }
    }
  });

  it('les doigts de Dactylo ne se referment jamais', () => {
    for (const d of DISPOS) {
      let precedent = 0;
      for (const e of etapesDe('dactylo', d)) {
        const n = e.doigtsOuverts?.length ?? 0;
        expect(n).toBeGreaterThanOrEqual(precedent);
        precedent = n;
      }
    }
  });

  it('Découverte ne déclare aucun budget de doigts', () => {
    for (const d of DISPOS) {
      for (const e of etapesDe('decouverte', d)) {
        expect(e.doigtsOuverts).toBeNull();
      }
    }
  });

  /* P8.2 : l'auriculaire entre d'abord comme porteur du modificateur, et ses
     lettres ne viennent qu'ensuite. */
  it("l'étape Majuscule de Dactylo précède les lettres d'auriculaire", () => {
    for (const d of DISPOS) {
      const et = etapesDe('dactylo', d);
      const maj = et.find((e) => e.genre === 'majuscule')!;
      expect(maj.doigtsModificateur).toContain('auriculaire_gauche');
      expect(maj.doigtsOuverts).not.toContain('auriculaire_gauche');
      const lettresAuriculaire = et.find(
        (e) => e.genre === 'lettres' && Object.values(e.doigts).includes('auriculaire_gauche'),
      );
      expect(lettresAuriculaire!.n).toBeGreaterThan(maj.n);
    }
  });
});

describe('règle de recette : 60 items par étape', () => {
  /* Cahier v2 P5. Une leçon dure 10-15 min, soit 50 à 60 exercices, et aucun
     ne doit s'y répéter. Une étape sous ce plancher fait tourner le corpus en
     rond — le défaut mesuré de la v1, où « fut » et « neuf » sortaient dans
     30 blocs sur 30. */
  it('chaque étape de lettres franchit le plancher', () => {
    for (const p of PARCOURS) {
      for (const d of DISPOS) {
        for (const e of etapesDe(p, d)) {
          if (e.genre !== 'lettres') continue;
          expect(e.items!.total, `${p}/${d} étape ${e.n}`).toBeGreaterThanOrEqual(PLANCHER);
        }
      }
    }
  });
});

describe('contenu tapable', () => {
  const tous = [...lexique.mots, ...lexique.groupes, ...lexique.phrases].map((x) => x.t);

  it('aucune apostrophe typographique, aucune majuscule accentuée', () => {
    for (const t of tous) {
      expect(t).not.toMatch(/[’ÉÈÀÇÊÎÔÛÄËÏÖÜŒ]/);
    }
  });

  it('les groupes nominaux sont en minuscules et sans point', () => {
    for (const { t } of lexique.groupes) {
      expect(t).toBe(t.toLowerCase());
      expect(t).not.toContain('.');
    }
  });

  /* P3 : une phrase sans majuscule ni point est une phrase écrite faux. */
  it('chaque phrase a une majuscule initiale et un point final', () => {
    for (const { t } of lexique.phrases) {
      expect(t[0]).toBe(t[0].toUpperCase());
      expect(t.endsWith('.')).toBe(true);
    }
  });

  it('un mot simple ne contient ni espace ni ponctuation', () => {
    for (const { t } of lexique.mots) {
      expect(t).toMatch(/^[a-zà-ÿ]+$/);
    }
  });
});
