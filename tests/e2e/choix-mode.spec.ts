import { expect, test, type Page } from '@playwright/test';
import { ouvrir } from './helpers/app';

const etat = (page: Page, corps: { status: number; json: unknown }) =>
  page.route('**/api/grammaire/etat', (r) =>
    r.fulfill({ status: corps.status, contentType: 'application/json', body: JSON.stringify(corps.json) }),
  );

test('grammaire disponible : choix du mode au lancement, retour possible', async ({ page }) => {
  /* `ouvrir` attend V1 : on le laisse passer avec la grammaire indisponible,
     puis on la déclare disponible et on relance l'app. */
  await ouvrir(page);
  await etat(page, { status: 200, json: { disponible: true } });
  await page.reload();
  await page.waitForSelector('body[data-vue="MODE"]');
  await page.getByRole('button', { name: 'Orthographe' }).click();
  await page.waitForSelector('body[data-vue="V1"]');
  await page.getByRole('button', { name: 'Changer de mode' }).click();
  await page.waitForSelector('body[data-vue="MODE"]');
});

test('grammaire indisponible (serveur sans clé) : arrivée directe sur V1, sans bouton', async ({ page }) => {
  await ouvrir(page);
  await expect(page.getByRole('button', { name: 'Changer de mode' })).toHaveCount(0);
});

test('état en erreur 500 : arrivée directe sur V1', async ({ page }) => {
  await etat(page, { status: 500, json: {} });
  await ouvrir(page);
  await expect(page.getByRole('button', { name: 'Changer de mode' })).toHaveCount(0);
});
