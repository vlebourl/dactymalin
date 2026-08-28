import { expect, test } from '@playwright/test';
import { ouvrir, motCourant, sauvegarde } from './helpers/app';

/* « Notre leçon » (demande du 2026-08-28) : la famille saisit ses mots dans
   les réglages, l'enfant les tape en mode libre — même avec des lettres pas
   encore enseignées — sans toucher à la progression des paliers. */

test('nos mots deviennent une leçon jouable, hors parcours', async ({ page }) => {
  await ouvrir(page, 'fr-FR', 1);
  const NOS_MOTS = ['dinosaure', 'papillon'];

  // les réglages enregistrent la liste (un mot par ligne)
  await page.getByLabel('Réglages').click();
  await page.getByLabel('Nos mots à nous').fill(NOS_MOTS.join('\n'));
  await page.getByLabel('Revenir').click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V1');
  expect((await sauvegarde(page)).motsPerso).toEqual(NOS_MOTS);

  // la carte du clavier propose « Notre leçon »
  await page.getByRole('button', { name: 'Ma carte du clavier' }).click();
  await page.getByRole('button', { name: 'Notre leçon : nos mots à nous' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');

  // le bloc ne sert QUE nos mots — palier 1, lettres non enseignées comprises
  const premier = (await motCourant(page))!;
  expect(NOS_MOTS).toContain(premier);

  // taper un mot entier avance au suivant, toujours à nous
  const { taper } = await import('./helpers/keyboard');
  await taper(page, 'fr-FR', premier);
  await page.waitForFunction(
    (m) => document.querySelector('[data-mot]')?.getAttribute('data-mot') !== m,
    premier,
  );
  expect(NOS_MOTS).toContain((await motCourant(page))!);

  // rien n'a bougé côté parcours
  expect((await sauvegarde(page)).palier).toBe(1);
});
