import { expect, test } from '@playwright/test';
import { ouvrir } from './helpers/app';

/**
 * #7 — ce qui se vérifie SANS Google.
 *
 * Le parcours réel (cliquer, choisir son compte Google, revenir connecté) ne
 * se vérifie que sur le vrai Google : un faux serveur OAuth testerait surtout
 * notre capacité à écrire un serveur OAuth. Cette vérification-là est
 * manuelle, et consignée au runbook.
 *
 * Reste, et ce n'est pas rien : le bouton n'apparaît pas quand le serveur ne
 * sait pas s'en servir, il mène à la bonne route quand il le sait, et le
 * trafic vers Google ne sort JAMAIS de l'écran de connexion.
 */
test('sans fournisseur configuré, aucun bouton Google, et le reste marche', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'connexion');

  /* Le serveur d'e2e n'a pas les variables du fournisseur : le bouton doit
     être absent, et le chemin mot de passe rester entier. */
  expect(await (await page.request.get('/api/config')).json()).toEqual({ google: false });
  await expect(page.getByRole('button', { name: /Google/ })).toHaveCount(0);

  await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible();
  await ouvrir(page, 'fr-FR', 1);
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V1');
});

/**
 * Le bouton s'adresse à la route que Better Auth monte VRAIMENT. Il n'existe
 * pas de `GET /sign-in/google` — j'y avais cru, et le paquet dit le contraire :
 * c'est un POST sur `/sign-in/social`, avec le fournisseur en corps. Un lien
 * `href` aurait donné un 404 que rien n'aurait signalé avant le premier parent
 * à cliquer.
 */
test('le bouton s’adresse à la vraie route d’authentification', async ({ page }) => {
  /* On ne simule QUE ce que le serveur apprend au portail : le fournisseur est
     disponible. Tout le reste de l'écran est le vrai — et l'interception
     survit à la navigation, contrairement à un `window.fetch` remplacé dans la
     page, que le rechargement efface. */
  await page.route('**/api/config', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"google":true}' }),
  );
  await page.goto('/');

  const bouton = page.getByRole('button', { name: 'Continuer avec Google' });
  await expect(bouton).toBeVisible();

  const envoi = page.waitForRequest(
    (r) => r.url().endsWith('/api/auth/sign-in/social') && r.method() === 'POST',
  );
  await bouton.click();
  const requete = await envoi;
  expect(JSON.parse(requete.postData() ?? '{}')).toMatchObject({ provider: 'google' });

  /* Cette route est bien MONTÉE, et c'est le CORPS qui le prouve, pas le
     statut : ici le fournisseur n'est pas configuré, donc elle répond 404 —
     exactement comme un chemin inventé. Mais elle dit POURQUOI
     (`PROVIDER_NOT_FOUND`), là où un chemin inventé rend un 404 muet. C'est la
     seule différence observable, et c'est elle qui distingue « bonne route,
     fournisseur absent » de « mauvaise route ». */
  const vraie = await page.request.post('/api/auth/sign-in/social', {
    data: { provider: 'google', callbackURL: '/' },
    failOnStatusCode: false,
  });
  expect(await vraie.json()).toMatchObject({ code: 'PROVIDER_NOT_FOUND' });

  const inventee = await page.request.post('/api/auth/sign-in/licorne', {
    data: { provider: 'google' },
    failOnStatusCode: false,
  });
  expect(await inventee.text()).toBe('');
});

/**
 * La promesse réseau, amendée par la spec : « aucun tiers PENDANT LA LEÇON ».
 * Google apprend l'existence du service — c'est le prix du SSO, et il est
 * assumé — mais uniquement au moment de se connecter.
 */
test('aucun trafic Google en dehors de l’écran de connexion', async ({ page }) => {
  const versGoogle: string[] = [];
  page.on('request', (r) => {
    if (/google|gstatic|googleapis/i.test(new URL(r.url()).hostname)) versGoogle.push(r.url());
  });

  await ouvrir(page, 'fr-FR', 1);
  await page.getByRole('button', { name: 'On commence !' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');
  await page.waitForTimeout(1200);

  expect(versGoogle).toEqual([]);
});

/**
 * Le chemin d'échec le plus probable en production, et il était MUET.
 *
 * La liaison automatique est désactivée exprès : un parent qui a déjà un compte
 * à mot de passe et clique « Continuer avec Google » avec la même adresse est
 * refusé. Google le ramène ici avec `?error=account_not_linked` — sans lecture
 * de ce paramètre, il retrouvait le formulaire sans un mot d'explication.
 */
test('revenir de Google en échec explique pourquoi, et ne laisse pas de trace', async ({
  page,
}) => {
  await page.goto('/?error=account_not_linked');
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'connexion');

  const alerte = page.getByRole('alert');
  await expect(alerte).toContainText(/déjà un compte avec mot de passe/i);

  /* Le paramètre est retiré de la barre d'adresse : un rechargement ne doit pas
     ressusciter une erreur déjà lue. */
  expect(new URL(page.url()).search).toBe('');
  await page.reload();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('un code d’erreur inconnu reste compréhensible', async ({ page }) => {
  await page.goto('/?error=quelque_chose_dimprevu');
  await expect(page.getByRole('alert')).toContainText(/Google n’a pas abouti/i);
});
