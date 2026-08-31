import { expect, test } from '@playwright/test';
import { creeListe, jouerItem, ouvrir } from './helpers/app';

/* Régression #76. La rangée de points de l'entête montrait douze pastilles
   figées remplies par le TEMPS écoulé : elles avançaient toutes seules pendant
   que l'enfant ne tapait rien, et leur nombre ne disait rien du contenu joué.
   Un point vaut désormais un exercice de la série servie.

   Ces tests tiennent les deux bouts : N exercices tapés allument exactement N
   points, et attendre sans taper n'en allume aucun. */

const points = (page: import('@playwright/test').Page) => page.locator('[data-pastille]');
const pleins = (page: import('@playwright/test').Page) =>
  page.locator('[data-pastille="pleine"]');

test.describe("les points de l'entête comptent les exercices", () => {
  /* Une leçon LONGUE : c'est le seul moyen d'observer que le temps ne remplit
     rien. Avec la durée courte du harnais, la leçon se terminerait pendant
     l'attente et l'écran de fin masquerait la question. */
  const LONGUE = 120_000;

  test('la rangée porte un libellé lisible, et compte la série et non douze', async ({ page }) => {
    await ouvrir(page, 'fr-FR', 1, false, 'Joueur 1', 'decouverte', 0, LONGUE);
    await page.getByRole('button', { name: 'On commence !' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');

    // un texte VISIBLE dit ce qu'un point représente, pas seulement un aria-label
    await expect(page.getByText('Mots de cette série')).toBeVisible();

    /* Le nombre de points est celui de la série réellement servie (8 à 12
       selon le tirage), et non plus la constante figée à douze. */
    const total = await points(page).count();
    expect(total).toBeGreaterThanOrEqual(8);
    expect(total).toBeLessThanOrEqual(12);
    await expect(page.locator('[data-serie-total]')).toHaveAttribute(
      'data-serie-total',
      String(total),
    );
    await expect(pleins(page)).toHaveCount(0);
  });

  test('après N exercices tapés, N points sont allumés', async ({ page }) => {
    await ouvrir(page, 'fr-FR', 1, false, 'Joueur 1', 'decouverte', 0, LONGUE);
    await page.getByRole('button', { name: 'On commence !' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');

    for (let n = 1; n <= 4; n++) {
      expect(await jouerItem(page, 'fr-FR')).not.toBeNull();
      await expect(pleins(page)).toHaveCount(n);
      await expect(page.locator('[data-serie-pleines]')).toHaveAttribute(
        'data-serie-pleines',
        String(n),
      );
    }
  });

  test('attendre sans taper n’allume aucun point', async ({ page }) => {
    await ouvrir(page, 'fr-FR', 1, false, 'Joueur 1', 'decouverte', 0, LONGUE);
    await page.getByRole('button', { name: 'On commence !' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');

    /* Trois secondes sur une leçon de deux minutes : l'ancienne rangée, qui
       lisait le chrono, en aurait déjà rempli une ou deux. */
    await page.waitForTimeout(3000);
    await expect(pleins(page)).toHaveCount(0);
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');

    // et une frappe, elle, en allume bien un
    await jouerItem(page, 'fr-FR');
    await expect(pleins(page)).toHaveCount(1);
  });

  test('la liste de la maison compte pareil, et le dit pareil', async ({ page }) => {
    await ouvrir(page, 'fr-FR', 1, false, 'Joueur 1', 'decouverte', 0, LONGUE);
    await creeListe(page, 'Les mots de Papa', ['la', 'le', 'lu']);
    await page.reload();
    await page.waitForSelector('body[data-vue="V1"]');
    await page.getByRole('button', { name: /Les mots de Papa/ }).click();
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');

    await expect(page.getByText('Mots de cette série')).toBeVisible();
    // une liste a une fin CONNUE : autant de points que de mots écrits
    await expect(points(page)).toHaveCount(3);
    await expect(pleins(page)).toHaveCount(0);
    await jouerItem(page, 'fr-FR');
    await expect(pleins(page)).toHaveCount(1);
  });
});
