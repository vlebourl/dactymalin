import { estEcrivable } from './generator';
import type { IdDisposition } from './layouts';
import { motsPersoValides } from './storage';

/**
 * Une liste de mots préparée par le parent — « Dictée de la semaine », « Les
 * prénoms de la famille ». Elle appartient au COMPTE, pas à un enfant : la
 * dictée du CE1 sert au grand, les prénoms servent aux deux, et attacher la
 * liste à un profil obligerait le parent à tout ressaisir (#9).
 */
export type Liste = {
  id: string;
  nom: string;
  mots: string[];
  creeLe: string;
};

/**
 * Plafond de listes par compte. Il vit ici, avec le reste du validateur, pour
 * que l'écran et le serveur refusent au MÊME nombre : sinon l'écran promet une
 * trente-et-unième liste que le serveur rejette.
 */
export const LISTES_MAX = 30;

/** Assez pour « Les prénoms de la famille », trop court pour une phrase. */
export const NOM_LISTE_MAX = 40;

/**
 * Une liste acceptable, ou `null`. Les bornes de mots ne sont pas réécrites :
 * `motsPersoValides` les tient déjà (1 à 30 caractères, 100 mots, dédoublonné).
 *
 * Une liste sans aucun mot valide est refusée : elle donnerait une carte qui
 * lance un bloc vide, un cul-de-sac que l'enfant ne saurait pas expliquer.
 */
export function listeValidee(nom: unknown, mots: unknown): { nom: string; mots: string[] } | null {
  if (typeof nom !== 'string') return null;
  const propre = nom.trim();
  if (propre.length < 1 || propre.length > NOM_LISTE_MAX) return null;
  const valides = motsPersoValides(mots);
  if (valides.length === 0) return null;
  return { nom: propre, mots: valides };
}

/**
 * Les mots que la disposition ne sait pas écrire directement — « la fête »
 * demande une touche morte, deux frappes pour un seul caractère attendu.
 * `composerBlocPerso` les écarte déjà au moment de jouer ; cette fonction
 * existe pour que le parent l'apprenne à la saisie plutôt que de chercher
 * pourquoi son mot n'apparaît jamais.
 */
export function motsIntapables(mots: string[], id: IdDisposition): string[] {
  return mots.filter((m) => !estEcrivable(m, id));
}

/**
 * Ce que le parent vient de taper, relu : les mots retenus, et ceux que la
 * disposition ne sait pas écrire d'une seule frappe. Créer et modifier une
 * liste lisent la saisie de la MÊME façon — sinon le même texte donnerait deux
 * listes différentes selon le formulaire qui l'a reçu.
 */
export function motsDeLaSaisie(
  texte: string,
  id: IdDisposition,
): { retenus: string[]; refuses: string[] } {
  const proposes = motsPersoValides(texte.split(/[\n,;]+/));
  const refuses = motsIntapables(proposes, id);
  return { retenus: proposes.filter((m) => !refuses.includes(m)), refuses };
}

/**
 * Cette liste donne-t-elle un bloc sur CETTE disposition ? Une liste
 * appartient au compte, une disposition appartient à l'appareil : les mots de
 * la dictée écrite sur l'AZERTY du salon peuvent n'être plus tapables sur le
 * clavier suisse de la tablette. Sa carte lancerait alors un bloc vide, et
 * l'enfant n'aurait rien à taper ni rien à comprendre.
 */
export const estJouable = (liste: Liste, id: IdDisposition): boolean =>
  liste.mots.some((m) => estEcrivable(m, id));
