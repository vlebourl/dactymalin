import { expect, test } from '@playwright/test';
import { creeListe, jouerItem, motCourant, ouvrir, sauvegarde } from './helpers/app';

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

  /* Puis on attend que le cache cesse de grossir. La mise en cache se fait au
     fil des requêtes ; couper le réseau à la seconde où la page a fini de
     charger l'interrompt en plein vol, et il manque alors un morceau de la
     coquille. Un vrai départ en voyage laisse ce temps-là de lui-même. */
  const entrees = () =>
    page.evaluate(async () => {
      let n = 0;
      for (const nom of await caches.keys()) n += (await (await caches.open(nom)).keys()).length;
      return n;
    });
  let precedent = -1;
  for (let i = 0; i < 40; i++) {
    const n = await entrees();
    if (n === precedent && n > 5) return;
    precedent = n;
    await page.waitForTimeout(150);
  }
  throw new Error('la coquille n’a jamais fini d’être gardée');
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

/**
 * L'invariant du service worker : il garde la COQUILLE, jamais les DONNÉES.
 * Une session, une progression ou une liste resservie depuis un cache serait
 * une réponse périmée présentée comme fraîche — et la promesse « aucun tiers
 * pendant la leçon » ne dit rien de la fraîcheur de ce qu'on affiche.
 */
test('le cache garde la coquille, jamais l’API', async ({ page, context }) => {
  await ouvrir(page, 'fr-FR', 1);
  await coquilleGardee(page);

  // en ligne, l'API répond — et cette réponse ne doit pas être gardée
  expect(
    await page.evaluate(async () => (await fetch('/api/auth/get-session')).status),
  ).toBe(200);

  await context.setOffline(true);
  /* Le document, lui, se recharge depuis le cache : c'est bien le worker qui
     travaille, et pourtant l'API échoue. */
  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V1');

  expect(
    await page.evaluate(async () => {
      try {
        await fetch('/api/auth/get-session');
        return 'SERVIE DEPUIS LE CACHE';
      } catch {
        return 'injoignable';
      }
    }),
  ).toBe('injoignable');

  const cachees = await page.evaluate(async () => {
    const noms = await caches.keys();
    const urls: string[] = [];
    for (const nom of noms) {
      for (const requete of await (await caches.open(nom)).keys()) urls.push(requete.url);
    }
    return urls;
  });
  expect(cachees.filter((u) => u.includes('/api/'))).toEqual([]);
  // …et la coquille, elle, est bien là
  expect(cachees.length).toBeGreaterThan(0);
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

/**
 * #11 — dans le train, l'enfant retrouve ses cartes. La bibliothèque appartient
 * au compte et vient du réseau ; sans cache, l'accueil hors ligne n'aurait
 * offert que le parcours, et la dictée préparée la veille aurait disparu.
 */
test('sans réseau, les listes connues sont sur l’accueil et se jouent', async ({
  page,
  context,
}) => {
  await ouvrir(page, 'fr-FR', 1);
  await creeListe(page, 'Dictée du mardi', ['papa', 'maman']);
  /* Un passage en ligne où l'application VOIT la liste : c'est ce passage-là
     qui remplit le cache, comme la veille du départ. */
  await page.reload();
  await expect(page.getByRole('button', { name: /Dictée du mardi/ })).toBeVisible();
  await coquilleGardee(page);

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V1');

  const carte = page.getByRole('button', { name: /Dictée du mardi/ });
  await expect(carte).toBeVisible();
  await carte.click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');
  expect(['papa', 'maman']).toContain((await motCourant(page))!);
});

/**
 * Le cache est en LECTURE SEULE. Hors ligne, le parent ne peut pas préparer sa
 * dictée — et l'application le DIT, au lieu d'échouer en silence ou de faire
 * croire à un enregistrement qui partirait plus tard. Rien n'est mis en file :
 * ce serait la porte ouverte aux conflits d'édition entre deux appareils.
 */
test('hors ligne, créer une liste est refusé et dit pourquoi', async ({ page, context }) => {
  await ouvrir(page, 'fr-FR', 1);
  await creeListe(page, 'Déjà là', ['papa']);
  await page.reload();
  await coquilleGardee(page);

  await context.setOffline(true);
  await page.reload();
  await page.getByLabel('Réglages').click();
  await page.getByRole('button', { name: 'Ouvrir' }).click();

  // la liste connue est bien LÀ, elle
  await expect(page.getByRole('button', { name: 'Modifier Déjà là' })).toBeVisible();

  await page.getByLabel('Nom de la liste').fill('Impossible');
  await page.getByLabel('Les mots de la liste').fill('chat');
  await page.getByRole('button', { name: 'Créer la liste' }).click();

  await expect(page.getByRole('alert')).toContainText(/Hors ligne/);
  await expect(page.getByRole('alert')).toContainText(/rien n’est perdu/i);

  /* La file ne porte QUE des progressions : aucune modification de liste ne s'y
     glisse pour partir toute seule plus tard. */
  const file = await page.evaluate(
    () => JSON.parse(localStorage.getItem('tapeavecmoi.file') ?? '[]') as { profilDistant?: string }[],
  );
  expect(file.every((e) => typeof e.profilDistant === 'string')).toBe(true);
});
