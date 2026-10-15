import { expect, test } from '@playwright/test';
import { curseur, motCourant, ouvrir } from './helpers/app';
import { DUREE_FAUSSE } from '../../src/core/lecon';
import { frapperCouple } from './helpers/keyboard';

test.describe('frappe fausse (P3)', () => {
  test('rien ne s\'écrit, le curseur ne bouge pas, aucun rouge', async ({ page }) => {
    await ouvrir(page, 'fr-FR');
    await page.getByRole('button', { name: 'On commence !' }).click();
    const mot = await motCourant(page);
    const avant = await curseur(page);

    // 12 frappes fausses de suite : le mot reste orthographiquement vrai.
    for (let i = 0; i < 12; i++) {
      await frapperCouple(page, 'KeyL', 'l');
      await frapperCouple(page, 'KeyK', 'k');
    }
    await expect(page.locator('[data-etat="fausse"]')).toHaveCount(0);

    expect(await motCourant(page)).toBe(mot);
    expect(await curseur(page)).toBe(avant);
  });

  test('la touche fausse s\'enfonce et retombe, la cible reste la plus vive', async ({ page }) => {
    await page.clock.install();
    await ouvrir(page, 'fr-FR');
    await page.getByRole('button', { name: 'On commence !' }).click();
    // L’état dure 180 ms : figer l’horloge permet d’examiner son rendu
    // même si le pilote est ralenti, puis de laisser sa durée s’écouler.
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    await frapperCouple(page, 'KeyL', 'l');

    const fausse = page.locator('[data-etat="fausse"]');
    await expect(fausse).toHaveCount(1);
    // la touche fausse est ENFONCÉE (rentrée), pas colorée
    const transform = await fausse.evaluate((n) => getComputedStyle(n).transform);
    expect(transform).not.toBe('none');
    // retombée en 150-200 ms
    await page.clock.runFor(DUREE_FAUSSE + 16);
    await expect(fausse).toHaveCount(0, { timeout: 1200 });

    // une seule touche cible à la fois (F5)
    await expect(page.locator('[data-etat="cible"]')).toHaveCount(1);
  });

  /* La bande de photographies a été retirée le 2026-08-29 : les deux mains
     encadrent le clavier et disent la même chose. Ce qui doit rester vrai est
     l'UNICITÉ du guide — un seul doigt visé, une seule main désignée. Sans ce
     test, une main allumée des deux côtés passerait inaperçue. */
  test('un seul doigt visé, une seule main désignée', async ({ page }) => {
    await ouvrir(page);
    await page.getByRole('button', { name: 'On commence !' }).click();

    await expect(page.locator('[data-doigt]')).toHaveCount(1);
    expect(await page.locator('[data-doigt]').getAttribute('data-doigt')).toMatch(
      /^(index|pouce)_(gauche|droit)$/,
    );
    await expect(page.locator('[data-main-active="oui"]')).toHaveCount(1);
    /* Une seule main porte un doigt surligné ; l'autre est au repos (#37). */
    await expect(page.locator('[data-main] img[src*="aucun_"]')).toHaveCount(1);
  });
});
