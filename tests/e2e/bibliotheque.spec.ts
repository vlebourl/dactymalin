import { expect, test } from '@playwright/test';
import { ouvrir, motCourant, sauvegarde } from './helpers/app';
import { taper } from './helpers/keyboard';

/**
 * #9 — la première tranche complète de la bibliothèque : le parent crée une
 * liste nommée, l'enfant la trouve en carte sur l'accueil, la joue, gagne ses
 * étoiles — et son palier ne bouge pas.
 */
test('le parent crée une liste, l’enfant la joue, le palier ne bouge pas', async ({ page }) => {
  await ouvrir(page, 'fr-FR', 1);
  const MOTS = ['dinosaure', 'papillon'];

  // — côté parent : réglages, puis l'espace parent.
  await page.getByLabel('Réglages').click();
  await page.getByRole('button', { name: 'Ouvrir' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V9');

  await page.getByLabel('Nom de la liste').fill('Dictée de la semaine');
  await page.getByLabel('Les mots de la liste').fill(MOTS.join('\n'));
  await page.getByRole('button', { name: 'Créer la liste' }).click();
  await expect(page.getByRole('button', { name: 'Modifier Dictée de la semaine' })).toBeVisible();

  // — la liste survit à un rechargement : elle vit sur le compte, pas ici.
  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V1');
  await page.getByLabel('Réglages').click();
  await page.getByRole('button', { name: 'Ouvrir' }).click();
  await expect(page.getByRole('button', { name: 'Modifier Dictée de la semaine' })).toBeVisible();
  await page.getByLabel('Revenir').click();
  await page.getByLabel('Revenir').click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V1');

  // — côté enfant : la carte est sur l'accueil, un seul appui la lance.
  const carte = page.getByRole('button', { name: /Dictée de la semaine/ });
  await expect(carte).toBeVisible();
  await carte.click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');

  const premier = (await motCourant(page))!;
  expect(MOTS).toContain(premier);

  /* Le clavier allume les touches de la liste MÊME HORS PROGRAMME : le palier 1
     n'enseigne que `e f j n s t u`, et pourtant `d` et `p` sont allumés parce
     que les mots de la liste les demandent. */
  for (const code of ['KeyD', 'KeyP']) {
    await expect(page.locator(`[data-code="${code}"]`)).not.toHaveAttribute('data-etat', 'eteinte');
  }

  await taper(page, 'fr-FR', premier);
  await page.waitForFunction(
    (m) => document.querySelector('[data-mot]')?.getAttribute('data-mot') !== m,
    premier,
  );
  const second = (await motCourant(page))!;
  expect(MOTS).toContain(second);
  await taper(page, 'fr-FR', second);
  await page.waitForSelector('body[data-vue="V5"]');

  // — des étoiles, oui ; du parcours, rien.
  await expect(page.locator('[aria-label="Tes étoiles de ce bloc"] svg')).toHaveCount(2);
  const apres = await sauvegarde(page);
  expect(apres.palier).toBe(1);
  expect(apres.blocsSurPalier).toBe(0);
  expect(apres.maitrise).toEqual({});
});

/* Un mot que la disposition ne sait pas écrire d'une seule frappe (« fête »
   passe par une touche morte) est écarté, et le parent l'apprend à la saisie
   plutôt qu'en cherchant pourquoi il n'arrive jamais dans la leçon. */
test('le parent est averti du mot que le clavier ne sait pas écrire', async ({ page }) => {
  await ouvrir(page, 'fr-FR', 1);
  await page.getByLabel('Réglages').click();
  await page.getByRole('button', { name: 'Ouvrir' }).click();

  await page.getByLabel('Nom de la liste').fill('La fête');
  await page.getByLabel('Les mots de la liste').fill('papa\nfête');
  await expect(page.getByText(/ne sait pas écrire.*fête/)).toBeVisible();

  await page.getByRole('button', { name: 'Créer la liste' }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: /La fête/ })).toBeVisible();
  await page.getByRole('button', { name: /La fête/ }).click();

  // le bloc ne contient que ce que le clavier écrit
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');
  expect(await motCourant(page)).toBe('papa');
});

/* « Les listes appartiennent au foyer : les deux enfants voient les mêmes »
   (#9). Une liste pend au COMPTE et non au profil — sans quoi le parent
   saisirait la même dictée deux fois. */
test('les deux enfants du foyer voient la même liste', async ({ page }) => {
  await ouvrir(page, 'fr-FR', 1, false, 'Timo');

  // le parent prépare la dictée, et ajoute le second enfant
  await page.getByLabel('Réglages').click();
  await page.getByRole('button', { name: 'Ouvrir' }).click();
  await page.getByLabel('Nom de la liste').fill('La famille');
  await page.getByLabel('Les mots de la liste').fill('papi\nmamie');
  await page.getByRole('button', { name: 'Créer la liste' }).click();
  await expect(page.getByRole('button', { name: 'Modifier La famille' })).toBeVisible();

  await page.getByLabel('Prénom du nouvel enfant').fill('Zoé');
  await page.getByRole('button', { name: 'Ajouter un enfant' }).click();
  await expect(page.getByLabel('Prénom de Zoé')).toBeVisible();

  /* Deux enfants : l'app repasse par « Qui joue ? ». Chacun ouvre SON accueil,
     et la carte y est. */
  await page.reload();
  for (const prenom of ['Timo', 'Zoé']) {
    await page.waitForSelector('body[data-vue="V0"]');
    await page.getByRole('button', { name: prenom }).click();
    /* Zoé n'a encore rien joué sur cet appareil : elle traverse d'abord son
       onboarding — clavier, puis doigts. Timo arrive directement sur le sien. */
    if ((await page.locator('body').getAttribute('data-vue')) === 'V2') {
      await page
        .locator('[data-disposition="fr-FR"]')
        .getByRole('button', { name: "C'est celui-là" })
        .click();
      await page.getByRole('button', { name: "J'ai compris" }).click();
    }
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V1');
    await expect(page.getByRole('button', { name: /La famille/ })).toBeVisible();
    await page.reload();
  }
});

/**
 * #10 — la dictée change chaque semaine. Le parent réécrit SA liste plutôt
 * que d'en empiler une nouvelle, la renomme, et jette celles qui ne servent
 * plus pour que la grille de l'enfant ne se remplisse pas de listes mortes.
 */
test('le parent modifie, renomme, puis supprime une liste', async ({ page }) => {
  await ouvrir(page, 'fr-FR', 1);
  const parent = async () => {
    await page.getByLabel('Réglages').click();
    await page.getByRole('button', { name: 'Ouvrir' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V9');
  };

  await parent();
  await page.getByLabel('Nom de la liste').fill('Dictée');
  await page.getByLabel('Les mots de la liste').fill('papa\nmaman');
  await page.getByRole('button', { name: 'Créer la liste' }).click();
  await expect(page.getByRole('button', { name: 'Modifier Dictée' })).toBeVisible();

  // — modifier les mots ET le nom d'un coup, puis relire depuis le serveur
  await page.getByRole('button', { name: 'Modifier Dictée' }).click();
  await page.getByLabel('Nom de Dictée').fill('Dictée du 2 septembre');
  await page.getByLabel('Les mots de Dictée').fill('lundi\nmardi\nmercredi');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.getByRole('button', { name: 'Modifier Dictée du 2 septembre' })).toBeVisible();

  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V1');

  // — le nouveau nom est sur la carte de l'accueil, et ce sont les nouveaux mots
  const carte = page.getByRole('button', { name: /Dictée du 2 septembre/ });
  await expect(carte).toBeVisible();
  await expect(carte).toContainText('3 mots');
  await carte.click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');
  expect(['lundi', 'mardi', 'mercredi']).toContain((await motCourant(page))!);

  // — supprimer : une confirmation d'abord, et elle nomme la liste
  await page.goto('/');
  await parent();
  await page.getByLabel('Supprimer Dictée du 2 septembre').click();
  await expect(page.getByRole('alert')).toContainText('Dictée du 2 septembre');
  await page.getByRole('button', { name: 'Annuler' }).click();
  await expect(page.getByRole('button', { name: 'Modifier Dictée du 2 septembre' })).toBeVisible();

  await page.getByLabel('Supprimer Dictée du 2 septembre').click();
  await page.getByRole('button', { name: 'Oui, supprimer Dictée du 2 septembre' }).click();
  await expect(page.getByText("Aucune liste pour l'instant.")).toBeVisible();

  // — et elle a bien disparu de l'accueil de l'enfant
  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V1');
  await expect(page.getByRole('button', { name: /Dictée/ })).toHaveCount(0);
});

/**
 * Régression (revue de #10) : une liste appartient au COMPTE, une disposition
 * appartient à l'APPAREIL. Ouvrir la liste sur un clavier qui ne sait pas
 * écrire l'un de ses mots, puis enregistrer, effaçait ce mot POUR TOUT LE
 * FOYER. « où » s'écrit d'une frappe sur l'AZERTY, pas sur le clavier suisse.
 */
test('changer de clavier n’efface pas les mots de la liste', async ({ page }) => {
  await ouvrir(page, 'fr-FR', 1);

  await page.getByLabel('Réglages').click();
  await page.getByRole('button', { name: 'Ouvrir' }).click();
  await page.getByLabel('Nom de la liste').fill('Les questions');
  await page.getByLabel('Les mots de la liste').fill('où\nquand');
  await page.getByRole('button', { name: 'Créer la liste' }).click();
  await expect(page.getByRole('button', { name: 'Modifier Les questions' })).toBeVisible();

  // cet appareil passe au clavier suisse
  await page.getByLabel('Revenir').click();
  await page.getByLabel('Revenir').click();
  await page.getByRole('button', { name: 'Changer' }).click();
  await page
    .locator('[data-disposition="fr-CH"]')
    .getByRole('button', { name: "C'est celui-là" })
    .click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V1');

  // le parent rouvre la liste : on l'avertit, mais rien n'est retranché
  await page.getByLabel('Réglages').click();
  await page.getByRole('button', { name: 'Ouvrir' }).click();
  await page.getByRole('button', { name: 'Modifier Les questions' }).click();
  await expect(page.getByLabel('Les mots de Les questions')).toHaveValue('où\nquand');
  await expect(page.getByText(/ne sait pas écrire.*où/)).toBeVisible();

  // il renomme, enregistre — et « où » est toujours là
  await page.getByLabel('Nom de Les questions').fill('Les questions du jour');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.getByRole('button', { name: 'Modifier Les questions du jour' })).toBeVisible();

  const { listes } = (await (await page.request.get('/api/listes')).json()) as {
    listes: { nom: string; mots: string[] }[];
  };
  expect(listes).toHaveLength(1);
  expect(listes[0].nom).toBe('Les questions du jour');
  expect(listes[0].mots).toEqual(['où', 'quand']);
});
