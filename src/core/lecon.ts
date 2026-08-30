/**
 * Machine d'état de la leçon (V4), extraite de la vue pour être testable sans
 * DOM. Fonctions PURES : la vue n'apporte que l'horloge et les frappes.
 */
import {
  barreau as calculerBarreau,
  estPropre,
  etatInitial,
  prochaineLatence,
  surErreur,
  type Barreau,
  type EtatAide,
} from './aide';
import type { Item } from './generator';
import { leconVierge, noterFrappe, type RapportLecon } from './mesures';
import type { IdDisposition } from './layouts';
import { verdictMaj } from './maj';

/**
 * Une leçon est une séance d'un jour : dix à quinze minutes (cahier §4.3).
 * On retient le milieu de la fourchette ; c'est le premier paramètre à
 * réajuster si l'usage réel le contredit, et c'est pourquoi le nombre de leçons
 * réellement consommées par étape est instrumenté.
 */
export const DUREE_LECON_MS = 12 * 60_000;

/**
 * ponytail: une leçon de douze minutes rendrait la suite de bout en bout
 * inexécutable — chaque test attendrait douze minutes pour voir l'écran de fin.
 * Le harnais pose donc `__dureeLeconMs`. Ce n'est pas une porte dérobée pour
 * l'enfant : rien dans l'interface n'y touche. À reprendre en réglage persisté
 * si un jour le parent doit pouvoir régler la durée.
 */
export function dureeLecon(): number {
  const o = (globalThis as { __dureeLeconMs?: unknown }).__dureeLeconMs;
  return typeof o === 'number' && o > 0 ? o : DUREE_LECON_MS;
}

export const DUREE_FAUSSE = 180; // 150-200 ms
export const DUREE_CELEBRATION = 700; // 0,5 à 1 s

export type EtatLecon = {
  items: Item[];
  i: number;
  curseur: number;
  aide: EtatAide;
  barreau: Barreau;
  latence: number;
  fausse: string | null;
  /** piège Maj : bonne touche, modificateur manquant ou du mauvais côté */
  majManquante: boolean;
  depuisFausse: number;
  debutCaractere: number;
  celebration: number | null;
  etoiles: number;
  propres: string[];
  aRevoir: string[];
  /** items validés dans ce bloc, dans l'ordre — alimente le gain lexical de V5 */
  valides: string[];
  /** l'item courant a-t-il demandé de l'aide (barreau ≥ 2) ? ⇒ réinjection */
  itemAide: boolean;
  masque: boolean;
  fini: boolean;
  /** frappes d'affilée cohérentes avec l'AUTRE disposition (surveillance F7) */
  incoherentes: number;
  /** items enchaînés qui ont saturé l'aide au barreau 3 */
  itemsSatures: number;
  /** l'item en cours a-t-il atteint le barreau 3 ? */
  satureCourant: boolean;
  /**
   * Instant où la leçon doit s'arrêter. `null` = elle s'arrête quand la file
   * est vide, ce qui reste le régime des listes de la maison.
   *
   * L'exercice COMMENCÉ avant l'échéance se termine : couper au milieu d'un
   * mot ferait disparaître l'écran sous les doigts de l'enfant.
   */
  finLe: number | null;
  /**
   * Ce que la leçon OBSERVE, frappe après frappe (§4.7). Il vit ici et pas dans
   * la vue pour deux raisons : le reducer est déjà la seule autorité du verdict,
   * du barreau atteint et de la propreté — les recalculer ailleurs les ferait
   * diverger — et aucune vue n'a le droit d'importer `mesures.ts` (P1).
   * L'étape reste à 0 : c'est l'état de l'app qui l'étiquette, lui seul sait
   * dans quelle série la leçon tombe.
   */
  rapport: RapportLecon;
  /** Début de la leçon, pour en connaître la durée une fois close. */
  debut: number;
  /** Dernier instant connu, rafraîchi à chaque tic. Sert à dire quelle part de
      la leçon est écoulée sans que l'écran ait à tenir sa propre horloge. */
  maintenant: number;
};

export type ActionLecon =
  | {
      type: 'frappe';
      caractere: string;
      code: string;
      attendu: string;
      maintenant: number;
      debutant: boolean;
      id: IdDisposition;
      /** true = cohérente, false = cohérente avec l'autre table, null = muette */
      coherente: boolean | null;
      /** la Maj exigée par la règle contralatérale n'est PAS celle qui est tenue */
      majMauvaisCote?: boolean;
    }
  | { type: 'tic'; maintenant: number }
  /** Rallonge la file : le compositeur de séance recharge avant la pénurie. */
  | { type: 'ajouter'; items: Item[] }
  | { type: 'reprise'; maintenant: number }
  | { type: 'masquer' }
  | { type: 'montrer' };

export type FrappeLecon = Extract<ActionLecon, { type: 'frappe' }>;
/** `inerte` : la frappe ne compte pas (célébration, bloc fini). */
export type Verdict = 'inerte' | 'reussite' | 'quasi' | 'faute';

/**
 * Verdict d'une frappe — SEULE autorité, pour le reducer comme pour la vue.
 * La vue jouait son propre `caractere === attendu` : le son de réussite partait
 * alors qu'une Maj homolatérale venait d'être refusée par le reducer.
 */
export function verdictFrappe(e: EtatLecon, a: FrappeLecon): Verdict {
  if (e.celebration !== null || e.fini) return 'inerte';
  if (a.caractere !== a.attendu) {
    return verdictMaj(a.id, a.attendu, a.caractere) === 'quasi' ? 'quasi' : 'faute';
  }
  // bonne touche, mais la Maj tenue n'est pas la contralatérale exigée (P8)
  return a.majMauvaisCote ? 'quasi' : 'reussite';
}

export function creerEtat(
  items: Item[],
  maintenant: number,
  latence: number,
  dureeMs?: number,
): EtatLecon {
  return {
    items,
    i: 0,
    curseur: 0,
    aide: etatInitial(items[0]?.texte[0] ?? '', latence),
    barreau: latence === 0 ? 1 : 0,
    latence,
    fausse: null,
    majManquante: false,
    depuisFausse: 0,
    debutCaractere: maintenant,
    celebration: null,
    etoiles: 0,
    propres: [],
    aRevoir: [],
    valides: [],
    itemAide: false,
    masque: false,
    fini: false,
    incoherentes: 0,
    itemsSatures: 0,
    satureCourant: false,
    finLe: dureeMs === undefined ? null : maintenant + dureeMs,
    maintenant,
    rapport: leconVierge(0),
    debut: maintenant,
  };
}

/**
 * Comptabilité du barreau ATTEINT, seul endroit où elle se fait.
 * - barreau ≥ 2 (erreur OU inactivité) ⇒ l'item part en réinjection ;
 * - barreau 3 ⇒ l'item est saturé, et il est compté IMMÉDIATEMENT.
 *   Compter à la sortie de l'item laissait le 3ᵉ item saturé à 2, et le dernier
 *   item du bloc n'était jamais compté du tout.
 */
function surBarreau(e: EtatLecon, b: Barreau) {
  const sature = b >= 3;
  return {
    itemAide: e.itemAide || b >= 2,
    satureCourant: e.satureCourant || sature,
    itemsSatures: sature && !e.satureCourant ? e.itemsSatures + 1 : e.itemsSatures,
  };
}

export function reducer(e: EtatLecon, a: ActionLecon): EtatLecon {
  switch (a.type) {
    case 'masquer':
      return { ...e, masque: true };

    case 'montrer':
      return { ...e, masque: false };

    /* Retour d'onglet : le temps passé ailleurs n'est pas de l'hésitation.
       On REBASE l'horloge du caractère au lieu de servir une aide d'inactivité
       dès la première image. */
    case 'reprise':
      return {
        ...e,
        debutCaractere: a.maintenant,
        depuisFausse: a.maintenant,
        celebration: e.celebration === null ? null : a.maintenant,
      };

    /* Le compositeur de séance rallonge la file avant qu'elle ne se vide. La
       vague reste invisible : rien à l'écran ne la marque, sans quoi le
       « bloc » que le cahier chasse reviendrait sous un autre nom. */
    case 'ajouter':
      return a.items.length === 0 ? e : { ...e, items: [...e.items, ...a.items] };

    case 'tic': {
      let suivant: EtatLecon = e.maintenant === a.maintenant ? e : { ...e, maintenant: a.maintenant };
      if (suivant.fausse && a.maintenant - suivant.depuisFausse >= DUREE_FAUSSE) {
        suivant = { ...suivant, fausse: null };
      }
      if (suivant.celebration !== null && a.maintenant - suivant.celebration >= DUREE_CELEBRATION) {
        suivant = itemSuivant(suivant, a.maintenant);
      }
      const b = calculerBarreau(suivant.aide, a.maintenant - suivant.debutCaractere);
      const compte = surBarreau(suivant, b);
      if (
        b !== suivant.barreau ||
        compte.itemAide !== suivant.itemAide ||
        compte.satureCourant !== suivant.satureCourant
      ) {
        suivant = { ...suivant, barreau: b, aide: { ...suivant.aide, atteint: b }, ...compte };
      }
      return suivant === e ? e : suivant;
    }

    case 'frappe': {
      const verdict = verdictFrappe(e, a);
      if (verdict === 'inerte') return e;
      const texte = e.items[e.i].texte;

      /* Surveillance de disposition (F7) : une frappe cohérente avec l'AUTRE
         table et avec aucune de la table courante incrémente le compteur ;
         toute frappe cohérente le remet à zéro. */
      const incoherentes =
        a.coherente === null ? e.incoherentes : a.coherente ? 0 : e.incoherentes + 1;
      e = incoherentes === e.incoherentes ? e : { ...e, incoherentes };

      /* ---- piège Maj : la bonne touche, sans le modificateur — ou avec la
         MAUVAISE Maj (homolatérale). État de QUASI-RÉUSSITE : ni erreur, ni
         escalade d'aide ; la cible reste allumée et la Maj s'invite à côté. */
      /* La quasi-réussite ne compte NI en lettre ni en faute : le reducer ne la
         traite ni comme une erreur ni comme une réussite, et la précision
         mesurée doit dire la même chose que la leçon vécue. */
      if (verdict === 'quasi') return { ...e, majManquante: true, fausse: null };

      // ---- frappe fausse : RIEN ne s'écrit, le curseur ne bouge pas (P3)
      if (verdict === 'faute') {
        const aide = surErreur(e.aide, a.maintenant - e.debutCaractere);
        const barreau = calculerBarreau(aide, a.maintenant - e.debutCaractere);
        return {
          ...e,
          aide,
          barreau,
          ...surBarreau(e, barreau),
          fausse: a.code,
          depuisFausse: a.maintenant,
          rapport: noterFrappe(e.rapport, {
            touche: a.attendu,
            juste: false,
            premierCoup: false,
          }),
        };
      }

      // ---- frappe correcte
      /* CHAQUE occurrence propre compte, pas une par bloc : le cahier demande
         « 3 occurrences réparties sur au moins 2 blocs ». */
      const propre = estPropre(e.aide);
      const propres =
        propre && a.attendu !== ' ' ? [...e.propres, a.attendu.toLowerCase()] : e.propres;
      const curseur = e.curseur + 1;
      const base = {
        ...e,
        propres,
        fausse: null,
        majManquante: false,
        /* `aide.atteint` est le barreau atteint SUR CE CARACTÈRE : c'est bien la
           position qu'observe §7.5, pas l'item entier. */
        rapport: noterFrappe(e.rapport, {
          touche: a.attendu,
          juste: true,
          premierCoup: propre,
          barreau3: e.aide.atteint === 3,
        }),
      };

      if (curseur >= texte.length) {
        return {
          ...base,
          curseur,
          etoiles: e.etoiles + 1,
          celebration: a.maintenant,
          valides: [...e.valides, texte],
          aRevoir: e.itemAide && !e.aRevoir.includes(texte) ? [...e.aRevoir, texte] : e.aRevoir,
        };
      }
      const latence = prochaineLatence(e.latence, propre, a.debutant);
      const aide = etatInitial(texte[curseur], latence);
      return {
        ...base,
        curseur,
        latence,
        aide,
        barreau: latence === 0 ? 1 : 0,
        debutCaractere: a.maintenant,
      };
    }
  }
}

export function itemSuivant(e: EtatLecon, maintenant: number): EtatLecon {
  const i = e.i + 1;
  /* Deux façons de finir : le temps est écoulé, ou l'étape n'a plus rien à
     servir. On ne coupe JAMAIS un exercice en cours — c'est ici, entre deux
     items, que l'échéance est lue. */
  const tempsEcoule = e.finLe !== null && maintenant >= e.finLe;
  /* La leçon close porte sa durée : c'est le dénominateur de la vitesse, et il
     n'existe qu'ici — personne d'autre ne sait quand la leçon a commencé. */
  if (tempsEcoule || i >= e.items.length)
    return {
      ...e,
      celebration: null,
      fini: true,
      /* ARRONDIE, et ce n'est pas cosmétique : `maintenant` vient de
         `performance.now()`, qui rend des flottants. La sauvegarde n'accepte
         que des entiers, et une durée fractionnaire faisait JETER la leçon
         entière à la relecture — sans un mot. Les mesures ne survivaient donc
         qu'en mémoire vive, et l'écran parent se vidait au premier
         rechargement. */
      rapport: { ...e.rapport, ms: Math.round(maintenant - e.debut) },
    };
  return {
    ...e,
    i,
    curseur: 0,
    celebration: null,
    itemAide: false,
    /* « Je tape sans regarder » vaut POUR LE MOT EN COURS : le clavier revient
       de lui-même au mot suivant (cahier P6). */
    masque: false,
    // la saturation est comptée à l'instant où elle survient ; ici on ne fait
    // que rompre la SÉRIE quand l'item sortant n'a pas saturé.
    itemsSatures: e.satureCourant ? e.itemsSatures : 0,
    satureCourant: false,
    aide: etatInitial(e.items[i].texte[0], e.latence),
    barreau: e.latence === 0 ? 1 : 0,
    debutCaractere: maintenant,
  };
}
