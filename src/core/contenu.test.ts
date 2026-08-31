import { describe, expect, it } from 'vitest';
import { groupesTypables, motsTypables, nouveaute, phrasesTypables } from './contenu';
import { ensembleTouches, ETAPE_MAX } from './parcours';

const etape1 = ensembleTouches('decouverte', 'fr-FR', 1);
const etape2 = ensembleTouches('decouverte', 'fr-FR', 2);
const tout = ensembleTouches('decouverte', 'fr-FR', ETAPE_MAX);

describe('le contenu typable à une étape donnée', () => {
  /* Le chiffre qui justifie tout le chantier : le palier 1 de la v1 donnait
     13 mots, dont 9 seulement du lexique de l'âge. */
  it("l'étape 1 de Découverte donne plus de deux cents mots", () => {
    expect(motsTypables(etape1).length).toBeGreaterThan(200);
  });

  it('ne propose jamais un mot contenant une touche fermée', () => {
    for (const m of motsTypables(etape1)) {
      for (const c of m) expect(etape1.has(c), `${m} : ${c}`).toBe(true);
    }
  });

  it('ouvrir des touches ne retire jamais un mot', () => {
    const avant = new Set(motsTypables(etape1));
    const apres = new Set(motsTypables(etape2));
    for (const m of avant) expect(apres.has(m)).toBe(true);
  });

  it('sert les mots les plus fréquents en premier', () => {
    /* On teste la PROPRIÉTÉ — l'ordre décroissant — et non une liste figée,
       qui bouge dès qu'on touche au lexique. */
    const mots = motsTypables(tout);
    for (const frequent of ['de', 'la', 'et', 'pas']) {
      expect(mots.indexOf(frequent), frequent).toBeLessThan(mots.indexOf('wagon'));
    }
  });
});

describe('les groupes nominaux', () => {
  /* L'étape 1 de Découverte ne rend typable AUCUN déterminant : `un`, `le`,
     `la`, `mon`, `des` exigent tous `n`, `l`, `m`, `o` ou `d`. Les groupes ne
     commencent donc qu'à l'étape 2. */
  it("n'existent pas encore à l'étape 1, faute de déterminant typable", () => {
    expect(groupesTypables(etape1)).toHaveLength(0);
  });

  it('apparaissent à l’étape 2', () => {
    expect(groupesTypables(etape2).length).toBeGreaterThan(100);
  });

  it('contiennent un espace et restent en minuscules', () => {
    for (const g of groupesTypables(etape2)) {
      expect(g).toContain(' ');
      expect(g).toBe(g.toLowerCase());
    }
  });
});

describe('les phrases', () => {
  /* P3 : une phrase sans majuscule ni signe final est une phrase écrite faux.
     Elles n'apparaissent donc qu'une fois le point ouvert — y compris celles
     qui finissent par « ! » ou « ? », arrivées avec l'étape 9 : l'étape qui
     ouvre le point est celle qui ouvre la majuscule, et c'est elle qui rend
     une phrase écrivable. */
  it("n'existent pas tant que le point n'est pas ouvert", () => {
    expect(phrasesTypables(etape2)).toHaveLength(0);
  });

  it('apparaissent quand le point est ouvert', () => {
    const avecPoint = new Set([...tout, '.']);
    const p = phrasesTypables(avecPoint);
    expect(p.length).toBeGreaterThan(0);
    for (const phrase of p) {
      expect(phrase[0]).toBe(phrase[0].toUpperCase());
      expect(phrase, phrase).toMatch(/[.!?]$/);
    }
  });
});

describe('la nouveauté, pour la célébration de fin de leçon', () => {
  it('ne rend que ce que la dernière étape a débloqué', () => {
    const neufs = nouveaute(etape1, etape2);
    expect(neufs.length).toBeGreaterThan(0);
    const avant = new Set(motsTypables(etape1));
    for (const m of neufs) expect(avant.has(m)).toBe(false);
  });

  it('rend une liste vide quand rien ne change', () => {
    expect(nouveaute(etape2, etape2)).toHaveLength(0);
  });
});
