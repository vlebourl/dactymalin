import { expect, test } from '@playwright/test';
import { creeListe, inscrit, jouerItem, ouvrir } from './helpers/app';

/**
 * #19 — le compte connecté est visible partout. Le parent qui ouvre
 * l'application sur un ordinateur partagé, ou qui a deux comptes, sait
 * immédiatement lequel est actif, sans traverser les réglages pour le voir.
 */
const bandeau = (page: import('@playwright/test').Page) => page.locator('[data-bandeau-compte]');

test('le compte est lisible sur chaque écran, sans se recharger', async ({ page }) => {
  const email = await inscrit(page);
  await ouvrir(page, 'fr-FR', 1);
  await creeListe(page, 'Dictée', ['papa']);
  await page.reload();

  await expect(bandeau(page)).toContainText(email);

  /* On traverse l'application : le bandeau suit, sur chacun des écrans. */
  const passer = async (versLaVue: () => Promise<void>, vue: string) => {
    await versLaVue();
    await expect(page.locator('body')).toHaveAttribute('data-vue', vue);
    await expect(bandeau(page)).toContainText(email);
  };

  await passer(() => page.getByRole('button', { name: 'Ma carte du clavier' }).click(), 'V6');
  await passer(() => page.getByLabel('Revenir').click(), 'V1');
  await passer(() => page.getByRole('button', { name: 'Changer' }).click(), 'V2');
  await passer(() => page.getByLabel('Revenir').click(), 'V1');
  await passer(() => page.getByLabel('Réglages').click(), 'V7');
  await passer(() => page.getByRole('button', { name: 'Ouvrir' }).click(), 'V9');
  await passer(() => page.getByLabel('Revenir').click(), 'V7');
  await passer(() => page.getByLabel('Revenir').click(), 'V1');
  await passer(() => page.getByRole('button', { name: 'On commence !' }).click(), 'V4');

  // …jusque dans la leçon, et jusqu'au bilan de fin de bloc
  await jouerItem(page, 'fr-FR');
  await expect(bandeau(page)).toContainText(email);
});

/**
 * Deux choses que le ticket demande et qu'on peut faire échouer.
 *
 * D'abord : UN SEUL bandeau, jamais un par vue. C'est le reproche d'origine —
 * « les six vues construisent chacune le leur » — et c'est ce qui casserait le
 * jour où quelqu'un recopierait la ligne dans un écran de plus.
 *
 * Ensuite : il ne se RECHARGE pas en changeant d'écran. L'adresse vient du
 * compte que l'appareil connaît, pas d'une requête ; si elle en demandait une
 * à chaque vue, elle clignoterait, et disparaîtrait hors ligne.
 */
test('un seul bandeau, et aucune requête de session en changeant de vue', async ({ page }) => {
  await inscrit(page);
  await ouvrir(page, 'fr-FR', 1);
  await expect(bandeau(page)).toHaveCount(1);

  const sessions: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('/api/auth/get-session')) sessions.push(r.url());
  });

  for (const [aller, vue] of [
    [() => page.getByLabel('Réglages').click(), 'V7'],
    [() => page.getByLabel('Revenir').click(), 'V1'],
    [() => page.getByRole('button', { name: 'Ma carte du clavier' }).click(), 'V6'],
    [() => page.getByLabel('Revenir').click(), 'V1'],
  ] as const) {
    await aller();
    await expect(page.locator('body')).toHaveAttribute('data-vue', vue);
    await expect(bandeau(page)).toHaveCount(1);
  }

  expect(sessions).toEqual([]);
});

/* L'information vient du compte CONNU de l'appareil : elle survit à la perte
   du réseau, au lieu de disparaître au moment précis où le parent se demande
   sur quel compte il est. */
test('hors ligne, le bandeau affiche encore le compte connu', async ({ page, context }) => {
  const email = await inscrit(page);
  await ouvrir(page, 'fr-FR', 1);
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V1');
  await expect(bandeau(page)).toContainText(email);
});

/* Y compris sur « Qui joue ? », qui précède l'application elle-même : c'est
   le premier écran qu'un parent voit sur un ordinateur partagé, donc celui où
   la question « quel compte ? » se pose le plus. */
test('le bandeau est déjà là sur « Qui joue ? »', async ({ page }) => {
  const email = await inscrit(page);
  await ouvrir(page, 'fr-FR', 1, false, 'Timo');
  await page.request.post('/api/profils', { data: { prenom: 'Zoé' } });

  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V0');
  await expect(bandeau(page)).toContainText(email);
});

/* Il n'apparaît PAS avant qu'un compte existe : sur le portail, il n'y a
   rien à dire, et une ligne vide ferait croire à un bandeau cassé. */
test('aucun bandeau sur l’écran de connexion', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /Se connecter|Créer/ }).first()).toBeVisible();
  await expect(bandeau(page)).toHaveCount(0);
});
