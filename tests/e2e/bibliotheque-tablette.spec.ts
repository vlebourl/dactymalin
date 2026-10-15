import { expect, test } from '@playwright/test';
import { creeListe, ouvrir } from './helpers/app';

for (const [largeur, hauteur] of [[768, 1024], [1024, 768]] as const) {
  test(`30 listes restent dans leur compartiment sur tablette ${largeur}×${hauteur}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: largeur, height: hauteur });
    await ouvrir(page, 'fr-FR', 1);
    await creeListe(page, 'Liste 1', ['papa', 'maman']);
    await page.reload();
    const listes = page.getByRole('list', { name: 'Les listes de la maison' });
    await expect(listes.getByRole('listitem')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Listes suivantes' })).toHaveCount(0);
    const initiale = await listes.boundingBox();
    expect(initiale).not.toBeNull();

    for (let i = 2; i <= 30; i++) {
      await creeListe(page, `Liste ${i}`, ['lundi', 'mardi']);
    }
    await page.reload();
    await expect(listes.getByRole('listitem')).toHaveCount(30);
    await page.screenshot({ path: testInfo.outputPath(`accueil-${largeur}.png`) });
    const pleine = await listes.boundingBox();
    expect(pleine).not.toBeNull();
    expect(pleine!.height).toBeLessThanOrEqual(initiale!.height + 1);
    await expect(page.getByRole('button', { name: 'On commence !' })).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Revoir : où mettre mes doigts' })).toBeInViewport({ ratio: 1 });

    // Le dernier choix reste atteignable et lance bien SA liste.
    const derniere = listes.getByRole('button', { name: 'Liste 30 2 mots', exact: true });
    await derniere.scrollIntoViewIfNeeded();
    await expect(derniere).toBeInViewport();
    await derniere.click();
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');
    await expect(page.locator('[data-mot]')).toHaveAttribute('data-mot', /^(lundi|mardi)$/);
  });
}

test('navigation tactile, flèches, clavier et titres longs', async ({ browser }, testInfo) => {
  const context = await browser.newContext({ hasTouch: true, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await ouvrir(page, 'fr-FR', 1);
  await expect(page.getByRole('list', { name: 'Les listes de la maison' })).toHaveCount(0);
  await creeListe(page, 'W'.repeat(40), ['papa', 'maman']);
  for (let i = 2; i <= 6; i++) await creeListe(page, `Liste ${i}`, ['lundi', 'mardi']);
  await page.reload();
  const listes = page.getByRole('list', { name: 'Les listes de la maison' });
  await expect(listes.getByRole('listitem')).toHaveCount(6);
  const titreLong = listes.getByRole('button').first();
  await expect.poll(() => titreLong.evaluate(e => e.scrollHeight - e.clientHeight)).toBeLessThanOrEqual(1);
  await expect(page.getByRole('button', { name: 'Revoir : où mettre mes doigts' })).toBeInViewport({ ratio: 1 });
  await page.screenshot({ path: testInfo.outputPath('accueil-mobile.png') });
  const suivant = page.getByRole('button', { name: 'Listes suivantes' });
  const precedent = page.getByRole('button', { name: 'Listes précédentes' });
  await expect(precedent).toBeDisabled();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await suivant.tap();
  await expect(precedent).toBeEnabled();
  await precedent.tap();
  await expect(precedent).toBeDisabled();
  const zone = await listes.boundingBox();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.synthesizeScrollGesture', {
    x: Math.round(zone!.x + zone!.width - 20), y: Math.round(zone!.y + 70),
    xDistance: -150, yDistance: 0, gestureSourceType: 'touch', preventFling: true,
  });
  await expect(precedent).toBeEnabled();
  for (let i = 0; i < 6 && await precedent.isEnabled(); i++) await precedent.tap();
  await expect(precedent).toBeDisabled();
  await listes.getByRole('button').first().focus();
  // Le parcours Tab révèle les cartes hors champ sans cliquer les flèches.
  for (let i = 0; i < 10; i++) await page.keyboard.press('Tab');
  const derniere = listes.getByRole('button', { name: 'Liste 6 2 mots', exact: true });
  await expect(derniere).toBeFocused();
  await expect(derniere).toBeInViewport();
  // Le focus rend la carte visible ; la flèche atteint aussi la marge de fin.
  await suivant.tap();
  await expect(suivant).toBeDisabled();
  await page.setViewportSize({ width: 1440, height: 900 });
  await listes.getByRole('button').first().focus();
  await expect.poll(() => titreLong.evaluate(e => e.scrollHeight - e.clientHeight)).toBeLessThanOrEqual(1);
  await expect(page.getByRole('button', { name: 'Revoir : où mettre mes doigts' })).toBeInViewport({ ratio: 1 });
  await page.screenshot({ path: testInfo.outputPath('accueil-desktop.png') });
  await context.close();
});
