import type { IdDisposition } from './layouts';
import { PALIER_MAX, touchesAValider } from './paliers';

/** Occurrences validées sans erreur ni aide, repérées par le n° de bloc. */
export type Maitrise = Record<string, number[]>;

export const OCCURRENCES_REQUISES = 3;
export const BLOCS_DISTINCTS_REQUIS = 2;
/** Plafond anti-mur : au-delà, le palier suivant s'ouvre quand même, en silence. */
export const PLAFOND_BLOCS = 6;

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

/**
 * Le palier est-il franchi ?
 * Critère : chaque touche du palier maîtrisée (3 occurrences / ≥ 2 blocs).
 * Plafond anti-mur : `blocsSurPalier >= 6` ouvre le palier suivant sans message.
 */
export function palierFranchi(
  id: IdDisposition,
  palier: number,
  m: Maitrise,
  blocsSurPalier: number,
): boolean {
  if (palier >= PALIER_MAX) return false;
  if (blocsSurPalier >= PLAFOND_BLOCS) return true;
  return touchesAValider(id, palier).every((c) => estMaitrisee(m, c));
}

/** Ce qui commande la barre d'avancement du palier. */
export type Avancement = {
  /** 0 → 1, plein exactement quand `palierFranchi` bascule */
  part: number;
  maitrisees: number;
  total: number;
  /** le chemin le plus avancé, celui qu'on nomme à l'écran */
  chemin: 'touches' | 'blocs' | 'dernier';
};

/**
 * Où en est-on DANS le palier ?
 *
 * Deux chemins mènent au palier suivant — toutes les touches maîtrisées, ou le
 * plafond de blocs — et on ne sait pas d'avance lequel arrivera le premier.
 * La barre suit donc le PLUS AVANCÉ des deux : elle atteint 1 exactement quand
 * `palierFranchi` bascule, jamais avant, jamais après. N'écouter que la
 * maîtrise la laisserait basse puis la ferait sauter sans prévenir chez
 * l'enfant que le plafond fait monter.
 */
export function avancementPalier(
  id: IdDisposition,
  palier: number,
  m: Maitrise,
  blocsSurPalier: number,
): Avancement {
  const cles = touchesAValider(id, palier);
  const maitrisees = cles.filter((c) => estMaitrisee(m, c)).length;
  // Le dernier palier n'ouvre sur rien : promettre une progression vers un
  // palier 8 inexistant serait une promesse en l'air.
  if (palier >= PALIER_MAX) {
    return { part: 1, maitrisees, total: cles.length, chemin: 'dernier' };
  }
  const parTouches = cles.length === 0 ? 1 : maitrisees / cles.length;
  const parBlocs = Math.min(1, blocsSurPalier / PLAFOND_BLOCS);
  return {
    part: Math.max(parTouches, parBlocs),
    maitrisees,
    total: cles.length,
    chemin: parTouches >= parBlocs ? 'touches' : 'blocs',
  };
}
