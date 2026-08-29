import { expect, test } from '@playwright/test';
import { creeListe, jouerItem, ouvrir, sauvegarde } from './helpers/app';

/**
 * La coquille n'est gardée qu'une fois le service worker AUX COMMANDES : les
 * requêtes de la toute première visite lui échappent encore. Une seconde
 * visite en ligne suffit — ce que fait n'importe quelle famille avant de
 * partir, et ce que la spec assume (« l'app ne démarre plus jamais sans un
 * premier passage en ligne »).
 */
async function coquilleGardee(page: import('@playwright/test').Page) {
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
}

/**
 * #3 — « l'enfant peut s'entraîner dans le train ». Une fois le parent
 * connecté sur cet appareil, l'application y démarre SANS RÉSEAU : elle ne
 * redemande la connexion que si la session a réellement expiré.
 *
 * Le portail se décide sur la session ; tant que « pas de réseau » et « pas de
 * compte » disaient la même chose, le train renvoyait au formulaire.
 */
test('sans réseau, l’application démarre et la leçon se joue', async ({ page, context }) => {
  await ouvrir(page, 'fr-FR', 1);
  await coquilleGardee(page);

  await context.setOffline(true);
  await page.reload();

  // ni portail, ni écran de panne : l'accueil, comme d'habitude
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V1');
  await expect(page.getByRole('button', { name: 'On commence !' })).toBeVisible();

  await page.getByRole('button', { name: 'On commence !' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');
  expect(await jouerItem(page, 'fr-FR')).toBeTruthy();
});

/* Le travail fait dans le train n'est pas perdu : il attend dans la file, et
   part quand le réseau revient. */
test('la progression faite hors ligne part au retour du réseau', async ({ page, context }) => {
  await ouvrir(page, 'fr-FR', 1);
  const idProfil = ((await (await page.request.get('/api/profils')).json()) as {
    profils: { id: string }[];
  }).profils[0].id;
  await coquilleGardee(page);

  await context.setOffline(true);
  await page.reload();
  await page.getByRole('button', { name: 'On commence !' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');
  await jouerItem(page, 'fr-FR');

  // l'appareil garde le travail, et le dit
  await page.waitForFunction(
    () => JSON.parse(localStorage.getItem('tapeavecmoi.file') ?? '[]').length > 0,
  );
  const localAvant = (await sauvegarde(page)).bloc;

  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));

  await expect
    .poll(async () => {
      const r = await page.request.get('/api/profils');
      const { profils } = (await r.json()) as { profils: { id: string; etat: unknown }[] };
      return profils.find((p) => p.id === idProfil)?.etat !== null;
    }, { timeout: 10_000 })
    .toBe(true);

  expect(localAvant).toBeGreaterThan(0);
});

/* Le parent doit COMPRENDRE, pas croire à une panne. L'information vit dans
   l'espace parent : l'enfant, lui, n'a rien à en savoir. */
test('le parent lit « hors ligne », et retrouve ses enfants', async ({ page, context }) => {
  await ouvrir(page, 'fr-FR', 1, false, 'Timo');
  await creeListe(page, 'Dictée', ['papa']);
  await coquilleGardee(page);

  await context.setOffline(true);
  await page.reload();
  await page.getByLabel('Réglages').click();
  await page.getByRole('button', { name: 'Ouvrir' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V9');

  await expect(page.getByText(/Hors ligne/)).toBeVisible();
  /* Et surtout PAS « aucun profil sur le compte » : le foyer connu de cet
     appareil reste affiché, sinon le parent croit avoir perdu ses enfants. */
  await expect(page.getByLabel('Prénom de Timo')).toBeVisible();
  await expect(page.getByText("Aucun profil sur le compte")).toHaveCount(0);
});

/**
 * L'autre moitié de la promesse : démarrer hors ligne ne veut pas dire ne
 * plus jamais vérifier. Quand le serveur RÉPOND et dit que la session n'est
 * plus valide, le souvenir s'efface et le portail reprend la main — sans quoi
 * l'appareil resterait sur un compte que le serveur ne reconnaît plus.
 */
test('la session expirée ramène à l’écran de connexion', async ({ page, context }) => {
  await ouvrir(page, 'fr-FR', 1);
  await coquilleGardee(page);

  // le cookie de session disparaît : pour le serveur, cette session n'est plus
  await context.clearCookies();
  await page.reload();

  await expect(page.getByRole('button', { name: /Se connecter|Créer/ }).first()).toBeVisible();
  await expect(page.locator('body')).not.toHaveAttribute('data-vue', 'V1');
  expect(await page.evaluate(() => localStorage.getItem('tapeavecmoi.compte'))).toBeNull();
});
