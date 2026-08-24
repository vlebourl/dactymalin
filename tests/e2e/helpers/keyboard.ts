import type { CDPSession, Page } from '@playwright/test';
import { toucheDirecte, toucheMaj, type IdDisposition } from '../../../src/core/layouts';

/**
 * Playwright pilote un QWERTY US : `page.keyboard.press('a')` n'émettrait
 * jamais le couple (code, key) d'un AZERTY ou d'un QWERTZ suisse. Toute la
 * logique de l'app reposant sur ce couple, chaque frappe est émise ici avec
 * le `code` réel de la disposition testée, lu dans les MÊMES tables que la
 * production (`src/core/layouts.ts`).
 *
 * Chromium : `Input.dispatchKeyEvent` via CDP — une vraie frappe navigateur.
 * Firefox / WebKit (chemin de repli « Appuie sur la touche A ») : CDP n'existe
 * pas, on retombe sur un KeyboardEvent synthétique, que l'app écoute de la
 * même façon puisqu'elle n'observe que (code, key).
 */

const sessions = new WeakMap<Page, CDPSession | null>();

async function cdp(page: Page): Promise<CDPSession | null> {
  if (!sessions.has(page)) {
    try {
      sessions.set(page, await page.context().newCDPSession(page));
    } catch {
      sessions.set(page, null); // pas Chromium
    }
  }
  return sessions.get(page) ?? null;
}

export type Modificateurs = { maj?: boolean; verrMaj?: boolean };

/** Émet une frappe brute (code, key), modificateurs compris. */
export async function frapperCouple(
  page: Page,
  code: string,
  key: string,
  mod: Modificateurs = {},
): Promise<void> {
  const session = await cdp(page);
  if (session) {
    // bit 8 = Shift dans le protocole CDP
    const modifiers = mod.maj ? 8 : 0;
    const commun = { key, code, modifiers, windowsVirtualKeyCode: key.charCodeAt(0) };
    await session.send('Input.dispatchKeyEvent', {
      ...commun,
      type: key.length === 1 ? 'keyDown' : 'rawKeyDown',
      text: key.length === 1 ? key : undefined,
    });
    await session.send('Input.dispatchKeyEvent', { ...commun, type: 'keyUp' });
    return;
  }
  await page.evaluate(
    ([c, k, maj, verr]) => {
      const init: KeyboardEventInit = { code: c, key: k, bubbles: true, cancelable: true, shiftKey: maj };
      const e = new KeyboardEvent('keydown', init);
      if (verr) Object.defineProperty(e, 'getModifierState', { value: () => true });
      window.dispatchEvent(e);
      window.dispatchEvent(new KeyboardEvent('keyup', init));
    },
    [code, key, !!mod.maj, !!mod.verrMaj] as const,
  );
}

/** Frappe le caractère `c` tel qu'on le tape RÉELLEMENT sur `id`. */
export async function frapper(page: Page, id: IdDisposition, c: string): Promise<void> {
  if (c === ' ') return frapperCouple(page, 'Space', ' ');
  const directe = toucheDirecte(id, c);
  if (directe) return frapperCouple(page, directe.code, c);
  const shiftee = toucheMaj(id, c);
  if (!shiftee) throw new Error(`« ${c} » n'est pas typable en ${id}`);
  return frapperCouple(page, shiftee.code, c, { maj: true });
}

/** Tape un item entier, caractère par caractère. */
export async function taper(page: Page, id: IdDisposition, texte: string): Promise<void> {
  for (const c of texte) {
    await frapper(page, id, c);
    await page.waitForTimeout(15);
  }
}
