import { expect, test } from '@playwright/test';
import { ouvrir } from './helpers/app';

/**
 * #105 — rien dans l'application ne disait quelle version tournait. Le pied des
 * réglages le dit maintenant ; il reste réservé à l'adulte.
 */
test('le pied des réglages dit ce qui tourne, discrètement', async ({ page }) => {
  await ouvrir(page, 'fr-FR', 1);
  await page.getByLabel('Réglages').click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V7');

  const ligne = page.getByTestId('version-app');
  await expect(ligne).toBeVisible();
  /* L'heure de démarrage est ce qui distingue deux déploiements : sans elle, la
     ligne retomberait sur le numéro figé de `package.json`. */
  await expect(ligne).toHaveText(/version \d+\.\d+\.\d+ · en ligne depuis le /);

  /* Discret : plus petit et plus éteint que le titre de l'écran. */
  const taille = await ligne.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  const titre = page.getByRole('heading', { name: 'Réglages' });
  const tailleTitre = await titre.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(taille).toBeLessThan(14);
  expect(taille).toBeLessThan(tailleTitre / 2);
});

test("l'écran de jeu de l'enfant n'en montre rien", async ({ page }) => {
  await ouvrir(page, 'fr-FR', 1);
  await expect(page.getByTestId('version-app')).toHaveCount(0);
  await page.getByLabel('Réglages').click();
  await expect(page.getByTestId('version-app')).toBeVisible();
  await page.getByLabel('Revenir').click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V1');
  await expect(page.getByTestId('version-app')).toHaveCount(0);
});
