// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useKeyInput, type Frappe } from './useKeyInput';

function frapper(init: KeyboardEventInit & { code: string }): KeyboardEvent {
  const e = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
  window.dispatchEvent(e);
  return e;
}

function relacher(init: KeyboardEventInit & { code: string }): void {
  window.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, ...init }));
}

describe('useKeyInput', () => {
  /* Régression itération 001 : `Tab` était preventDefault, ce qui rendait
     toute l'application inatteignable au clavier. */
  it('ne préempte JAMAIS Tab', () => {
    renderHook(() => useKeyInput(true, () => {}));
    expect(frapper({ code: 'Tab', key: 'Tab' }).defaultPrevented).toBe(false);
  });

  it('neutralise Espace quand le focus est sur le corps du document', () => {
    renderHook(() => useKeyInput(true, () => {}));
    expect(frapper({ code: 'Space', key: ' ' }).defaultPrevented).toBe(true);
  });

  it("laisse Espace activer un bouton focalisé", () => {
    renderHook(() => useKeyInput(true, () => {}));
    const bouton = document.createElement('button');
    document.body.appendChild(bouton);
    bouton.focus();
    expect(frapper({ code: 'Space', key: ' ' }).defaultPrevented).toBe(false);
    bouton.remove();
  });

  it('rend le couple (code, key) brut et ignore les modificateurs seuls', () => {
    const vues: Frappe[] = [];
    renderHook(() => useKeyInput(true, (f) => vues.push(f)));
    frapper({ code: 'ShiftLeft', key: 'Shift', shiftKey: true });
    relacher({ code: 'ShiftLeft', key: 'Shift', shiftKey: false });
    frapper({ code: 'KeyQ', key: 'a' });
    expect(vues).toEqual([
      {
        code: 'KeyQ',
        key: 'a',
        repeat: false,
        avecMaj: false,
        majGauche: false,
        majDroite: false,
        avecAutreModificateur: false,
      },
    ]);
  });

  /* Gate Codex n°5 : seul un booléen `avecMaj` était transmis. L'app affichait
     la Maj contralatérale mais ne pouvait pas la vérifier — n'importe laquelle
     des deux validait. */
  describe('côté réel de la touche Maj', () => {
    const avecMajTenue = (cote: string): Frappe => {
      const vues: Frappe[] = [];
      renderHook(() => useKeyInput(true, (f) => vues.push(f)));
      frapper({ code: cote, key: 'Shift', shiftKey: true });
      frapper({ code: 'Digit7', key: '7', shiftKey: true });
      relacher({ code: cote, key: 'Shift', shiftKey: false });
      return vues[0];
    };

    it('distingue ShiftLeft de ShiftRight', () => {
      expect(avecMajTenue('ShiftLeft')).toMatchObject({ majGauche: true, majDroite: false });
      expect(avecMajTenue('ShiftRight')).toMatchObject({ majGauche: false, majDroite: true });
    });

    it('oublie une Maj relâchée', () => {
      const vues: Frappe[] = [];
      renderHook(() => useKeyInput(true, (f) => vues.push(f)));
      frapper({ code: 'ShiftRight', key: 'Shift', shiftKey: true });
      relacher({ code: 'ShiftRight', key: 'Shift', shiftKey: false });
      frapper({ code: 'KeyE', key: 'e' });
      expect(vues.at(-1)).toMatchObject({ majGauche: false, majDroite: false, avecMaj: false });
    });

    it("oublie les Maj fantômes quand la fenêtre perd le focus", () => {
      const vues: Frappe[] = [];
      renderHook(() => useKeyInput(true, (f) => vues.push(f)));
      frapper({ code: 'ShiftLeft', key: 'Shift', shiftKey: true });
      window.dispatchEvent(new Event('blur'));
      frapper({ code: 'KeyE', key: 'e' });
      expect(vues.at(-1)).toMatchObject({ majGauche: false, majDroite: false });
    });

    /* Gate Codex n°5 résiduel : Maj tenue mais aucun code observé (reprise de
       focus Maj déjà enfoncée) déclarait les DEUX côtés tenus — une Maj
       homolatérale passait alors pour la bonne. Côté inconnu = aucun côté. */
    it('ne déclare AUCUN côté quand la Maj est tenue sans code observé', () => {
      const vues: Frappe[] = [];
      renderHook(() => useKeyInput(true, (f) => vues.push(f)));
      frapper({ code: 'Digit7', key: '7', shiftKey: true });
      expect(vues.at(-1)).toMatchObject({ avecMaj: true, majGauche: false, majDroite: false });

      // dès qu'un vrai code Maj est observé, le côté redevient connu
      frapper({ code: 'ShiftRight', key: 'Shift', shiftKey: true });
      frapper({ code: 'Digit7', key: '7', shiftKey: true });
      expect(vues.at(-1)).toMatchObject({ majGauche: false, majDroite: true });
      relacher({ code: 'ShiftRight', key: 'Shift', shiftKey: false });
    });
  });

  /* Gate Codex n°8 : une touche pressée alors qu'un bouton a le focus comptait
     À LA FOIS comme activation du bouton et comme frappe pédagogique. */
  it('ignore une frappe partie d’un contrôle focalisé', () => {
    const vues: Frappe[] = [];
    renderHook(() => useKeyInput(true, (f) => vues.push(f)));
    const bouton = document.createElement('button');
    document.body.appendChild(bouton);
    bouton.focus();
    frapper({ code: 'Space', key: ' ' });
    frapper({ code: 'KeyE', key: 'e' });
    expect(vues).toEqual([]);
    bouton.blur();
    bouton.remove();
    frapper({ code: 'KeyE', key: 'e' });
    expect(vues).toHaveLength(1);
  });

  it('transmet le drapeau d’auto-répétition tel quel', () => {
    const vues: Frappe[] = [];
    renderHook(() => useKeyInput(true, (f) => vues.push(f)));
    frapper({ code: 'KeyL', key: 'l' });
    frapper({ code: 'KeyL', key: 'l', repeat: true });
    expect(vues.map((f) => f.repeat)).toEqual([false, true]);
  });

  it('retire ses écouteurs au démontage', () => {
    const surFrappe = vi.fn();
    const { unmount } = renderHook(() => useKeyInput(true, surFrappe));
    unmount();
    frapper({ code: 'KeyE', key: 'e' });
    expect(surFrappe).not.toHaveBeenCalled();
  });
});
