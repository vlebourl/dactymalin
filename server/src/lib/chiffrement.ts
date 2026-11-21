import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto';

/**
 * La clé Anthropic d'un compte, chiffrée au repos (AES-256-GCM). La clé de
 * chiffrement dérive du secret de session du serveur : une copie de la base
 * seule ne rend aucune clé lisible.
 */
const deriver = (secret: string) =>
  Buffer.from(hkdfSync('sha256', secret, 'dactymalin', 'cle-anthropic', 32));

/** `base64(iv ‖ tag ‖ données)`, IV aléatoire de 12 octets. */
export function chiffrer(texte: string, secret: string): string {
  const iv = randomBytes(12);
  const chiffreur = createCipheriv('aes-256-gcm', deriver(secret), iv);
  const donnees = Buffer.concat([chiffreur.update(texte, 'utf8'), chiffreur.final()]);
  return Buffer.concat([iv, chiffreur.getAuthTag(), donnees]).toString('base64');
}

/** Le texte, ou `null` sur toute erreur (tag invalide, autre secret, base64 corrompu). Ne lève jamais. */
export function dechiffrer(chiffre: string, secret: string): string | null {
  try {
    const octets = Buffer.from(chiffre, 'base64');
    if (octets.length < 12 + 16) return null;
    const dechiffreur = createDecipheriv('aes-256-gcm', deriver(secret), octets.subarray(0, 12));
    dechiffreur.setAuthTag(octets.subarray(12, 28));
    return Buffer.concat([dechiffreur.update(octets.subarray(28)), dechiffreur.final()]).toString('utf8');
  } catch {
    return null;
  }
}
