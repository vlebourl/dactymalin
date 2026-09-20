import { describe, expect, it } from 'vitest';
import { nomDeLettre } from './nomDeLettre';
import { ensembleTouches, ETAPE_MAX } from './parcours';

/* #126 — ce que la voix DIT quand la leçon donne une lettre. Le moteur de
   Piper lit « à » comme « a » et reste muet sur toute la ponctuation : le nom
   s'écrit donc en toutes lettres, et sert aussi au repli navigateur. */
describe('nom de lettre', () => {
  it('dit une lettre et un chiffre tels quels : le moteur sait les nommer', () => {
    expect(nomDeLettre('y')).toBe('y');
    expect(nomDeLettre('7')).toBe('7');
  });

  it('nomme une capitale comme sa minuscule : la Maj est montrée, pas dite', () => {
    expect(nomDeLettre('A')).toBe('a');
    expect(nomDeLettre('É')).toBe('e accent aigu');
  });

  it('épelle les lettres accentuées, pour que « à » ne sonne pas comme « a »', () => {
    expect(nomDeLettre('à')).toBe('a accent grave');
    expect(nomDeLettre('ç')).toBe('c cédille');
    expect(nomDeLettre('ê')).toBe('e accent circonflexe');
    expect(nomDeLettre('ï')).toBe('i tréma');
  });

  it('nomme la ponctuation, que le moteur laisserait muette', () => {
    expect(nomDeLettre('.')).toBe('point');
    expect(nomDeLettre('?')).toBe("point d'interrogation");
    expect(nomDeLettre("'")).toBe('apostrophe');
    expect(nomDeLettre('-')).toBe("trait d'union");
    expect(nomDeLettre(' ')).toBe('espace');
  });

  it('ne nomme pas ce qu’il ne connaît pas, ni plus d’un caractère', () => {
    expect(nomDeLettre('€')).toBeNull();
    expect(nomDeLettre('ab')).toBeNull();
    expect(nomDeLettre('')).toBeNull();
  });

  it('nomme TOUT ce que le parcours enseigne, dans les deux dispositions', () => {
    const sansNom: string[] = [];
    for (const p of ['decouverte', 'dactylo'] as const)
      for (const d of ['fr-FR', 'fr-CH'] as const)
        for (const c of ensembleTouches(p, d, ETAPE_MAX)) if (nomDeLettre(c) === null) sansNom.push(c);
    expect(sansNom).toEqual([]);
  });
});
