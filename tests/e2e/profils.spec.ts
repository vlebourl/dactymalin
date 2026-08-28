import { expect, test } from '@playwright/test';
import { ouvrir, sauvegarde } from './helpers/app';

/* Multi-profils locaux (demande du 2026-08-28) : plusieurs enfants sur le même
   appareil, chacun sa progression, zéro compte en ligne. Le premier profil
   reprend la clé historique : personne ne perd sa progression. */

test('une sauvegarde d\'avant les profils entre directement, progression intacte', async ({
  page,
}) => {
  await ouvrir(page, 'fr-FR', 3);
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V1');
  expect((await sauvegarde(page)).palier).toBe(3);
});

test('créer un second joueur, chacun sa progression, choix au démarrage', async ({ page }) => {
  await ouvrir(page, 'fr-FR', 3);

  // réglages → changer de joueur → écran « Qui joue ? »
  await page.getByLabel('Réglages').click();
  await page.getByRole('button', { name: 'Changer de joueur' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V0');
  await expect(page.getByRole('button', { name: 'Joueur 1' })).toBeVisible();

  // nouveau joueur : Zoé démarre par l'onboarding, progression neuve
  await page.getByRole('button', { name: 'Nouveau joueur' }).click();
  await page.getByLabel('Ton prénom').fill('Zoé');
  await page.getByRole('button', { name: "C'est parti !" }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V2');

  // la progression de Joueur 1 n'a pas bougé
  expect((await sauvegarde(page)).palier).toBe(3);

  // au rechargement, l'écran « Qui joue ? » propose les deux
  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V0');
  await expect(page.getByRole('button', { name: 'Zoé' })).toBeVisible();

  // Joueur 1 retrouve son palier 3
  await page.getByRole('button', { name: 'Joueur 1' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V1');
  expect((await sauvegarde(page)).palier).toBe(3);
});
