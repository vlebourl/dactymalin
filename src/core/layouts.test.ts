import { describe, expect, it } from 'vitest';
import { ensembleTouches, PALIER_MAX } from './paliers';
import {
  disposition,
  estProposable,
  exigeMaj,
  legendes,
  MAJ_DROITE,
  MAJ_GAUCHE,
  mainDe,
  toucheDe,
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

  /* Régression itération 002 (point critique n°2) : `mainDe` ne consultait que
     `toucheDirecte`. Résultat, au palier 7 les DIX chiffres FR-FR et le ç
     CH-FR n'avaient ni touche cible ni main annoncée — un palier entier
     livré sans le moindre repère. */
  it('un caractère shifté a une touche porteuse et une main', () => {
    for (const c of '0123456789.') {
      expect(toucheDirecte('fr-FR', c), `${c} devrait exiger Maj`).toBeUndefined();
      expect(toucheDe('fr-FR', c), `${c} sans touche porteuse`).toBeDefined();
      expect(mainDe('fr-FR', c), `${c} sans main`).toMatch(/gauche|droite/);
    }
    expect(mainDe('fr-FR', '8')).toBe('droite');
    expect(mainDe('fr-FR', '4')).toBe('gauche');
    expect(mainDe('fr-CH', 'ç')).toBe('gauche');
    expect(toucheDe('fr-FR', '8')?.code).toBe('Digit8');
    expect(toucheDe('fr-CH', 'ç')?.code).toBe('Digit4');
  });

  it('exigeMaj distingue le direct du shifté, disposition par disposition', () => {
    expect(exigeMaj('fr-FR', '4')).toBe(true);
    expect(exigeMaj('fr-CH', '4')).toBe(false);
    expect(exigeMaj('fr-FR', 'ç')).toBe(false);
    expect(exigeMaj('fr-CH', 'ç')).toBe(true);
    expect(exigeMaj('fr-FR', 'e')).toBe(false);
  });

  it('les deux Maj sont dessinables et opposées à la main du caractère', () => {
    for (const id of ['fr-FR', 'fr-CH'] as const) {
      const majs = touches(id).filter((t) => t.modificateur);
      expect(majs.map((t) => t.code).sort()).toEqual([MAJ_GAUCHE, MAJ_DROITE].sort());
      expect(majs.find((t) => t.code === MAJ_GAUCHE)?.main).toBe('gauche');
      expect(majs.find((t) => t.code === MAJ_DROITE)?.main).toBe('droite');
      // une Maj ne produit aucun caractère : jamais proposable comme cible
      for (const t of majs) expect(t.base).toBeUndefined();
    }
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
    const rendu = disposition('fr-FR')
      .rangees[0].filter((t) => t.code.startsWith('Digit'))
      .map((t) => {
        const { haut, bas } = legendes(t);
        return [haut, bas];
      });
    expect(rendu).toEqual(attendu);
  });

  /* Régression itération 001 : la leçon CH-FR demandait « 4 » et la touche
     affichait « ç » en dominante, parce que la hiérarchie était déduite du
     type de caractère au lieu d'être portée par la table. */
  it('CH-FR : la légende dominante de la rangée des chiffres est le CHIFFRE', () => {
    const rendu = disposition('fr-CH')
      .rangees[0].filter((t) => t.code.startsWith('Digit'))
      .map((t) => legendes(t));
    expect(rendu.map((l) => l.bas)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']);
    expect(rendu.map((l) => l.haut)).toEqual(['+', '"', '*', 'ç', '%', '&', '/', '(', ')', '=']);
  });

  it('la légende dominante est toujours le caractère produit sans modificateur', () => {
    for (const d of TOUTES_DISPOSITIONS) {
      for (const t of d.rangees.flat()) {
        if (!t.base || t.nom) continue;
        expect(legendes(t).bas.toLowerCase()).toBe(t.base.toLowerCase());
      }
    }
  });

  it('les lettres sont légendées en CAPITALE sur le clavier virtuel', () => {
    expect(legendes(toucheDirecte('fr-FR', 'a')!)).toEqual({ bas: 'A' });
    expect(legendes(toucheDirecte('fr-CH', 'z')!)).toEqual({ bas: 'Z' });
  });
});

/**
 * Gate Codex n°3 : les tables s'arrêtaient au 10ᵉ chiffre. Manquaient `²`,
 * `)/°`, `=/+` en FR-FR, `'/?` et le `^` mort en CH-FR, et le Retour arrière
 * dans les deux — alors que la spec (F3) le veut dessiné et inactif.
 * MATRICE PHYSIQUE de référence, écrite à la main d'après kbdfr / kbdsf_2.
 */
const MATRICE: Record<'fr-FR' | 'fr-CH', string[][]> = {
  'fr-FR': [
    ['Backquote', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7',
      'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal', 'Backspace'],
    ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP',
      'BracketLeft', 'BracketRight'],
    ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon',
      'Quote', 'Backslash'],
    ['ShiftLeft', 'IntlBackslash', 'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM',
      'Comma', 'Period', 'Slash', 'ShiftRight'],
  ],
  'fr-CH': [
    ['Backquote', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7',
      'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal', 'Backspace'],
    ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP',
      'BracketLeft', 'BracketRight'],
    ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon',
      'Quote', 'Backslash'],
    ['ShiftLeft', 'IntlBackslash', 'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM',
      'Comma', 'Period', 'Slash', 'ShiftRight'],
  ],
};

describe('matrice physique exhaustive', () => {
  it.each(['fr-FR', 'fr-CH'] as const)('%s déclare TOUTES ses touches physiques', (id) => {
    const rendu = disposition(id).rangees.map((r) => r.map((t) => t.code));
    expect(rendu).toEqual(MATRICE[id]);
  });

  it.each(['fr-FR', 'fr-CH'] as const)(
    '%s dessine le Retour arrière, sans jamais le proposer',
    (id) => {
      const retour = touches(id).find((t) => t.code === 'Backspace');
      expect(retour, 'Retour arrière absent de la table').toBeDefined();
      expect(retour!.nom, 'le Retour arrière doit être dessiné avec un libellé').toBeTruthy();
      expect(retour!.base).toBeUndefined();
      expect(estProposable(retour!)).toBe(false);
    },
  );

  it('les touches mortes sont déclarées là où elles existent physiquement', () => {
    const morte = (id: 'fr-FR' | 'fr-CH', code: string) =>
      touches(id).find((t) => t.code === code)?.morte;
    expect(morte('fr-FR', 'BracketLeft')).toBe(true); // ^ accent circonflexe
    expect(morte('fr-CH', 'Equal')).toBe(true); // ^ CH-FR
    expect(morte('fr-CH', 'BracketRight')).toBe(true); // ¨ tréma
  });

  it('CH-FR déclare bien la touche apostrophe et le ^ mort', () => {
    expect(toucheDirecte('fr-CH', "'")?.code).toBe('Minus');
    expect(toucheMaj('fr-CH', '?')?.code).toBe('Minus');
    expect(toucheDirecte('fr-CH', '^')).toBeUndefined(); // morte
  });

  it('FR-FR déclare bien ², ) / ° et = / +', () => {
    const t = (code: string) => touches('fr-FR').find((x) => x.code === code)!;
    expect(t('Backquote').base).toBe('²');
    expect(legendes(t('Minus'))).toEqual({ bas: ')', haut: '°' });
    expect(legendes(t('Equal'))).toEqual({ bas: '=', haut: '+' });
  });

  /* DESSINABLE ≠ PROPOSABLE : une touche morte ou inerte est rendue, jamais visée. */
  it('aucune touche morte, inerte ou modificatrice ne peut devenir une cible', () => {
    for (const d of TOUTES_DISPOSITIONS) {
      for (const t of d.rangees.flat()) {
        if (estProposable(t)) continue;
        if (t.base) expect(toucheDirecte(d.id, t.base), `${t.code} proposée`).toBeUndefined();
        if (t.maj) expect(toucheMaj(d.id, t.maj), `${t.code} proposée sous Maj`).toBeUndefined();
      }
    }
  });

  it('toute touche du curriculum reste atteignable après complétion des tables', () => {
    for (const id of ['fr-FR', 'fr-CH'] as const) {
      for (const c of ensembleTouches(id, PALIER_MAX)) {
        if (c === ' ') continue;
        expect(toucheDe(id, c), `${c} introuvable en ${id}`).toBeDefined();
      }
    }
  });
});
