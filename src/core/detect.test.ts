import { describe, expect, it } from 'vitest';
import { doitProposerV2, frappeCoherente, verdictFrappe, verrMajActif } from './detect';
import { ENCOURAGEMENTS, encouragementSuivant } from './encouragements';
import { pouceDeLEspace } from './generator';

describe('détection de disposition en une frappe', () => {
  it('KeyQ → a : famille AZERTY', () => {
    expect(verdictFrappe('KeyQ', 'a')).toEqual({ id: 'fr-FR', sur: true });
  });

  it('KeyQ → q puis KeyY → z : famille QWERTZ', () => {
    expect(verdictFrappe('KeyQ', 'q')?.id).toBe('fr-CH');
    expect(verdictFrappe('KeyY', 'z')?.id).toBe('fr-CH');
  });

  it('Semicolon → é, BracketLeft → è, Quote → à : CH-FR et non CH-DE', () => {
    expect(verdictFrappe('Semicolon', 'é')).toEqual({ id: 'fr-CH', sur: true });
    expect(verdictFrappe('BracketLeft', 'è')).toEqual({ id: 'fr-CH', sur: true });
    expect(verdictFrappe('Quote', 'à')).toEqual({ id: 'fr-CH', sur: true });
    expect(verdictFrappe('Semicolon', 'ö')).toBeNull();
    expect(verdictFrappe('Quote', 'ä')).toBeNull();
  });

  it('une frappe non discriminante ne conclut rien', () => {
    expect(verdictFrappe('KeyF', 'f')).toBeNull();
    expect(frappeCoherente('fr-FR', 'KeyF', 'f')).toBeNull();
  });

  it('détecte une frappe incohérente avec la disposition configurée', () => {
    expect(frappeCoherente('fr-FR', 'KeyQ', 'a')).toBe(true);
    expect(frappeCoherente('fr-FR', 'KeyY', 'z')).toBe(false);
  });

  it('5 frappes incohérentes ou 3 items saturés font afficher V2', () => {
    expect(doitProposerV2(4, 2)).toBe(false);
    expect(doitProposerV2(5, 0)).toBe(true);
    expect(doitProposerV2(0, 3)).toBe(true);
  });
});

describe('Verr.Maj', () => {
  it('getModifierState fait foi quand il est disponible', () => {
    expect(verrMajActif('a', false, true)).toBe(true);
    expect(verrMajActif('a', false, false)).toBe(false);
  });

  it('repli : une MAJUSCULE sans Maj maintenue trahit le verrouillage', () => {
    expect(verrMajActif('F', false, null)).toBe(true);
    expect(verrMajActif('F', true, false)).toBe(false); // Maj maintenue : normal
    expect(verrMajActif('f', false, null)).toBe(false);
    expect(verrMajActif('É', false, null)).toBe(true);
  });

  it('les touches non alphabétiques ne déclenchent rien', () => {
    expect(verrMajActif(' ', false, null)).toBe(false);
    expect(verrMajActif('Enter', false, null)).toBe(false);
    expect(verrMajActif('7', false, null)).toBe(false);
  });
});

describe('encouragements', () => {
  it('au moins 15 formulations distinctes', () => {
    expect(new Set(ENCOURAGEMENTS).size).toBeGreaterThanOrEqual(15);
  });

  it('ne répète jamais le titre précédent', () => {
    let precedent: string | undefined;
    for (let i = 0; i < 200; i++) {
      const titre = encouragementSuivant(precedent, (i * 0.137) % 1);
      expect(titre).not.toBe(precedent);
      precedent = titre;
    }
  });

  it('aucun vocabulaire de performance', () => {
    const interdits = /vitesse|rapide|record|score|point|erreur|parfait|meilleur|plus vite/i;
    for (const e of ENCOURAGEMENTS) expect(e).not.toMatch(interdits);
  });
});

describe('espace : pouce de la main opposée (P8)', () => {
  it('lettre à gauche → pouce droit, lettre à droite → pouce gauche', () => {
    expect(pouceDeLEspace('gauche')).toBe('droite');
    expect(pouceDeLEspace('droite')).toBe('gauche');
    expect(pouceDeLEspace(undefined)).toBe('gauche');
  });
});
