import { expect, test } from '@playwright/test';
import { assureProfil, cleProfil, connecte, courrielUnique, inscrit, ouvrir, sauvegarde } from './helpers/app';

/**
 * Profils enfants DU COMPTE (#4). Leur identifiant serveur est leur seul
 * identifiant : ils suivent la famille d'un appareil à l'autre, deux
 * homonymes restent deux enfants, et corriger un prénom ne perd rien.
 */

test("un compte tout neuf demande le prénom du premier enfant, il n'y a pas de « Joueur 1 »", async ({
  page,
}) => {
  await inscrit(page);
  await page.goto('/');
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V0');
  await expect(page.getByLabel('Ton prénom')).toBeVisible();

  await page.getByLabel('Ton prénom').fill('Timo');
  await page.getByRole('button', { name: "C'est parti !" }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V2');

  // le profil existe bien SUR LE COMPTE, pas seulement dans ce navigateur
  const { profils } = (await (await page.request.get('/api/profils')).json()) as {
    profils: { prenom: string }[];
  };
  expect(profils.map((p) => p.prenom)).toEqual(['Timo']);
});

test('les profils du compte se retrouvent sur un autre appareil', async ({ browser, page }) => {
  const email = courrielUnique();
  await inscrit(page, email);
  await assureProfil(page, 'Timo');
  await page.request.post('/api/profils', { data: { prenom: 'Zoé' } });

  const autre = await browser.newContext();
  const page2 = await autre.newPage();
  await connecte(page2, email);
  await page2.goto('/');

  // deux joueurs : l'écran « Qui joue ? » les propose, sans qu'on ait rien créé ici
  await expect(page2.locator('body')).toHaveAttribute('data-vue', 'V0');
  await expect(page2.getByRole('button', { name: 'Timo' })).toBeVisible();
  await expect(page2.getByRole('button', { name: 'Zoé' })).toBeVisible();
  await autre.close();
});

test('deux enfants du même prénom restent deux joueurs, chacun sa progression', async ({
  page,
}) => {
  await ouvrir(page, 'fr-FR', 3, false, 'Timo');
  const premier = cleProfil(page);
  expect((await sauvegarde(page)).palier).toBe(3);

  // un second Timo, créé depuis « Qui joue ? »
  await page.getByLabel('Réglages').click();
  await page.getByRole('button', { name: 'Changer de joueur' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V0');
  await page.getByRole('button', { name: 'Nouveau joueur' }).click();
  await page.getByLabel('Ton prénom').fill('Timo');
  await page.getByRole('button', { name: "C'est parti !" }).click();

  // il démarre à neuf, sur SA clé : le premier Timo n'a pas été absorbé
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V2');
  const cles = await page.evaluate((prefixe) =>
    Object.keys(localStorage).filter((c) => c.startsWith(prefixe) && !c.endsWith('.backup')),
    'tapeavecmoi.v1.',
  );
  expect(cles.length).toBe(2);
  expect(await page.evaluate((c) => JSON.parse(localStorage.getItem(c) ?? '{}').palier, premier)).toBe(3);

  // au rechargement, les deux homonymes sont là, distincts
  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V0');
  await expect(page.getByRole('button', { name: 'Timo' })).toHaveCount(2);
});

test('renommer un enfant conserve sa progression', async ({ page }) => {
  await ouvrir(page, 'fr-FR', 4, false, 'Timo');
  await page.getByLabel('Réglages').click();
  await page.getByRole('button', { name: 'Ouvrir' }).click();
  await expect(page.getByText('palier 4')).toBeVisible();

  await page.getByLabel('Prénom de Timo').fill('Timothée');
  await page.getByRole('button', { name: 'Renommer' }).click();

  // même profil, même progression : le prénom n'était pas son identité
  await expect(page.getByLabel('Prénom de Timothée')).toBeVisible();
  await expect(page.getByText('palier 4')).toBeVisible();
  expect((await sauvegarde(page)).palier).toBe(4);

  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V1');
  expect((await sauvegarde(page)).palier).toBe(4);
});

test('changer de joueur revient au choix, chacun retrouve sa progression', async ({ page }) => {
  await ouvrir(page, 'fr-FR', 3, false, 'Timo');
  await page.getByLabel('Réglages').click();
  await page.getByRole('button', { name: 'Changer de joueur' }).click();
  await expect(page.getByRole('button', { name: 'Timo' })).toBeVisible();

  await page.getByRole('button', { name: 'Nouveau joueur' }).click();
  await page.getByLabel('Ton prénom').fill('Zoé');
  await page.getByRole('button', { name: "C'est parti !" }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V2');

  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V0');
  await page.getByRole('button', { name: 'Timo' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V1');
  expect((await sauvegarde(page)).palier).toBe(3);
});
