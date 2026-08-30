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
 * seuil est donc réglé sur « un calcul qu'on ne fait pas de tête à neuf ans, et
 * qu'un adulte fait volontiers de tête ou avec sa calculatrice ».
 *
 * Un produit à deux chiffres × un chiffre le tient : 27 × 7 est hors de portée
 * mentale d'un CE2, et ne coûte rien à un parent.
 */

export type QuestionAdulte = { a: number; b: number; reponse: number };

/** Bornes du premier facteur : au-delà de la table de multiplication apprise. */
export const A_MIN = 12;
export const A_MAX = 39;
/** Bornes du second : jamais 0, 1 ou 2, qui rendraient le calcul trivial. */
export const B_MIN = 3;
export const B_MAX = 9;

const entre = (min: number, max: number, alea: () => number) =>
  min + Math.floor(alea() * (max - min + 1));

/**
 * Une question neuve. Tirée à chaque ouverture ET à chaque échec : une question
 * figée finirait par s'apprendre par cœur, ce qui est exactement le contraire
 * du but.
 */
export function questionAdulte(alea: () => number = Math.random): QuestionAdulte {
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
