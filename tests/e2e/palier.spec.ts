import { expect, test } from '@playwright/test';
import { jouerBlocParfait, jouerItem, ouvrir, sauvegarde } from './helpers/app';

/**
 * Régression itération 003, point 1 : six blocs SANS UNE SEULE ERREUR
 * n'ouvraient pas le palier au mérite — c'est le plafond anti-mur (6 blocs)
 * qui finissait par le faire, ce qui transformait le critère pédagogique en
 * minuteur déguisé. Trois blocs parfaits doivent suffire, et de loin.
 */
test.describe('passage de palier au mérite', () => {
  test('trois blocs parfaits ouvrent le palier 2, bien avant le plafond', async ({ page }) => {
    test.slow();
    await ouvrir(page, 'fr-FR');
    await page.getByRole('button', { name: 'On commence !' }).click();

    for (let bloc = 0; bloc < 3; bloc++) {
      await jouerBlocParfait(page, 'fr-FR');
      const etat = await sauvegarde(page);
      // Le plafond ne doit jamais être la cause : on reste sous ses 6 blocs.
      expect(etat.blocsSurPalier).toBeLessThan(6);
      if (etat.palier > 1) break;
      await page.getByRole('button', { name: 'Encore' }).click();
      await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');
    }

    const etat = await sauvegarde(page);
    expect(etat.palier).toBe(2);
  });
});

test.describe('« Je tape sans regarder »', () => {
  /* Régression itération 003, point 2 : le masquage ne se réarmait jamais.
     Un seul clic faisait jouer tout le reste du bloc à l'aveugle. */
  test('le clavier revient de lui-même au mot suivant', async ({ page }) => {
    await ouvrir(page, 'fr-FR');
    await page.getByRole('button', { name: 'On commence !' }).click();
    // Le masquage replie un ANCÊTRE (hauteur 0, overflow hidden) : mesurer la
    // touche seule ne dit rien, c'est la chaîne entière qui compte.
    const hauteurF = () =>
      page.locator('[data-code="KeyF"]').evaluate((n) => {
        for (let p = n.parentElement; p; p = p.parentElement) {
          if (p.getBoundingClientRect().height === 0) return 0;
        }
        return n.getBoundingClientRect().height;
      });

    expect(await hauteurF()).toBeGreaterThan(0);
    await page.getByRole('button', { name: 'Je tape sans regarder' }).click();
    expect(await hauteurF()).toBe(0);

    await jouerItem(page, 'fr-FR');
    expect(await hauteurF()).toBeGreaterThan(0);
    await expect(page.getByRole('button', { name: 'Je tape sans regarder' })).toBeVisible();
  });

  test('le bouton de retour rend le clavier immédiatement', async ({ page }) => {
    await ouvrir(page, 'fr-FR');
    await page.getByRole('button', { name: 'On commence !' }).click();
    await page.getByRole('button', { name: 'Je tape sans regarder' }).click();
    await page.getByRole('button', { name: 'Remontre-moi le clavier' }).click();
    expect(
      await page.locator('[data-code="KeyF"]').evaluate((n) => n.getBoundingClientRect().height),
    ).toBeGreaterThan(0);
  });
});
