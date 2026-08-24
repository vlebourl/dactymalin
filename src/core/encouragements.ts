/**
 * Rotation d'au moins 15 formulations distinctes (cahier 4.2).
 * Le ton célèbre le GESTE, jamais la performance : aucun vocabulaire de
 * vitesse, de score ou de record.
 */
export const ENCOURAGEMENTS: string[] = [
  'Tes doigts ont trouvé leur place',
  'Voilà du beau travail',
  'Tu avances bien',
  'Tes mains commencent à savoir',
  'Bloc terminé, bravo',
  'Tu t\'y mets vraiment',
  'Chaque main est restée de son côté',
  'Tu tapes de plus en plus tranquillement',
  'Tes index connaissent le chemin',
  'C\'est tout bon',
  'Tu as tenu jusqu\'au bout',
  'Tes pouces ont bien travaillé',
  'Encore un bloc, tranquillement',
  'Tu écris pour de vrai maintenant',
  'Tes doigts se souviennent',
  'Joli, continue comme ça',
  'Tu prends le coup de main',
  'Rien ne t\'a arrêté',
];

/** Tire un encouragement sans jamais répéter le précédent. */
export function encouragementSuivant(precedent: string | undefined, tirage = Math.random()): string {
  const choix = ENCOURAGEMENTS.filter((e) => e !== precedent);
  return choix[Math.floor(tirage * choix.length) % choix.length];
}

/** Ligne du 4ᵉ bloc consécutif : on propose, on ne félicite pas d'arrêter. */
export const PROPOSITION_PAUSE = 'Tu as bien travaillé. On peut s\'arrêter là.';
