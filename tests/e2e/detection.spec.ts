import { expect, test } from '@playwright/test';
import { ouvrirNeuf } from './helpers/app';
import { frapperCouple } from './helpers/keyboard';

/**
 * Ce spec tourne aussi sur Firefox et WebKit : c'est le chemin de REPLI,
 * là où `navigator.keyboard.getLayoutMap()` n'existe pas et où une seule
 * frappe doit suffire à trancher.
 */
test.describe('détection de disposition (V2)', () => {
  test('une seule frappe suffit : KeyQ → a coche le Français', async ({ page }) => {
    await ouvrirNeuf(page);
    await expect(page.getByText('Appuie sur la touche A')).toBeVisible();

    await frapperCouple(page, 'KeyQ', 'a');
    await expect(page.locator('[data-disposition="fr-FR"]')).toHaveAttribute('data-detectee', 'oui');
    await expect(
      page.getByText('Sur ce clavier, les chiffres arrivent au palier de la touche Majuscule.'),
    ).toBeVisible();
  });

  test('KeyQ → q puis KeyY → z bascule sur le Suisse romand', async ({ page }) => {
    await ouvrirNeuf(page);
    await frapperCouple(page, 'KeyQ', 'q');
    await frapperCouple(page, 'KeyY', 'z');
    await expect(page.locator('[data-disposition="fr-CH"]')).toHaveAttribute('data-detectee', 'oui');
    await expect(
      page.getByText('Sur ce clavier, tu tapes des nombres dès la première leçon.'),
    ).toBeVisible();
  });

  test('le choix manuel a priorité absolue et est mémorisé', async ({ page }) => {
    await ouvrirNeuf(page);
    await page
      .locator('[data-disposition="fr-CH"]')
      .getByRole('button', { name: "C'est celui-là" })
      .click();
    const sauve = await page.evaluate(() => localStorage.getItem('tapeavecmoi.v1'));
    expect(JSON.parse(sauve ?? '{}')).toMatchObject({
      disposition: 'fr-CH',
      dispositionChoisieALaMain: true,
    });
  });
});
