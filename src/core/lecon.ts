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
import type { IdDisposition } from './layouts';
import { verdictMaj } from './maj';

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
  | { type: 'reprise'; maintenant: number }
  | { type: 'masquer' }
  | { type: 'montrer' };

export function creerEtat(items: Item[], maintenant: number, latence: number): EtatLecon {
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
      return { ...e, debutCaractere: a.maintenant, depuisFausse: a.maintenant };

    case 'tic': {
      let suivant = e;
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
      if (e.celebration !== null || e.fini) return e;
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
      const quasi =
        a.caractere !== a.attendu
          ? verdictMaj(a.id, a.attendu, a.caractere) === 'quasi'
          : !!a.majMauvaisCote;
      if (quasi) return { ...e, majManquante: true, fausse: null };

      // ---- frappe fausse : RIEN ne s'écrit, le curseur ne bouge pas (P3)
      if (a.caractere !== a.attendu) {
        const aide = surErreur(e.aide, a.maintenant - e.debutCaractere);
        const barreau = calculerBarreau(aide, a.maintenant - e.debutCaractere);
        return {
          ...e,
          aide,
          barreau,
          ...surBarreau(e, barreau),
          fausse: a.code,
          depuisFausse: a.maintenant,
        };
      }

      // ---- frappe correcte
      /* CHAQUE occurrence propre compte, pas une par bloc : le cahier demande
         « 3 occurrences réparties sur au moins 2 blocs ». */
      const propre = estPropre(e.aide);
      const propres =
        propre && a.attendu !== ' ' ? [...e.propres, a.attendu.toLowerCase()] : e.propres;
      const curseur = e.curseur + 1;
      const base = { ...e, propres, fausse: null, majManquante: false };

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
  if (i >= e.items.length) return { ...e, celebration: null, fini: true };
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
