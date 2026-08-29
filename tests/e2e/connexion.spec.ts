import { expect, test } from '@playwright/test';
import { inscrit, courrielUnique, MDP_TEST, ouvrir } from './helpers/app';

/**
 * La connexion est OBLIGATOIRE, et c'est le premier écran. Le parent la
 * franchit une fois par appareil ; l'enfant ne la voit jamais.
 *
 * Ces tests n'utilisent pas `ouvrir()` : c'est justement le portail qu'ils
 * vérifient, avant que le helper ne le franchisse pour tous les autres.
 */
test.describe('connexion obligatoire', () => {
  test("au premier lancement, on atterrit sur la connexion et nulle part ailleurs", async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'connexion');
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible();
  });

  test('créer un compte mène au choix du profil, puis à la leçon', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Créer un compte' }).click();
    await page.getByLabel('Adresse électronique').fill(courrielUnique());
    await page.getByLabel(/Mot de passe/).fill(MDP_TEST);
    await page.getByRole('button', { name: 'Créer notre compte' }).click();

    /* Appareil neuf : on enchaîne sur le choix du clavier, première étape du
       parcours. Ce qui compte ici est qu'on ait quitté le portail pour de bon
       et qu'on soit entré dans l'application. */
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V2');
  });

  /* Assertions POSITIVES : `not.toHaveAttribute('connexion')` serait déjà
     satisfait par l'état transitoire « chargement », donc passerait même si
     l'app restait bloquée avant le premier écran. */
  test('un rechargement ne redemande pas la connexion', async ({ page }) => {
    await inscrit(page);
    await page.goto('/');
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V2');
    await page.reload();
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V2');
  });

  /* Le chemin « j'ai déjà un compte » : le helper e2e passe par l'API, donc
     sans ce test l'écran de connexion lui-même ne serait jamais exercé avec
     un mot de passe VALIDE. */
  test('se reconnecter à l’écran avec le bon mot de passe', async ({ page }) => {
    const email = await inscrit(page);
    await page.context().clearCookies();
    await page.goto('/');
    await page.getByLabel('Adresse électronique').fill(email);
    await page.getByLabel(/Mot de passe/).fill(MDP_TEST);
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V2');
  });

  test('un mot de passe erroné est refusé, et ne connecte pas', async ({ page }) => {
    const email = await inscrit(page);
    await page.context().clearCookies();
    await page.goto('/');
    await page.getByLabel('Adresse électronique').fill(email);
    await page.getByLabel(/Mot de passe/).fill('nimportequoi');
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page.getByRole('alert')).toHaveText(/incorrect/);
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'connexion');
  });

  test('se déconnecter ramène à la connexion', async ({ page }) => {
    await ouvrir(page);
    await page.getByLabel('Réglages').click();
    await page.getByRole('button', { name: 'Ouvrir' }).click();
    await page.getByRole('button', { name: 'Se déconnecter' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'connexion');
  });
});
