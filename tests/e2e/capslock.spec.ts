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

test.describe('CH-FR', () => {
  test('la leçon 1 propose bien des nombres, comme V2 le promet', async ({ page }) => {
    await ouvrir(page, 'fr-CH');
    await page.getByRole('button', { name: 'On commence !' }).click();
    const items = await page.evaluate(() => {
      const bandeau = document.querySelector('[data-mot]');
      return bandeau?.getAttribute('data-mot') ?? '';
    });
    expect(items.length).toBeGreaterThan(0);
    // les chiffres 4 5 6 7 sont déverrouillés dès le palier 1
    await expect(page.getByText(/4\s*5\s*6\s*7/)).toBeVisible();
  });
});
