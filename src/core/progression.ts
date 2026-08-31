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

/** Ce que l'entête a besoin de savoir pour dessiner la rangée de points. */
export type AvancementLecon = {
  /** Nombre total de pastilles dessinées : la taille de la série en cours. */
  pastilles: number;
  /** Nombre de pastilles pleines, en tête de rangée. */
  pleines: number;
};

/** Le strict nécessaire de l'état de leçon : on ne veut pas d'un état complet
    pour répondre à « où en est-on ? ». */
export type EtatAvancement = {
  /**
   * La taille de chaque SÉRIE servie, dans l'ordre de service. Une leçon de
   * parcours en reçoit plusieurs — le compositeur rallonge la file avant
   * qu'elle ne se vide — là où une liste de la maison n'en a jamais qu'une.
   */
  series: number[];
  /** L'exercice en cours, indexé dans la file cumulée. */
  i: number;
};

/**
 * Où en est-on DANS la série en cours ?
 *
 * Une pastille = un exercice, et une seule sémantique pour les deux modes de
 * jeu (#76). Avant, la rangée montrait douze pastilles figées remplies par le
 * TEMPS écoulé : elles avançaient toutes seules pendant que l'enfant ne tapait
 * rien, et leur nombre ne disait rien du contenu joué. Le temps ne fait plus
 * partie du calcul du tout — la leçon se termine toujours d'elle-même, mais
 * l'entête ne raconte plus le chrono.
 *
 * La série est un découpage INTERNE (la « vague » du compositeur) qu'on rend
 * ici visible sous ce seul nom : elle donne une fin proche et atteignable, là
 * où le total d'une leçon de douze minutes n'est pas connu d'avance.
 */
export function avancementLecon(e: EtatAvancement): AvancementLecon {
  /* Une vague peut n'apporter aucun item neuf (tirage retombé sur du déjà
     servi) : une série vide ne doit pas manger un tour de rangée. */
  const series = e.series.filter((t) => t > 0);
  let debut = 0;
  for (const pastilles of series) {
    if (e.i < debut + pastilles) return { pastilles, pleines: Math.max(0, e.i - debut) };
    debut += pastilles;
  }
  /* Fin de leçon : l'index a dépassé la dernière série, qui reste pleine. */
  const derniere = series[series.length - 1] ?? 0;
  return { pastilles: derniere, pleines: derniere };
}
