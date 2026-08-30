/**
 * Échelle d'aide 1→3 et fenêtre de rappel P6, en fonctions PURES
 * `(état, temps écoulé) → état`. Aucune minuterie ici : la vue leçon
 * appelle ces fonctions depuis un unique requestAnimationFrame.
 */

export type Barreau = 0 | 1 | 2 | 3;

/** Paliers de latence de la fenêtre de rappel, en millisecondes (P6). */
export const LATENCES = [0, 800, 1500, 2500] as const;

/** Délai d'inactivité qui fait monter au barreau 2 (cahier 4.5). */
export const DELAI_INACTIVITE = 3000;

export type EtatAide = {
  /** caractère courant à taper */
  caractere: string;
  /** nombre d'erreurs commises sur CE caractère */
  erreurs: number;
  /** latence de rappel applicable à ce caractère, en ms */
  latence: number;
  /** barreau déjà atteint — le barreau 3 est terminal, il ne redescend jamais */
  atteint: Barreau;
};

export function etatInitial(caractere: string, latence: number): EtatAide {
  return { caractere, erreurs: 0, latence, atteint: 0 };
}

/**
 * Barreau à afficher.
 * 1 : à l'expiration de la fenêtre de rappel (immédiat si latence = 0).
 * 2 : 1ʳᵉ erreur, ou ~3 s sans frappe.
 * 3 : 2ᵉ erreur sur le même caractère — terminal et permanent pour l'item.
 */
export function barreau(etat: EtatAide, ecoule: number): Barreau {
  if (etat.atteint === 3 || etat.erreurs >= 2) return 3;
  let b: Barreau = 0;
  if (ecoule >= etat.latence) b = 1;
  if (etat.erreurs >= 1 || ecoule >= DELAI_INACTIVITE) b = 2;
  return Math.max(b, etat.atteint) as Barreau;
}

/** Enregistre une frappe fausse. Le barreau ne redescend jamais. */
export function surErreur(etat: EtatAide, ecoule: number): EtatAide {
  const suivant = { ...etat, erreurs: etat.erreurs + 1 };
  return { ...suivant, atteint: barreau(suivant, ecoule) };
}

/** Passage au caractère suivant : l'état d'aide repart de zéro. */
export function surCaractereSuivant(caractere: string, latence: number): EtatAide {
  return etatInitial(caractere, latence);
}

/**
 * Latence de rappel du caractère suivant.
 * Monte d'un cran après une réussite autonome, retombe INSTANTANÉMENT à 0
 * sur erreur ou sur dépassement de la fenêtre (P6).
 * En mode débutant, plafonnée à 0 s : l'aide est toujours immédiate.
 */
export function prochaineLatence(
  latence: number,
  reussieSansAide: boolean,
  debutant: boolean,
): number {
  if (debutant) return 0;
  if (!reussieSansAide) return LATENCES[0];
  const i = LATENCES.indexOf(latence as (typeof LATENCES)[number]);
  return LATENCES[Math.min((i < 0 ? 0 : i) + 1, LATENCES.length - 1)];
}

/**
 * Un item est « propre » (il compte pour la maîtrise) s'il a été frappé JUSTE.
 *
 * L'escalade de l'aide n'entre plus dans le calcul, et c'est la correction du
 * défaut le plus grave du produit livré : le barreau 2 monte après trois
 * secondes d'hésitation, or un débutant de huit ans dépasse ce délai en
 * permanence. Exiger `atteint <= 1` faisait donc qu'AUCUNE de ses frappes ne
 * comptait jamais — il franchissait tous ses paliers par le plafond de secours,
 * et le critère de maîtrise ne mesurait rien.
 *
 * P7 le disait déjà : aucune pénalité pour une frappe lente, nulle part.
 */
export function estPropre(etat: EtatAide): boolean {
  return etat.erreurs === 0;
}
