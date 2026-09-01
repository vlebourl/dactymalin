import { expect, test } from '@playwright/test';
import { creeListe, jouerItem, ouvrir } from './helpers/app';

/* Régression #107. La rangée de points se remplissait, puis se vidait, sans
   que rien d'autre ne bouge : un enfant pouvait la finir deux fois de suite en
   lisant « Leçon 1 sur 7 » figé. Les points ne comptaient vers rien.
   L'exercice est l'échelon manquant entre le mot et la leçon, et il a
   désormais son compteur — ce que #86 avait retiré, sur la foi d'une
   interdiction du cahier depuis levée : sans dénominateur, l'enfant ne peut
   pas savoir où il en est.

   Ces tests tiennent les trois bouts : le compteur s'affiche, il avance quand
   la rangée se vide, et une liste de la maison n'en a pas. */

const LONGUE = 120_000;
const pleins = (page: import('@playwright/test').Page) =>
  page.locator('[data-pastille="pleine"]');
const compteur = (page: import('@playwright/test').Page) => page.locator('[data-exercice]');

test.describe("le compteur d'exercices de l'entête", () => {
  test('la leçon annonce à quel exercice on en est, et combien il y en a', async ({ page }) => {
    await ouvrir(page, 'fr-FR', 1, false, 'Joueur 1', 'decouverte', 0, LONGUE);
    await page.getByRole('button', { name: 'On commence !' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');

    await expect(compteur(page)).toHaveAttribute('data-exercice', '1');
    const total = Number(await compteur(page).getAttribute('data-exercices'));
    expect(total).toBeGreaterThanOrEqual(2);
    await expect(compteur(page)).toHaveText(`Exercice 1 sur ${total}`);

    // le compte des mots reste offert aux lecteurs d'écran, sur la rangée
    await expect(page.locator('[data-serie-total]')).toHaveAttribute(
      'aria-label',
      `Mots de cet exercice : 0 sur ${await page.locator('[data-pastille]').count()}`,
    );
  });

  test("la rangée qui se vide fait avancer l'exercice — elle ne repart plus de rien", async ({
    page,
  }) => {
    await ouvrir(page, 'fr-FR', 1, false, 'Joueur 1', 'decouverte', 0, LONGUE);
    await page.getByRole('button', { name: 'On commence !' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');

    const mots = await page.locator('[data-pastille]').count();
    await expect(compteur(page)).toHaveAttribute('data-exercice', '1');

    /* On tape l'exercice ENTIER : c'est le geste exact du bug — la rangée se
       remplit, se vide, et il fallait que quelque chose bouge à ce moment-là. */
    for (let n = 1; n <= mots; n++) {
      expect(await jouerItem(page, 'fr-FR'), `mot ${n}`).not.toBeNull();
    }

    await expect(compteur(page)).toHaveAttribute('data-exercice', '2');
    await expect(compteur(page)).toHaveText(/^Exercice 2 sur /);
    // la rangée est bien repartie à zéro, mais l'échelon du dessus a avancé
    await expect(pleins(page)).toHaveCount(0);
  });

  test('le total annoncé ne bouge pas en cours de leçon', async ({ page }) => {
    await ouvrir(page, 'fr-FR', 1, false, 'Joueur 1', 'decouverte', 0, LONGUE);
    await page.getByRole('button', { name: 'On commence !' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');

    const total = await compteur(page).getAttribute('data-exercices');
    const mots = await page.locator('[data-pastille]').count();
    for (let n = 1; n <= mots; n++) await jouerItem(page, 'fr-FR');
    // la file se recharge en cours de route : le dénominateur ne doit pas
    // grandir sous les yeux de l'enfant.
    await expect(compteur(page)).toHaveAttribute('data-exercices', total!);
  });

  test("la liste de la maison n'affiche pas d'exercice : elle n'en a qu'un", async ({ page }) => {
    await ouvrir(page, 'fr-FR', 1, false, 'Joueur 1', 'decouverte', 0, LONGUE);
    await creeListe(page, 'Les mots de Papa', ['la', 'le', 'lu']);
    await page.reload();
    await page.waitForSelector('body[data-vue="V1"]');
    await page.getByRole('button', { name: /Les mots de Papa/ }).click();
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');

    await expect(compteur(page)).toHaveCount(0);
    await expect(page.locator('[data-pastille]')).toHaveCount(3);
  });
});
