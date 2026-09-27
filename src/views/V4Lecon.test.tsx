// @vitest-environment jsdom
/**
 * Tests composants de la vue leçon, exigés par l'arbitrage de STACK.md
 * (point 3) : la frappe fausse muette, et les minuteries de la leçon jouées
 * avec de FAUX timers. Playwright les couvre aussi, mais en attendant de
 * vraies secondes — c'est ce qui rendait l'e2e lent et fragile (#136).
 *
 * La leçon joue une liste de la maison d'UN mot : l'ordre est fixe, la leçon
 * n'a pas de chrono, et sa fin est connue d'avance.
 */
import { StrictMode } from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Action, EtatApp } from '../state';

const son = vi.hoisted(() => ({ sonLettre: vi.fn(), sonItem: vi.fn() }));
const voix = vi.hoisted(() => ({
  direLettre: vi.fn(),
  direMot: vi.fn(),
  prechargerLaLettre: vi.fn(),
  prechargerLesMots: vi.fn(),
}));
const app = vi.hoisted(() => ({ etat: null as EtatApp | null, envoi: vi.fn() }));

vi.mock('../ui/son', () => son);
vi.mock('../ui/voix', () => voix);
vi.mock('../state', async (original) => ({
  ...(await original<typeof import('../state')>()),
  useApp: () => app.etat,
  useEnvoi: () => app.envoi,
}));

import { etatDeDepart } from '../state';
import { V4Lecon } from './V4Lecon';

const MOT = 'sel';

function monter(reglages: Partial<EtatApp['reglages']> = {}) {
  return monterAvecRendu(reglages).container;
}

function monterAvecRendu(reglages: Partial<EtatApp['reglages']> = {}) {
  const depart = etatDeDepart();
  app.etat = {
    ...depart,
    vue: 'V4',
    disposition: 'fr-FR',
    reglages: { ...depart.reglages, ...reglages },
    listeJouee: { id: 'l1', nom: 'Essai', mots: [MOT], creeLe: '2026-09-27' },
  };
  /* Comme dans `main.tsx` : StrictMode rejoue les effets au montage, et la
     leçon doit y survivre (une seule boucle d'horloge, une seule annonce). */
  const rendu = render(
    <StrictMode>
      <V4Lecon />
    </StrictMode>,
  );
  /* jsdom n'a pas le focus au départ : la leçon SUSPEND alors son horloge
     (voir `refEnPause`). La fenêtre le reçoit, comme au premier clic. */
  act(() => {
    window.dispatchEvent(new Event('focus'));
  });
  return rendu;
}

function taper(code: string, key: string) {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code, key, bubbles: true, cancelable: true }));
    window.dispatchEvent(new KeyboardEvent('keyup', { code, key, bubbles: true }));
  });
}

function attendre(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

const mot = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-mot]')!;
const touche = (c: HTMLElement, code: string) =>
  c.querySelector<HTMLElement>(`[data-code="${code}"]`)!;
const blocQuiPulse = (c: HTMLElement) => c.querySelector('[data-pulse="oui"]');
/* `verrMaj` est l'état de la touche Verr. Maj, relu à CHAQUE frappe par le
   hook clavier : ce n'est pas une réaction de la leçon. */
const actionsApp = (): Action['type'][] =>
  app.envoi.mock.calls.map(([a]) => (a as Action).type).filter((t) => t !== 'verrMaj');
const bilan = () =>
  (
    app.envoi.mock.calls
      .map(([a]) => a as Action)
      .find((a) => a.type === 'leconTerminee') as Extract<Action, { type: 'leconTerminee' }>
  ).bilan;

beforeEach(() => {
  /* L'horloge de la leçon, c'est `performance.now()` lu dans un unique
     requestAnimationFrame : ce sont eux qu'il faut simuler. */
  vi.useFakeTimers({
    toFake: [
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'performance',
      'Date',
      'setTimeout',
      'clearTimeout',
    ],
  });
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('V4Lecon : la frappe fausse est muette', () => {
  it("n'écrit rien, n'avance pas, ne sonne pas et ne dit rien au reste de l'app", () => {
    const c = monter();
    expect(mot(c).dataset.mot).toBe(MOT);
    const annonce = c.querySelector('[aria-live]')!.textContent;

    taper('KeyP', 'p');

    expect(mot(c).dataset.curseur).toBe('0');
    expect(mot(c).textContent).toBe(MOT);
    expect(son.sonLettre).not.toHaveBeenCalled();
    expect(son.sonItem).not.toHaveBeenCalled();
    expect(c.querySelector('[aria-live]')!.textContent).toBe(annonce);
    expect(actionsApp()).toEqual([]);
  });

  it('seule la touche frappée clignote, et moins de 200 ms', () => {
    const c = monter();
    taper('KeyP', 'p');
    expect(touche(c, 'KeyP').dataset.etat).toBe('fausse');

    attendre(200);
    expect(touche(c, 'KeyP').dataset.etat).not.toBe('fausse');
    expect(c.querySelector('[data-etat="fausse"]')).toBeNull();
  });

  it('une Maj avant l’étape qui l’enseigne ne compte ni en faute ni en réussite', () => {
    const c = monter();
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { code: 'ShiftLeft', key: 'Shift', shiftKey: true, bubbles: true }),
      );
    });
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { code: 'KeyS', key: 'S', shiftKey: true, bubbles: true, cancelable: true }),
      );
    });

    expect(mot(c).dataset.curseur).toBe('0');
    expect(c.querySelector('[data-etat="fausse"]')).toBeNull();
    expect(son.sonLettre).not.toHaveBeenCalled();
    // Deux vraies fautes ensuite suffisent au barreau 3 : la Maj n'en était pas une.
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ShiftLeft', key: 'Shift', bubbles: true }));
    });
    taper('KeyP', 'p');
    expect(voix.direLettre).not.toHaveBeenCalled();
  });

  it('la frappe juste sonne, elle, et avance le curseur', () => {
    const c = monter();
    taper('KeyS', 's');
    expect(mot(c).dataset.curseur).toBe('1');
    expect(son.sonLettre).toHaveBeenCalledTimes(1);
  });
});

describe('V4Lecon : les minuteries', () => {
  it("l'aide monte au barreau 2 après 3 s sans frappe, pas avant", () => {
    const c = monter();
    attendre(2900);
    expect(blocQuiPulse(c)).toBeNull();

    attendre(200);
    expect(blocQuiPulse(c)?.getAttribute('data-bloc')).toBe('gauche');
  });

  it('une fenêtre sans focus fige l’horloge : pas d’aide d’inactivité', () => {
    const c = monter();
    act(() => {
      window.dispatchEvent(new Event('blur'));
    });
    attendre(10_000);
    expect(blocQuiPulse(c)).toBeNull();

    // Au retour, l'horloge du caractère repart de zéro.
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });
    attendre(2900);
    expect(blocQuiPulse(c)).toBeNull();
    attendre(200);
    expect(blocQuiPulse(c)).not.toBeNull();
  });

  it('la question de sortie fige l’horloge et n’écoute plus le clavier', () => {
    const c = monter();
    act(() => {
      c.querySelector<HTMLButtonElement>('[data-quitter="bouton"]')!.click();
    });
    // La fenêtre qui reprend le focus ne dégèle pas l'horloge dans son dos.
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });
    attendre(10_000);
    expect(blocQuiPulse(c)).toBeNull();
    /* Le bouton « Je continue » a le focus, et un bouton garde ses frappes :
       sans ce blur, le test passerait même si la leçon écoutait encore. */
    act(() => {
      (document.activeElement as HTMLElement | null)?.blur();
    });
    taper('KeyS', 's');
    expect(mot(c).dataset.curseur).toBe('0');

    act(() => {
      c.querySelector<HTMLButtonElement>('[data-quitter="rester"]')!.click();
    });
    expect(blocQuiPulse(c)).toBeNull();
    attendre(3100);
    expect(blocQuiPulse(c)).not.toBeNull();
  });

  it('démontée, la leçon ne laisse aucune minuterie derrière elle', () => {
    const { unmount } = monterAvecRendu();
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('deux fautes sur la même lettre font dire son nom (barreau 3), une seule fois', () => {
    const c = monter();
    taper('KeyP', 'p');
    attendre(200);
    expect(voix.direLettre).not.toHaveBeenCalled();

    taper('KeyP', 'p');
    attendre(200);
    expect(voix.direLettre).toHaveBeenCalledTimes(1);
    expect(voix.direLettre).toHaveBeenCalledWith('s');
    expect(blocQuiPulse(c)).not.toBeNull();

    attendre(5000);
    expect(voix.direLettre).toHaveBeenCalledTimes(1);
  });

  it('sons coupés : le nom de la lettre n’est pas dit hors dictée', () => {
    monter({ sons: false });
    taper('KeyP', 'p');
    taper('KeyP', 'p');
    attendre(200);
    expect(voix.direLettre).not.toHaveBeenCalled();
  });

  it('le mot fini se célèbre 700 ms, puis la leçon se termine', () => {
    const c = monter();
    taper('KeyS', 's');
    taper('KeyE', 'e');
    taper('KeyL', 'l');
    expect(son.sonItem).toHaveBeenCalledTimes(1);
    expect(mot(c).dataset.curseur).toBe('3');

    attendre(600);
    expect(actionsApp()).not.toContain('leconTerminee');

    attendre(200);
    expect(actionsApp()).toEqual(['leconTerminee']);
    expect(bilan()).toMatchObject({ etoiles: 1, items: [MOT], aRevoir: [] });
  });

  it('un mot où l’aide a monté part à revoir', () => {
    monter();
    taper('KeyP', 'p');
    taper('KeyS', 's');
    taper('KeyE', 'e');
    taper('KeyL', 'l');
    attendre(800);
    expect(bilan().aRevoir).toEqual([MOT]);
  });
});
