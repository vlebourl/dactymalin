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
 * l'adulte, dans son espace — c'est `V9Compte` depuis #63, et lui seul.
 */
import { ESPACE, LECONS_PAR_ETAPE, type IdParcours } from './parcours';

/** Positions validées pour une touche, et celles réussies du premier coup. */
export type ComptesTouche = { propres: number; total: number };

/** Ce qu'une leçon laisse derrière elle, une fois close. */
export type LeconMesuree = {
  etape: number;
  /**
   * Quand la leçon a été close, en millisecondes epoch.
   *
   * C'est ce qui donne son IDENTITÉ à une leçon, et donc ce qui permet de
   * réunir les séries de deux appareils sans les dupliquer ni en jeter une
   * (#64). Sans elle, deux listes de leçons ne peuvent qu'être départagées.
   *
   * Vaut 0 pour les leçons d'avant #64, qui n'en portaient pas : elles sont
   * alors les plus anciennes, ce qui est vrai.
   */
  le: number;
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

/**
 * Garde-fou §7.1, en mots nets par minute. Au-delà, l'index de Découverte
 * commence à s'automatiser sur sa demi-moitié de clavier, et le passage à
 * Dactylo coûtera d'autant plus cher qu'il tardera. Le seuil d'automatisation
 * kinesthésique mesuré est à 20-25 (West 1967) : quinze laisse au parent le
 * temps de voir venir. C'est le SEUL chiffre que l'app remonte d'elle-même, et
 * il ne va qu'au parent.
 */
export const SEUIL_VITESSE_DECOUVERTE = 15;

export const SERIE_VIDE: Serie = { touches: {}, lecons: [] };

export const leconVierge = (etape: number): RapportLecon => ({
  etape,
  /* Posée à la clôture par l'état, qui seul connaît l'heure : le reducer d'une
     leçon est pur, et une date tirée ici changerait à chaque frappe. */
  le: 0,
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

/**
 * Les dernières leçons d'UNE série, additionnées en une seule.
 *
 * `vitesse` et `precision` répondent sur une leçon ; une leçon isolée est trop
 * bruitée pour qu'un parent en tire quoi que ce soit, et la moyenne des
 * vitesses leçon par leçon donnerait plus de poids à une leçon courte qu'à une
 * longue. Additionner d'abord, diviser ensuite : les deux fonctions
 * existantes s'appliquent telles quelles au résultat, et la formule ne vit
 * qu'à un seul endroit.
 *
 * Comme partout ici, le cumul reste DANS une série : il n'existe pas de forme
 * de cet appel qui prenne deux parcours.
 */
export function cumulRecent(serie: Serie, sur: number = LECONS_OBSERVEES): LeconMesuree | null {
  const recentes = serie.lecons.slice(-sur);
  if (recentes.length === 0) return null;
  return recentes.reduce(
    (t, l) => ({
      etape: l.etape, // la plus récente : c'est celle où l'enfant en est
      le: l.le,
      ms: t.ms + l.ms,
      lettres: t.lettres + l.lettres,
      fautes: t.fautes + l.fautes,
      barreau3: t.barreau3 + l.barreau3,
    }),
    { etape: 0, le: 0, ms: 0, lettres: 0, fautes: 0, barreau3: 0 },
  );
}

/**
 * Garde-fou §7.1 : il est temps de proposer Dactylo au parent.
 *
 * Ne regarde QUE la série Découverte — c'est l'index qui balaie sa moitié que
 * le risque vise, pas la vitesse en soi. Un enfant rapide en Dactylo fait
 * exactement ce qu'on lui demande.
 */
export function alarmePassageDactylo(m: Mesures, sur: number = LECONS_OBSERVEES): boolean {
  const cumul = cumulRecent(serieDe(m, 'decouverte'), sur);
  const v = cumul && vitesse(cumul);
  return v !== null && v >= SEUIL_VITESSE_DECOUVERTE;
}

/**
 * Réunit les mesures de DEUX appareils du même enfant.
 *
 * Le module refusait jusqu'ici de choisir : `storage.garderLesMesures` gardait
 * la série la mieux fournie et jetait l'autre, faute de pouvoir distinguer deux
 * leçons. La date de clôture le permet, et la règle devient une union — plus un
 * départage, donc plus de perte.
 *
 * Trois propriétés, et ce ne sont pas des élégances :
 * - **idempotente** : la réconciliation rejoue à chaque démarrage, et une
 *   union qui empilerait ferait grossir l'historique sans fin ;
 * - **commutative** : `fusion.ts` ne garantit pas quel appareil est passé en
 *   premier ;
 * - **par parcours** : aucune leçon ne franchit la frontière (§4.7).
 *
 * Les leçons de même date forment un lot, et c'est le lot le mieux fourni qui
 * gagne — maximum des multiplicités, comme `fusionnerMaitrise`. Ça compte pour
 * de vrai : toutes les leçons d'avant #64 portent la date 0, et les empiler les
 * doublerait à chaque synchronisation.
 */
export function fusionnerMesures(a: Mesures, b: Mesures): Mesures {
  const sortie: Mesures = {};
  for (const parcours of Object.keys({ ...a, ...b }) as IdParcours[]) {
    const ici = a[parcours];
    const la = b[parcours];
    if (!ici || !la) {
      /* Un seul côté connaît ce parcours : rien à réunir, et surtout rien à
         effacer — un appareil resté à l'ancien bundle n'en porte aucun. */
      sortie[parcours] = ici ?? la;
      continue;
    }
    sortie[parcours] = {
      touches: fusionnerTouches(ici.touches, la.touches),
      lecons: unionDesLecons(ici.lecons, la.lecons),
    };
  }
  return sortie;
}

/**
 * Le MAXIMUM par touche, jamais la somme.
 *
 * `touches` est un cumul sur toute la vie du parcours : additionner deux cumuls
 * qui se recouvrent doublerait le compte à chaque synchronisation, et
 * l'inflation ne s'arrêterait jamais — la réconciliation rejoue à chaque
 * démarrage. Le maximum dit « ce qu'a vu le mieux informé des deux appareils ».
 * Il sous-compte quand les deux ont joué des choses différentes : c'est le prix
 * d'un cumul qui ne garde pas le détail de qui a vu quoi, et il est payé dans
 * le bon sens.
 *
 * À noter pour qui viendra après : `proprete`, qui lit ce cumul, n'a encore
 * AUCUN appelant. La décision 8 du cahier veut qu'il compose les leçons
 * suivantes ; ce n'est pas branché. Ne pas justifier ce choix-ci par un lecteur
 * qui n'existe pas.
 */
function fusionnerTouches(
  a: Record<string, ComptesTouche>,
  b: Record<string, ComptesTouche>,
): Record<string, ComptesTouche> {
  const sortie: Record<string, ComptesTouche> = {};
  for (const touche of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const x = a[touche] ?? { propres: 0, total: 0 };
    const y = b[touche] ?? { propres: 0, total: 0 };
    sortie[touche] = {
      propres: Math.max(x.propres, y.propres),
      total: Math.max(x.total, y.total),
    };
  }
  return sortie;
}

/**
 * Union des leçons de deux appareils, remise dans l'ordre, puis bornée.
 *
 * L'identité d'une leçon est son CONTENU, pas sa date — et ce n'est pas un
 * détail de mise en œuvre. Un appareil resté au bundle d'avant #64 relit les
 * leçons avec un `leconsValides` qui ne connaît pas `le` : il les repousse
 * toutes datées de 0. Une union qui se fierait à la date verrait alors deux
 * fois chaque leçon — une fois datée, une fois à zéro — et l'historique
 * doublerait à chaque synchronisation jusqu'à saturer la mémoire de 500. Le
 * parent lirait « 30 leçons » pour 5 réellement jouées.
 *
 * La clé est donc (étape, durée, lettres, fautes, barreau 3). La durée est
 * comptée à la milliseconde sur une séance de douze minutes : deux leçons
 * distinctes qui coïncideraient sur les cinq champs à la fois n'existent pas
 * en pratique, et si elles existaient on en perdrait une — bien moins grave
 * que l'inflation.
 *
 * La date, elle, sert à l'ORDRE : on garde la plus grande vue pour une même
 * leçon, ce qui fait gagner la copie datée sur la copie remise à zéro.
 *
 * Multiplicités au MAXIMUM, comme `fusionnerMaitrise` : deux leçons vraiment
 * identiques et vraiment distinctes restent deux, sans devenir quatre à la
 * synchronisation suivante.
 */
function unionDesLecons(a: LeconMesuree[], b: LeconMesuree[]): LeconMesuree[] {
  const cle = (l: LeconMesuree) => `${l.etape}|${l.ms}|${l.lettres}|${l.fautes}|${l.barreau3}`;
  const lots = (v: LeconMesuree[]) => {
    const m = new Map<string, LeconMesuree[]>();
    for (const l of v) m.set(cle(l), [...(m.get(cle(l)) ?? []), l]);
    return m;
  };
  const ici = lots(a);
  const la = lots(b);
  const sortie: LeconMesuree[] = [];
  for (const k of new Set([...ici.keys(), ...la.keys()])) {
    const g = ici.get(k) ?? [];
    const d = la.get(k) ?? [];
    /* La date la mieux informée des deux : une copie revenue d'un appareil qui
       ignore `le` la porte à 0, et ne doit pas effacer celle qu'on connaît. */
    const le = Math.max(...[...g, ...d].map((l) => l.le));
    const combien = Math.max(g.length, d.length);
    const modele = { ...(g[0] ?? d[0]), le };
    for (let i = 0; i < combien; i++) sortie.push({ ...modele });
  }
  /* Du plus ancien au plus récent, et à date égale par contenu : l'ordre ne
     doit dépendre ni de celui des arguments ni de celui des clés. */
  sortie.sort((x, y) => x.le - y.le || (cle(x) < cle(y) ? -1 : cle(x) > cle(y) ? 1 : 0));
  return sortie.slice(-MEMOIRE_LECONS);
}
