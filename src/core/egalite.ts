/** Compare le contenu sans dépendre de l'ordre de sérialisation des clés. */
export function memeContenu(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length &&
      a.every((valeur, i) => memeContenu(valeur, b[i]));
  }
  const gauche = a as Record<string, unknown>;
  const droite = b as Record<string, unknown>;
  // La file passe par JSON : une propriété undefined y disparaît.
  const clesDefinies = (objet: Record<string, unknown>) =>
    Object.keys(objet).filter((cle) => objet[cle] !== undefined);
  const cles = clesDefinies(gauche);
  return cles.length === clesDefinies(droite).length &&
    cles.every((cle) => Object.prototype.hasOwnProperty.call(droite, cle) && memeContenu(gauche[cle], droite[cle]));
}
