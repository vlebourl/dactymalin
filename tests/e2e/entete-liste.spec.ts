import { expect, test } from '@playwright/test';
import { creeListe, ouvrir } from './helpers/app';

/**
 * #77 — une liste de la maison ne fait avancer ni l'étape ni la leçon.
 * L'entête affichait pourtant « Étape N sur 10 », la jauge d'étape et
 * « Leçon n sur 7 » : l'enfant croyait progresser dans son parcours pendant
 * qu'aucun de ces compteurs ne bougeait.
 */

/** Un nom au plafond des 40 caractères, pour éprouver aussi le cadre étroit. */
const NOM_LONG = 'Dictée de la semaine du 2 septembre 2026';

test("l'entête d'une liste de la maison n'annonce aucun rang de parcours", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await ouvrir(page, 'fr-FR', 3, false, 'Joueur 1', 'decouverte', 2, 600_000);
  await creeListe(page, NOM_LONG, ['dinosaure', 'papillon']);

  // — d'abord le parcours : les trois repères y sont, et doivent y rester.
  await page.getByRole('button', { name: 'On commence !' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');
  const entete = page.locator('header');
  await expect(entete).toContainText('Étape 3 sur 10');
  await expect(entete).toContainText(/Leçon \d+ sur \d+/);
  await expect(page.getByRole('img', { name: /Leçon \d+ sur \d+/ })).toHaveCount(1);
  /* Depuis #78 la jauge d'étape porte un libellé VISIBLE : il fait partie des
     repères de parcours, donc il doit disparaître avec eux. */
  await expect(page.getByText("Avancement de l'étape")).toBeVisible();

  // — puis la liste de la maison, sur le même écran.
  await page.reload();
  await page.waitForSelector('body[data-vue="V1"]');
  await page.getByRole('button', { name: new RegExp(NOM_LONG) }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');

  await expect(entete).not.toContainText(/Étape \d+ sur \d+/);
  await expect(entete).not.toContainText(/Leçon \d+ sur \d+/);
  // la jauge d'étape est un `role="img"` dont le nom porte le rang de parcours
  await expect(page.getByRole('img', { name: /Étape|Leçon/ })).toHaveCount(0);
  // …et son libellé visible s'en va avec elle (#78) : une liste n'avance aucune étape
  await expect(page.getByText("Avancement de l'étape")).toHaveCount(0);

  // — elle annonce la liste, et le nom entier est là
  await expect(entete).toContainText(`Ta liste : ${NOM_LONG}`);

  /* La rangée de points garde la même sémantique dans les deux modes (#76) :
     un point par exercice de la série, ici les deux mots de la liste. */
  await expect(page.locator('[data-serie-total]')).toHaveAttribute('data-serie-total', '2');

  // — et rien ne sort du cadre à 375 px, nom long compris
  await page.evaluate(() => document.fonts.ready);
  const debordement = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(debordement, "l'entête de liste déborde horizontalement").toBeLessThanOrEqual(1);
});
