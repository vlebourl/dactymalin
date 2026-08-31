import { expect, test } from '@playwright/test';
import { ouvrir } from './helpers/app';
import { LECONS_PAR_ETAPE } from '../../src/core/parcours';

/* Régression #78. L'entête superposait deux mesures d'échelles différentes
   sans un mot pour les distinguer : une barre fine disait l'avancement dans
   l'ÉTAPE (7 leçons), la rangée de points celui de la SÉRIE en cours. La barre
   faisait cinq pixels, sa teinte était douce, et son seul libellé apparaissait
   au SURVOL — donc jamais sur tablette.

   Ces tests n'effectuent aucun survol : c'est tout leur objet. */
test.describe("la jauge d'étape se distingue des points de série", () => {
  /* Une leçon longue : une leçon qui se termine pendant la mesure ferait
     basculer l'écran sur la vue de fin, et on mesurerait autre chose. */
  const LONGUE = 600_000;

  test("le libellé de l'étape est lisible sans le moindre survol", async ({ page }) => {
    await ouvrir(page, 'fr-FR', 3, false, 'Lila', 'decouverte', 2, LONGUE);
    await page.getByRole('button', { name: 'On commence !' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');

    // aucun hover, aucun focus : le texte doit être là, tout simplement
    await expect(page.getByText("Avancement de l'étape")).toBeVisible();

    /* Le nom accessible de la jauge ne bouge pas : d'autres tests s'y
       appuient, et un lecteur d'écran doit toujours entendre les deux. */
    await expect(page.getByLabel(`Étape 3 · Leçon 3 sur ${LECONS_PAR_ETAPE}`)).toBeVisible();
  });

  test('la barre et les pastilles ne peuvent pas être prises pour la même mesure', async ({
    page,
  }) => {
    await ouvrir(page, 'fr-FR', 3, false, 'Lila', 'decouverte', 2, LONGUE);
    await page.getByRole('button', { name: 'On commence !' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');

    const jauge = page.getByLabel(`Étape 3 · Leçon 3 sur ${LECONS_PAR_ETAPE}`);
    const boite = await jauge.boundingBox();
    const pastille = await page.locator('[data-pastille]').first().boundingBox();
    expect(boite).not.toBeNull();
    expect(pastille).not.toBeNull();

    // une barre franche, plus haute que les cinq pixels d'origine
    expect(boite!.height).toBeGreaterThanOrEqual(10);
    // continue et longue, là où une pastille est un petit rond
    expect(boite!.width).toBeGreaterThan(boite!.height * 3);
    expect(pastille!.width).toBeLessThan(boite!.height * 3);

    /* Perceptible sur fond clair : la jauge est cernée d'un trait, sans quoi
       sa piste très pâle se confondait avec le papier. */
    const cerne = await jauge.evaluate((el) => {
      const s = getComputedStyle(el);
      return { largeur: parseFloat(s.borderTopWidth), couleur: s.borderTopColor };
    });
    expect(cerne.largeur).toBeGreaterThan(0);
    expect(cerne.couleur).not.toBe('rgba(0, 0, 0, 0)');
  });
});
