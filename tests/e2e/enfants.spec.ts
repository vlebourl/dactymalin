import { expect, test, type Page } from '@playwright/test';
import { ouvrir, sauvegarde } from './helpers/app';
import { PRENOM_MAX, PROFILS_MAX } from '../../src/core/profils';

/**
 * Le parent gère ses enfants (#18) : ajouter, renommer, supprimer. Les
 * réglages les LISTENT ; les boutons qui détruisent une progression vivent sur
 * l'écran du compte, une porte plus loin — un enfant de sept ans qui cherche
 * le bouton des sons ne doit pas tomber dessus.
 */

/** Réglages → « Gérer les enfants ». */
async function espaceParent(page: Page) {
  await page.getByLabel('Réglages').click();
  await page.getByRole('button', { name: 'Gérer les enfants' }).click();
  await expect(page.getByRole('heading', { name: 'Nos enfants' })).toBeVisible();
}

test('les réglages listent les enfants DU COMPTE, avec leur progression', async ({ page }) => {
  await ouvrir(page, 'fr-FR', 4, false, 'Timo');
  await espaceParent(page);
  await page.getByLabel('Prénom du nouvel enfant').fill('Zoé');
  await page.getByRole('button', { name: 'Ajouter un enfant' }).click();
  await expect(page.getByLabel('Prénom de Zoé')).toBeVisible();

  await page.getByRole('button', { name: 'Revenir' }).click();
  // Timo a joué ICI : son palier s'affiche. Zoé, non : on ne l'invente pas.
  await expect(page.getByText('Timo — leçon 4')).toBeVisible();
  await expect(page.getByText('Zoé — pas encore joué sur cet appareil')).toBeVisible();
});

test('le parent ajoute un enfant, il apparaît aussitôt sur « Qui joue ? »', async ({ page }) => {
  await ouvrir(page, 'fr-FR', 3, false, 'Timo');
  await espaceParent(page);

  await page.getByLabel('Prénom du nouvel enfant').fill('Zoé');
  await page.getByRole('button', { name: 'Ajouter un enfant' }).click();
  await expect(page.getByLabel('Prénom de Zoé')).toBeVisible();

  // « Qui joue ? » la propose, et Timo garde sa progression
  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V0');
  await expect(page.getByRole('button', { name: 'Zoé' })).toBeVisible();
  await page.getByRole('button', { name: 'Timo' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V1');
  expect((await sauvegarde(page)).palier).toBe(3);
});

test("le dernier enfant supprimé, l'écran redemande un prénom plutôt que d'enfermer le compte", async ({
  page,
}) => {
  /* Un compte sans aucun enfant n'a plus d'écran parent atteignable : les
     réglages vivent DANS l'application, qui exige un joueur. Le champ de
     « Qui joue ? » est donc le seul chemin de retour — le retirer là
     enfermerait le foyer dehors. */
  await ouvrir(page, 'fr-FR', 2, false, 'Timo');
  await espaceParent(page);
  await page.getByRole('button', { name: 'Supprimer Timo' }).click();
  await page.getByRole('button', { name: 'Oui, supprimer Timo' }).click();

  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V0');
  await page.getByLabel('Ton prénom').fill('Timo');
  await page.getByRole('button', { name: "C'est parti !" }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V2');
});

test("l'enfant ne peut pas créer de joueur depuis son écran", async ({ page }) => {
  await ouvrir(page, 'fr-FR', 1, false, 'Timo');
  await page.request.post('/api/profils', { data: { prenom: 'Zoé' } });
  await page.reload();

  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V0');
  await expect(page.getByRole('button', { name: 'Nouveau joueur' })).toHaveCount(0);
  await expect(page.getByLabel('Ton prénom')).toHaveCount(0);
  await expect(page.getByText(/c'est dans les réglages/i)).toBeVisible();
});

test('renommer un enfant conserve sa progression', async ({ page }) => {
  /* L'identité d'un enfant est son identifiant serveur (#4) : corriger son
     prénom ne doit rien lui coûter. */
  await ouvrir(page, 'fr-FR', 4, false, 'Timo');
  await espaceParent(page);
  await expect(page.getByText('étape 4')).toBeVisible();

  await page.getByLabel('Prénom de Timo').fill('Timothée');
  await page.getByRole('button', { name: 'Renommer' }).click();

  await expect(page.getByLabel('Prénom de Timothée')).toBeVisible();
  await expect(page.getByText('étape 4')).toBeVisible();
  expect((await sauvegarde(page)).palier).toBe(4);

  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V1');
  expect((await sauvegarde(page)).palier).toBe(4);
});

test('un renommage vide ou trop long est refusé, et le dit', async ({ page }) => {
  await ouvrir(page, 'fr-FR', 4, false, 'Timo');
  await espaceParent(page);

  await page.getByLabel('Prénom de Timo').fill('   ');
  await page.getByRole('button', { name: 'Renommer' }).click();
  await expect(page.getByRole('alert')).toHaveText(/ne peut pas être sans nom/i);

  await page.getByLabel('Prénom de Timo').fill('a'.repeat(PRENOM_MAX + 5));
  await page.getByRole('button', { name: 'Renommer' }).click();
  await expect(page.getByRole('alert')).toHaveText(new RegExp(`${PRENOM_MAX} lettres`));

  // le profil n'a bougé ni de prénom ni de progression
  const { profils } = (await (await page.request.get('/api/profils')).json()) as {
    profils: { prenom: string; etat: { palier: number } | null }[];
  };
  expect(profils[0].prenom).toBe('Timo');
  expect(profils[0].etat?.palier).toBe(4);
});

test('supprimer un enfant demande un oui explicite, et emporte sa progression', async ({
  page,
}) => {
  await ouvrir(page, 'fr-FR', 5, false, 'Timo');
  await page.request.post('/api/profils', { data: { prenom: 'Zoé' } });
  await espaceParent(page);

  // un premier clic ne supprime RIEN : il demande confirmation, en nommant l'enfant
  await page.getByRole('button', { name: 'Supprimer Zoé' }).click();
  await expect(page.getByText(/Supprimer Zoé et toute sa progression \?/)).toBeVisible();
  await page.getByRole('button', { name: 'Annuler' }).click();
  await expect(page.getByLabel('Prénom de Zoé')).toBeVisible();

  // le oui explicite, lui, supprime
  await page.getByRole('button', { name: 'Supprimer Zoé' }).click();
  await page.getByRole('button', { name: 'Oui, supprimer Zoé' }).click();
  await expect(page.getByLabel('Prénom de Zoé')).toHaveCount(0);

  // le compte ne la connaît plus, et Timo n'a pas bougé
  const { profils } = (await (await page.request.get('/api/profils')).json()) as {
    profils: { prenom: string; etat: { palier: number } | null }[];
  };
  expect(profils.map((p) => p.prenom)).toEqual(['Timo']);
  expect(profils[0].etat?.palier).toBe(5);
});

test('la progression en cache part avec l’enfant supprimé', async ({ page }) => {
  await ouvrir(page, 'fr-FR', 2, false, 'Timo');
  const { id } = (await (
    await page.request.post('/api/profils', { data: { prenom: 'Zoé' } })
  ).json()) as { id: string };
  // Zoé a joué sur CET appareil : sa progression y est en cache
  await page.evaluate(
    ([cle]) => localStorage.setItem(cle as string, JSON.stringify({ version: 1, palier: 3 })),
    [`tapeavecmoi.v1.${id}`],
  );

  await espaceParent(page);
  await page.getByRole('button', { name: 'Supprimer Zoé' }).click();
  await page.getByRole('button', { name: 'Oui, supprimer Zoé' }).click();
  await expect(page.getByLabel('Prénom de Zoé')).toHaveCount(0);

  expect(
    await page.evaluate(([cle]) => localStorage.getItem(cle as string), [`tapeavecmoi.v1.${id}`]),
  ).toBeNull();
});

test('un prénom déjà pris dans le foyer est refusé, et le dit', async ({ page }) => {
  await ouvrir(page, 'fr-FR', 1, false, 'Timo');
  await espaceParent(page);

  await page.getByLabel('Prénom du nouvel enfant').fill('  timo ');
  await page.getByRole('button', { name: 'Ajouter un enfant' }).click();
  await expect(page.getByRole('alert')).toHaveText(/porte déjà ce prénom/);

  const { profils } = (await (await page.request.get('/api/profils')).json()) as {
    profils: unknown[];
  };
  expect(profils).toHaveLength(1);
});

test('un prénom vide ou trop long est refusé à l’ajout, et le dit', async ({ page }) => {
  await ouvrir(page, 'fr-FR', 1, false, 'Timo');
  await espaceParent(page);

  await page.getByRole('button', { name: 'Ajouter un enfant' }).click();
  await expect(page.getByRole('alert')).toHaveText(/ne peut pas être sans nom/);

  await page.getByLabel('Prénom du nouvel enfant').fill('a'.repeat(PRENOM_MAX + 5));
  await page.getByRole('button', { name: 'Ajouter un enfant' }).click();
  await expect(page.getByRole('alert')).toHaveText(new RegExp(`${PRENOM_MAX} lettres`));
});

test('le plafond de profils est expliqué, pas seulement subi', async ({ page }) => {
  await ouvrir(page, 'fr-FR', 1, false, 'Timo');
  /* Le foyer est plein AVANT d'ouvrir l'écran parent : il relit la liste à son
     montage, inutile de repasser par « Qui joue ? » — que douze boutons
     rendraient de toute façon impraticable. */
  for (let i = 0; i < PROFILS_MAX - 1; i++) {
    await page.request.post('/api/profils', { data: { prenom: `Enfant ${i}` } });
  }
  await espaceParent(page);

  await page.getByLabel('Prénom du nouvel enfant').fill('Un de trop');
  await page.getByRole('button', { name: 'Ajouter un enfant' }).click();
  await expect(page.getByRole('alert')).toHaveText(new RegExp(`${PROFILS_MAX} enfants`));
});

test("supprimer l'enfant en train de jouer ferme sa session, sans écrire pour un fantôme", async ({
  page,
}) => {
  await ouvrir(page, 'fr-FR', 3, false, 'Timo');
  const cleTimo = await page.evaluate(
    () => Object.keys(localStorage).find((c) => c.startsWith('tapeavecmoi.v1.'))!,
  );
  await page.request.post('/api/profils', { data: { prenom: 'Zoé' } });
  await espaceParent(page);

  await page.getByRole('button', { name: 'Supprimer Timo' }).click();
  await page.getByRole('button', { name: 'Oui, supprimer Timo' }).click();

  /* Timo était le joueur courant : l'application ne peut pas continuer à
     écrire sa progression. Elle repart, et comme Zoé est seule désormais,
     c'est directement sur elle — écran de choix inutile pour un enfant unique.
     Ce qui compte : plus rien ne joue Timo, et son cache est parti avec lui. */
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V2');
  expect(await page.evaluate((c) => localStorage.getItem(c), cleTimo)).toBeNull();

  const { profils } = (await (await page.request.get('/api/profils')).json()) as {
    profils: { prenom: string }[];
  };
  expect(profils.map((p) => p.prenom)).toEqual(['Zoé']);
});
