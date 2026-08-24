import { expect, test } from '@playwright/test';
import { ouvrir } from './helpers/app';

/**
 * Régression itération 002, point critique n°1 : les touches de la leçon et les
 * touches éteintes avaient 0,008 d'écart de luminance relative. En niveaux de
 * gris, l'appartenance à la leçon — l'information la plus utile de l'écran
 * après la cible — disparaissait entièrement. Le cahier (P1) l'interdit.
 */

/** Luminance relative WCAG d'une couleur `rgb(…)` telle que le navigateur la rend. */
function luminance(css: string): number {
  const canaux = (css.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
  const c = canaux.map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

async function styleTouche(page: import('@playwright/test').Page, etat: string) {
  return page.locator(`[data-etat="${etat}"]`).first().evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      fond: s.backgroundColor,
      encre: s.color,
      bord: parseFloat(s.borderTopWidth),
    };
  });
}

const contraste = (a: number, b: number) =>
  (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

test.describe('états de touche lisibles sans couleur', () => {
  test.beforeEach(async ({ page }) => {
    await ouvrir(page, 'fr-FR');
    await page.getByRole('button', { name: 'On commence !' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');
  });

  test('une touche de la leçon se distingue d\'une touche éteinte en niveaux de gris', async ({
    page,
  }) => {
    const ouverte = await styleTouche(page, 'ouverte');
    const eteinte = await styleTouche(page, 'eteinte');

    const lumOuverte = luminance(ouverte.fond);
    const lumEteinte = luminance(eteinte.fond);
    // porteur n°1 : la luminance du fond
    expect(Math.abs(lumOuverte - lumEteinte)).toBeGreaterThanOrEqual(0.05);
    // porteur n°2 : l'épaisseur du liseré
    expect(ouverte.bord).toBeGreaterThanOrEqual(eteinte.bord * 2);
  });

  test('la touche cible reste plus claire que l\'encre et lisible à 7:1', async ({ page }) => {
    const cible = await styleTouche(page, 'cible');
    const lumFond = luminance(cible.fond);
    const lumEncre = luminance(cible.encre);
    // La lettre la plus importante de l'écran doit être la mieux lisible.
    expect(contraste(lumFond, lumEncre)).toBeGreaterThanOrEqual(7);
    // La cible n'est jamais la tache la plus sombre : ce vocabulaire est
    // réservé à l'enfoncement de l'erreur.
    const eteinte = await styleTouche(page, 'eteinte');
    expect(lumFond).toBeLessThan(luminance(eteinte.fond));
  });

  test('aucune légende de touche ne descend sous le plancher du cahier', async ({ page }) => {
    const tailles = await page
      .locator('[data-code] span, [data-code="Space"]')
      .evaluateAll((els) => els.map((e) => parseFloat(getComputedStyle(e).fontSize)));
    expect(tailles.length).toBeGreaterThan(20);
    expect(Math.min(...tailles)).toBeGreaterThanOrEqual(14);
  });
});
