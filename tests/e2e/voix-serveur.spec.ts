import { expect, test, type Page } from '@playwright/test';
import { creeListe, ouvrir } from './helpers/app';
import { frapper } from './helpers/keyboard';

/**
 * #124 — la dictée parle avec la voix du SERVEUR (Piper) quand il en a une, et
 * retombe sur celle du navigateur sans que rien ne se voie.
 *
 * Piper n'existe que dans l'image de production : ici, les deux routes
 * `/api/voix/*` sont jouées par le harnais. Aucun son n'est réellement émis —
 * la lecture audio et la synthèse du navigateur sont remplacées par des espions.
 */
type Regime = { voixNavigateur: boolean };

async function espionner(page: Page, { voixNavigateur }: Regime): Promise<void> {
  await page.addInitScript((avecVoix) => {
    const w = window as unknown as Record<string, unknown>;
    const dits: string[] = [];
    const joues: string[] = [];
    w.__dits = dits;
    w.__joues = joues;
    w.SpeechSynthesisUtterance = class {
      lang = '';
      rate = 1;
      voice: unknown = null;
      constructor(public text: string) {}
    };
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        getVoices: () => (avecVoix ? [{ lang: 'fr-FR', name: 'Voix de test' }] : []),
        speak: (p: { text: string }) => p.text && dits.push(p.text),
        cancel: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
      },
    });
    /* Un vrai lecteur REJETTE `play()` quand la source ne se charge pas : c'est
       ce rejet qui déclenche le repli. L'espion fait de même, sans rien jouer. */
    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
      const src = this.src;
      if (!src.includes('/api/voix/')) return Promise.resolve();
      return fetch(src).then((r) => {
        if (!r.ok) throw new DOMException('source illisible', 'NotSupportedError');
        joues.push(decodeURIComponent(new URL(src).searchParams.get('mot') ?? ''));
      });
    };
  }, voixNavigateur);
}

async function serveurVocal(page: Page, etatDuMot: number): Promise<void> {
  await page.route('**/api/voix/etat', (r) => r.fulfill({ json: { disponible: true } }));
  await page.route('**/api/voix/mot*', (r) =>
    etatDuMot === 200
      ? r.fulfill({ status: 200, contentType: 'audio/wav', body: Buffer.from('RIFF') })
      : r.fulfill({ status: etatDuMot, json: { erreur: 'voix indisponible' } }),
  );
}

const lire = (page: Page, cle: '__dits' | '__joues') =>
  page.evaluate((c) => (window as unknown as Record<string, string[]>)[c], cle);

async function lancerLaDictee(page: Page): Promise<void> {
  await ouvrir(page, 'fr-FR', 3, true, 'Joueur 1', 'decouverte', 2, 600_000);
  await creeListe(page, 'Semaine 12', ['chat']);
  await page.reload();
  await page.waitForSelector('body[data-vue="V1"]');
  await page.getByRole('button', { name: 'En dictée' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');
}

test('le mot est dit par la voix du serveur, pas par celle du navigateur', async ({ page }) => {
  await espionner(page, { voixNavigateur: true });
  await serveurVocal(page, 200);
  await lancerLaDictee(page);

  await expect.poll(() => lire(page, '__joues')).toEqual(['chat']);
  // la première faute et le haut-parleur passent par la même voix
  await frapper(page, 'fr-FR', 'x');
  await expect.poll(() => lire(page, '__joues')).toEqual(['chat', 'chat']);
  await page.getByRole('button', { name: 'Réécouter le mot' }).click();
  await expect.poll(() => lire(page, '__joues')).toEqual(['chat', 'chat', 'chat']);
  expect(await lire(page, '__dits')).not.toContain('chat');
});

test('voix du serveur en panne : le navigateur prend le relais, la dictée continue', async ({ page }) => {
  await espionner(page, { voixNavigateur: true });
  await serveurVocal(page, 503);
  await lancerLaDictee(page);

  await expect.poll(() => lire(page, '__dits')).toEqual(['chat']);
  expect(await lire(page, '__joues')).toEqual([]);
  await frapper(page, 'fr-FR', 'c');
  await expect(page.locator('[data-mot]')).toHaveText('c___');
});

test('sans voix française sur l’appareil, la voix du serveur suffit à ouvrir la dictée', async ({ page }) => {
  await espionner(page, { voixNavigateur: false });
  await serveurVocal(page, 200);
  await lancerLaDictee(page);

  await expect.poll(() => lire(page, '__joues')).toEqual(['chat']);
  await expect(page.getByText('Il manque une voix française')).toHaveCount(0);
});
