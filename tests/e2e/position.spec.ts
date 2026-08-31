import { expect, test } from '@playwright/test';
import { jouerBlocParfait, ouvrir } from './helpers/app';

/**
 * #88 — l'enfant lit où il en est, sur les trois écrans qui le taisaient.
 *
 * L'accueil s'arrêtait au nom du parcours, la fin de leçon ne disait la
 * position qu'au passage d'étape (une fois sur sept), et la carte listait dix
 * étapes sans nommer de quel parcours elles relèvent — ambigu dès que le
 * parent bascule de Découverte à Dactylo.
 */
test.describe('la position se lit', () => {
  test("l'accueil, la carte et la fin de leçon disent où en est l'enfant", async ({ page }) => {
    await ouvrir(page, 'fr-FR', 3, false, 'Joueur 1', 'decouverte', 1);

    // V1 : parcours ET position.
    await expect(page.getByText(/Parcours\s*:\s*Découverte/)).toBeVisible();
    await expect(page.getByText(/Étape 3, leçon 2 sur 7/)).toBeVisible();

    // V6 : l'en-tête nomme le parcours en cours.
    await page.getByRole('button', { name: 'Ma carte du clavier' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V6');
    await expect(page.getByText(/Parcours\s*:\s*Découverte/)).toBeVisible();

    // V5 : la position, sans qu'aucune étape ne vienne d'être débloquée.
    await page.getByRole('button', { name: 'Revenir' }).click();
    await page.getByRole('button', { name: 'On commence !' }).click();
    await jouerBlocParfait(page, 'fr-FR');
    await expect(page.getByText(/Étape 3 débloquée/)).toHaveCount(0);
    await expect(page.getByText(/Leçon 3 sur 7 de l'étape 3/)).toBeVisible();
  });

  test('rien ne déborde à 375 px sur les trois écrans', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await ouvrir(page, 'fr-FR', 3, false, 'Joueur 1', 'decouverte', 1);

    const sansDebordement = async (vue: string) => {
      await page.evaluate(() => document.fonts.ready);
      const debordement = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(debordement, `${vue} déborde horizontalement`).toBeLessThanOrEqual(1);
    };

    await sansDebordement('V1');
    await page.getByRole('button', { name: 'Ma carte du clavier' }).click();
    await sansDebordement('V6');
    await page.getByRole('button', { name: 'Revenir' }).click();
    await page.getByRole('button', { name: 'On commence !' }).click();
    await jouerBlocParfait(page, 'fr-FR');
    await sansDebordement('V5');
  });
});
