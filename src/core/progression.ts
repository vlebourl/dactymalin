import { dureeLecon } from './lecon';
import { LECONS_PAR_ETAPE } from './parcours';

/** Occurrences validées sans erreur ni aide, repérées par le n° de bloc. */
export type Maitrise = Record<string, number[]>;

/* Ces deux seuils ne commandent plus aucun passage (#38) : ils définissent ce
   qu'on appelle « une touche acquise » pour composer les leçons suivantes. */
export const OCCURRENCES_REQUISES = 3;
export const BLOCS_DISTINCTS_REQUIS = 2;
/** Plafond anti-mur : au-delà, le palier suivant s'ouvre quand même, en silence. */

/**
 * Enregistre une frappe propre (ni erreur, ni escalade d'aide au-delà du
 * barreau 1) sur `caractere`, en gardant le n° de bloc : c'est la RÉPARTITION
 * entre blocs qui fait le critère, pas le volume.
 */
export function noterOccurrence(m: Maitrise, caractere: string, bloc: number): Maitrise {
  if (caractere === ' ') return m;
  return { ...m, [caractere]: [...(m[caractere] ?? []), bloc] };
}

export function estMaitrisee(m: Maitrise, caractere: string): boolean {
  const blocs = m[caractere] ?? [];
  return blocs.length >= OCCURRENCES_REQUISES && new Set(blocs).size >= BLOCS_DISTINCTS_REQUIS;
}

/* `palierFranchi` a disparu (#38). L'étape se termine après sept leçons, ce
   que `parcours.etapeFinie` décide seul. La maîtrise ne garde donc plus de
   rôle de PORTE : elle sert à composer le contenu des leçons suivantes, en
   faisant revenir plus souvent les touches mal acquises. */

/** Ce qui commande la barre d'avancement de l'étape. */
export type Avancement = {
  /** 0 → 1, plein exactement à la septième leçon. */
  part: number;
  leconsFaites: number;
  total: number;
};

/**
 * Où en est-on DANS l'étape ?
 *
 * Une seule réponse désormais, et elle est lisible d'avance : le nombre de
 * leçons faites sur sept. La v1 suivait le plus avancé de deux chemins — les
 * touches maîtrisées ou le plafond de blocs — parce qu'on ne savait pas lequel
 * arriverait le premier. Avec un quota fixe, la question ne se pose plus.
 */
export function avancementEtape(leconsFaites: number): Avancement {
  const total = LECONS_PAR_ETAPE;
  return {
    part: Math.min(1, leconsFaites / total),
    leconsFaites: Math.min(leconsFaites, total),
    total,
  };
}

/** Douze pastilles fixes : elles disent la part de la leçon écoulée, jamais un
    nombre d'exercices — qui n'est ni connu d'avance ni le même d'un enfant à
    l'autre. */
export const PASTILLES_LECON = 12;

/** Ce que l'entête a besoin de savoir pour dessiner l'avancement d'une leçon. */
export type AvancementLecon = {
  /** 0 → 1, borné aux deux bouts. */
  part: number;
  /** Nombre total de pastilles dessinées. */
  pastilles: number;
  /** Nombre de pastilles pleines, en tête de rangée. */
  pleines: number;
};

/** Le strict nécessaire de l'état de leçon : on ne veut pas d'un état complet
    pour répondre à « où en est-on ? ». */
export type EtatAvancement = {
  items: unknown[];
  i: number;
  finLe: number | null;
  maintenant: number;
};

/**
 * Où en est-on DANS la leçon ?
 *
 * Deux sémantiques, et c'est le mode de jeu qui tranche — d'où l'intérêt de
 * l'écrire ici plutôt que dans le JSX :
 * - une LISTE de la maison a une fin connue (les mots que la famille a
 *   écrits) : l'avancement est la position dans les items ;
 * - un PARCOURS dure un temps : l'avancement est la part du chrono écoulée.
 */
export function avancementLecon(e: EtatAvancement, dureeMs: number = dureeLecon()): AvancementLecon {
  const brut =
    e.finLe === null
      ? e.items.length === 0
        ? 0
        : e.i / e.items.length
      : dureeMs <= 0
        ? 1
        : 1 - (e.finLe - e.maintenant) / dureeMs;
  const part = Math.min(1, Math.max(0, brut));
  return { part, pastilles: PASTILLES_LECON, pleines: Math.round(part * PASTILLES_LECON) };
}
