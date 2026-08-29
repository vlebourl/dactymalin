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
    /* `toBeVisible` et pas `toContainText` : ce dernier passe sur un élément
       caché, et il aurait donc continué à « prouver » la présence du bandeau
       là où il est justement effacé. */
    await expect(bandeau(page)).toBeVisible();
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
  /* La leçon est le seul écran qui l'efface — c'est vérifié à part. On la
     traverse donc, et on retrouve le bandeau au bilan de fin de bloc. */
  await page.getByRole('button', { name: 'On commence !' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');
  await expect(bandeau(page)).toBeHidden();

  await jouerItem(page, 'fr-FR');
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

/**
 * Le critère d'accessibilité, vérifié sur l'ARBRE d'accessibilité et non sur le
 * balisage : `getByRole` passe par lui, donc si le nom n'est pas calculé, le
 * test ne trouve rien. C'est exactement ce qui manquait — un `aria-label` posé
 * sur un `div` nu est ignoré (rôle `generic`, nom interdit), et rien ne le
 * disait.
 */
test('le bandeau est un repère nommé, pas un texte anonyme', async ({ page }) => {
  const email = await inscrit(page);
  await ouvrir(page, 'fr-FR', 1);

  const repere = page.getByRole('complementary', { name: 'Compte connecté' });
  await expect(repere).toBeVisible();
  await expect(repere).toContainText(email);
});

/**
 * …et il s'efface PENDANT la leçon. Le cahier des charges est catégorique sur
 * cet écran : « un enfant de 7 ans ne doit décoder qu'UNE SEULE chose à
 * l'écran ». Une adresse d'adulte n'y a rien à faire, et le parent qui se
 * demande sur quel compte il est ne se le demande pas pendant que l'enfant
 * tape. Il revient dès la fin du bloc.
 */
test('le bandeau s’efface pendant la leçon, et revient après', async ({ page }) => {
  await inscrit(page);
  await ouvrir(page, 'fr-FR', 1);
  await expect(bandeau(page)).toBeVisible();

  await page.getByRole('button', { name: 'On commence !' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');
  await expect(bandeau(page)).toBeHidden();

  /* Et l'écran de la leçon retrouve TOUTE sa hauteur : le clavier n'est pas
     rogné par un bandeau qui lui prendrait quelques pixels. */
  await page.setViewportSize({ width: 1280, height: 720 });
  const deborde = await page.evaluate(() => {
    const e = document.scrollingElement!;
    return e.scrollHeight - e.clientHeight;
  });
  expect(deborde).toBeLessThanOrEqual(1);
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
