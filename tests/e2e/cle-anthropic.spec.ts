import { expect, test, type Page } from '@playwright/test';
import { ouvrir } from './helpers/app';

/**
 * La clé Anthropic se saisit dans l'espace parent. Tout ce qui touche Anthropic
 * est simulé : aucune vraie clé, aucun appel payant. `etat` suit la clé posée,
 * comme le ferait le serveur.
 */
const json = (corps: unknown, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(corps) });

async function versEspaceParent(page: Page, put: { status: number; corps: unknown }) {
  await ouvrir(page);
  let enregistree = false;
  await page.route('**/api/grammaire/etat', (r) => r.fulfill(json({ disponible: enregistree })));
  await page.route('**/api/compte/cle-anthropic', (r) => {
    const methode = r.request().method();
    if (methode === 'PUT') {
      if (put.status === 200) enregistree = true;
      return r.fulfill(json(put.corps, put.status));
    }
    if (methode === 'DELETE') {
      enregistree = false;
      return r.fulfill(json({ enregistree: false }));
    }
    return r.fulfill(json(enregistree ? { enregistree: true, fin: 'ab12' } : { enregistree: false }));
  });
  await page.getByLabel('Réglages').click();
  await page.getByRole('button', { name: 'Ouvrir' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V9');
}

const CLE = 'sk-ant-exemple-factice-0000000000ab12';

test('une clé acceptée : « Clé enregistrée », et l’accueil offre « Changer de mode » sans rechargement', async ({ page }) => {
  await versEspaceParent(page, { status: 200, corps: { enregistree: true, fin: 'ab12' } });
  const champ = page.getByLabel('Clé Anthropic');
  await expect(champ).toHaveAttribute('type', 'password');
  await champ.fill(CLE);
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.getByText('Clé enregistrée (…ab12)')).toBeVisible();
  await expect(page.getByText(CLE)).toHaveCount(0);

  await page.getByLabel('Revenir').click();
  await page.getByLabel('Revenir').click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V1');
  await expect(page.getByRole('button', { name: 'Changer de mode' })).toBeVisible();
});

test('une clé refusée par Anthropic : le message le dit, rien n’est enregistré', async ({ page }) => {
  await versEspaceParent(page, { status: 400, corps: { code: 'CLE_REFUSEE' } });
  await page.getByLabel('Clé Anthropic').fill(CLE);
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.getByText('Cette clé est refusée par Anthropic.')).toBeVisible();
  await expect(page.getByLabel('Clé Anthropic')).toBeVisible();
});

test('« Retirer la clé » revient à l’état non enregistré', async ({ page }) => {
  await versEspaceParent(page, { status: 200, corps: { enregistree: true, fin: 'ab12' } });
  await page.getByLabel('Clé Anthropic').fill(CLE);
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await page.getByRole('button', { name: 'Retirer la clé' }).click();
  await expect(page.getByLabel('Clé Anthropic')).toBeVisible();
  await expect(page.getByLabel('Clé Anthropic')).toHaveValue('');
  await page.getByLabel('Revenir').click();
  await page.getByLabel('Revenir').click();
  await expect(page.getByRole('button', { name: 'Changer de mode' })).toHaveCount(0);
});
