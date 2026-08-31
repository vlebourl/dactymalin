import { describe, expect, it } from 'vitest';
import { mainDeLaMaj, verdictMaj } from './maj';

describe('piège Maj (palier 7)', () => {
  it('la bonne touche sans le modificateur est une QUASI-réussite, pas une erreur', () => {
    // FR-FR : le 7 se tape Maj+è ; recevoir « è » signifie « Maj oubliée ».
    expect(verdictMaj('fr-FR', '7', 'è')).toBe('quasi');
    expect(verdictMaj('fr-FR', '7', '7')).toBe('juste');
    expect(verdictMaj('fr-FR', '7', 'à')).toBe('faux');
  });

  it('CH-FR : ç se tape Maj+4', () => {
    expect(verdictMaj('fr-CH', 'ç', '4')).toBe('quasi');
    expect(verdictMaj('fr-CH', 'ç', 'ç')).toBe('juste');
  });

  /* #98 : la touche du `!` suisse a une base MORTE (`¨`). Le piège doit y jouer
     comme ailleurs — le navigateur filtre d'ailleurs `Dead` en amont, donc
     l'oubli de Maj n'y produit ni faute ni escalade d'aide dans les deux cas. */
  it('CH-FR : le ! se tape Maj+¨, et l\'oubli de Maj reste une quasi-réussite', () => {
    expect(verdictMaj('fr-CH', '!', '¨')).toBe('quasi');
    expect(verdictMaj('fr-CH', '!', '!')).toBe('juste');
    expect(verdictMaj('fr-CH', '!', 'p')).toBe('faux');
    // BracketRight est une touche de DROITE ⇒ Maj gauche (règle contralatérale).
    expect(mainDeLaMaj('fr-CH', '!')).toBe('gauche');
  });

  it("un caractère direct n'a pas de quasi-réussite", () => {
    expect(verdictMaj('fr-FR', 'e', 'r')).toBe('faux');
    expect(verdictMaj('fr-FR', 'e', 'e')).toBe('juste');
  });

  it('la Maj se tient de la main opposée au caractère visé (contralatérale)', () => {
    // Digit1 (« 1 » sous Maj) est à gauche ⇒ Maj droite.
    expect(mainDeLaMaj('fr-FR', '1')).toBe('droite');
    // Digit7 (« 7 » sous Maj) est à droite ⇒ Maj gauche.
    expect(mainDeLaMaj('fr-FR', '7')).toBe('gauche');
    // CH-FR : Digit4 est à gauche ⇒ Maj droite.
    expect(mainDeLaMaj('fr-CH', 'ç')).toBe('droite');
    // Régression itération 002 : « 8 » est une touche de la main DROITE, donc
    // la Maj est la GAUCHE — l'app annonçait l'inverse faute de câblage.
    expect(mainDeLaMaj('fr-FR', '8')).toBe('gauche');
  });
});
