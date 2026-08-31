import { expect, test } from '@playwright/test';
import { ouvrir } from './helpers/app';

/**
 * #90 — la légende des couleurs des réglages ne portait que « main gauche » et
 * « main droite ». Le cahier (l. 1188) en demande une troisième : les réglages
 * sont, hors onboarding, le SEUL endroit où le rôle des pouces est rappelé.
 */
test('la légende des réglages nomme aussi les pouces de la barre d\'espace', async ({ page }) => {
  await ouvrir(page, 'fr-FR', 1);
  await page.getByLabel('Réglages').click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V7');

  const legende = page.getByTestId('legende-couleurs');
  await expect(legende).toBeVisible();
  const entrees = legende.locator(':scope > span');
  await expect(entrees).toHaveCount(3);
  await expect(entrees.nth(0)).toHaveText(/main gauche/i);
  await expect(entrees.nth(1)).toHaveText(/main droite/i);
  await expect(entrees.nth(2)).toHaveText(/espace\s*:\s*tes pouces/i);

  /* La troisième puce suit la même logique visuelle que les deux autres — une
     touche en réduction — et emprunte la teinte NEUTRE de la barre d'espace du
     jeu : ni teal ni orange, qui disent déjà « une main » partout ailleurs. */
  const puces = legende.locator('i');
  await expect(puces).toHaveCount(3);
  const couleurs = await puces.evaluateAll((els) =>
    els.map((el) => {
      const s = getComputedStyle(el);
      return { fond: s.backgroundColor, liseré: s.borderTopColor, largeur: el.getBoundingClientRect().width };
    }),
  );
  expect(couleurs[2].fond).not.toBe(couleurs[0].fond);
  expect(couleurs[2].fond).not.toBe(couleurs[1].fond);
  expect(couleurs[2].liseré).not.toBe(couleurs[0].liseré);
  expect(couleurs[2].liseré).not.toBe(couleurs[1].liseré);
  // une barre, pas une touche carrée : c'est ce qui la fait lire « espace »
  expect(couleurs[2].largeur).toBeGreaterThan(couleurs[0].largeur);
});
