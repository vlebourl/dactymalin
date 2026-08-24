import type { IdDisposition } from './layouts';

/**
 * Détection de disposition (cahier 4.6).
 * 1. carte du clavier du navigateur → verdict silencieux ;
 * 2. sinon, test déguisé « Appuie sur la touche A » : une frappe suffit ;
 * 3. un choix manuel a priorité absolue et est mémorisé (voir storage).
 */

export type Verdict = { id: IdDisposition; sur: boolean } | null;

/** Verdict à partir d'un couple (code, key) réellement observé. */
export function verdictFrappe(code: string, key: string): Verdict {
  const k = key.toLowerCase();
  if (code === 'KeyQ' && k === 'a') return { id: 'fr-FR', sur: true };
  if (code === 'KeyQ' && k === 'q') return { id: 'fr-CH', sur: false }; // QWERTY ou QWERTZ
  if (code === 'KeyY' && k === 'z') return { id: 'fr-CH', sur: false };
  if (code === 'KeyZ' && k === 'w') return { id: 'fr-FR', sur: true };
  // discriminants CH-FR vs CH-DE
  if (code === 'Semicolon' && k === 'é') return { id: 'fr-CH', sur: true };
  if (code === 'BracketLeft' && k === 'è') return { id: 'fr-CH', sur: true };
  if (code === 'Quote' && k === 'à') return { id: 'fr-CH', sur: true };
  if (code === 'Semicolon' && k === 'm') return { id: 'fr-FR', sur: true };
  if (code === 'Digit9' && k === 'ç') return { id: 'fr-FR', sur: true };
  return null;
}

/** Verdict à partir de la carte clavier du navigateur, si elle existe. */
export async function verdictCarteClavier(): Promise<Verdict> {
  type AvecClavier = Navigator & { keyboard?: { getLayoutMap?: () => Promise<Map<string, string>> } };
  const clavier = (navigator as AvecClavier).keyboard;
  if (!clavier?.getLayoutMap) return null;
  try {
    const carte = await clavier.getLayoutMap();
    for (const code of ['KeyQ', 'Semicolon', 'BracketLeft', 'Quote', 'KeyY']) {
      const v = verdictFrappe(code, carte.get(code) ?? '');
      if (v?.sur) return v;
    }
    return null;
  } catch {
    return null;
  }
}

/** Une frappe est-elle cohérente avec la disposition `id` ? */
export function frappeCoherente(id: IdDisposition, code: string, key: string): boolean | null {
  const v = verdictFrappe(code, key);
  if (!v) return null;
  return v.id === id;
}

/**
 * Verr.Maj actif ? `getModifierState` fait foi quand le navigateur le fournit.
 * Repli observable : une lettre MAJUSCULE arrivée SANS Maj maintenue ne peut
 * venir que du verrouillage — c'est le cas qui casse tout silencieusement sous
 * pilote FR historique.
 */
export function verrMajActif(
  key: string,
  avecMaj: boolean,
  etatModificateur: boolean | null,
): boolean {
  if (etatModificateur) return true;
  return !avecMaj && key.length === 1 && key !== key.toLowerCase() && key === key.toUpperCase();
}

export const FRAPPES_INCOHERENTES_AVANT_BASCULE = 5;
export const ITEMS_SATURES_AVANT_BASCULE = 3;

/**
 * Surveillance continue en jeu : 5 frappes consécutives cohérentes avec
 * l'AUTRE disposition, ou 3 items enchaînés saturés au barreau 3, font
 * afficher V2. C'est la seule sortie automatique d'un item.
 */
export function doitProposerV2(frappesIncoherentes: number, itemsSatures: number): boolean {
  return (
    frappesIncoherentes >= FRAPPES_INCOHERENTES_AVANT_BASCULE ||
    itemsSatures >= ITEMS_SATURES_AVANT_BASCULE
  );
}
