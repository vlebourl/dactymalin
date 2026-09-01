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
  /** Nombre total de pastilles dessinées : la taille de l'exercice en cours. */
  pastilles: number;
  /** Nombre de pastilles pleines, en tête de rangée. */
  pleines: number;
  /** Le rang de l'exercice en cours, à partir de 1. */
  exercice: number;
  /** Combien d'exercices la leçon sert en tout. */
  exercices: number;
};

/** Le strict nécessaire de l'état de leçon : on ne veut pas d'un état complet
    pour répondre à « où en est-on ? ». */
export type EtatAvancement = {
  /**
   * La taille de chaque EXERCICE servi, dans l'ordre de service. Une leçon de
   * parcours en reçoit plusieurs — le compositeur rallonge la file avant
   * qu'elle ne se vide — là où une liste de la maison n'en a jamais qu'un.
   */
  series: number[];
  /** Le mot en cours, indexé dans la file cumulée. */
  i: number;
};

/**
 * Où en est-on DANS l'exercice en cours, et à quel exercice de la leçon ?
 *
 * Une pastille = un MOT, un exercice = une rangée pleine, une leçon = un nombre
 * d'exercices connu d'avance (#107). Les quatre échelons s'emboîtent enfin :
 * avant, la rangée se remplissait puis se vidait sans que rien d'autre ne
 * bouge, si bien qu'un enfant pouvait la finir deux fois de suite en lisant
 * « Leçon 1 sur 7 » figé — les points ne comptaient vers rien.
 *
 * Le temps ne fait plus partie du calcul, ni ici (#76) ni pour terminer la
 * leçon (#107) : c'est le quota d'exercices qui décide.
 */
export function avancementLecon(e: EtatAvancement, exercicesPrevus?: number): AvancementLecon {
  /* Une vague peut n'apporter aucun item neuf (tirage retombé sur du déjà
     servi) : un exercice vide ne doit pas manger un tour de rangée. */
  const series = e.series.filter((t) => t > 0);
  /* Le quota commande le dénominateur, jamais le nombre de vagues déjà
     servies : la file se remplit AVANT de se vider, si bien qu'annoncer
     `series.length` ferait monter le total en cours de route. Sans quota — la
     liste de la maison —, il n'y a que ce qui a été servi. */
  const exercices = Math.max(exercicesPrevus ?? series.length, series.length);
  let debut = 0;
  for (let k = 0; k < series.length; k++) {
    const pastilles = series[k];
    if (e.i < debut + pastilles)
      return { pastilles, pleines: Math.max(0, e.i - debut), exercice: k + 1, exercices };
    debut += pastilles;
  }
  /* Fin de leçon : l'index a dépassé le dernier exercice, qui reste plein. */
  const derniere = series[series.length - 1] ?? 0;
  return {
    pastilles: derniere,
    pleines: derniere,
    exercice: Math.max(series.length, 1),
    exercices: Math.max(exercices, 1),
  };
}
