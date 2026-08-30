// L'attribut d'import est OBLIGATOIRE : le serveur charge ce module sous Node
// pur, où un import JSON sans attribut est une erreur d'exécution. Vite et
// Vitest s'en accommodaient, la suite Playwright non — elle démarre un vrai
// serveur, et la suite entière avortait avant le premier test.
import lexique from '../data/lexique-v3.json' with { type: 'json' };

/**
 * Ce que l'enfant peut taper, filtré par les touches ouvertes.
 *
 * Trois familles, et le filtre est un ENSEMBLE DE CARACTÈRES, pas un numéro
 * d'étape : c'est ce qui permet aux deux parcours de partager le même contenu
 * alors qu'ils n'ouvrent pas les mêmes touches au même moment.
 *
 * Le lexique vient de `scripts/analyse/generer-lecons.py` : échelle
 * Dubois-Buyse jusqu'au CM2, croisée avec Lexique 3.83 pour la fréquence,
 * formes fléchies comprises. Il remplace les 321 mots écrits à la main de
 * `corpus.ts`, dont 70 % seulement relevaient du lexique de l'âge.
 */

type Entree = { t: string; p: number };

/** Trié une fois par poids décroissant : le générateur sert le plus fréquent
    en premier sans avoir à retrier à chaque bloc. */
const parPoids = (l: Entree[]) => [...l].sort((a, b) => b.p - a.p);

const MOTS = parPoids(lexique.mots as Entree[]);
const GROUPES = parPoids(lexique.groupes as Entree[]);
const PHRASES = parPoids(lexique.phrases as Entree[]);

/**
 * Un texte est typable si chacun de ses caractères l'est.
 *
 * Une majuscule exige sa minuscule ouverte — et, en pratique, le modificateur :
 * l'étape qui ouvre Majuscule ouvre le point en même temps, si bien que la
 * présence du point dans l'ensemble suffit à décider si une phrase est jouable.
 */
export function estTypable(texte: string, ensemble: Set<string>): boolean {
  for (const c of texte) {
    if (c === ' ') continue;
    if (ensemble.has(c)) continue;
    if (ensemble.has(c.toLowerCase())) continue;
    return false;
  }
  return true;
}

const filtre = (source: Entree[], ensemble: Set<string>) =>
  source.filter((e) => estTypable(e.t, ensemble)).map((e) => e.t);

export function motsTypables(ensemble: Set<string>): string[] {
  return filtre(MOTS, ensemble);
}

export function groupesTypables(ensemble: Set<string>): string[] {
  return filtre(GROUPES, ensemble);
}

/** Une phrase n'est jamais proposée sans sa majuscule et son point : sans eux
    elle serait orthographiquement fausse, ce que P3 interdit. */
export function phrasesTypables(ensemble: Set<string>): string[] {
  if (!ensemble.has('.')) return [];
  return filtre(PHRASES, ensemble);
}

/** Mots et groupes que la dernière étape vient de débloquer — c'est le gain
    lexical annoncé en fin de leçon, le remplaçant du score interdit. */
export function nouveaute(avant: Set<string>, apres: Set<string>): string[] {
  const connus = new Set([...motsTypables(avant), ...groupesTypables(avant)]);
  return [...motsTypables(apres), ...groupesTypables(apres)].filter((t) => !connus.has(t));
}
