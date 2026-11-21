/* Le serveur a-t-il de quoi fabriquer des phrases (clé d'API présente) ?
   Toute erreur compte pour « non » : le mode grammaire est un bonus, jamais
   une condition pour jouer. Rien n'est gardé en cache. */
export async function grammaireDisponible(): Promise<boolean> {
  try {
    const r = await fetch('/api/grammaire/etat');
    if (!r.ok) return false;
    return ((await r.json()) as { disponible?: boolean }).disponible === true;
  } catch {
    return false;
  }
}
