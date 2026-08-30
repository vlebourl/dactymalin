import { expect, test } from '@playwright/test';
import { jouerBlocParfait, ouvrir, sauvegarde } from './helpers/app';

/**
 * Ce que ce fichier vérifiait, et pourquoi il ne le vérifie plus.
 *
 * Il exigeait que trois blocs parfaits ouvrent le palier « au mérite », bien
 * avant le plafond anti-mur. L'intention était juste — le critère ne devait pas
 * être un minuteur déguisé — mais elle ne pouvait pas tenir : le critère de
 * maîtrise exigeait des frappes sans aide, et l'aide monte après trois secondes
 * d'hésitation. Un débutant réel ne le franchissait donc JAMAIS au mérite ; seul
 * un joueur parfait, comme ce test, y arrivait.
 *
 * La v2 arrête de prétendre mesurer une maîtrise pour décider du passage (#38).
 * L'étape se termine après sept leçons, annoncées d'avance. Le test devient donc
 * l'inverse de ce qu'il était : le passage ne doit dépendre QUE du compte de
 * leçons, et surtout pas de la qualité des frappes.
 */
test.describe("passage d'étape au quota", () => {
  test('jouer parfaitement n’ouvre pas l’étape suivante plus tôt', async ({ page }) => {
    test.slow();
    await ouvrir(page, 'fr-FR');
    await page.getByRole('button', { name: 'On commence !' }).click();

    for (let lecon = 0; lecon < 3; lecon++) {
      await jouerBlocParfait(page, 'fr-FR');
      const etat = await sauvegarde(page);
      /* Trois leçons parfaites : l'étape ne bouge pas. C'est voulu — la
         maîtrise compose le contenu, elle ne commande plus le passage. */
      expect(etat.palier).toBe(1);
      await page.getByRole('button', { name: 'Encore' }).click();
      await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');
    }
  });
});
