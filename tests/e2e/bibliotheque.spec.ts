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
  await expect(page.getByText('Dictée de la semaine')).toBeVisible();

  // — la liste survit à un rechargement : elle vit sur le compte, pas ici.
  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V1');
  await page.getByLabel('Réglages').click();
  await page.getByRole('button', { name: 'Ouvrir' }).click();
  await expect(page.getByText('Dictée de la semaine')).toBeVisible();
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
  await expect(page.getByText('La famille')).toBeVisible();

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
