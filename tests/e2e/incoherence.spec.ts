import { expect, test } from '@playwright/test';
import { ouvrir } from './helpers/app';
import { frapperCouple } from './helpers/keyboard';

/**
 * Régression itération 002, point majeur n°4 : `doitProposerV2()` existait,
 * son test unitaire passait, mais la fonction n'était appelée nulle part.
 * En AZERTY confirmé, six frappes parfaitement cohérentes avec le QWERTZ ne
 * produisaient rien. F7 (Must-Have du sprint 2) était donc absent.
 */
test.describe('surveillance de disposition en jeu (F7)', () => {
  test('5 frappes QWERTZ en AZERTY interrompent la leçon et reproposent V2', async ({ page }) => {
    await ouvrir(page, 'fr-FR');
    await page.getByRole('button', { name: 'On commence !' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');

    // (KeyY → « z ») n'existe qu'en QWERTZ ; en AZERTY, KeyY produit « y ».
    for (let i = 0; i < 5; i++) {
      await frapperCouple(page, 'KeyY', 'z');
      await page.waitForTimeout(30);
    }

    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V2');
    await expect(page.getByRole('heading', { name: 'Regarde ton vrai clavier' })).toBeVisible();
    await expect(page.getByText('Appuie sur la touche A')).toBeVisible();
  });

  test('une frappe cohérente remet le compteur à zéro', async ({ page }) => {
    await ouvrir(page, 'fr-FR');
    await page.getByRole('button', { name: 'On commence !' }).click();

    for (let i = 0; i < 4; i++) {
      await frapperCouple(page, 'KeyY', 'z');
      await page.waitForTimeout(30);
    }
    // (KeyQ → « a ») est le discriminant AZERTY : le doute retombe
    await frapperCouple(page, 'KeyQ', 'a');
    await page.waitForTimeout(30);
    for (let i = 0; i < 4; i++) {
      await frapperCouple(page, 'KeyY', 'z');
      await page.waitForTimeout(30);
    }
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');
  });
});
