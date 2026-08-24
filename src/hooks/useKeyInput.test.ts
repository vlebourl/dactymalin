// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useKeyInput, type Frappe } from './useKeyInput';

function frapper(init: KeyboardEventInit & { code: string }): KeyboardEvent {
  const e = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
  window.dispatchEvent(e);
  return e;
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
    frapper({ code: 'ShiftLeft', key: 'Shift' });
    frapper({ code: 'KeyQ', key: 'a' });
    expect(vues).toEqual([
      { code: 'KeyQ', key: 'a', repeat: false, avecMaj: false, avecAutreModificateur: false },
    ]);
  });

  it('retire ses écouteurs au démontage', () => {
    const surFrappe = vi.fn();
    const { unmount } = renderHook(() => useKeyInput(true, surFrappe));
    unmount();
    frapper({ code: 'KeyE', key: 'e' });
    expect(surFrappe).not.toHaveBeenCalled();
  });
});
