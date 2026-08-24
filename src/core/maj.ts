import { toucheDirecte, toucheMaj, type IdDisposition, type Main } from './layouts';

/**
 * Piège Maj (palier 7) : l'enfant appuie sur la BONNE touche mais sans tenir
 * Majuscule — l'app reçoit `è` au lieu de `7`. Ce n'est pas une erreur : c'est
 * une quasi-réussite. La cible reste en surbrillance et la touche Maj s'allume.
 */
export type VerdictMaj = 'juste' | 'quasi' | 'faux';

export function verdictMaj(id: IdDisposition, attendu: string, recu: string): VerdictMaj {
  if (recu === attendu) return 'juste';
  const cible = toucheMaj(id, attendu);
  if (!cible) return 'faux'; // le caractère attendu ne demande pas Maj
  return cible.base === recu ? 'quasi' : 'faux';
}

/**
 * Règle contralatérale : la Maj se tient de la main OPPOSÉE au caractère visé
 * (Maj droite pour un caractère de gauche).
 */
export function mainDeLaMaj(id: IdDisposition, attendu: string): Main {
  const t = toucheMaj(id, attendu) ?? toucheDirecte(id, attendu);
  return t?.main === 'gauche' ? 'droite' : 'gauche';
}
