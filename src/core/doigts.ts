/**
 * Les quatre états de guide-doigt, et quatre seulement (addendum).
 *
 * Vivaient dans `ui/FingerBar` avec la bande de photographies. Celle-ci a été
 * retirée — les deux mains encadrent désormais le clavier et disent la même
 * chose — mais la CONSIGNE reste : c'est elle que lit un lecteur d'écran après
 * le mot à taper, et elle n'a jamais dépendu des images.
 */
export type Doigt = 'index_gauche' | 'pouce_gauche' | 'pouce_droit' | 'index_droit';

export const CONSIGNES: Record<Doigt, [string, string]> = {
  index_gauche: ['Main gauche', 'ton index'],
  pouce_gauche: ['Main gauche', 'ton pouce'],
  pouce_droit: ['Main droite', 'ton pouce'],
  index_droit: ['Main droite', 'ton index'],
};
