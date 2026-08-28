import { CLE } from './storage';

/**
 * Multi-profils LOCAUX (demande du 2026-08-28) : plusieurs enfants sur le même
 * appareil, chacun sa progression, toujours zéro backend. Le premier profil
 * (`p1`) garde la clé localStorage historique `tapeavecmoi.v1` : une
 * progression d'avant les profils devient « Joueur 1 » sans migration de
 * données. Seuls les profils suivants reçoivent une clé suffixée.
 */
export const CLE_PROFILS = 'tapeavecmoi.profils';
/** Drapeau de session : forcer l'écran « Qui joue ? » au prochain chargement. */
export const CLE_CHOISIR = 'tapeavecmoi.choisir';

export type Profil = { id: string; nom: string };
export type IndexProfils = { version: 1; actif: string | null; liste: Profil[] };

export const cleDe = (id: string): string => (id === 'p1' ? CLE : `${CLE}.${id}`);

function lire(): IndexProfils | null {
  try {
    const brut = JSON.parse(localStorage.getItem(CLE_PROFILS) ?? 'null') as unknown;
    if (!brut || typeof brut !== 'object') return null;
    const o = brut as Record<string, unknown>;
    if (o.version !== 1 || !Array.isArray(o.liste)) return null;
    const liste = o.liste.filter(
      (p): p is Profil =>
        !!p && typeof p === 'object' &&
        typeof (p as Profil).id === 'string' && (p as Profil).id.length > 0 &&
        typeof (p as Profil).nom === 'string',
    );
    if (liste.length === 0) return null;
    const actif = typeof o.actif === 'string' && liste.some((p) => p.id === o.actif) ? o.actif : null;
    return { version: 1, actif, liste };
  } catch {
    return null;
  }
}

export function sauverIndex(ix: IndexProfils): void {
  try {
    localStorage.setItem(CLE_PROFILS, JSON.stringify(ix));
  } catch {
    /* navigation privée : la session continue sans persistance */
  }
}

/**
 * Index des profils, créé au premier passage : la sauvegarde historique
 * (ou son absence — tout premier lancement) devient le profil « Joueur 1 ».
 */
export function chargerIndex(): IndexProfils {
  const existant = lire();
  if (existant) return existant;
  const ix: IndexProfils = { version: 1, actif: 'p1', liste: [{ id: 'p1', nom: 'Joueur 1' }] };
  sauverIndex(ix);
  return ix;
}

export function creerProfil(ix: IndexProfils, nom: string): [IndexProfils, string] {
  const id = `p${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
  const suivant: IndexProfils = {
    ...ix,
    actif: id,
    liste: [...ix.liste, { id, nom: nom.trim() || `Joueur ${ix.liste.length + 1}` }],
  };
  sauverIndex(suivant);
  return [suivant, id];
}

/**
 * Profil à ouvrir au chargement, ou `null` si l'écran « Qui joue ? » doit
 * décider : plusieurs joueurs, ou changement demandé depuis les réglages.
 * SANS effet de bord (appelée depuis un initialisateur React, StrictMode la
 * rejoue) : c'est l'écran « Qui joue ? » qui efface le drapeau, à son montage.
 */
export function profilInitial(): string | null {
  const ix = chargerIndex();
  let choisir = false;
  try {
    choisir = sessionStorage.getItem(CLE_CHOISIR) === '1';
  } catch {
    /* pas de sessionStorage : on n'affiche le choix que s'il y a à choisir */
  }
  if (choisir || ix.liste.length > 1) return null;
  return ix.liste[0].id;
}

/** À appeler quand l'écran de choix est affiché : le drapeau a servi. */
export function effacerDemandeDeChoix(): void {
  try {
    sessionStorage.removeItem(CLE_CHOISIR);
  } catch {
    /* rien à effacer */
  }
}

export function activerProfil(id: string): void {
  const ix = chargerIndex();
  if (ix.liste.some((p) => p.id === id)) sauverIndex({ ...ix, actif: id });
}
