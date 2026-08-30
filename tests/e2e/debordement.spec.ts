import { expect, test } from '@playwright/test';
import { ouvrir } from './helpers/app';

/**
 * Régression gate Codex n°3 : compléter la matrice physique (², )/°, =/+,
 * '/?, ^ morte, Retour arrière) élargit chaque rangée d'un tiers. Aucun
 * débordement horizontal n'est toléré, à aucune largeur, à aucun palier.
 */
const LARGEURS = [375, 768, 1024, 1280, 1440];

/** Chaque vue à clavier, atteinte depuis l'accueil en un clic. */
const VUES: Array<[string, string | null]> = [
  ['V4', 'On commence !'],
  ['V2', 'Changer'],
  ['V6', 'Ma carte du clavier'],
  ['V3', 'Revoir : où mettre mes doigts'],
  ['V7', null], // engrenage
];

test.describe('aucun débordement horizontal', () => {
  for (const largeur of LARGEURS) {
    for (const palier of [1, 7]) {
      test(`${largeur} px, palier ${palier}`, async ({ page }) => {
        await page.setViewportSize({ width: largeur, height: 900 });
        await ouvrir(page, 'fr-FR', palier);

        const mesurer = async (vue: string) => {
          const debordement = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          );
          expect(debordement, `${vue} déborde horizontalement`).toBeLessThanOrEqual(1);

          const hors = await page.evaluate((w) => {
            const mauvaises: string[] = [];
            for (const el of document.querySelectorAll<HTMLElement>('[data-code]')) {
              const r = el.getBoundingClientRect();
              if (r.left < -0.5 || r.right > w + 0.5) mauvaises.push(el.dataset.code ?? '?');
            }
            return mauvaises;
          }, largeur);
          expect(hors, `${vue} : touches hors cadre — ${hors.join(', ')}`).toEqual([]);
        };

        await mesurer('V1');
        for (const [vue, bouton] of VUES) {
          if (bouton) await page.getByRole('button', { name: bouton }).click();
          else await page.getByLabel('Réglages').click();
          await expect(page.locator('body')).toHaveAttribute('data-vue', vue);
          await mesurer(vue);
          await page.reload();
          await page.waitForSelector('body[data-vue="V1"]');
        }
      });
    }
  }
});

/* Gate Codex n°8 : les frappes parties d'un contrôle focalisé sont ignorées.
   Corollaire à ne pas rater — après un clic souris sur un bouton de la leçon,
   le clavier doit revenir à la leçon, sinon plus rien ne se tape. */
test('un clic souris sur un bouton de la leçon rend le clavier à la leçon', async ({ page }) => {
  await ouvrir(page, 'fr-FR', 1);
  await page.getByRole('button', { name: 'On commence !' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');

  await page.getByRole('button', { name: 'Je tape sans regarder' }).click();
  expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe('BUTTON');

  const mot = (await page.locator('[data-mot]').first().getAttribute('data-mot'))!;
  const { frapper } = await import('./helpers/keyboard');
  await frapper(page, 'fr-FR', mot[0]);
  await expect(page.locator('[data-mot]')).toHaveAttribute('data-curseur', '1');
});

test.describe('touches dessinables mais non proposables', () => {
  test('Retour arrière et touches mortes sont dessinés, éteints et sans cadenas', async ({
    page,
  }) => {
    await ouvrir(page, 'fr-FR', 1);
    await page.getByRole('button', { name: 'On commence !' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');

    for (const code of ['BracketLeft', 'Backquote', 'Minus', 'Equal']) {
      const touche = page.locator(`[data-code="${code}"]`);
      await expect(touche, `${code} devrait être dessinée`).toBeVisible();
      await expect(touche, `${code} devrait être éteinte`).toHaveAttribute('data-etat', 'eteinte');
      // le cadenas dit « ça arrive plus tard » : jamais sur une touche inerte
      await expect(touche.locator('svg')).toHaveCount(0);
    }

    // à l'inverse, la rangée des chiffres FR-FR arrive au palier 7 : cadenas
    await expect(page.locator('[data-code="Digit1"] svg')).toHaveCount(1);
  });

  test('CH-FR : le ^ mort est là, éteint', async ({ page }) => {
    await ouvrir(page, 'fr-CH', 1);
    await page.getByRole('button', { name: 'On commence !' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');
    for (const code of ['Equal', 'BracketRight', 'Minus']) {
      await expect(page.locator(`[data-code="${code}"]`)).toHaveAttribute('data-etat', 'eteinte');
    }
    /* Les chiffres ne sont plus ouverts dès la première étape en CH-FR : la v2
       les place à la même étape pour les deux dispositions. Ils sont donc
       dessinés et cadenassés — annoncés, pas absents. */
    await expect(page.locator('[data-code="Digit4"] svg')).toHaveCount(1);
    // le Retour arrière a été retiré du dessin : plus aucune trace
    await expect(page.locator('[data-code="Backspace"]')).toHaveCount(0);
  });
});

/* Régression : à 1440×900, le repli (flex-wrap) de la rangée mains+clavier
   envoyait la main gauche AU-DESSUS du clavier, la droite en dessous, et la
   page débordait verticalement. Les mains doivent ENCADRER le clavier. */
test.describe('V3 : les mains encadrent le clavier', () => {
  for (const [largeur, hauteur] of [
    [1440, 900],
    [1280, 720],
  ] as const) {
    test(`${largeur}×${hauteur} : mains de part et d'autre, page sans ascenseur`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: largeur, height: hauteur });
      await ouvrir(page, 'fr-FR', 1);
      await page.getByRole('button', { name: 'Revoir : où mettre mes doigts' }).click();
      await expect(page.locator('body')).toHaveAttribute('data-vue', 'V3');

      const gauche = (await page.getByText('main gauche', { exact: true }).locator('..').boundingBox())!;
      const droite = (await page.getByText('main droite', { exact: true }).locator('..').boundingBox())!;
      const toucheG = (await page.locator('[data-code="KeyQ"]').boundingBox())!;
      const toucheD = (await page.locator('[data-code="KeyM"]').boundingBox())!;

      // chaque main est SUR LE CÔTÉ du clavier, pas au-dessus ni en dessous
      expect(gauche.x + gauche.width).toBeLessThan(toucheG.x);
      expect(droite.x).toBeGreaterThan(toucheD.x + toucheD.width);
      // ... et sur la même ligne que lui (le duo encadre, centré)
      const centre = (b: { y: number; height: number }) => b.y + b.height / 2;
      expect(Math.abs(centre(gauche) - centre(droite))).toBeLessThanOrEqual(2);
      expect(centre(gauche)).toBeGreaterThan(toucheG.y - 100);
      expect(centre(gauche)).toBeLessThan(toucheG.y + 400);

      const deborde = await page.evaluate(
        () => document.documentElement.scrollHeight - document.documentElement.clientHeight,
      );
      expect(deborde, 'la page déborde verticalement').toBeLessThanOrEqual(1);
    });
  }
});

/* Régression signalée le 2026-08-29 : les réglages ne tenaient pas dans un
   écran (1023 px de contenu pour 900 px de fenêtre) et `body{overflow:hidden}`
   — la règle « un item = un écran » du cahier (P7) — interdisait de défiler.
   Le bas du formulaire était donc INATTEIGNABLE. P7 vaut pour la leçon, pas
   pour un formulaire : c'est le contenu qui défile, à l'intérieur de l'écran. */
test.describe('les écrans de formulaire restent atteignables', () => {
  for (const [largeur, hauteur] of [
    [1280, 720],
    [1024, 640],
  ] as const) {
    test(`réglages : on atteint le bas en ${largeur}×${hauteur}`, async ({ page }) => {
      await page.setViewportSize({ width: largeur, height: hauteur });
      await ouvrir(page, 'fr-FR', 1);
      await page.getByLabel('Réglages').click();
      await expect(page.locator('body')).toHaveAttribute('data-vue', 'V7');

      const dernier = page.getByRole('button', { name: 'Changer de joueur' });
      await dernier.scrollIntoViewIfNeeded();
      await expect(dernier).toBeInViewport();

      // La page elle-même ne défile jamais : c'est le contenu qui bouge.
      const pageDefile = await page.evaluate(
        () => document.documentElement.scrollHeight > document.documentElement.clientHeight,
      );
      expect(pageDefile).toBe(false);
    });
  }
});
