import { expect, test, type Page } from '@playwright/test';
import { creeListe, curseur, ouvrir } from './helpers/app';
import { frapper } from './helpers/keyboard';

/**
 * #118 — la dictée : une liste de la maison jouée À L'OREILLE. Le mot est dit,
 * ses lettres restent cachées, et chacune n'apparaît que sous la bonne touche.
 *
 * Aucune voix n'est réellement jouée : le harnais remplace la synthèse vocale
 * et note ce que l'app lui a demandé de dire.
 */
type Dit = { texte: string; debit: number };

async function espionnerLaVoix(page: Page, voix: 'presente' | 'absente' | 'differee'): Promise<void> {
  await page.addInitScript((regime) => {
    const francaise = { lang: 'fr-FR', name: 'Voix de test' };
    const voixConnues = regime === 'presente' ? [francaise] : [];
    const ecouteurs: Array<() => void> = [];
    const dits: Array<{ texte: string; debit: number }> = [];
    const w = window as unknown as Record<string, unknown>;
    w.__dits = dits;
    w.__voixArrive = () => {
      voixConnues.push(francaise);
      for (const f of ecouteurs) f();
    };
    /* Une vraie `SpeechSynthesisUtterance` refuse une voix qui n'en est pas
       une : la phrase est remplacée avec la synthèse. */
    w.SpeechSynthesisUtterance = class {
      lang = '';
      rate = 1;
      voice: unknown = null;
      constructor(public text: string) {}
    };
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        getVoices: () => voixConnues,
        speak: (p: { text: string; rate: number }) => dits.push({ texte: p.text, debit: p.rate }),
        cancel: () => {},
        addEventListener: (_: string, f: () => void) => ecouteurs.push(f),
        removeEventListener: () => {},
      },
    });
  }, voix);
}

/** Ce que l'app a fait dire — sans l'amorce muette du premier geste. */
const dits = (page: Page) =>
  page.evaluate(() => (window as unknown as { __dits: Dit[] }).__dits.filter((d) => d.texte !== ''));

const allumees = (page: Page) => page.locator('[data-etat="cible"]');

async function ouvrirAvecListe(page: Page, sons: boolean): Promise<void> {
  await ouvrir(page, 'fr-FR', 3, sons, 'Joueur 1', 'decouverte', 2, 600_000);
  await creeListe(page, 'Semaine 12', ['chat']);
  await page.reload();
  await page.waitForSelector('body[data-vue="V1"]');
}

async function lancerLaDictee(page: Page, sons = true): Promise<void> {
  await ouvrirAvecListe(page, sons);
  await page.getByRole('button', { name: 'En dictée' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');
}

test('le mot est dit lentement, caché, et se dévoile lettre par lettre', async ({ page }) => {
  await espionnerLaVoix(page, 'presente');
  await lancerLaDictee(page);

  await expect.poll(() => dits(page)).toHaveLength(1);
  const [premier] = await dits(page);
  expect(premier.texte).toBe('chat');
  expect(premier.debit, 'le mot doit être dit plus lentement qu’une consigne').toBeLessThan(0.9);

  // ni à l'œil, ni pour un lecteur d'écran : le mot n'est écrit nulle part
  await expect(page.locator('[data-mot]')).toHaveText('____');
  await expect(page.locator('body')).not.toContainText('chat');
  // rien ne désigne la touche : ni le clavier, ni le doigt des mains dessinées
  await expect(allumees(page)).toHaveCount(0);
  await expect(page.locator('[data-doigt]')).toHaveAttribute('data-doigt', 'aucun');

  await frapper(page, 'fr-FR', 'c');
  await expect(page.locator('[data-mot]')).toHaveText('c___');
  await frapper(page, 'fr-FR', 'h');
  await expect(page.locator('[data-mot]')).toHaveText('ch__');
});

test("l'hésitation n'allume aucune touche", async ({ page }) => {
  await espionnerLaVoix(page, 'presente');
  await lancerLaDictee(page);
  await page.waitForTimeout(5200);
  await expect(allumees(page)).toHaveCount(0);
});

test('la première faute redit le mot, la troisième donne la lettre', async ({ page }) => {
  await espionnerLaVoix(page, 'presente');
  await lancerLaDictee(page);
  await expect.poll(() => dits(page)).toHaveLength(1);

  await frapper(page, 'fr-FR', 'x');
  await expect.poll(() => dits(page)).toHaveLength(2);
  expect((await dits(page))[1].texte).toBe('chat');
  expect(await curseur(page)).toBe(0);
  await expect(page.locator('[data-mot]')).toHaveText('____');

  // la deuxième ne redit rien et ne montre toujours rien
  await page.waitForTimeout(250);
  await frapper(page, 'fr-FR', 'x');
  await page.waitForTimeout(250);
  expect(await dits(page)).toHaveLength(2);
  await expect(allumees(page)).toHaveCount(0);

  // la troisième : la touche s'allume — jamais d'échec, l'enfant finit le mot
  await frapper(page, 'fr-FR', 'x');
  await expect(allumees(page)).toHaveCount(1);
  await page.waitForTimeout(250);
  await frapper(page, 'fr-FR', 'c');
  await expect(page.locator('[data-mot]')).toHaveText('c___');
  await expect(allumees(page)).toHaveCount(0);
});

test('le bouton haut-parleur redit le mot, et rend le clavier à la leçon', async ({ page }) => {
  await espionnerLaVoix(page, 'presente');
  await lancerLaDictee(page);
  await expect.poll(() => dits(page)).toHaveLength(1);

  await page.getByRole('button', { name: 'Réécouter le mot' }).click();
  await expect.poll(() => dits(page)).toHaveLength(2);
  expect((await dits(page))[1].texte).toBe('chat');

  await frapper(page, 'fr-FR', 'c');
  await expect(page.locator('[data-mot]')).toHaveText('c___');
});

test('sons coupés : la voix de la dictée parle quand même', async ({ page }) => {
  await espionnerLaVoix(page, 'presente');
  await lancerLaDictee(page, false);
  await expect.poll(() => dits(page)).toHaveLength(1);
});

test('la copie reste la copie : mot écrit, touche allumée, aucune voix', async ({ page }) => {
  await espionnerLaVoix(page, 'presente');
  await ouvrirAvecListe(page, true);
  await page.getByRole('button', { name: /Semaine 12/ }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');

  await expect(page.locator('[data-mot]')).toHaveText('chat');
  await expect(allumees(page)).toHaveCount(1);
  await page.waitForTimeout(300);
  expect(await dits(page)).toHaveLength(0);
});

test.describe('sans voix française', () => {
  test('la dictée est fermée, avec un mot pour le parent', async ({ page }) => {
    await espionnerLaVoix(page, 'absente');
    await ouvrirAvecListe(page, true);

    await expect(page.getByText('Il manque une voix française sur cet appareil')).toBeVisible();
    await expect(page.getByRole('button', { name: 'En dictée' })).toBeDisabled();
    // la copie, elle, reste ouverte
    await expect(page.getByRole('button', { name: /Semaine 12/ })).toBeEnabled();
  });

  test("une voix qui arrive en différé l'ouvre", async ({ page }) => {
    await espionnerLaVoix(page, 'differee');
    await ouvrirAvecListe(page, true);
    await expect(page.getByRole('button', { name: 'En dictée' })).toBeDisabled();

    await page.evaluate(() => (window as unknown as { __voixArrive: () => void }).__voixArrive());
    await expect(page.getByRole('button', { name: 'En dictée' })).toBeEnabled();
    await expect(page.getByText('Il manque une voix française')).toHaveCount(0);
  });
});
