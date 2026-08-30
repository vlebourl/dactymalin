import { expect, test } from '@playwright/test';
import { ouvrir } from './helpers/app';
import { frapperCouple } from './helpers/keyboard';

test.describe('Verr. Maj', () => {
  test('une majuscule sans Maj affiche le bandeau, une minuscule le retire', async ({ page }) => {
    await ouvrir(page, 'fr-FR');
    await page.getByRole('button', { name: 'On commence !' }).click();

    const bandeau = page.getByText('Ton clavier écrit en grandes lettres.');
    await expect(bandeau).toHaveCount(0);

    await frapperCouple(page, 'KeyE', 'E');
    await expect(bandeau).toBeVisible();
    // le message reste en langue d'enfant, sans abréviation technique
    await expect(page.getByText('VERR. MAJ')).toHaveCount(0);

    await frapperCouple(page, 'KeyE', 'e');
    await expect(bandeau).toHaveCount(0);
  });
});

/* La v1 ouvrait les chiffres dès le palier 1 en CH-FR parce qu'ils y sont
   directs : l'enfant suisse devait valider onze touches contre sept pour
   l'enfant français, avec le même plafond, et son premier palier était ~57 %
   plus long. La v2 aligne les deux dispositions sur une étape « chiffres »
   commune — l'asymétrie était un défaut, pas une promesse. */
test.describe('CH-FR', () => {
  test('la première étape sert des mots, et aucun chiffre', async ({ page }) => {
    await ouvrir(page, 'fr-CH');
    await page.getByRole('button', { name: 'On commence !' }).click();
    const mot = await page.evaluate(
      () => document.querySelector('[data-mot]')?.getAttribute('data-mot') ?? '',
    );
    expect(mot.length).toBeGreaterThan(0);
    expect(mot, 'aucun chiffre avant l’étape qui les enseigne').not.toMatch(/[0-9]/);
  });
});
