import { describe, expect, it } from 'vitest';
import parcours from './parcours.json';
import lexique from './lexique-v3.json';
import { toucheDe } from '../core/layouts';
import { estTypable } from '../core/contenu';

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
  promesse: string | null;
  exemples: string[];
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

  /* Le fichier est GÉNÉRÉ : ce test garde la SORTIE de la chaîne, pas le
     modèle. L'étape 9 promet « la ponctuation » à l'enfant ; en fr-CH elle
     n'en ouvrait que quatre signes sur cinq, le `!` vivant sous Maj étant
     écarté avec sa base morte (#98). */
  it('l\'étape 9 ouvre les cinq signes de ponctuation sur les deux dispositions', () => {
    for (const p of PARCOURS) {
      for (const d of DISPOS) {
        const neuf = etapesDe(p, d).find((e) => e.n === 9)!;
        expect(neuf.nouvelles, `${p}/${d}`).toEqual([',', ';', ':', '!', '?']);
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

  /* P3 : une phrase sans majuscule ni signe final est une phrase écrite faux.
     Depuis l'étape 9, le signe final n'est plus forcément le point : une
     interrogation et une exclamation en sont deux autres, tout aussi justes. */
  it('chaque phrase a une majuscule initiale et un signe de fin', () => {
    for (const { t } of lexique.phrases) {
      expect(t[0]).toBe(t[0].toUpperCase());
      expect(t, t).toMatch(/[.!?]$/);
    }
  });

  it('un mot simple ne contient ni espace ni ponctuation', () => {
    for (const { t } of lexique.mots) {
      expect(t).toMatch(/^[a-zà-ÿ]+$/);
    }
  });
});

/* ------------------------------------------------------------------ #99 */
describe("l'étape 9 enseigne vraiment la ponctuation", () => {
  /* Le trou que ce test ferme : l'étape 9 s'appelait « La ponctuation » et
     déclarait bien `, ; : ! ?`, mais aucune des 11 422 entrées du lexique ne
     portait l'un de ces signes. L'enfant y retapait le contenu de l'étape 8.
     Les deux garde-fous existants étaient aveugles : le plancher de 60 items
     saute les étapes sans lettres, et « aucune étape vide » vérifie qu'une
     étape DÉCLARE des touches, jamais qu'un item les PORTE. */

  /** L'ensemble des caractères ouverts à la fin de l'étape `n`. */
  const cumulJusqua = (p: string, d: string, n: number) =>
    new Set(
      etapesDe(p, d)
        .filter((e) => e.n <= n)
        .flatMap((e) => e.nouvelles),
    );

  const itemsDeLEtape9 = (p: string, d: string) => {
    const ouverts = cumulJusqua(p, d, 9);
    const tous = [...lexique.mots, ...lexique.groupes, ...lexique.phrases].map((x) => x.t);
    return tous.filter((t) => estTypable(t, ouverts));
  };

  it('au moins un item porte CHACUNE des touches neuves de l\'étape 9', () => {
    for (const p of PARCOURS) {
      for (const d of DISPOS) {
        const neuf = etapesDe(p, d).find((e) => e.n === 9)!;
        const items = itemsDeLEtape9(p, d);
        for (const c of neuf.nouvelles) {
          const porteurs = items.filter((t) => t.includes(c));
          expect(porteurs.length, `${p}/${d} : aucun item ne porte « ${c} »`).toBeGreaterThan(0);
        }
      }
    }
  });

  /* Même exigence que le plancher des étapes de lettres : une leçon dure 50 à
     60 exercices et aucun ne doit s'y répéter. Une étape qui n'aurait que dix
     items ponctués les redirait six fois. */
  it('au moins 60 items distincts portent une touche neuve de l\'étape 9', () => {
    for (const p of PARCOURS) {
      for (const d of DISPOS) {
        const neuf = etapesDe(p, d).find((e) => e.n === 9)!;
        const ponctues = itemsDeLEtape9(p, d).filter((t) =>
          neuf.nouvelles.some((c) => t.includes(c)),
        );
        expect(new Set(ponctues).size, `${p}/${d}`).toBeGreaterThanOrEqual(PLANCHER);
      }
    }
  });

  /* P7 : « aucun défilement, un item = un écran ». La taille affichée vaut
     148/n vw (V4Lecon) : au-delà de 28 caractères, un item tombe sous 20 px de
     haut sur un écran de 375 px, et l'enfant ne le lit plus. */
  it('aucun item ne dépasse 28 caractères', () => {
    for (const { t } of [...lexique.mots, ...lexique.groupes, ...lexique.phrases]) {
      expect(t.length, t).toBeLessThanOrEqual(28);
    }
  });

  /* Aucun sujet ne monopolise une position. Le tri par poids, seul, laissait
     « un roi » occuper 540 des 1000 secondes propositions — non parce que la
     langue le voulait, mais parce qu'il est le plus court des sujets fréquents
     et survivait donc à la borne de 28 caractères là où « une princesse » la
     faisait dépasser. Un enfant lisait dix sujets ; le vivier en offre
     trente-trois. */
  it('aucun sujet ne prend plus du cinquième des phrases à deux propositions', () => {
    const deux = lexique.phrases
      .map((x) => x.t)
      .filter((t) => t.includes(' ; ') || /, une? /.test(t));
    expect(deux.length).toBeGreaterThan(0);
    const seconde = (t: string) =>
      t.split(t.includes(' ; ') ? ' ; ' : ', ')[1].split(' ').slice(0, 2).join(' ');
    for (const position of [(t: string) => t.split(' ').slice(0, 2).join(' '), seconde]) {
      const compte = new Map<string, number>();
      for (const t of deux) {
        const sujet = position(t).toLowerCase();
        compte.set(sujet, (compte.get(sujet) ?? 0) + 1);
      }
      for (const [sujet, n] of compte) {
        expect(n / deux.length, `« ${sujet} » occupe ${n} phrases sur ${deux.length}`).toBeLessThan(
          0.2,
        );
      }
    }
  });

  it("l'étape 9 annonce une promesse et des exemples non vides", () => {
    for (const p of PARCOURS) {
      for (const d of DISPOS) {
        const neuf = etapesDe(p, d).find((e) => e.n === 9)!;
        expect(neuf.promesse, `${p}/${d}`).toBeTruthy();
        expect(neuf.exemples.length, `${p}/${d}`).toBeGreaterThan(0);
      }
    }
  });
});
