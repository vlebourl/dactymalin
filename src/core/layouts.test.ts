import { describe, expect, it } from 'vitest';
import {
  disposition,
  legendes,
  mainDe,
  toucheDirecte,
  toucheMaj,
  touches,
  TOUTES_DISPOSITIONS,
} from './layouts';

/**
 * Fixtures ÉCRITES À LA MAIN depuis les sérigraphies réelles, volontairement
 * NON dérivées des tables de production (arbitrage Codex n°4 : casser l'oracle
 * circulaire). Si la table de prod change, ces couples doivent rester vrais.
 */
const FIXTURES_FR_FR: Array<[string, string]> = [
  ['KeyQ', 'a'],
  ['KeyW', 'z'],
  ['KeyA', 'q'],
  ['KeyZ', 'w'],
  ['Semicolon', 'm'],
  ['Quote', 'ù'],
  ['Digit2', 'é'],
  ['Digit7', 'è'],
  ['Digit9', 'ç'],
  ['Digit0', 'à'],
  ['Digit6', '-'],
  ['KeyM', ','],
];

const FIXTURES_FR_CH: Array<[string, string]> = [
  ['KeyQ', 'q'],
  ['KeyY', 'z'],
  ['KeyZ', 'y'],
  ['Semicolon', 'é'],
  ['BracketLeft', 'è'],
  ['Quote', 'à'],
  ['Digit4', '4'],
  ['Digit1', '1'],
  ['Period', '.'],
  ['Slash', '-'],
  ['KeyM', 'm'],
];

describe('tables de disposition', () => {
  it.each(FIXTURES_FR_FR)('FR-FR : %s produit %s sans modificateur', (code, attendu) => {
    expect(touches('fr-FR').find((t) => t.code === code)?.base).toBe(attendu);
  });

  it.each(FIXTURES_FR_CH)('CH-FR : %s produit %s sans modificateur', (code, attendu) => {
    expect(touches('fr-CH').find((t) => t.code === code)?.base).toBe(attendu);
  });

  it('les deux tables sont distinctes, jamais partagées', () => {
    expect(disposition('fr-FR').rangees).not.toBe(disposition('fr-CH').rangees);
    const fr = touches('fr-FR');
    const ch = touches('fr-CH');
    expect(fr.some((t) => ch.includes(t))).toBe(false);
  });

  it('ç est direct en FR-FR et exige Maj+4 en CH-FR', () => {
    expect(toucheDirecte('fr-FR', 'ç')?.code).toBe('Digit9');
    expect(toucheDirecte('fr-CH', 'ç')).toBeUndefined();
    expect(toucheMaj('fr-CH', 'ç')?.code).toBe('Digit4');
  });

  it('ù est direct en FR-FR, inexistant en CH-FR (touche morte, hors MVP)', () => {
    expect(toucheDirecte('fr-FR', 'ù')?.code).toBe('Quote');
    expect(toucheDirecte('fr-CH', 'ù')).toBeUndefined();
    expect(toucheMaj('fr-CH', 'ù')).toBeUndefined();
  });

  it('les chiffres exigent Maj en FR-FR et sont directs en CH-FR', () => {
    expect(toucheDirecte('fr-FR', '1')).toBeUndefined();
    expect(toucheMaj('fr-FR', '1')?.code).toBe('Digit1');
    expect(toucheDirecte('fr-CH', '1')?.code).toBe('Digit1');
  });

  it('le point exige Maj en FR-FR et est direct en CH-FR', () => {
    expect(toucheDirecte('fr-FR', '.')).toBeUndefined();
    expect(toucheMaj('fr-FR', '.')?.code).toBe('Comma');
    expect(toucheDirecte('fr-CH', '.')?.code).toBe('Period');
  });

  it('aucune touche morte n\'est proposable', () => {
    for (const d of TOUTES_DISPOSITIONS) {
      for (const t of d.rangees.flat()) {
        if (t.morte) expect(toucheDirecte(d.id, t.base!)).toBeUndefined();
      }
    }
  });

  it('la ligne médiane physique partage les touches en deux MAINS (P1)', () => {
    const cote = (id: 'fr-FR' | 'fr-CH', code: string) =>
      touches(id).find((t) => t.code === code)?.main;
    for (const id of ['fr-FR', 'fr-CH'] as const) {
      expect(cote(id, 'KeyT')).toBe('gauche');
      expect(cote(id, 'KeyG')).toBe('gauche');
      expect(cote(id, 'KeyB')).toBe('gauche');
      expect(cote(id, 'KeyY')).toBe('droite');
      expect(cote(id, 'KeyH')).toBe('droite');
      expect(cote(id, 'KeyN')).toBe('droite');
    }
    expect(mainDe('fr-FR', 'a')).toBe('gauche');
    expect(mainDe('fr-FR', 'j')).toBe('droite');
  });

  it('les repères tactiles sont sur F et J dans les deux dispositions', () => {
    for (const id of ['fr-FR', 'fr-CH'] as const) {
      const reperes = touches(id).filter((t) => t.repere).map((t) => t.base);
      expect(reperes.sort()).toEqual(['f', 'j']);
    }
  });

  it('la rangée des chiffres AZERTY porte ses deux légendes réelles', () => {
    const attendu = [
      ['1', '&'], ['2', 'é'], ['3', '"'], ['4', "'"], ['5', '('],
      ['6', '-'], ['7', 'è'], ['8', '_'], ['9', 'ç'], ['0', 'à'],
    ];
    const rendu = disposition('fr-FR').rangees[0].map((t) => {
      const { haut, bas } = legendes(t);
      return [haut, bas];
    });
    expect(rendu).toEqual(attendu);
  });

  it('les lettres sont légendées en CAPITALE sur le clavier virtuel', () => {
    expect(legendes(toucheDirecte('fr-FR', 'a')!)).toEqual({ bas: 'A' });
    expect(legendes(toucheDirecte('fr-CH', 'z')!)).toEqual({ bas: 'Z' });
  });
});
