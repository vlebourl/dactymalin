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
