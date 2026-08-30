/**
 * Ce que l'app observe, et que l'enfant ne voit JAMAIS (cahier §4.7).
 *
 * Cinq mesures, et deux garde-fous qui en dépendent : §7.1 (l'index qui
 * s'installe en Découverte) et §7.5 (le doigt illisible à dix doigts).
 * La v1 ne comptait rien, ce qui rendait ces deux garde-fous inapplicables —
 * on ne pouvait ni constater le risque ni le démentir.
 *
 * DEUX SÉRIES, JAMAIS FUSIONNÉES. Découverte et Dactylo ne produisent pas des
 * vitesses comparables : le passage à dix doigts fait mécaniquement chuter la
 * vitesse, et c'est le seul effet que la littérature garantisse. Une courbe
 * qui plonge sans raison visible serait le pire artefact possible. D'où la
 * forme du modèle : les mesures sont indexées PAR parcours, et aucune fonction
 * d'ici n'en additionne deux. Ce n'est pas une convention d'appel, c'est la
 * structure qui l'interdit.
 *
 * Aucune de ces valeurs ne remonte à l'écran de l'enfant : pas de mots/minute,
 * pas de score, pas de compteur d'erreurs (§1). Le seul lecteur légitime est
 * l'adulte, dans les réglages, et il n'y a pour l'instant aucun lecteur.
 */
import { ESPACE, LECONS_PAR_ETAPE, type IdParcours } from './parcours';

/** Positions validées pour une touche, et celles réussies du premier coup. */
export type ComptesTouche = { propres: number; total: number };

/** Ce qu'une leçon laisse derrière elle, une fois close. */
export type LeconMesuree = {
  etape: number;
  /** durée de la leçon, en millisecondes */
  ms: number;
  /** lettres écrites (une par position validée, espace compris) */
  lettres: number;
  /** frappes fausses — elles n'écrivent rien (P3), mais elles se comptent */
  fautes: number;
  /** positions où le DERNIER barreau d'aide s'est déclenché (§7.5) */
  barreau3: number;
};

export type RapportLecon = LeconMesuree & { touches: Record<string, ComptesTouche> };

/** La série d'UN parcours. Il n'existe pas de type qui en réunisse deux. */
export type Serie = {
  /** cumul sur toute la vie du parcours : c'est lui qui compose les leçons (§4.4) */
  touches: Record<string, ComptesTouche>;
  /** du plus ancien au plus récent */
  lecons: LeconMesuree[];
};

export type Mesures = Partial<Record<IdParcours, Serie>>;

/**
 * Combien de leçons on garde par parcours. L'horizon du produit est de 140
 * leçons TOUS parcours confondus ; 500 laisse la marge d'un enfant qui
 * s'attarde sans laisser la sauvegarde grossir sans fin.
 */
export const MEMOIRE_LECONS = 500;

/**
 * Le « régime stabilisé » de §7.5, en leçons : une étape entière. En deçà,
 * l'enfant découvre encore ses touches — l'aide s'y déclenche par nouveauté,
 * pas parce que la main dessinée serait illisible.
 */
export const LECONS_OBSERVEES = LECONS_PAR_ETAPE;

/** Seuil d'alarme du barreau 3 : une lettre sur cinq (§7.5). */
export const SEUIL_BARREAU3 = 0.2;

export const SERIE_VIDE: Serie = { touches: {}, lecons: [] };

export const leconVierge = (etape: number): RapportLecon => ({
  etape,
  ms: 0,
  lettres: 0,
  fautes: 0,
  barreau3: 0,
  touches: {},
});

export type Frappe = {
  /** le caractère ATTENDU, jamais celui qui a été frappé */
  touche: string;
  juste: boolean;
  /** aucune erreur sur cette position — la définition de `aide.estPropre` */
  premierCoup: boolean;
  /** le dernier barreau d'aide s'est déclenché sur cette position */
  barreau3?: boolean;
};

/**
 * Une frappe de plus dans la leçon en cours.
 *
 * Une faute n'écrit rien (P3) : elle ne fait donc ni lettre ni occurrence de
 * touche, seulement une faute de plus au dénominateur de la précision.
 * L'espace compte pour une lettre — il est frappé, il prend du temps — mais
 * pas pour une touche : la maîtrise n'est pas indexée dessus (§4.4), et une
 * touche qui pèse un cinquième de tout le corpus noierait les autres.
 */
export function noterFrappe(r: RapportLecon, f: Frappe): RapportLecon {
  if (!f.juste) return { ...r, fautes: r.fautes + 1 };
  const compte = f.touche === ESPACE ? r.touches : compter(r.touches, f.touche, f.premierCoup);
  return {
    ...r,
    lettres: r.lettres + 1,
    barreau3: r.barreau3 + (f.barreau3 ? 1 : 0),
    touches: compte,
  };
}

function compter(
  touches: Record<string, ComptesTouche>,
  touche: string,
  propre: boolean,
): Record<string, ComptesTouche> {
  const avant = touches[touche] ?? { propres: 0, total: 0 };
  return {
    ...touches,
    [touche]: { propres: avant.propres + (propre ? 1 : 0), total: avant.total + 1 },
  };
}

export const serieDe = (m: Mesures, parcours: IdParcours): Serie => m[parcours] ?? SERIE_VIDE;

/**
 * Range une leçon close dans la série de SON parcours, et nulle part ailleurs.
 * L'étiquette est l'argument, pas un champ du rapport : on ne peut pas se
 * tromper de série en oubliant de la renseigner.
 */
export function enregistrer(m: Mesures, parcours: IdParcours, r: RapportLecon): Mesures {
  const serie = serieDe(m, parcours);
  const { touches, ...lecon } = r;
  let cumul = serie.touches;
  for (const [touche, c] of Object.entries(touches)) {
    const avant = cumul[touche] ?? { propres: 0, total: 0 };
    cumul = { ...cumul, [touche]: { propres: avant.propres + c.propres, total: avant.total + c.total } };
  }
  return {
    ...m,
    [parcours]: { touches: cumul, lecons: [...serie.lecons, lecon].slice(-MEMOIRE_LECONS) },
  };
}

/** Proportion de positions justes du premier coup, ou `null` si jamais tapée. */
export function proprete(serie: Serie, touche: string): number | null {
  const c = serie.touches[touche];
  return c && c.total > 0 ? c.propres / c.total : null;
}

/**
 * Mots nets par minute. Le « mot » vaut cinq caractères, la convention de la
 * littérature — c'est la seule façon de comparer cette valeur aux repères
 * chiffrés du cahier (4-8 mots/min à 8-9 ans, 15 en §7.1, 20-25 chez West).
 * Rien ne l'affiche : elle n'existe que pour ces comparaisons-là.
 */
export function vitesse(l: LeconMesuree): number | null {
  return l.ms > 0 ? l.lettres / 5 / (l.ms / 60_000) : null;
}

/** Lettres écrites sur frappes totales. `null` tant que rien n'a été frappé. */
export function precision(l: LeconMesuree): number | null {
  const total = l.lettres + l.fautes;
  return total > 0 ? l.lettres / total : null;
}

/** Garde-fou §7.1 : ce compteur ne s'arrête pas à sept. */
export const leconsDeLEtape = (serie: Serie, etape: number): number =>
  serie.lecons.filter((l) => l.etape === etape).length;

/**
 * Garde-fou §7.5 : à quelle fréquence le dernier barreau se déclenche, sur les
 * dernières leçons seulement. Prendre toute la vie du parcours ferait traîner
 * indéfiniment les premières leçons, celles où tout déclenche l'aide.
 */
export function frequenceBarreau3(serie: Serie, sur: number = LECONS_OBSERVEES): number | null {
  const recentes = serie.lecons.slice(-sur);
  const lettres = recentes.reduce((n, l) => n + l.lettres, 0);
  if (lettres === 0) return null;
  return recentes.reduce((n, l) => n + l.barreau3, 0) / lettres;
}

/** Au-delà, la représentation du doigt est rouverte (§7.5). */
export function alarmeBarreau3(serie: Serie, sur: number = LECONS_OBSERVEES): boolean {
  const f = frequenceBarreau3(serie, sur);
  return f !== null && f >= SEUIL_BARREAU3;
}
