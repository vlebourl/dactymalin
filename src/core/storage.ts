import type { IdDisposition } from './layouts';
import {
  MEMOIRE_LECONS,
  type ComptesTouche,
  type LeconMesuree,
  type Mesures,
  type Serie,
} from './mesures';
import type { Maitrise } from './progression';
import { PALIER_MAX } from './paliers';
import { ETAPE_MAX, type IdParcours } from './parcours';

export const CLE = 'tapeavecmoi.v1';
/** Dernière progression VALIDE : une corruption ne remet jamais à zéro. */
export const CLE_SECOURS = 'tapeavecmoi.v1.backup';

export type Reglages = {
  sons: boolean;
  texteEspace: boolean;
  animationsDouces: boolean;
};

/**
 * Où en est l'enfant dans UN parcours, sur UNE disposition. Les deux parcours
 * sont indépendants et parallèles (cahier §4.2) : leurs progressions sont
 * persistées séparément. La disposition les sépare aussi — une même étape n'y
 * ouvre pas les mêmes touches (§4.5).
 */
export type Progression = { etape: number; leconsSurEtape: number };
export type CleProgression = `${IdParcours}:${IdDisposition}`;
export type Progressions = Partial<Record<CleProgression, Progression>>;

/**
 * Version du MODÈLE de progression, distincte de `version`.
 *
 * `version` reste à 1, et ce n'est pas un oubli : c'est le contrat de lecture
 * des clients DÉJÀ DÉPLOYÉS. Leur `estIntact` refuse tout ce qui ne porte pas
 * `version === 1`, et ce refus n'est pas anodin — l'appareil retombe sur sa
 * sauvegarde de secours puis sur les défauts, et le serveur, s'il est resté
 * lui aussi sur l'ancien code, répond 400, ce que la file d'envoi jette
 * DÉFINITIVEMENT (`sync.vidange`). Bref : annoncer le nouveau modèle en
 * bombant `version` aurait effacé la progression qu'il sert à protéger.
 *
 * Le nouveau modèle est donc ADDITIF. Ce qu'un ancien client ignore lui reste
 * invisible ; ce qu'il connaît reste vrai.
 */
export const MODELE = 2;

export type Sauvegarde = {
  version: 1;
  /**
   * Le parcours que le PARENT a choisi (#42). Optionnel comme `modele` : une
   * sauvegarde écrite avant le sélecteur n'en porte pas, et Découverte est
   * alors la bonne réponse — c'est le seul parcours qui ait jamais été
   * jouable. C'est une PRÉFÉRENCE, pas un acquis : elle ne se fusionne pas,
   * le dernier choix de la famille gagne (`fusion.fusionner`).
   */
  parcours?: IdParcours;
  /** Optionnel : un producteur d'état resté sur l'ancien modèle n'en écrit
      pas, et `valider`/`sauver` le reposent sans rien perdre. */
  modele?: typeof MODELE;
  disposition: IdDisposition;
  dispositionChoisieALaMain: boolean;
  /** MIROIR de `progressions['decouverte:<disposition>']`, borné au dernier
      palier que les anciens clients savent lire. */
  palier: number;
  blocsSurPalier: number;
  /** n° du PROCHAIN bloc, monotone : sert à répartir les occurrences */
  bloc: number;
  maitrise: Maitrise;
  guideDoigtVu: boolean;
  reglages: Reglages;
  progressions?: Progressions;
  /**
   * Ce que l'app OBSERVE, étiqueté par parcours et jamais montré à l'enfant
   * (§4.7, voir `mesures.ts`). Optionnel comme `progressions` : une sauvegarde
   * d'avant l'instrumentation n'en porte pas, et n'en est pas moins saine.
   */
  mesures?: Mesures;
};

/** Les deux parcours en VALEURS : `parcours.ts` n'en expose que le type. */
const PARCOURS: IdParcours[] = ['decouverte', 'dactylo'];
const DISPOSITIONS: IdDisposition[] = ['fr-FR', 'fr-CH'];

export const cleProgression = (p: IdParcours, d: IdDisposition): CleProgression => `${p}:${d}`;

const CLES_PROGRESSION = new Set<string>(
  PARCOURS.flatMap((p) => DISPOSITIONS.map((d) => cleProgression(p, d))),
);

export const PROGRESSION_INITIALE: Progression = { etape: 1, leconsSurEtape: 0 };
/** Même borne que `blocsSurPalier` : rejouer une étape n'a pas de plafond. */
export const LECONS_MAX = 999;

/**
 * La plus AVANCÉE de deux progressions du même couple. Même règle que la
 * fusion multi-appareil : l'étape décide d'abord, les leçons ne départagent
 * qu'à étape égale — les leçons d'une étape dépassée ne disent plus rien.
 */
export function plusAvancee(a: Progression, b: Progression): Progression {
  if (a.etape !== b.etape) return a.etape > b.etape ? a : b;
  return { etape: a.etape, leconsSurEtape: Math.max(a.leconsSurEtape, b.leconsSurEtape) };
}

export function progressionDe(
  s: Pick<Sauvegarde, 'progressions'>,
  parcours: IdParcours,
  disposition: IdDisposition,
): Progression {
  return s.progressions?.[cleProgression(parcours, disposition)] ?? { ...PROGRESSION_INITIALE };
}

/**
 * Écrit une progression, miroir compris. Elle ne REDESCEND jamais : rejouer
 * une étape déjà finie (§4.4) est un choix de l'enfant, pas une perte
 * d'acquis, et un appareil en retard ne doit pas pouvoir défaire une avance.
 */
export function avecProgression(
  s: Sauvegarde,
  parcours: IdParcours,
  disposition: IdDisposition,
  p: Progression,
): Sauvegarde {
  return valider({
    ...s,
    progressions: { ...s.progressions, [cleProgression(parcours, disposition)]: p },
  });
}

/** Borne haute du compteur de blocs : au-delà, la valeur relue est aberrante. */
export const BLOC_MAX = 1_000_000;

/* Bornes des MESURES relues. Elles ne protègent pas d'un tricheur — il n'y a
   rien à gagner à gonfler un compteur que personne ne voit — mais d'un fichier
   abîmé qui ferait grossir la sauvegarde sans fin. */
const TOUCHES_MAX = 200;
const COMPTE_MAX = 10_000_000;
/** 24 h : une leçon dure 10-15 min, tout le reste est un onglet oublié. */
const LECON_MS_MAX = 86_400_000;

export const DEFAUTS: Sauvegarde = {
  version: 1,
  modele: MODELE,
  parcours: 'decouverte',
  progressions: { 'decouverte:fr-FR': { ...PROGRESSION_INITIALE } },
  disposition: 'fr-FR',
  dispositionChoisieALaMain: false,
  palier: 1,
  blocsSurPalier: 0,
  bloc: 1,
  maitrise: {},
  guideDoigtVu: false,
  reglages: { sons: true, texteEspace: false, animationsDouces: true },
};

/**
 * Une liste de mots assainie : textes courts, dédoublonnés, bornés. Elle
 * servait à « Notre leçon », la liste unique d'avant la bibliothèque ; c'est
 * aujourd'hui le validateur des mots d'une liste nommée (`listes.ts`), et ses
 * bornes n'ont pas bougé.
 */
export function motsValides(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const sortie = v
    .filter((m): m is string => typeof m === 'string')
    .map((m) => m.trim())
    .filter((m) => m.length >= 1 && m.length <= 30);
  return [...new Set(sortie)].slice(0, 100);
}

/**
 * Repli LEGACY : numéro du prochain bloc reconstruit depuis la maîtrise, pour
 * les sauvegardes écrites avant que `bloc` ne soit persisté. Il ne suffit pas
 * comme source unique — un bloc sans aucune frappe propre ne laisse aucune
 * trace dans la maîtrise, et son numéro était alors resservi au rechargement.
 */
export function blocDeDepart(maitrise: Maitrise): number {
  let max = 0;
  for (const blocs of Object.values(maitrise)) for (const b of blocs) if (b > max) max = b;
  return Math.min(max + 1, BLOC_MAX);
}

/**
 * Les mesures relues avec méfiance, et JETÉES au moindre doute.
 *
 * C'est la différence avec la progression : ce qui est observé n'est qu'une
 * observation. Une série abîmée ne vaut pas de déclarer la sauvegarde corrompue
 * — cela renverrait l'enfant à son backup, voire aux défauts, et lui ferait
 * perdre des étapes réellement jouées pour une statistique que personne
 * n'affiche. On perd la mesure, jamais l'acquis.
 */
function comptesTouchesValides(v: unknown): Record<string, ComptesTouche> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
  const sortie: Record<string, ComptesTouche> = {};
  for (const [touche, c] of Object.entries(v as Record<string, unknown>).slice(0, TOUCHES_MAX)) {
    if (touche.length !== 1 || !c || typeof c !== 'object') continue;
    const o = c as Record<string, unknown>;
    const total = entierBorne(o.total, 0, COMPTE_MAX, -1);
    const propres = entierBorne(o.propres, 0, total < 0 ? 0 : total, -1);
    if (total < 0 || propres < 0) continue;
    sortie[touche] = { propres, total };
  }
  return sortie;
}

function leconsValides(v: unknown): LeconMesuree[] {
  if (!Array.isArray(v)) return [];
  const sortie: LeconMesuree[] = [];
  for (const l of v.slice(-MEMOIRE_LECONS)) {
    if (!l || typeof l !== 'object') continue;
    const o = l as Record<string, unknown>;
    const etape = entierBorne(o.etape, 1, ETAPE_MAX, 0);
    const ms = entierBorne(o.ms, 0, LECON_MS_MAX, -1);
    const lettres = entierBorne(o.lettres, 0, COMPTE_MAX, -1);
    const fautes = entierBorne(o.fautes, 0, COMPTE_MAX, -1);
    const barreau3 = entierBorne(o.barreau3, 0, COMPTE_MAX, -1);
    if (etape === 0 || ms < 0 || lettres < 0 || fautes < 0 || barreau3 < 0) continue;
    sortie.push({ etape, ms, lettres, fautes, barreau3 });
  }
  return sortie;
}

export function mesuresValides(v: unknown): Mesures {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
  const sortie: Mesures = {};
  for (const [cle, serie] of Object.entries(v as Record<string, unknown>)) {
    /* Une clé qui n'est pas un parcours connu ne devient PAS une série : c'est
       exactement ainsi que deux séries finiraient par n'en faire qu'une. */
    if (!estParcours(cle)) continue;
    if (!serie || typeof serie !== 'object' || Array.isArray(serie)) continue;
    const o = serie as Record<string, unknown>;
    sortie[cle] = { touches: comptesTouchesValides(o.touches), lecons: leconsValides(o.lecons) };
  }
  return sortie;
}

const estDisposition = (v: unknown): v is IdDisposition => v === 'fr-FR' || v === 'fr-CH';

/* Un parcours inconnu retombe sur Découverte plutôt que d'invalider la
   sauvegarde entière : le refuser renverrait au backup une progression saine
   à cause d'une simple préférence. */
const estParcours = (v: unknown): v is IdParcours => PARCOURS.includes(v as IdParcours);

const bool = (v: unknown, defaut: boolean) => (typeof v === 'boolean' ? v : defaut);

const entierBorne = (v: unknown, min: number, max: number, defaut: number) =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max ? v : defaut;

function maitriseValide(v: unknown): Maitrise {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
  const sortie: Maitrise = {};
  for (const [cle, val] of Object.entries(v as Record<string, unknown>)) {
    if (cle.length !== 1) continue;
    if (!Array.isArray(val)) continue;
    const blocs = val.filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
    if (blocs.length) sortie[cle] = blocs;
  }
  return sortie;
}

/** Une progression relue avec méfiance : hors domaine → rien, jamais de crash. */
function progressionValide(v: unknown): Progression | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  const etape = entierBorne(o.etape, 1, ETAPE_MAX, 0);
  const lecons = entierBorne(o.leconsSurEtape, 0, LECONS_MAX, -1);
  if (etape === 0 || lecons === -1) return null;
  return { etape, leconsSurEtape: lecons };
}

/**
 * Une clé de progression INCONNUE est conservée telle quelle, sans être
 * interprétée.
 *
 * `estIntact` la tolérait déjà — « une clé inconnue est TOLÉRÉE (un parcours
 * futur) » — mais cette fonction-là la jetait, et `valider` passe par elle. Le
 * jour où un troisième parcours arrive, un appareil resté sur l'ancien bundle
 * aurait donc EFFACÉ la progression du parcours neuf à chaque fusion, sans un
 * mot et sans retour possible. Ce n'est pas un bug actif — `IdParcours` n'a que
 * deux valeurs — c'est une bombe à retardement, et elle explosait au moment
 * précis où l'on croirait n'avoir fait qu'ajouter une valeur.
 *
 * Les deux fonctions tiennent désormais le même contrat : on ne comprend pas,
 * on ne touche pas.
 */
function progressionsValides(v: unknown): Progressions {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
  const sortie: Progressions = Object.create(null) as Progressions;
  /* Les clés CONNUES passent d'abord : le plafond ne doit jamais coûter la
     progression réelle de l'enfant au profit d'un espace opaque. */
  const entrees = Object.entries(v as Record<string, unknown>).sort(
    (a, b) => Number(CLES_PROGRESSION.has(b[0])) - Number(CLES_PROGRESSION.has(a[0])),
  );
  let n = 0;
  for (const [cle, val] of entrees) {
    if (n >= PROGRESSIONS_MAX) break;
    const p = progressionValide(val);
    if (!p) continue;
    if (CLES_PROGRESSION.has(cle) || estCleProgressionPlausible(cle)) {
      sortie[cle as CleProgression] = p;
      n++;
    }
  }
  return { ...sortie };
}

/** Bornes de l'espace opaque : elles empêchent un pair d'y faire grossir la
    sauvegarde sans fin, sans rien décider de ce qu'il contient. */
export const CLE_PROGRESSION_MAX = 64;
export const PROGRESSIONS_MAX = 32;

/**
 * Forme d'une clé de progression, sans exiger de connaître NI le parcours NI la
 * disposition : les deux peuvent évoluer, et un client d'aujourd'hui n'a pas à
 * en juger. On vérifie seulement que la clé est sûre et bornée.
 */
function estCleProgressionPlausible(cle: string): boolean {
  return (
    cle.length > 0 &&
    cle.length <= CLE_PROGRESSION_MAX &&
    /^[a-z0-9-]+:[a-zA-Z0-9-]+$/.test(cle) &&
    /* pollution de prototype : une clé ne devient jamais une propriété
       héritée, même si elle passe le filtre de forme */
    cle !== '__proto__' &&
    cle !== 'constructor'
  );
}

/**
 * LA MIGRATION, et elle est monotone dans les DEUX SENS.
 *
 * Une sauvegarde v1 ne porte que `palier` / `blocsSurPalier` : c'est la
 * progression Découverte de la disposition jouée, et rien d'autre — l'enfant
 * n'a jamais eu accès à Dactylo. On la verse donc dans le couple
 * `decouverte:<disposition>`, sans jamais écraser une progression déjà
 * enregistrée : c'est ce qui rend l'opération rejouable à l'identique.
 *
 * Le miroir vaut aussi dans l'autre sens, et c'est ce qui sauve les familles à
 * plusieurs appareils pendant le déploiement : une avance faite sur un
 * appareil resté à l'ancien bundle n'arrive QUE par `palier`, et elle est
 * reprise ici. La règle « le plus avancé gagne » est la même que celle de la
 * fusion multi-appareil : personne ne perd, personne ne recule.
 */
export function progressionsNormalisees(s: {
  disposition: IdDisposition;
  palier: number;
  blocsSurPalier: number;
  progressions?: unknown;
}): Progressions {
  const stockees = progressionsValides(s.progressions);
  const cle = cleProgression('decouverte', s.disposition);
  return {
    ...stockees,
    [cle]: plusAvancee(stockees[cle] ?? PROGRESSION_INITIALE, {
      etape: s.palier,
      leconsSurEtape: s.blocsSurPalier,
    }),
  };
}

/**
 * Le miroir que lisent les clients d'avant. Il est BORNÉ à `PALIER_MAX` : au
 * delà, leur contrôle d'intégrité déclarerait la sauvegarde corrompue et la
 * remplacerait par des défauts. Les leçons ne suivent que tant que l'étape
 * tient dans le miroir — sinon elles compteraient pour une autre étape.
 */
export function miroirLegacy(p: Progression): { palier: number; blocsSurPalier: number } {
  const palier = Math.min(p.etape, PALIER_MAX);
  return { palier, blocsSurPalier: p.etape === palier ? p.leconsSurEtape : 0 };
}

/** Gardes manuelles : champ absent ou hors domaine → valeur par défaut, jamais de crash. */
export function valider(brut: unknown): Sauvegarde {
  if (!brut || typeof brut !== 'object') return { ...DEFAUTS };
  const o = brut as Record<string, unknown>;
  const r = (o.reglages ?? {}) as Record<string, unknown>;
  const maitrise = maitriseValide(o.maitrise);
  const mesures = mesuresValides(o.mesures);
  const disposition = estDisposition(o.disposition) ? o.disposition : DEFAUTS.disposition;
  const progressions = progressionsNormalisees({
    disposition,
    palier: entierBorne(o.palier, 1, PALIER_MAX, DEFAUTS.palier),
    blocsSurPalier: entierBorne(o.blocsSurPalier, 0, LECONS_MAX, 0),
    progressions: o.progressions,
  });
  const miroir = miroirLegacy(progressionDe({ progressions }, 'decouverte', disposition));
  return {
    version: 1,
    modele: MODELE,
    parcours: estParcours(o.parcours) ? o.parcours : 'decouverte',
    disposition,
    dispositionChoisieALaMain: bool(o.dispositionChoisieALaMain, false),
    palier: miroir.palier,
    blocsSurPalier: miroir.blocsSurPalier,
    bloc: entierBorne(o.bloc, 1, BLOC_MAX, blocDeDepart(maitrise)),
    maitrise,
    /* ABSENT tant qu'il n'y a rien à dire, et ce n'est pas cosmétique : deux
       appareils comparent leurs états par EMPREINTE (`sync.empreinte`), et un
       `mesures: {}` posé d'un seul côté leur ferait échanger indéfiniment un
       état pourtant identique. */
    ...(Object.keys(mesures).length ? { mesures } : {}),
    guideDoigtVu: bool(o.guideDoigtVu, false),
    progressions,
    reglages: {
      sons: bool(r.sons, true),
      texteEspace: bool(r.texteEspace, false),
      animationsDouces: bool(r.animationsDouces, true),
    },
  };
}

/**
 * `true` si l'objet brut est conforme SUR TOUS SES CHAMPS.
 * Une validation partielle laissait passer `{version:1, disposition:"fr-FR",
 * palier:42}` : `valider()` écrasait alors la progression vers les défauts sans
 * jamais consulter le backup, pourtant sain. Le contrôle porte donc désormais
 * sur chaque champ, avec les MÊMES bornes que `valider()`.
 */
export function estIntact(brut: unknown): boolean {
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) return false;
  const o = brut as Record<string, unknown>;
  const entier = (v: unknown, min: number, max: number) =>
    typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;
  if (o.version !== 1) return false;
  if (!estDisposition(o.disposition)) return false;
  if (typeof o.dispositionChoisieALaMain !== 'boolean') return false;
  if (!entier(o.palier, 1, PALIER_MAX)) return false;
  if (!entier(o.blocsSurPalier, 0, 999)) return false;
  /* `bloc` est un champ AJOUTÉ : absent = sauvegarde d'une version antérieure,
     encore parfaitement saine (le repli reconstruit le compteur). Présent, il
     doit être valide, sinon le backup a plus de valeur que ce fichier-là. */
  if (o.bloc !== undefined && !entier(o.bloc, 1, BLOC_MAX)) return false;
  if (typeof o.guideDoigtVu !== 'boolean') return false;
  /* `motsPerso` — l'ancienne liste unique — n'est PLUS contrôlé (#12). Une
     sauvegarde d'avant son retrait le porte encore : le champ est ignoré, pas
     rejeté. Le contrôler encore ferait renvoyer au backup une progression
     parfaitement saine à cause d'un champ que plus personne ne lit. */
  /* `modele` et `progressions` sont AJOUTÉS : absents, la sauvegarde est celle
     d'un client d'avant, parfaitement saine — la migration la reprendra.
     Un `modele` PLUS RÉCENT que le nôtre est accepté lui aussi : ses champs
     connus restent lisibles, et le refuser renverrait au backup, voire aux
     défauts, une progression réelle venue d'un appareil mieux à jour. */
  if (o.modele !== undefined && !entier(o.modele, 1, 1000)) return false;
  if (o.progressions !== undefined) {
    const p = o.progressions;
    if (!p || typeof p !== 'object' || Array.isArray(p)) return false;
    for (const [cle, val] of Object.entries(p as Record<string, unknown>)) {
      /* Une clé inconnue est TOLÉRÉE (un parcours futur), une progression
         illisible ne l'est pas : c'est la marque d'un fichier abîmé. */
      if (!CLES_PROGRESSION.has(cle)) continue;
      if (!progressionValide(val)) return false;
    }
  }
  if (!o.maitrise || typeof o.maitrise !== 'object' || Array.isArray(o.maitrise)) return false;
  for (const [cle, val] of Object.entries(o.maitrise as Record<string, unknown>)) {
    if (cle.length !== 1) return false;
    if (!Array.isArray(val)) return false;
    if (!val.every((n) => typeof n === 'number' && Number.isFinite(n))) return false;
  }
  const r = o.reglages;
  if (!r || typeof r !== 'object' || Array.isArray(r)) return false;
  const reg = r as Record<string, unknown>;
  return (['sons', 'texteEspace', 'animationsDouces'] as const).every(
    (c) => typeof reg[c] === 'boolean',
  );
}

/** Union de deux jeux de progressions : le plus avancé gagne, couple par couple. */
export function fusionnerProgressions(a: Progressions, b: Progressions): Progressions {
  const sortie: Progressions = {};
  for (const cle of new Set([...Object.keys(a), ...Object.keys(b)]) as Set<CleProgression>) {
    const ici = a[cle];
    const la = b[cle];
    sortie[cle] = ici && la ? plusAvancee(ici, la) : (ici ?? la);
  }
  return sortie;
}

/**
 * L'état à écrire, réuni à ce que la clé portait déjà. Ce n'est PAS une
 * précaution de style : tant que la boucle de jeu produit un état au modèle 1,
 * l'écrire tel quel effacerait à chaque checkpoint tout ce que ce modèle
 * ignore.
 */
function fusionnerAvecStocke(etat: Sauvegarde, precedent: unknown): Sauvegarde {
  const neuf = valider(etat);
  if (!estIntact(precedent)) return neuf;
  const avant = valider(precedent);
  const progressions = fusionnerProgressions(neuf.progressions ?? {}, avant.progressions ?? {});
  return valider({ ...neuf, progressions, mesures: garderLesMesures(neuf, avant) });
}

/**
 * Même raison que pour les progressions, et même remède : un producteur d'état
 * qui ne connaît pas les mesures ne doit pas les effacer en écrivant. Il en
 * existe un aujourd'hui — `fusion.fusionner` reconstruit la sauvegarde champ
 * par champ, et le retour du serveur passe par lui à chaque réconciliation.
 * Sans ceci, l'observation d'un enfant disparaîtrait à sa première synchro.
 *
 * La règle est PAR PARCOURS, jamais entre parcours : la série la mieux fournie
 * gagne. Ce n'est pas une fusion multi-appareil — celle-là appartient à
 * `fusion.ts` — c'est le refus de perdre ce qu'on avait déjà.
 */
function garderLesMesures(neuf: Sauvegarde, avant: Sauvegarde): Mesures {
  const sortie: Mesures = { ...avant.mesures };
  for (const [cle, serie] of Object.entries(neuf.mesures ?? {}) as [IdParcours, Serie][]) {
    const stockee = sortie[cle];
    if (!stockee || serie.lecons.length >= stockee.lecons.length) sortie[cle] = serie;
  }
  return sortie;
}

function lireCle(cle: string): unknown {
  try {
    const texte = localStorage.getItem(cle);
    return texte ? JSON.parse(texte) : null;
  } catch {
    return null;
  }
}

/* Chaque profil a sa clé (`tapeavecmoi.v1` pour le premier, suffixée ensuite,
   voir profils.ts) ; le défaut garde tous les appels historiques valides. */
export function charger(cle: string = CLE): Sauvegarde {
  const principal = lireCle(cle);
  if (estIntact(principal)) return valider(principal);
  // principal corrompu ou absent : on retombe sur la dernière progression valide
  const secours = lireCle(`${cle}.backup`);
  if (estIntact(secours)) return valider(secours);
  return { ...DEFAUTS };
}

/** Checkpoint : appelé en fin d'item ou de bloc, jamais à chaque frappe. */
export function sauver(etat: Sauvegarde, cle: string = CLE): void {
  const precedent = lireCle(cle);
  /* Deux écritures ISOLÉES : un QuotaExceededError sur le backup ne doit pas
     emporter avec lui l'écriture de la clé principale (elle, seule, porte la
     progression du moment). */
  try {
    if (estIntact(precedent)) localStorage.setItem(`${cle}.backup`, JSON.stringify(precedent));
  } catch {
    /* backup au mieux : son échec n'est jamais fatal */
  }
  try {
    /* L'état écrit ne porte que ce que son producteur connaît : celui qui est
       resté au modèle 1 n'a jamais entendu parler de Dactylo, et l'écrire tel
       quel effacerait à chaque fin de leçon la progression de l'autre
       parcours. On repose donc ce qui était déjà là, sous la règle habituelle
       « le plus avancé gagne ». */
    localStorage.setItem(cle, JSON.stringify(fusionnerAvecStocke(etat, precedent)));
  } catch {
    /* quota plein ou navigation privée : la leçon continue sans persistance */
  }
}

export function demanderPersistance(): void {
  void navigator.storage?.persist?.().catch(() => undefined);
}
