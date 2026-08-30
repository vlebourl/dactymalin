import { expect, test } from '@playwright/test';
import { jouerBlocParfait, ouvrir, sauvegarde } from './helpers/app';
import { DELAI_INACTIVITE } from '../../src/core/aide';

/**
 * Gate Codex n°8 résiduel : l'horloge n'était rebasée qu'au RETOUR
 * (`focus` / `visibilitychange`). Une fenêtre peut rester visible — donc animée
 * par requestAnimationFrame — sans avoir le focus : l'aide d'inactivité montait
 * pendant que l'enfant était ailleurs, et il retrouvait la main qui pulse.
 */
test.describe('fenêtre laissée de côté', () => {
  /* Une main pulse = tous ses SEGMENTS de rangée pulsent (le clavier est une
     suite de rangées continues, plus deux colonnes) : on compte la présence,
     pas le nombre d'éléments. */
  const pulse = (p: import('@playwright/test').Page) => p.locator('[data-pulse="oui"]');

  test("l'aide d'inactivité ne monte pas pendant l'absence, et repart au retour", async ({
    page,
  }) => {
    await ouvrir(page, 'fr-FR');
    await page.getByRole('button', { name: 'On commence !' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');
    await expect(pulse(page)).toHaveCount(0);

    // la fenêtre perd le focus SANS être masquée (autre fenêtre au premier plan)
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await page.waitForTimeout(DELAI_INACTIVITE + 1200);
    expect(await pulse(page).count(), "l'aide a monté pendant l'absence").toBe(0);

    // au retour, l'horloge repart de zéro : l'aide arrive après le délai, pas avant
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await page.waitForTimeout(500);
    expect(await pulse(page).count(), "l'aide était déjà là au retour").toBe(0);
    await expect(pulse(page).first()).toBeVisible({ timeout: DELAI_INACTIVITE + 2000 });
  });
});

/**
 * #60 : rien n'écrivait `derniereLecon`. La révision du retour (§7.4) était
 * complète et testée, et ne pouvait pas se déclencher une seule fois en vrai —
 * l'enfant qui revient après quinze jours reprenait son étape à froid.
 */
test('une leçon finie date la sauvegarde', async ({ page }) => {
  await ouvrir(page, 'fr-FR');
  const avant = Date.now();
  await page.getByRole('button', { name: 'On commence !' }).click();
  await jouerBlocParfait(page, 'fr-FR');
  const { derniereLecon } = await sauvegarde(page);
  expect(derniereLecon, 'la leçon finie n’a rien daté').toBeGreaterThanOrEqual(avant);
});
