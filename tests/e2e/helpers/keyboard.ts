import type { CDPSession, Page } from '@playwright/test';
import {
  MAJ_DROITE,
  MAJ_GAUCHE,
  toucheDirecte,
  toucheMaj,
  type IdDisposition,
} from '../../../src/core/layouts';
import { mainDeLaMaj } from '../../../src/core/maj';

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

/**
 * `maj` porte le CODE réel de la touche Majuscule tenue (`ShiftLeft` /
 * `ShiftRight`), jamais un booléen : l'app vérifie la règle contralatérale, et
 * un simple drapeau `shiftKey` ne dit pas de quel côté la main travaille.
 */
export type CoteMaj = typeof MAJ_GAUCHE | typeof MAJ_DROITE;
export type Modificateurs = { maj?: CoteMaj; verrMaj?: boolean };

/** Émet une frappe brute (code, key), Maj réellement enfoncée puis relâchée. */
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
    const maj = mod.maj
      ? { key: 'Shift', code: mod.maj, modifiers: 8, windowsVirtualKeyCode: 16 }
      : null;
    if (maj) await session.send('Input.dispatchKeyEvent', { ...maj, type: 'rawKeyDown' });
    const commun = { key, code, modifiers, windowsVirtualKeyCode: key.charCodeAt(0) };
    await session.send('Input.dispatchKeyEvent', {
      ...commun,
      type: key.length === 1 ? 'keyDown' : 'rawKeyDown',
      text: key.length === 1 ? key : undefined,
    });
    await session.send('Input.dispatchKeyEvent', { ...commun, type: 'keyUp' });
    if (maj) {
      await session.send('Input.dispatchKeyEvent', { ...maj, type: 'keyUp', modifiers: 0 });
    }
    return;
  }
  await page.evaluate(
    ([c, k, cote, verr]) => {
      const emettre = (type: string, init: KeyboardEventInit, capsLock = false) => {
        const e = new KeyboardEvent(type, { bubbles: true, cancelable: true, ...init });
        if (capsLock) Object.defineProperty(e, 'getModifierState', { value: () => true });
        window.dispatchEvent(e);
      };
      if (cote) emettre('keydown', { code: cote, key: 'Shift', shiftKey: true });
      const init: KeyboardEventInit = { code: c, key: k, shiftKey: !!cote };
      emettre('keydown', init, verr);
      emettre('keyup', init, verr);
      if (cote) emettre('keyup', { code: cote, key: 'Shift', shiftKey: false });
    },
    [code, key, mod.maj ?? null, !!mod.verrMaj] as const,
  );
}

/**
 * Frappe le caractère `c` tel qu'on le tape RÉELLEMENT sur `id`.
 * Quand Maj est nécessaire, c'est la Maj CONTRALATÉRALE qui est tenue — celle
 * que l'application exige.
 */
export async function frapper(page: Page, id: IdDisposition, c: string): Promise<void> {
  if (c === ' ') return frapperCouple(page, 'Space', ' ');
  const directe = toucheDirecte(id, c);
  if (directe) return frapperCouple(page, directe.code, c);
  const shiftee = toucheMaj(id, c);
  if (!shiftee) throw new Error(`« ${c} » n'est pas typable en ${id}`);
  return frapperCouple(page, shiftee.code, c, { maj: coteMajAttendu(id, c) });
}

/** Côté de Maj exigé par la règle contralatérale pour ce caractère. */
export function coteMajAttendu(id: IdDisposition, c: string): CoteMaj {
  return mainDeLaMaj(id, c) === 'gauche' ? MAJ_GAUCHE : MAJ_DROITE;
}

/** L'autre Maj : celle de la MÊME main que le caractère, qui doit être refusée. */
export function coteMajHomolateral(id: IdDisposition, c: string): CoteMaj {
  return coteMajAttendu(id, c) === MAJ_GAUCHE ? MAJ_DROITE : MAJ_GAUCHE;
}

/** Tape un item entier, caractère par caractère. */
export async function taper(page: Page, id: IdDisposition, texte: string): Promise<void> {
  for (const c of texte) {
    await frapper(page, id, c);
    await page.waitForTimeout(15);
  }
}
