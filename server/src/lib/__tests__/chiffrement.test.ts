import { describe, expect, it } from 'vitest';
import { chiffrer, dechiffrer } from '../chiffrement';

const SECRET = 's'.repeat(40);
const CLE = 'sk-ant-exemple-factice-0000000000ab12';

describe('chiffrement de la clé Anthropic', () => {
  it('un aller-retour redonne le texte', () => {
    expect(dechiffrer(chiffrer(CLE, SECRET), SECRET)).toBe(CLE);
  });

  it('deux chiffrements du même texte diffèrent (IV aléatoire), sans laisser voir la clé', () => {
    const a = chiffrer(CLE, SECRET);
    expect(a).not.toBe(chiffrer(CLE, SECRET));
    expect(a).not.toContain(CLE);
  });

  it('un octet modifié donne null', () => {
    const octets = Buffer.from(chiffrer(CLE, SECRET), 'base64');
    octets[octets.length - 1] ^= 1;
    expect(dechiffrer(octets.toString('base64'), SECRET)).toBeNull();
  });

  it('un autre secret donne null', () => {
    expect(dechiffrer(chiffrer(CLE, SECRET), 't'.repeat(40))).toBeNull();
  });

  it('une chaîne invalide donne null', () => {
    expect(dechiffrer('', SECRET)).toBeNull();
    expect(dechiffrer('pas du base64 !!', SECRET)).toBeNull();
    expect(dechiffrer('AAAA', SECRET)).toBeNull();
  });
});
