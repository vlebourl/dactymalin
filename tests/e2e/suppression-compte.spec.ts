import { expect, test } from '@playwright/test';
import { creeListe, inscrit, MDP_TEST, ouvrir } from './helpers/app';

/**
 * #6 — « partir sans laisser de trace ». Tant que le compte était facultatif,
 * s'en passer était tenable ; obligatoire, il n'y a plus de porte de sortie
 * sans ce bouton.
 */
test('le parent supprime son compte, après confirmation, et tout part', async ({ page }) => {
  const email = await inscrit(page);
  await ouvrir(page, 'fr-FR', 1, false, 'Timo');
  await creeListe(page, 'Dictée', ['papa']);
  await page.reload();

  await page.getByLabel('Réglages').click();
  await page.getByRole('button', { name: 'Ouvrir' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V9');

  /* Une confirmation précède l'action, et elle NOMME ce qu'elle détruit —
     « êtes-vous sûr ? » ne dit pas de quoi on parle. */
  await page.getByLabel('Supprimer le compte').click();
  /* L'alerte de CETTE confirmation, pas n'importe laquelle : l'espace parent
     en contient d'autres, et un `getByRole('alert')` nu finirait par pointer
     ailleurs sans qu'on le voie. */
  const avertissement = page.getByRole('alert').filter({ hasText: 'Supprimer le compte' });
  await expect(avertissement).toContainText(email);
  await expect(avertissement).toContainText(/définitif/i);

  // …et on peut encore reculer
  await page.getByRole('button', { name: 'Annuler' }).click();
  await expect(page.getByLabel('Supprimer le compte')).toBeVisible();
  expect((await page.request.get('/api/profils')).status()).toBe(200);

  await page.getByLabel('Supprimer le compte').click();
  await page.getByRole('button', { name: 'Oui, supprimer le compte' }).click();

  /* Le portail reprend la main : il n'y a plus de compte. On s'oriente sur
     l'attribut de vue, pas sur un libellé de bouton — « Créer » attrapait
     aussi « Créer la liste » de l'espace parent, si bien que l'assertion
     passait sans qu'on ait quitté l'écran. */
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'connexion', {
    timeout: 10_000,
  });

  // les mêmes identifiants ne rouvrent rien
  const reconnexion = await page.request.post('/api/auth/sign-in/email', {
    data: { email, password: MDP_TEST },
    failOnStatusCode: false,
  });
  expect(reconnexion.status()).toBe(401);

  // et la session d'avant ne vaut plus rien
  expect((await page.request.get('/api/profils')).status()).toBe(401);
});

/* Le geste exige le serveur. Hors ligne, il est refusé — et il le DIT, parce
   que croire son compte supprimé alors qu'il est intact est la pire issue
   possible pour un geste qu'on ne fait qu'en partant. */
test('hors ligne, la suppression est refusée et le dit', async ({ page, context }) => {
  await inscrit(page);
  await ouvrir(page, 'fr-FR', 1);
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

  await context.setOffline(true);
  await page.reload();
  await page.getByLabel('Réglages').click();
  await page.getByRole('button', { name: 'Ouvrir' }).click();

  await page.getByLabel('Supprimer le compte').click();
  await page.getByRole('button', { name: 'Oui, supprimer le compte' }).click();

  await expect(page.getByText(/n’a pas pu être confirmée/)).toBeVisible();
  // on est toujours dans l'espace parent, pas sur le portail
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V9');

  await context.setOffline(false);
  expect((await page.request.get('/api/profils')).status()).toBe(200);
});
