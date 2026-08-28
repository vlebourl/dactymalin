import { expect, test, type Page } from '@playwright/test';
import { ouvrir, sauvegarde } from './helpers/app';

/**
 * Comptes parents et synchronisation. Ces tests exigent l'API et sa base :
 *
 *   docker run -d --name pg-tapeavecmoi -e POSTGRES_USER=tapeavecmoi \
 *     -e POSTGRES_PASSWORD=tapeavecmoi -e POSTGRES_DB=tapeavecmoi \
 *     -p 55432:5432 postgres:17-alpine
 *   npm run db:migrate     # DATABASE_URL=…
 *   npm run server:dev
 *
 * Sans API, ils sont sautés : l'app doit rester testable sans serveur, comme
 * elle reste JOUABLE sans serveur.
 */
async function apiPresente(page: Page): Promise<boolean> {
  try {
    const r = await page.request.get('/api/health');
    return r.ok() && (await r.json()).db === 'ok';
  } catch {
    return false;
  }
}

const courriel = () => `parent-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@exemple.fr`;
const MDP = 'motdepasse-solide';

async function ouvrirLeCompte(page: Page) {
  await page.getByLabel('Réglages').click();
  await page.getByRole('button', { name: 'Ouvrir' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V9');
}

test.describe('comptes parents', () => {
  test.beforeEach(async ({ page }) => {
    await ouvrir(page, 'fr-FR', 1);
    test.skip(!(await apiPresente(page)), 'API absente : test sauté (npm run server:dev)');
  });

  test('un parent crée un compte, se déconnecte, se reconnecte', async ({ page }) => {
    const email = courriel();
    await ouvrirLeCompte(page);
    await page.getByRole('button', { name: 'Créer un compte' }).click();
    await page.getByLabel('Adresse électronique').fill(email);
    await page.getByLabel(/Mot de passe/).fill(MDP);
    await page.getByRole('button', { name: 'Créer notre compte' }).click();

    await expect(page.getByText(email)).toBeVisible();
    await page.getByRole('button', { name: 'Se déconnecter' }).click();
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible();

    await page.getByLabel('Adresse électronique').fill(email);
    await page.getByLabel(/Mot de passe/).fill(MDP);
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page.getByText(email)).toBeVisible();
  });

  test('un mauvais mot de passe est refusé, sans détail', async ({ page }) => {
    await ouvrirLeCompte(page);
    await page.getByLabel('Adresse électronique').fill(courriel());
    await page.getByLabel(/Mot de passe/).fill('nimportequoi');
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page.getByRole('alert')).toHaveText(/incorrect/);
  });

  /* Le cœur de l'étape 5 : la progression suit l'enfant d'un ordinateur à
     l'autre, et c'est TOUJOURS la plus avancée qui gagne. */
  test('la progression passe d’un ordinateur à l’autre, la plus avancée gagne', async ({
    browser,
    page,
  }) => {
    const email = courriel();

    /* ordinateur 1 : palier 4. On repasse par `ouvrir` plutôt que d'écrire
       dans localStorage puis recharger — le script d'init du helper rejoue à
       CHAQUE navigation et écrasait la valeur posée à la main. */
    await ouvrir(page, 'fr-FR', 4);
    await ouvrirLeCompte(page);
    await page.getByRole('button', { name: 'Créer un compte' }).click();
    await page.getByLabel('Adresse électronique').fill(email);
    await page.getByLabel(/Mot de passe/).fill(MDP);
    await page.getByRole('button', { name: 'Créer notre compte' }).click();
    await expect(page.getByText('palier 4')).toBeVisible();

    // ordinateur 2 : tout neuf, même compte
    const autre = await browser.newContext();
    const page2 = await autre.newPage();
    await ouvrir(page2, 'fr-FR', 1);
    expect((await sauvegarde(page2)).palier).toBe(1);
    await ouvrirLeCompte(page2);
    await page2.getByLabel('Adresse électronique').fill(email);
    await page2.getByLabel(/Mot de passe/).fill(MDP);
    await page2.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page2.getByText(email)).toBeVisible();

    // la progression du premier a rejoint le second
    await expect.poll(async () => (await sauvegarde(page2)).palier, { timeout: 5000 }).toBe(4);
    await autre.close();
  });
});
