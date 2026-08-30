import { expect, test, type Page } from '@playwright/test';
import { ouvrir } from './helpers/app';

/**
 * La porte de l'espace parent.
 *
 * L'espace parent était à deux clics de l'accueil de l'enfant : l'engrenage,
 * puis « Ouvrir ». On y trouve la suppression du compte, celle d'un enfant, et
 * depuis #63 la vitesse et la précision — que §1 et §4.7 interdisent de montrer
 * à l'enfant. Rien n'en gardait l'entrée.
 *
 * Cette spec est la seule à NE PAS profiter de l'interrupteur du harnais :
 * c'est la porte elle-même qu'elle exerce.
 */
async function sansHarnais(page: Page): Promise<void> {
  await page.addInitScript(() => {
    (globalThis as { __porteAdulteOuverte?: boolean }).__porteAdulteOuverte = false;
  });
  await page.reload();
  await page.waitForSelector('body[data-vue="V1"]');
}

/** L'enfant appuie sur l'engrenage, puis sur « Ouvrir ». */
async function frapperALaPorte(page: Page): Promise<void> {
  await page.getByLabel('Réglages').click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V7');
  await page.getByRole('button', { name: 'Ouvrir' }).click();
}

/** Le produit demandé, lu dans le nom accessible du champ. */
async function produitDemande(page: Page): Promise<number> {
  const champ = page.getByRole('textbox', { name: /Combien font/ });
  const libelle = (await champ.getAttribute('aria-label')) ?? '';
  const trouve = /Combien font (\d+) fois (\d+)/.exec(libelle);
  expect(trouve, `libellé inattendu : ${libelle}`).not.toBeNull();
  return Number(trouve![1]) * Number(trouve![2]);
}

test('un enfant qui appuie sur « Ouvrir » reste dans les réglages', async ({ page }) => {
  await ouvrir(page, 'fr-FR', 1);
  await sansHarnais(page);
  await frapperALaPorte(page);

  await expect(page.getByText('Une question pour les grands')).toBeVisible();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V7');
});

test('une mauvaise réponse n’ouvre rien, et la question change', async ({ page }) => {
  await ouvrir(page, 'fr-FR', 1);
  await sansHarnais(page);
  await frapperALaPorte(page);

  const champ = page.getByRole('textbox', { name: /Combien font/ });
  const premier = await produitDemande(page);
  await champ.fill('1');
  await page.getByRole('button', { name: 'Entrer' }).click();

  await expect(page.locator('[data-porte="ratee"]')).toBeVisible();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V7');
  /* Une question NEUVE : la même reposée indéfiniment céderait à l'essai
     systématique, et le champ ne garde pas la tentative précédente. */
  await expect(champ).toHaveValue('');
  await expect
    .poll(async () => (await produitDemande(page)) !== premier, {
      message: 'la question devrait avoir changé après un échec',
      timeout: 3000,
    })
    .toBe(true);
});

test('le parent répond juste et entre', async ({ page }) => {
  await ouvrir(page, 'fr-FR', 1);
  await sansHarnais(page);
  await frapperALaPorte(page);

  await page.getByRole('textbox', { name: /Combien font/ }).fill(String(await produitDemande(page)));
  await page.getByRole('button', { name: 'Entrer' }).click();

  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V9');
});

test('« Gérer les enfants » est gardé par la même porte', async ({ page }) => {
  // Deux boutons mènent à l'espace parent : en garder un seul ne garde rien.
  await ouvrir(page, 'fr-FR', 1);
  await sansHarnais(page);
  await page.getByLabel('Réglages').click();
  await page.getByRole('button', { name: 'Gérer les enfants' }).click();

  await expect(page.getByText('Une question pour les grands')).toBeVisible();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V7');
});

test('« Laisser tomber » referme la question sans rien ouvrir', async ({ page }) => {
  await ouvrir(page, 'fr-FR', 1);
  await sansHarnais(page);
  await frapperALaPorte(page);

  await page.getByRole('button', { name: 'Laisser tomber' }).click();
  await expect(page.getByText('Une question pour les grands')).toHaveCount(0);
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V7');
});
