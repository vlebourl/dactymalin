import type { Main } from './layouts';
import type { Doigt } from './parcours';

/**
 * Ce qu'on MONTRE d'une main : son dessin, et la consigne qui l'accompagne.
 *
 * Le doigt lui-même est décidé ailleurs — `parcours.doigtDe` — parce qu'il
 * dépend du parcours suivi. Ici on ne fait que le rendre visible.
 *
 * Douze états, un fichier chacun (P4) : cinq doigts plus la main au repos, ×
 * gauche et droite. Découverte en emploie six, Dactylo les douze. La
 * distinction est portée par un remplissage plus sombre de la MÊME teinte, donc
 * lisible en niveaux de gris, et par la position anatomique du doigt — jamais
 * par un code couleur qui demanderait une légende (§7.5).
 */
export type { Doigt };

export const DOIGTS: Doigt[] = [
  'auriculaire_gauche',
  'annulaire_gauche',
  'majeur_gauche',
  'index_gauche',
  'pouce_gauche',
  'pouce_droit',
  'index_droit',
  'majeur_droit',
  'annulaire_droit',
  'auriculaire_droit',
];

/**
 * La consigne reste de NIVEAU MAIN : c'est le dessin qui porte le doigt, jamais
 * un texte. Elle est ce que lit un lecteur d'écran après le mot à taper — elle
 * n'a jamais dépendu des images, et n'en dépend toujours pas.
 */
export const CONSIGNES: Record<Doigt, [string, string]> = {
  auriculaire_gauche: ['Main gauche', 'ton petit doigt'],
  annulaire_gauche: ['Main gauche', 'ton annulaire'],
  majeur_gauche: ['Main gauche', 'ton majeur'],
  index_gauche: ['Main gauche', 'ton index'],
  pouce_gauche: ['Main gauche', 'ton pouce'],
  pouce_droit: ['Main droite', 'ton pouce'],
  index_droit: ['Main droite', 'ton index'],
  majeur_droit: ['Main droite', 'ton majeur'],
  annulaire_droit: ['Main droite', 'ton annulaire'],
  auriculaire_droit: ['Main droite', 'ton petit doigt'],
};

export function coteDe(doigt: Doigt): Main {
  return doigt.endsWith('_gauche') ? 'gauche' : 'droite';
}

/**
 * Le dessin à afficher pour UNE main, sachant le doigt visé — lequel appartient
 * à l'autre main la moitié du temps : elle reste alors affichée, au repos,
 * aucun doigt marqué. Les deux mains sont là à chaque tour ; c'est ce qui fait
 * de leur paire la frontière du clavier.
 *
 * Les fichiers disent `droite` là où le doigt se dit `droit`.
 */
export function imageMain(cote: Main, doigt: Doigt | undefined): string {
  const nom = doigt && coteDe(doigt) === cote ? doigt.slice(0, doigt.indexOf('_')) : 'aucun';
  return `/doigts/${nom}_${cote}.png`;
}
