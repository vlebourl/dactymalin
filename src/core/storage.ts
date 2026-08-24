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
  maitrise: Maitrise;
  guideDoigtVu: boolean;
  reglages: Reglages;
};

export const DEFAUTS: Sauvegarde = {
  version: 1,
  disposition: 'fr-FR',
  dispositionChoisieALaMain: false,
  palier: 1,
  blocsSurPalier: 0,
  maitrise: {},
  guideDoigtVu: false,
  reglages: { sons: true, texteEspace: false, animationsDouces: true },
};

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
  return {
    version: 1,
    disposition: estDisposition(o.disposition) ? o.disposition : DEFAUTS.disposition,
    dispositionChoisieALaMain: bool(o.dispositionChoisieALaMain, false),
    palier: entierBorne(o.palier, 1, PALIER_MAX, DEFAUTS.palier),
    blocsSurPalier: entierBorne(o.blocsSurPalier, 0, 999, 0),
    maitrise: maitriseValide(o.maitrise),
    guideDoigtVu: bool(o.guideDoigtVu, false),
    reglages: {
      sons: bool(r.sons, true),
      texteEspace: bool(r.texteEspace, false),
      animationsDouces: bool(r.animationsDouces, true),
    },
  };
}

/** `true` si l'objet brut était déjà conforme — sert à ne sauvegarder en secours que du sain. */
function estIntact(brut: unknown): boolean {
  if (!brut || typeof brut !== 'object') return false;
  const o = brut as Record<string, unknown>;
  return estDisposition(o.disposition) && typeof o.palier === 'number' && o.version === 1;
}

function lireCle(cle: string): unknown {
  try {
    const texte = localStorage.getItem(cle);
    return texte ? JSON.parse(texte) : null;
  } catch {
    return null;
  }
}

export function charger(): Sauvegarde {
  const principal = lireCle(CLE);
  if (estIntact(principal)) return valider(principal);
  // principal corrompu ou absent : on retombe sur la dernière progression valide
  const secours = lireCle(CLE_SECOURS);
  if (estIntact(secours)) return valider(secours);
  return { ...DEFAUTS };
}

/** Checkpoint : appelé en fin d'item ou de bloc, jamais à chaque frappe. */
export function sauver(etat: Sauvegarde): void {
  try {
    const precedent = lireCle(CLE);
    if (estIntact(precedent)) localStorage.setItem(CLE_SECOURS, JSON.stringify(precedent));
    localStorage.setItem(CLE, JSON.stringify(etat));
  } catch {
    /* quota plein ou navigation privée : la leçon continue sans persistance */
  }
}

export function demanderPersistance(): void {
  void navigator.storage?.persist?.().catch(() => undefined);
}
