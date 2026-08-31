import { expect, test } from '@playwright/test';
import { jouerBlocParfait, ouvrir, sauvegarde } from './helpers/app';

/**
 * #72 — un même exercice ne revient pas d'une leçon à l'autre.
 *
 * Garde-fou §7.2 : « pas deux fois le même exercice dans une leçon, au moins
 * trois leçons d'écart entre deux occurrences ». La dé-duplication DANS une
 * leçon existait ; celle ENTRE leçons non — le générateur l'acceptait en
 * argument, personne ne le lui passait, et rien ne gardait la trace de ce qui
 * avait été servi la fois d'avant.
 *
 * Ce parcours joue deux leçons entières au clavier : il traverse le reducer,
 * l'écriture locale, la relecture, et la composition de la séance suivante.
 */
test('les mots de la leçon d’avant ne reviennent pas dans la suivante', async ({ page }) => {
  /* Une étape au corpus large : à l'étape 1, deux leçons épuiseraient presque
     le vivier et la règle d'écart devrait céder — c'est un autre cas. */
  await ouvrir(page, 'fr-FR', 4);

  await page.getByRole('button', { name: 'On commence !' }).click();
  await jouerBlocParfait(page, 'fr-FR');
  await expect
    .poll(async () => (await sauvegarde(page)).exercicesRecents?.[0]?.length ?? 0, {
      timeout: 5_000,
      message: 'la première leçon devrait avoir laissé ses exercices',
    })
    .toBeGreaterThan(0);
  const premiere: string[] = (await sauvegarde(page)).exercicesRecents[0];

  // Deuxième leçon, enchaînée depuis l'écran de fin.
  await page.getByRole('button', { name: 'Encore' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');
  await jouerBlocParfait(page, 'fr-FR');

  await expect
    .poll(async () => ((await sauvegarde(page)).exercicesRecents ?? []).length, { timeout: 5_000 })
    .toBe(2);
  const seconde: string[] = (await sauvegarde(page)).exercicesRecents[1];

  expect(seconde.length, 'la seconde leçon doit avoir servi quelque chose').toBeGreaterThan(0);
  for (const mot of seconde) expect(premiere, `« ${mot} » revient trop tôt`).not.toContain(mot);
});

test('ce que la leçon a servi revient après un rechargement', async ({ page }) => {
  /* Ce que ce parcours prouve exactement, et pas plus : le champ franchit un
     rechargement complet de l'application. Il ne prouve PAS la relecture du
     stockage local — le harnais réécrit la sauvegarde du profil à chaque
     navigation, si bien que c'est la réconciliation avec le compte qui la
     ramène. La relecture locale, elle, est tenue en unitaire
     (`mesures.test.ts`, « traversent une sauvegarde et sa relecture »). */
  await ouvrir(page, 'fr-FR', 4);
  await page.getByRole('button', { name: 'On commence !' }).click();
  await jouerBlocParfait(page, 'fr-FR');
  await expect
    .poll(async () => (await sauvegarde(page)).exercicesRecents?.[0]?.length ?? 0, {
      timeout: 5_000,
    })
    .toBeGreaterThan(0);
  const avant: string[] = (await sauvegarde(page)).exercicesRecents[0];

  await page.reload();
  await page.waitForSelector('body[data-vue="V1"]');

  /* Sondé, et il faut le dire : le champ n'est pas là à l'instant où V1
     s'affiche — il revient après deux allers-retours réseau. Une assertion
     sèche passait ici sur une machine rapide et tombait sur la CI. */
  await expect
    .poll(async () => (await sauvegarde(page)).exercicesRecents?.[0], {
      timeout: 10_000,
      message: 'le souvenir de la leçon devrait revenir après le rechargement',
    })
    .toEqual(avant);
});
