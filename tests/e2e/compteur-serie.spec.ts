import { expect, test } from '@playwright/test';
import { creeListe, jouerItem, ouvrir } from './helpers/app';

/* Régression #86. L'entête affichait « 4 / 12 » à droite de la rangée de
   points. Le cahier interdit « tout compteur d'exercices » sur l'écran de
   leçon (l. 588, l. 1054) : chiffrer l'effort en cours transforme un repère
   en score. Les points restent — ils disent la même chose sans nombre —, et
   le compte reste offert aux lecteurs d'écran, à qui rien n'est interdit.

   Ces tests tiennent les trois bouts : aucun chiffre visible dans la rangée,
   autant de points allumés qu'avant, et l'aria-label toujours chiffré. */

const LONGUE = 120_000;
const pleins = (page: import('@playwright/test').Page) =>
  page.locator('[data-pastille="pleine"]');
/** La ligne de l'entête qui porte le libellé, les points, et jadis le chiffre. */
const rangee = (page: import('@playwright/test').Page) =>
  page.locator('[data-serie-total]').locator('..');

test.describe("la rangée de points ne chiffre rien à l'écran", () => {
  test('en parcours, aucun nombre ne s’affiche, avant comme après des frappes', async ({
    page,
  }) => {
    await ouvrir(page, 'fr-FR', 1, false, 'Joueur 1', 'decouverte', 0, LONGUE);
    await page.getByRole('button', { name: 'On commence !' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');

    await expect(page.getByText('Mots de cette série')).toBeVisible();
    expect(await rangee(page).innerText()).not.toMatch(/\d/);

    for (let n = 1; n <= 3; n++) {
      expect(await jouerItem(page, 'fr-FR')).not.toBeNull();
      await expect(pleins(page)).toHaveCount(n);
      // le point s'allume, le chiffre ne revient pas
      expect(await rangee(page).innerText()).not.toMatch(/\d/);
    }
  });

  test('le compte reste donné aux lecteurs d’écran', async ({ page }) => {
    await ouvrir(page, 'fr-FR', 1, false, 'Joueur 1', 'decouverte', 0, LONGUE);
    await page.getByRole('button', { name: 'On commence !' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');

    expect(await jouerItem(page, 'fr-FR')).not.toBeNull();
    await expect(pleins(page)).toHaveCount(1);
    const total = await page.locator('[data-pastille]').count();
    await expect(page.locator('[data-serie-total]')).toHaveAttribute(
      'aria-label',
      `Mots de cette série : 1 sur ${total}`,
    );
  });

  test('la liste de la maison ne chiffre pas davantage', async ({ page }) => {
    await ouvrir(page, 'fr-FR', 1, false, 'Joueur 1', 'decouverte', 0, LONGUE);
    await creeListe(page, 'Les mots de Papa', ['la', 'le', 'lu']);
    await page.reload();
    await page.waitForSelector('body[data-vue="V1"]');
    await page.getByRole('button', { name: /Les mots de Papa/ }).click();
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');

    await expect(page.locator('[data-pastille]')).toHaveCount(3);
    expect(await rangee(page).innerText()).not.toMatch(/\d/);
    await jouerItem(page, 'fr-FR');
    await expect(pleins(page)).toHaveCount(1);
    expect(await rangee(page).innerText()).not.toMatch(/\d/);
  });
});
