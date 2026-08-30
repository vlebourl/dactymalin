import { beforeEach, describe, expect, it } from 'vitest';
import { aSauvegarder, etatDeDepart, reducer, type BilanBloc, type EtatApp } from './state';
import {
  BLOC_MAX,
  blocDeDepart,
  charger,
  CLE,
  DEFAUTS,
  progressionDe,
  sauver,
  valider,
} from './core/storage';
import { estMaitrisee } from './core/progression';
import { ETAPE_MAX, LECONS_PAR_ETAPE, parcoursFini } from './core/parcours';

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
    etat = reducer(etat, { type: 'leconTerminee', bilan: bilan(propres) });
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
      etat = reducer(etat, { type: 'leconTerminee', bilan: bilan(['e']) });
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
    etat = reducer(etat, { type: 'leconTerminee', bilan: bilan([]) });
    expect(aSauvegarder(etat).bloc).toBe(2);
    sauver(aSauvegarder(etat));
    etat = etatDeDepart();
    expect(etat.lecon).toBe(2);

    // bloc 2 puis bloc 3 : « e » est vu sur deux blocs DISTINCTS
    etat = reducer(etat, { type: 'leconTerminee', bilan: bilan(['e']) });
    sauver(aSauvegarder(etat));
    etat = etatDeDepart();
    etat = reducer(etat, { type: 'leconTerminee', bilan: bilan(['e']) });
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
    etape: 3,
    leconsSurEtape: 4,
    maitrise: { e: [1, 2, 3] },
    vue: 'V7',
    lecon: 5,
    etoilesDuBloc: 0,
    titreEncouragement: '',
    etapeOuverte: null,
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
    expect(apres.leconsSurEtape).toBe(0);
    expect(apres.maitrise).toEqual({});
  });

  it('ne touche à rien si la disposition est la même', () => {
    const apres = reducer(depart(), { type: 'disposition', id: 'fr-FR', manuel: true });
    expect(apres.leconsSurEtape).toBe(4);
    expect(apres.maitrise).toEqual({ e: [1, 2, 3] });
  });

  it("changer de clavier ne peut plus ouvrir l'étape à la leçon suivante", () => {
    let etat = depart();
    etat = { ...etat, leconsSurEtape: LECONS_PAR_ETAPE - 1 };
    etat = reducer(etat, { type: 'disposition', id: 'fr-CH', manuel: true });
    etat = reducer(etat, { type: 'leconTerminee', bilan: bilan([]) });
    expect(etat.etape).toBe(3);
    expect(etat.etapeOuverte).toBeNull();
  });
});

/* Le plafond anti-mur a disparu (#38) : il n'existait que pour forcer une porte
   qui n'existe plus. Ce qui ouvre l'étape suivante est le quota, lisible
   d'avance — sept leçons, et rien d'autre. */
describe("quota de sept leçons par étape", () => {
  it("ouvre l'étape suivante à la septième leçon, quoi qu'il se soit passé", () => {
    const etat = jouer(etatDeDepart(), [], LECONS_PAR_ETAPE);
    expect(etat.etape).toBe(2);
  });

  it("ne l'ouvre pas avant", () => {
    const etat = jouer(etatDeDepart(), [], LECONS_PAR_ETAPE - 1);
    expect(etat.etape).toBe(1);
  });

  it('remet le compteur de leçons à zéro au passage', () => {
    const etat = jouer(etatDeDepart(), [], LECONS_PAR_ETAPE);
    expect(etat.leconsSurEtape).toBe(0);
  });
});

describe('touchesNouvelles', () => {
  /* Gate Codex n°9 : le repli illuminait TOUTES les frappes propres du bloc,
     alors que V5 promet « seules les touches nouvellement maîtrisées ». */
  it("est VIDE quand aucune touche ne vient d'être maîtrisée", () => {
    const etat = reducer(etatDeDepart(), { type: 'leconTerminee', bilan: bilan(['e', 's']) });
    expect(etat.touchesNouvelles).toEqual([]);
  });

  it("ne contient que ce que CE bloc a fait basculer", () => {
    let etat = etatDeDepart();
    // 2 occurrences de « e » sur 2 blocs : pas encore maîtrisée (3 requises)
    etat = jouer(etat, ['e'], 2);
    expect(etat.touchesNouvelles).toEqual([]);
    // 3ᵉ occurrence, 3ᵉ bloc : « e » bascule, et elle SEULE
    etat = reducer(etat, { type: 'leconTerminee', bilan: bilan(['e', 's']) });
    expect(etat.touchesNouvelles).toEqual(['e']);
  });

  it('une touche déjà maîtrisée ne se rallume pas', () => {
    let etat = jouer(etatDeDepart(), ['e'], 3);
    etat = reducer(etat, { type: 'leconTerminee', bilan: bilan(['e']) });
    expect(etat.touchesNouvelles).toEqual([]);
  });
});

describe('borne du compteur de bloc', () => {
  /* Verdict Codex final : depuis bloc = BLOC_MAX, `leconTerminee` produisait
     BLOC_MAX + 1, sauvegarde rejetée au rechargement → retour au backup et
     numéro resservi. Le repli legacy était pareillement non borné. */
  it("l'incrément ne dépasse jamais BLOC_MAX", () => {
    let etat = { ...etatDeDepart(), lecon: BLOC_MAX };
    etat = reducer(etat, { type: 'leconTerminee', bilan: bilan(['e']) });
    expect(etat.lecon).toBe(BLOC_MAX);
    expect(valider(aSauvegarder(etat) as unknown as Record<string, unknown>).bloc).toBe(BLOC_MAX);
  });

  it('le repli legacy est borné lui aussi', () => {
    expect(blocDeDepart({ e: [BLOC_MAX] })).toBe(BLOC_MAX);
  });
});

/* #42 — le parent choisit le parcours. Les deux progressions sont
   indépendantes et parallèles (cahier §4.2) : basculer de l'une à l'autre ne
   doit rien perdre, dans aucun sens. */
describe('choix du parcours', () => {
  it('démarre sur Découverte quand rien n\'a jamais été choisi', () => {
    expect(etatDeDepart().parcours).toBe('decouverte');
  });

  it('Dactylo se joue directement, à son étape 1, sans avoir fini Découverte', () => {
    let etat = jouer(etatDeDepart(), [], LECONS_PAR_ETAPE * 2); // Découverte étape 3
    expect(etat.etape).toBe(3);
    etat = reducer(etat, { type: 'parcours', parcours: 'dactylo' });
    expect(etat.parcours).toBe('dactylo');
    expect(etat.etape).toBe(1);
    expect(etat.leconsSurEtape).toBe(0);
  });

  it("l'avance faite en Dactylo n'écrase pas celle de Découverte", () => {
    let etat = jouer(etatDeDepart(), [], LECONS_PAR_ETAPE * 2); // Découverte étape 3
    etat = reducer(etat, { type: 'parcours', parcours: 'dactylo' });
    etat = jouer(etat, [], LECONS_PAR_ETAPE); // Dactylo étape 2
    expect(etat.etape).toBe(2);
    etat = reducer(etat, { type: 'parcours', parcours: 'decouverte' });
    expect(etat.etape).toBe(3);
    etat = reducer(etat, { type: 'parcours', parcours: 'dactylo' });
    expect(etat.etape).toBe(2);
  });

  it('les deux progressions et le parcours choisi survivent au rechargement', () => {
    let etat = jouer(etatDeDepart(), [], LECONS_PAR_ETAPE); // Découverte étape 2
    etat = reducer(etat, { type: 'parcours', parcours: 'dactylo' });
    etat = jouer(etat, [], LECONS_PAR_ETAPE * 2); // Dactylo étape 3
    sauver(aSauvegarder(etat));

    const relu = etatDeDepart();
    expect(relu.parcours).toBe('dactylo');
    expect(relu.etape).toBe(3);
    const s = charger();
    expect(progressionDe(s, 'decouverte', 'fr-FR')).toEqual({ etape: 2, leconsSurEtape: 0 });
    expect(progressionDe(s, 'dactylo', 'fr-FR')).toEqual({ etape: 3, leconsSurEtape: 0 });
  });

  /* Le miroir `palier` est le contrat de lecture des clients DÉJÀ DÉPLOYÉS :
     y verser l'étape de Dactylo leur ferait relire cette avance comme une
     avance en Découverte, et `progressionsNormalisees` la fusionnerait alors
     dans le mauvais couple, définitivement. */
  it('le miroir legacy reste sur Découverte même quand on joue Dactylo', () => {
    let etat = jouer(etatDeDepart(), [], LECONS_PAR_ETAPE); // Découverte étape 2
    etat = reducer(etat, { type: 'parcours', parcours: 'dactylo' });
    etat = jouer(etat, [], LECONS_PAR_ETAPE * 3); // Dactylo étape 4
    expect(aSauvegarder(etat).palier).toBe(2);
  });

  it('ne fait rien quand on rechoisit le parcours déjà en cours', () => {
    const etat = jouer(etatDeDepart(), [], 2);
    expect(reducer(etat, { type: 'parcours', parcours: 'decouverte' })).toBe(etat);
  });
});

/* REJOUER UNE ÉTAPE (#58).
 *
 * `rejouerEtape` posait bien l'étape à rejouer, et la vue servait bien son
 * contenu — mais la fin de leçon incrémentait le quota de l'étape COURANTE
 * sans jamais regarder qu'on était en train de rejouer. Refaire l'étape 2
 * ouvrait donc l'étape 6. Le commentaire du reducer promettait déjà l'inverse
 * de ce que le code faisait. */
describe("rejouer une étape déjà faite", () => {
  const aLEtape5 = (): EtatApp => ({
    ...etatDeDepart(),
    etape: 5,
    leconsSurEtape: LECONS_PAR_ETAPE - 1,
    premierLancement: false,
  });

  const enReplay = () =>
    reducer(aLEtape5(), { type: 'rejouerEtape', etape: 2 });

  it("ne fait pas avancer le quota de l'étape courante", () => {
    const etat = jouer(enReplay(), ['e'], 1);
    expect(etat.leconsSurEtape).toBe(LECONS_PAR_ETAPE - 1);
  });

  it("n'ouvre pas l'étape suivante, même à la septième leçon rejouée", () => {
    const etat = jouer(enReplay(), ['e'], 3);
    expect(etat.etape).toBe(5);
    expect(etat.etapeOuverte).toBe(null);
  });

  /* Ce qui a été tapé reste vrai : le replay observe, il ne progresse pas. */
  it('enregistre quand même ce que l’enfant a tapé', () => {
    const etat = jouer(enReplay(), ['e'], 1);
    expect(etat.maitrise.e?.length).toBe(1);
  });

  /* Sans replay, rien ne change : la septième leçon ouvre bien l'étape 6. */
  it("laisse la progression ordinaire intacte", () => {
    const etat = jouer(aLEtape5(), ['e'], 1);
    expect(etat.etape).toBe(6);
    expect(etat.leconsSurEtape).toBe(0);
  });
});

/* LA FIN DU PARCOURS (#60).
 *
 * À la dixième étape le franchissement exigeait `etape < ETAPE_MAX`, donc la
 * septième leçon ne produisait aucun état de fin : le compteur montait à 8, 9,
 * 10 indéfiniment. Et la carte ne dit « finie » que d'une étape DÉPASSÉE —
 * l'étape 10 restait donc éternellement courante et n'était jamais rejouable.
 * Un enfant qui finissait le parcours n'en voyait aucun signe. */
describe('terminer le parcours', () => {
  const auBout = (): EtatApp => ({
    ...etatDeDepart(),
    etape: ETAPE_MAX,
    leconsSurEtape: LECONS_PAR_ETAPE - 1,
    premierLancement: false,
  });

  it('la septième leçon de la dixième étape termine le parcours', () => {
    const etat = jouer(auBout(), [], 1);
    expect(parcoursFini(etat.etape, etat.leconsSurEtape)).toBe(true);
  });

  it("ne fabrique pas d'onzième étape", () => {
    const etat = jouer(auBout(), [], 1);
    expect(etat.etape).toBe(ETAPE_MAX);
  });

  /* Le compteur montait sans fin, ce qui rendait « fini » indistinguable de
     « fini il y a trois semaines ». */
  it('plafonne le compteur de leçons au lieu de le laisser filer', () => {
    const etat = jouer(auBout(), [], 5);
    expect(etat.leconsSurEtape).toBe(LECONS_PAR_ETAPE);
  });

  /* La célébration est fêtée UNE fois : un rechargement ne la rejoue pas. */
  it('ne fête la fin qu’à la leçon qui la produit', () => {
    const fin = reducer(auBout(), { type: 'leconTerminee', bilan: bilan([]) });
    expect(fin.parcoursTermineMaintenant).toBe(true);
    /* Quitter V5 éteint le drapeau : un rechargement ne rejoue pas la fête. */
    expect(reducer(fin, { type: 'commencer' }).parcoursTermineMaintenant).toBe(false);
    /* Et la leçon SUIVANTE, déjà au-delà, ne la rallume pas. */
    const apres = reducer(jouer(auBout(), [], 1), { type: 'leconTerminee', bilan: bilan([]) });
    expect(apres.parcoursTermineMaintenant).toBe(false);
  });

  it("n'est pas fini avant la septième leçon", () => {
    const etat = { ...auBout(), leconsSurEtape: LECONS_PAR_ETAPE - 2 };
    expect(parcoursFini(etat.etape, jouer(etat, [], 1).leconsSurEtape)).toBe(false);
  });
});
