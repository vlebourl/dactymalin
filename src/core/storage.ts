import type { IdDisposition } from './layouts';
import type { Maitrise } from './progression';
import { PALIER_MAX } from './paliers';

export const CLE = 'tapeavecmoi.v1';
/** Dernière progression VALIDE : une corruption ne remet jamais à zéro. */
export const CLE_SECOURS = 'tapeavecmoi.v1.backup';

export type Reglages = {
  sons: boolean;
  texteEspace: boolean;
  animationsDouces: boolean;
};

export type Sauvegarde = {
  version: 1;
  disposition: IdDisposition;
  dispositionChoisieALaMain: boolean;
  palier: number;
  blocsSurPalier: number;
  /** n° du PROCHAIN bloc, monotone : sert à répartir les occurrences */
  bloc: number;
  maitrise: Maitrise;
  guideDoigtVu: boolean;
  reglages: Reglages;
  /** Mots choisis par la famille pour « Notre leçon » (mode libre). */
  motsPerso: string[];
};

/** Borne haute du compteur de blocs : au-delà, la valeur relue est aberrante. */
export const BLOC_MAX = 1_000_000;

export const DEFAUTS: Sauvegarde = {
  version: 1,
  disposition: 'fr-FR',
  dispositionChoisieALaMain: false,
  palier: 1,
  blocsSurPalier: 0,
  bloc: 1,
  maitrise: {},
  guideDoigtVu: false,
  reglages: { sons: true, texteEspace: false, animationsDouces: true },
  motsPerso: [],
};

/** Liste « Notre leçon » assainie : textes courts, dédoublonnés, bornés. */
export function motsPersoValides(v: unknown): string[] {
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

const estDisposition = (v: unknown): v is IdDisposition => v === 'fr-FR' || v === 'fr-CH';

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

/** Gardes manuelles : champ absent ou hors domaine → valeur par défaut, jamais de crash. */
export function valider(brut: unknown): Sauvegarde {
  if (!brut || typeof brut !== 'object') return { ...DEFAUTS };
  const o = brut as Record<string, unknown>;
  const r = (o.reglages ?? {}) as Record<string, unknown>;
  const maitrise = maitriseValide(o.maitrise);
  return {
    version: 1,
    disposition: estDisposition(o.disposition) ? o.disposition : DEFAUTS.disposition,
    dispositionChoisieALaMain: bool(o.dispositionChoisieALaMain, false),
    palier: entierBorne(o.palier, 1, PALIER_MAX, DEFAUTS.palier),
    blocsSurPalier: entierBorne(o.blocsSurPalier, 0, 999, 0),
    bloc: entierBorne(o.bloc, 1, BLOC_MAX, blocDeDepart(maitrise)),
    maitrise,
    guideDoigtVu: bool(o.guideDoigtVu, false),
    motsPerso: motsPersoValides(o.motsPerso),
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
  /* `motsPerso` est un champ AJOUTÉ (même logique que `bloc`) : absent =
     sauvegarde saine d'une version antérieure ; présent, il doit être une
     liste de textes. */
  if (o.motsPerso !== undefined) {
    if (!Array.isArray(o.motsPerso)) return false;
    if (!o.motsPerso.every((m) => typeof m === 'string')) return false;
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
  /* Deux écritures ISOLÉES : un QuotaExceededError sur le backup ne doit pas
     emporter avec lui l'écriture de la clé principale (elle, seule, porte la
     progression du moment). */
  try {
    const precedent = lireCle(cle);
    if (estIntact(precedent)) localStorage.setItem(`${cle}.backup`, JSON.stringify(precedent));
  } catch {
    /* backup au mieux : son échec n'est jamais fatal */
  }
  try {
    localStorage.setItem(cle, JSON.stringify(etat));
  } catch {
    /* quota plein ou navigation privée : la leçon continue sans persistance */
  }
}

export function demanderPersistance(): void {
  void navigator.storage?.persist?.().catch(() => undefined);
}
