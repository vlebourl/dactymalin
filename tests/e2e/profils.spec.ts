import { expect, test } from '@playwright/test';
import { assureProfil, cleProfil, connecte, courrielUnique, inscrit, ouvrir, sauvegarde } from './helpers/app';
import { PRENOM_MAX } from '../../src/core/profils';

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

test('un prénom vide est refusé, et personne ne devient « Joueur 1 »', async ({ page }) => {
  await inscrit(page);
  await page.goto('/');
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V0');

  // champ laissé vide, puis rempli d'espaces : refusé, avec un motif dit
  await page.getByRole('button', { name: "C'est parti !" }).click();
  await expect(page.getByRole('status')).toHaveText(/écris ton prénom/i);
  await page.getByLabel('Ton prénom').fill('   ');
  await page.getByRole('button', { name: "C'est parti !" }).click();
  await expect(page.getByRole('status')).toHaveText(/écris ton prénom/i);

  // on est toujours sur l'écran, et le compte n'a hérité d'AUCUN profil
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V0');
  const { profils } = (await (await page.request.get('/api/profils')).json()) as {
    profils: unknown[];
  };
  expect(profils).toHaveLength(0);

  // le prénom corrigé passe, et le message s'en va
  await page.getByLabel('Ton prénom').fill('Timo');
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.getByRole('button', { name: "C'est parti !" }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V2');
});

test('un prénom trop long est refusé et le dit, plutôt que de couper en silence', async ({
  page,
}) => {
  await inscrit(page);
  await page.goto('/');
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V0');

  const tropLong = 'a'.repeat(PRENOM_MAX + 5);
  await page.getByLabel('Ton prénom').fill(tropLong);
  /* Ce qui a été tapé reste À L'ÉCRAN : couper à la trentième lettre sans un
     mot laisse l'enfant devant un prénom qui n'est pas le sien. */
  await expect(page.getByLabel('Ton prénom')).toHaveValue(tropLong);
  await expect(page.getByRole('status')).toHaveText(new RegExp(`${PRENOM_MAX} lettres`));

  await page.getByRole('button', { name: "C'est parti !" }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V0');
  const { profils } = (await (await page.request.get('/api/profils')).json()) as {
    profils: unknown[];
  };
  expect(profils).toHaveLength(0);
});

test("la progression d'avant la mise à jour rejoint le premier enfant créé", async ({ page }) => {
  /* Appareil qui a joué AVANT que les profils ne viennent du serveur : sa
     progression est sous la clé historique, et personne ne l'a jamais envoyée
     au compte. Elle ne doit pas être perdue. */
  await page.addInitScript(() => {
    localStorage.setItem(
      'tapeavecmoi.v1',
      JSON.stringify({
        version: 1,
        disposition: 'fr-FR',
        dispositionChoisieALaMain: true,
        palier: 5,
        blocsSurPalier: 0,
        bloc: 1,
        maitrise: {},
        guideDoigtVu: true,
        reglages: { sons: false, texteEspace: false, animationsDouces: false },
      }),
    );
  });
  await inscrit(page);
  await page.goto('/');
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V0');
  await page.getByLabel('Ton prénom').fill('Timo');
  await page.getByRole('button', { name: "C'est parti !" }).click();

  // il reprend à son palier, pas à zéro, et la clé historique a disparu
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V1');
  expect(await page.evaluate(() => localStorage.getItem('tapeavecmoi.v1'))).toBeNull();
  const { profils } = (await (await page.request.get('/api/profils')).json()) as {
    profils: { prenom: string; etat: { palier: number } | null }[];
  };
  expect(profils[0].etat?.palier).toBe(5);
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

test('chaque enfant a sa progression, indexée par son identifiant', async ({ page }) => {
  /* L'invariant de #4 : la clé d'une progression est l'IDENTIFIANT du profil.
     Deux enfants ne partagent donc jamais la leur, quoi qu'il arrive à leurs
     prénoms. Depuis #18, le foyer refuse deux prénoms identiques — la preuve
     qu'aucune fusion par prénom n'existe vit dans `sync.test.ts` et
     `profils.test.ts`, qui fabriquent des homonymes que le serveur enverrait. */
  await ouvrir(page, 'fr-FR', 3, false, 'Timo');
  const premier = cleProfil(page);
  expect((await sauvegarde(page)).palier).toBe(3);

  await page.request.post('/api/profils', { data: { prenom: 'Zoé' } });
  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V0');
  await page.getByRole('button', { name: 'Zoé' }).click();

  // Zoé démarre à neuf, sur SA clé : Timo n'a pas été touché
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V2');
  const cles = await page.evaluate(
    (prefixe) =>
      Object.keys(localStorage).filter((c) => c.startsWith(prefixe) && !c.endsWith('.backup')),
    'tapeavecmoi.v1.',
  );
  expect(cles.length).toBe(2);
  expect(
    await page.evaluate((c) => JSON.parse(localStorage.getItem(c) ?? '{}').palier, premier),
  ).toBe(3);
});

test('changer de joueur revient au choix, chacun retrouve sa progression', async ({ page }) => {
  await ouvrir(page, 'fr-FR', 3, false, 'Timo');
  /* Le second enfant est ajouté par le PARENT (#18) : l'écran de l'enfant ne
     crée plus personne. */
  await page.request.post('/api/profils', { data: { prenom: 'Zoé' } });

  await page.getByLabel('Réglages').click();
  await page.getByRole('button', { name: 'Changer de joueur' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V0');
  await page.getByRole('button', { name: 'Zoé' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V2');

  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V0');
  await page.getByRole('button', { name: 'Timo' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V1');
  expect((await sauvegarde(page)).palier).toBe(3);
});
