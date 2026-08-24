import { beforeEach, describe, expect, it } from 'vitest';
import { aSauvegarder, etatDeDepart, reducer, type BilanBloc, type EtatApp } from './state';
import { blocDeDepart, CLE, DEFAUTS, sauver, valider } from './core/storage';
import { estMaitrisee } from './core/progression';
import { PLAFOND_BLOCS } from './core/progression';

/** Faux localStorage : le reducer doit rester testable en env node. */
class FauxStockage {
  private m = new Map<string, string>();
  getItem = (k: string) => this.m.get(k) ?? null;
  setItem = (k: string, v: string) => void this.m.set(k, v);
  removeItem = (k: string) => void this.m.delete(k);
  clear = () => this.m.clear();
  key = (i: number) => [...this.m.keys()][i] ?? null;
  get length() {
    return this.m.size;
  }
}

beforeEach(() => {
  globalThis.localStorage = new FauxStockage() as unknown as Storage;
});

const bilan = (propres: string[]): BilanBloc => ({
  etoiles: propres.length,
  propres,
  aRevoir: [],
  items: [],
});

/** Joue `n` blocs identiques et rend l'état final. */
function jouer(depart: EtatApp, propres: string[], n: number): EtatApp {
  let etat = depart;
  for (let k = 0; k < n; k++) {
    etat = reducer(etat, { type: 'blocTermine', bilan: bilan(propres) });
    etat = reducer(etat, { type: 'commencer' });
  }
  return etat;
}

describe('numéro de bloc et rechargement', () => {
  it('repart au bloc SUIVANT après un rechargement', () => {
    expect(blocDeDepart({})).toBe(1);
    expect(blocDeDepart({ e: [1, 2], s: [2] })).toBe(3);
    expect(blocDeDepart({ e: [7] })).toBe(8);
  });

  /* Gate Codex n°1 : `bloc` repartait à 1 à chaque chargement. Un bloc par
     session donnait `maitrise = [1,1,1…]`, `new Set(blocs).size >= 2` n'était
     jamais vrai et le palier ne s'ouvrait que par le plafond anti-mur. */
  it('une occurrence par session finit par maîtriser la touche', () => {
    let etat = etatDeDepart();
    for (let session = 0; session < 3; session++) {
      etat = reducer(etat, { type: 'blocTermine', bilan: bilan(['e']) });
      // rechargement : on repart de ce qui est réellement persisté
      sauver(aSauvegarder(etat));
      etat = etatDeDepart();
    }
    expect(JSON.parse(localStorage.getItem(CLE)!).maitrise.e).toEqual([1, 2, 3]);
    expect(estMaitrisee(etat.maitrise, 'e')).toBe(true);
  });

  /* Gate Codex n°1 résiduel : un bloc SANS aucune frappe propre ne laissait
     aucune trace dans la maîtrise ; le compteur reconstruit resservait donc son
     numéro, et deux blocs distincts comptaient pour un seul. */
  it('un bloc sans frappe propre consomme quand même son numéro', () => {
    let etat = etatDeDepart();
    // bloc 1 : rien de propre — puis rechargement
    etat = reducer(etat, { type: 'blocTermine', bilan: bilan([]) });
    expect(aSauvegarder(etat).bloc).toBe(2);
    sauver(aSauvegarder(etat));
    etat = etatDeDepart();
    expect(etat.bloc).toBe(2);

    // bloc 2 puis bloc 3 : « e » est vu sur deux blocs DISTINCTS
    etat = reducer(etat, { type: 'blocTermine', bilan: bilan(['e']) });
    sauver(aSauvegarder(etat));
    etat = etatDeDepart();
    etat = reducer(etat, { type: 'blocTermine', bilan: bilan(['e']) });
    expect(etat.maitrise.e).toEqual([2, 3]);
  });

  it('accepte une sauvegarde ANTÉRIEURE sans champ bloc et le reconstruit', () => {
    expect(valider({ ...DEFAUTS, bloc: undefined, maitrise: { e: [4] } }).bloc).toBe(5);
    // valeur aberrante : on retombe sur le repli plutôt que de la croire
    expect(valider({ ...DEFAUTS, bloc: -3, maitrise: { e: [4] } }).bloc).toBe(5);
    expect(valider({ ...DEFAUTS, bloc: 12, maitrise: {} }).bloc).toBe(12);
  });
});

describe('changement de disposition', () => {
  const depart = (): EtatApp => ({
    ...etatDeDepart(),
    ...DEFAUTS,
    palier: 3,
    blocsSurPalier: 4,
    maitrise: { e: [1, 2, 3] },
    vue: 'V7',
    bloc: 5,
    blocsConsecutifs: 0,
    etoilesDuBloc: 0,
    titreEncouragement: '',
    palierOuvert: null,
    aReinjecter: [],
    itemsDuBloc: [],
    touchesNouvelles: [],
    verrMaj: false,
    premierLancement: false,
  });

  /* Gate Codex n°1 (2ᵉ volet) : les blocs joués sur l'autre clavier restaient
     au compteur et pouvaient ouvrir le palier suivant par le plafond. */
  it('remet blocsSurPalier à zéro quand la disposition change', () => {
    const apres = reducer(depart(), { type: 'disposition', id: 'fr-CH', manuel: true });
    expect(apres.blocsSurPalier).toBe(0);
    expect(apres.maitrise).toEqual({});
  });

  it('ne touche à rien si la disposition est la même', () => {
    const apres = reducer(depart(), { type: 'disposition', id: 'fr-FR', manuel: true });
    expect(apres.blocsSurPalier).toBe(4);
    expect(apres.maitrise).toEqual({ e: [1, 2, 3] });
  });

  it('changer de clavier ne peut plus ouvrir le palier au bloc suivant', () => {
    let etat = depart();
    etat = { ...etat, blocsSurPalier: PLAFOND_BLOCS - 1 };
    etat = reducer(etat, { type: 'disposition', id: 'fr-CH', manuel: true });
    etat = reducer(etat, { type: 'blocTermine', bilan: bilan([]) });
    expect(etat.palier).toBe(3);
    expect(etat.palierOuvert).toBeNull();
  });
});

describe('plafond anti-mur', () => {
  it("ouvre le palier suivant après 6 blocs, même sans rien maîtriser", () => {
    const etat = jouer(etatDeDepart(), [], PLAFOND_BLOCS);
    expect(etat.palier).toBe(2);
  });

  it("ne l'ouvre pas avant", () => {
    const etat = jouer(etatDeDepart(), [], PLAFOND_BLOCS - 1);
    expect(etat.palier).toBe(1);
  });

  it('remet le compteur à zéro au franchissement', () => {
    const etat = jouer(etatDeDepart(), [], PLAFOND_BLOCS);
    expect(etat.blocsSurPalier).toBe(0);
  });
});

describe('touchesNouvelles', () => {
  /* Gate Codex n°9 : le repli illuminait TOUTES les frappes propres du bloc,
     alors que V5 promet « seules les touches nouvellement maîtrisées ». */
  it("est VIDE quand aucune touche ne vient d'être maîtrisée", () => {
    const etat = reducer(etatDeDepart(), { type: 'blocTermine', bilan: bilan(['e', 's']) });
    expect(etat.touchesNouvelles).toEqual([]);
  });

  it("ne contient que ce que CE bloc a fait basculer", () => {
    let etat = etatDeDepart();
    // 2 occurrences de « e » sur 2 blocs : pas encore maîtrisée (3 requises)
    etat = jouer(etat, ['e'], 2);
    expect(etat.touchesNouvelles).toEqual([]);
    // 3ᵉ occurrence, 3ᵉ bloc : « e » bascule, et elle SEULE
    etat = reducer(etat, { type: 'blocTermine', bilan: bilan(['e', 's']) });
    expect(etat.touchesNouvelles).toEqual(['e']);
  });

  it('une touche déjà maîtrisée ne se rallume pas', () => {
    let etat = jouer(etatDeDepart(), ['e'], 3);
    etat = reducer(etat, { type: 'blocTermine', bilan: bilan(['e']) });
    expect(etat.touchesNouvelles).toEqual([]);
  });
});
