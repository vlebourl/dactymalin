/* Le serveur a-t-il de quoi fabriquer des phrases (clé d'API présente) ?
   Toute erreur compte pour « non » : le mode grammaire est un bonus, jamais
   une condition pour jouer. Rien n'est gardé en cache. */
export async function grammaireDisponible(): Promise<boolean> {
  try {
    const r = await fetch('/api/grammaire/etat', { signal: AbortSignal.timeout(5_000) });
    if (!r.ok) return false;
    return ((await r.json()) as { disponible?: boolean }).disponible === true;
  } catch {
    return false;
  }
}

export type Categorie = 'passe' | 'present' | 'futur';
export type PhraseGrammaire = { phrase: string; categorie: Categorie };

export const PHRASES_PAR_SERIE = 10;

async function demander(): Promise<PhraseGrammaire | null> {
  try {
    const r = await fetch('/api/grammaire/phrase', { signal: AbortSignal.timeout(20_000) });
    if (!r.ok) return null;
    const p = (await r.json()) as Partial<PhraseGrammaire>;
    if (typeof p.phrase !== 'string' || !['passe', 'present', 'futur'].includes(p.categorie ?? '')) {
      return null;
    }
    return p as PhraseGrammaire;
  } catch {
    return null;
  }
}

/* Une phrase déjà vue dans la série est redemandée une fois ; si le serveur
   persiste, on la garde plutôt que de bloquer l'enfant. */
export async function phraseSuivante(dejaVues: Set<string>): Promise<PhraseGrammaire | null> {
  let p = await demander();
  if (p && dejaVues.has(p.phrase)) p = await demander();
  if (p) dejaVues.add(p.phrase);
  return p;
}

export type Serie = {
  faites: number;
  justes: number;
  courante: PhraseGrammaire | null;
  reponse: Categorie | null;
};

/* Une réponse déjà donnée verrouille la phrase : le double-clic ne compte pas deux fois. */
export function repondre(serie: Serie, choix: Categorie): Serie {
  if (serie.reponse !== null || !serie.courante) return serie;
  return {
    ...serie,
    reponse: choix,
    faites: serie.faites + 1,
    justes: serie.justes + (choix === serie.courante.categorie ? 1 : 0),
  };
}

export function serieFinie(serie: Serie): boolean {
  return serie.faites >= PHRASES_PAR_SERIE;
}
