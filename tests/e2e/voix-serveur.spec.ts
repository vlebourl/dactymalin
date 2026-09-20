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
    /* Le son du serveur est téléchargé puis joué depuis la mémoire (`blob:`),
       et l'élément porte le mot qu'il dit. Rien n'est réellement joué. */
    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
      if (this.src.startsWith('blob:')) joues.push(this.dataset.dit ?? '');
      return Promise.resolve();
    };
  }, voixNavigateur);
}

async function serveurVocal(page: Page, etatDuMot: number): Promise<void> {
  await page.route('**/api/voix/etat', (r) => r.fulfill({ json: { disponible: true } }));
  for (const route of ['**/api/voix/mot*', '**/api/voix/lettre*', '**/api/voix/consigne*'])
    await page.route(route, (r) =>
      etatDuMot === 200
        ? r.fulfill({ status: 200, contentType: 'audio/wav', body: Buffer.from('RIFF') })
        : r.fulfill({ status: etatDuMot, json: { erreur: 'voix indisponible' } }),
    );
}

const lire = (page: Page, cle: '__dits' | '__joues') =>
  page.evaluate((c) => (window as unknown as Record<string, string[]>)[c], cle);

async function lancerLaDictee(page: Page, mot = 'chat'): Promise<void> {
  await ouvrir(page, 'fr-FR', 3, true, 'Joueur 1', 'decouverte', 2, 600_000);
  await creeListe(page, 'Semaine 12', [mot]);
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

/* Revue #124 : le repli comparait l'URL demandée à `audio.src`, que le
   navigateur réécrit — l'apostrophe y devient `%27`. Pour « c'est », la
   comparaison échouait toujours : ni voix du serveur, ni repli, un mot MUET. */
test("un mot à apostrophe n'est jamais muet quand la voix du serveur tombe", async ({ page }) => {
  await espionner(page, { voixNavigateur: true });
  await serveurVocal(page, 503);
  await lancerLaDictee(page, "c'est");
  await expect.poll(() => lire(page, '__dits')).toEqual(["c'est"]);
});

/* Revue #124 : une synthèse coincée dans la file du serveur laissait l'enfant
   dans le silence, jusqu'à vingt secondes par mot. */
test('voix du serveur trop lente : le navigateur parle sans attendre', async ({ page }) => {
  await espionner(page, { voixNavigateur: true });
  await page.route('**/api/voix/etat', (r) => r.fulfill({ json: { disponible: true } }));
  await page.route('**/api/voix/mot*', () => {
    /* jamais de réponse */
  });
  await lancerLaDictee(page);
  await expect.poll(() => lire(page, '__dits'), { timeout: 6000 }).toEqual(['chat']);
});

/* Revue #124 : un seul échec de `/etat` (réseau qui tousse) était retenu pour
   toute la vie de la page — sur une tablette jamais rechargée, la voix du
   serveur ne revenait plus. */
test("un échec passager de l'état n'écarte pas la voix du serveur pour de bon", async ({ page }) => {
  await espionner(page, { voixNavigateur: true });
  /* Une PANNE, pas « la première requête » : le harnais charge la page deux
     fois avant d'arriver à l'accueil. */
  let panne = true;
  await page.route('**/api/voix/etat', (r) =>
    panne ? r.abort() : r.fulfill({ json: { disponible: true } }),
  );
  await page.route('**/api/voix/mot*', (r) =>
    r.fulfill({ status: 200, contentType: 'audio/wav', body: Buffer.from('RIFF') }),
  );
  await lancerLaDictee(page);
  await expect.poll(() => lire(page, '__dits')).toEqual(['chat']); // 1re fois : repli

  panne = false;
  await page.getByRole('button', { name: 'Quitter la leçon' }).click();
  await page.getByRole('button', { name: "Oui, j'arrête" }).click();
  await page.waitForSelector('body[data-vue="V1"]');
  await page.getByRole('button', { name: 'En dictée' }).click();
  await expect.poll(() => lire(page, '__joues')).toEqual(['chat']);
});

/* #126 — le nom de la lettre, au barreau 3, passe par la même voix. Ici en
   COPIE : c'est là que le barreau 3 sert tous les jours. */
async function lancerLaCopie(page: Page, mot: string, sons: boolean): Promise<void> {
  await ouvrir(page, 'fr-FR', 3, sons, 'Joueur 1', 'decouverte', 2, 600_000);
  await creeListe(page, 'Semaine 12', [mot]);
  await page.reload();
  await page.waitForSelector('body[data-vue="V1"]');
  await page.getByRole('button', { name: /Semaine 12/ }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');
}

async function deuxFautes(page: Page): Promise<void> {
  for (let k = 0; k < 2; k++) {
    await frapper(page, 'fr-FR', 'x');
    await page.waitForTimeout(250);
  }
}

test('au barreau 3, la lettre est dite par la voix du serveur', async ({ page }) => {
  await espionner(page, { voixNavigateur: true });
  await serveurVocal(page, 200);
  await lancerLaCopie(page, 'chat', true);
  await deuxFautes(page);
  await expect.poll(() => lire(page, '__joues')).toEqual(['c']);
  expect(await lire(page, '__dits')).toEqual([]);
});

test('voix du serveur en panne : le navigateur dit le NOM, « à » ne sonne pas comme « a »', async ({ page }) => {
  await espionner(page, { voixNavigateur: true });
  await serveurVocal(page, 503);
  await lancerLaCopie(page, 'à', true);
  await deuxFautes(page);
  await expect.poll(() => lire(page, '__dits')).toEqual(['a accent grave']);
});

test('sons coupés, en copie : aucune voix, ni serveur ni navigateur', async ({ page }) => {
  await espionner(page, { voixNavigateur: true });
  await serveurVocal(page, 200);
  await lancerLaCopie(page, 'chat', false);
  await deuxFautes(page);
  await page.waitForTimeout(400);
  expect(await lire(page, '__joues')).toEqual([]);
  expect(await lire(page, '__dits')).toEqual([]);
});

/* #126 — les consignes lues à voix haute passent par la même voix. */
test('le guide des doigts et le choix du clavier parlent avec la voix du serveur', async ({ page }) => {
  await espionner(page, { voixNavigateur: true });
  await serveurVocal(page, 200);
  await ouvrir(page, 'fr-FR', 1, false, 'Joueur 1', 'decouverte');

  await page.getByRole('button', { name: 'Revoir : où mettre mes doigts' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V3');
  const guide = await page.locator('[data-consigne-guide]').innerText();
  await page.getByRole('button', { name: 'Réécouter' }).click();
  await expect.poll(() => lire(page, '__joues')).toEqual([guide]);

  await page.goto('/');
  await page.waitForSelector('body[data-vue="V1"]');
  await page.getByRole('button', { name: 'Changer' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V2');
  await page.getByRole('button', { name: 'Écouter la consigne' }).click();
  await expect.poll(() => lire(page, '__joues')).toEqual(['Appuie sur la touche A']);
  expect(await lire(page, '__dits')).toEqual([]);
});
