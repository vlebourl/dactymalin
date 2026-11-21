/**
 * La porte de l'espace parent.
 *
 * L'espace parent est à deux clics de l'accueil de l'enfant : l'engrenage, puis
 * « Ouvrir ». On y trouve la suppression du compte, celle d'un enfant, et
 * depuis #63 les mesures — vitesse et précision — que §1 et §4.7 interdisent
 * formellement de montrer à l'enfant. Rien n'en gardait l'entrée.
 *
 * Ce n'est pas un coffre-fort, et ça ne prétend pas l'être : c'est un
 * ralentisseur. Il vise l'enfant de 8-11 ans qui appuie sur les boutons pour
 * voir, pas un adolescent déterminé — celui-là ouvrirait la console du
 * navigateur, et aucune question posée dans la page n'y changerait rien. Le
 * seuil est donc réglé sur « un calcul qu'un adulte fait de tête en deux
 * secondes, et qui sort de la table de multiplication qu'apprend un CE2 ».
 *
 * Un nombre de 11 à 19 fois 3, 4 ou 5 le tient : 17 × 4 se fait de tête, sans
 * papier. Les bornes d'avant (jusqu'à 39 × 9, soit 37 × 8) ne se faisaient pas
 * de tête : le parent sortait sa calculatrice pour ouvrir son propre espace.
 */

export type QuestionAdulte = { a: number; b: number; reponse: number };

/** Bornes du premier facteur : au-delà de la table de multiplication apprise. */
export const A_MIN = 11;
export const A_MAX = 19;
/** Bornes du second : jamais 0, 1 ou 2, trop faciles ; jamais plus de 5, pour
    que le produit (moins de 100) reste un calcul de tête pour l'adulte. */
export const B_MIN = 3;
export const B_MAX = 5;

const entre = (min: number, max: number, alea: () => number) =>
  min + Math.floor(alea() * (max - min + 1));

/**
 * Une question neuve. Tirée à chaque ouverture ET à chaque échec : une question
 * figée finirait par s'apprendre par cœur, ce qui est exactement le contraire
 * du but.
 */
export function questionAdulte(
  alea: () => number = Math.random,
  /** Le produit à ne pas reposer — celui de la question qu'on vient de rater. */
  sauf?: number,
): QuestionAdulte {
  /* Reposer exactement la même question après un échec invite à réessayer au
     hasard sur la même cible, et donne à l'enfant l'impression que la porte
     bégaie. Il n'y a que 27 couples possibles : un tirage nu retombait sur le
     même produit assez souvent pour rendre le test instable, ce qui était le
     symptôme du vrai défaut.

     La boucle est bornée : `sauf` n'écarte qu'une poignée de couples, et sortir
     après vingt essais vaut mieux que tourner si un jour les bornes changent
     au point de ne plus laisser d'alternative. */
  for (let essai = 0; essai < 20; essai++) {
    const a = entre(A_MIN, A_MAX, alea);
    const b = entre(B_MIN, B_MAX, alea);
    if (a * b !== sauf) return { a, b, reponse: a * b };
  }
  const a = entre(A_MIN, A_MAX, alea);
  const b = entre(B_MIN, B_MAX, alea);
  return { a, b, reponse: a * b };
}

/**
 * La réponse saisie ouvre-t-elle la porte ?
 *
 * Tolérante sur la forme — espaces, champ vide — et stricte sur le fond : rien
 * d'autre que le produit exact ne passe.
 */
export function reponseJuste(q: QuestionAdulte, saisie: string): boolean {
  const propre = saisie.replace(/\s/g, '');
  return propre !== '' && Number(propre) === q.reponse;
}
