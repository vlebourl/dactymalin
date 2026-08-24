import { expect, test } from '@playwright/test';
import { ouvrir } from './helpers/app';

test.describe('aucune requête externe', () => {
  test("l'app ne contacte jamais un autre hôte que localhost", async ({ page }) => {
    const externes: string[] = [];
    page.on('request', (r) => {
      const u = new URL(r.url());
      if (u.hostname !== 'localhost' && u.hostname !== '127.0.0.1') externes.push(r.url());
    });

    await ouvrir(page, 'fr-FR');
    await page.getByRole('button', { name: 'On commence !' }).click();
    await page.waitForTimeout(1500);

    expect(externes).toEqual([]);
  });

  test('la police Lexend est servie localement', async ({ page }) => {
    await ouvrir(page, 'fr-FR');
    const famille = await page.evaluate(() => {
      const charge = [...document.fonts].some(
        (f) => f.family.replace(/['"]/g, '') === 'Lexend' && f.status === 'loaded',
      );
      return charge;
    });
    expect(famille).toBe(true);
  });
});
