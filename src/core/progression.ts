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
