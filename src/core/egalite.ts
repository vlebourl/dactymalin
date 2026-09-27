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
  const cles = Object.keys(gauche);
  return cles.length === Object.keys(droite).length &&
    cles.every((cle) => Object.prototype.hasOwnProperty.call(droite, cle) && memeContenu(gauche[cle], droite[cle]));
}
