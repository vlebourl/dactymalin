import { expect, test, type Locator, type Page } from '@playwright/test';
import { creeListe, ouvrir } from './helpers/app';

test.use({ hasTouch: true });

for (const [largeur, hauteur] of [[768, 1024], [1024, 768]] as const) {
  test(`30 listes restent dans leur compartiment sur tablette ${largeur}×${hauteur}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: largeur, height: hauteur });
    await ouvrir(page, 'fr-FR', 1);
    await creeListe(page, 'Liste 1', ['papa', 'maman']);
    await page.reload();
    const listes = page.getByRole('list', { name: 'Les listes de la maison' });
    await expect(listes.getByRole('listitem')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Listes suivantes' })).toHaveCount(0);
    // Une liste courte ne réserve pas une grande zone vide sous son compteur.
    const carte = listes.getByRole('button', { name: 'Liste 1 2 mots', exact: true });
    const hauteurCarte = (await carte.boundingBox())!.height;
    expect(hauteurCarte).toBeGreaterThanOrEqual(44);
    // Environ 72 px au rendu courant ; 80 px laisse une marge typographique,
    // tout en refusant les 132 px de la tuile étirée avant correction.
    expect(hauteurCarte).toBeLessThan(80);
    await testInfo.attach('hauteur-tuile-courte', {
      body: JSON.stringify({ largeur, hauteur, hauteurCarte }), contentType: 'application/json',
    });
    await expect(carte.getByText('Liste 1', { exact: true })).toHaveCSS('text-align', 'center');
    await expect(carte.getByText('2 mots', { exact: true })).toHaveCSS('text-align', 'center');
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
    const derniere = listes.getByRole('listitem').last().getByRole('button', { name: /^Liste \d+ 2 mots$/ });
    const motsAttendus = await derniere.getByText('Liste 1', { exact: true }).count()
      ? /^(papa|maman)$/
      : /^(lundi|mardi)$/;
    await derniere.scrollIntoViewIfNeeded();
    await expect(derniere).toBeInViewport();
    await derniere.click();
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');
    await expect(page.locator('[data-mot]')).toHaveAttribute('data-mot', motsAttendus);
  });
}

/** Attend la fin native du déplacement, puis l'état React, avant une autre action. */
async function defilerParFleche(listes: Locator, fleche: Locator) {
  const avant = await listes.evaluate(e => e.scrollLeft);
  await listes.evaluate(e => {
    e.setAttribute('data-test-defilement', 'en-cours');
    e.addEventListener('scrollend', () => e.setAttribute('data-test-defilement', 'fini'), { once: true });
  });
  await fleche.press('Enter');
  await expect(listes).toHaveAttribute('data-test-defilement', 'fini');
  await expect.poll(() => listes.evaluate(e => e.scrollLeft)).not.toBe(avant);
}

async function sixListes(page: Page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await ouvrir(page, 'fr-FR', 1);
  await expect(page.getByRole('list', { name: 'Les listes de la maison' })).toHaveCount(0);
  await creeListe(page, 'W'.repeat(40), ['papa', 'maman']);
  for (let i = 2; i <= 6; i++) await creeListe(page, `Liste ${i}`, ['lundi', 'mardi']);
  await page.reload();
  const listes = page.getByRole('list', { name: 'Les listes de la maison' });
  await expect(listes.getByRole('listitem')).toHaveCount(6);
  return listes;
}

test('flèches, bornes, focus clavier et titres longs', async ({ page }, testInfo) => {
  const listes = await sixListes(page);
  const titreLong = listes.getByRole('button', { name: `${'W'.repeat(40)} 2 mots`, exact: true });
  await expect(titreLong).toHaveCount(1);
  await expect.poll(() => titreLong.evaluate(e => e.scrollHeight - e.clientHeight)).toBeLessThanOrEqual(1);
  await expect(page.getByRole('button', { name: 'Revoir : où mettre mes doigts' })).toBeInViewport({ ratio: 1 });
  await page.screenshot({ path: testInfo.outputPath('accueil-mobile.png') });
  const suivant = page.getByRole('button', { name: 'Listes suivantes' });
  const precedent = page.getByRole('button', { name: 'Listes précédentes' });
  await expect(precedent).toHaveAttribute('aria-disabled', 'true');

  // Mouvement normal à l'aller, mouvement réduit au retour ; aucune durée supposée.
  await defilerParFleche(listes, suivant);
  await expect(precedent).toHaveAttribute('aria-disabled', 'false');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await defilerParFleche(listes, precedent);
  await expect(precedent).toHaveAttribute('aria-disabled', 'true');
  await expect(precedent).toBeFocused();
  await precedent.press('Enter');
  await expect(precedent).toBeFocused();
  await expect.poll(() => listes.evaluate(e => e.scrollLeft)).toBeLessThanOrEqual(1);

  const premiere = listes.getByRole('listitem').first().getByRole('button', { name: / 2 mots$/ });
  const derniere = listes.getByRole('listitem').last().getByRole('button', { name: / 2 mots$/ });
  await premiere.focus();
  await expect(premiere).toBeFocused();
  await expect(derniere).not.toBeFocused();
  // Tab suit les contrôles réellement disponibles, même si les dictées sont désactivées.
  const maximum = await listes.getByRole('button').count();
  for (let i = 0; i < maximum && !await derniere.evaluate(e => e === document.activeElement); i++) {
    await page.keyboard.press('Tab');
  }
  await expect(derniere).toBeFocused();
  await expect(derniere).toBeInViewport({ ratio: 1 });

  // Atteindre la borne droite par les flèches : attendre chaque déplacement ET son état.
  await listes.evaluate(e => e.scrollTo({ left: 0, behavior: 'instant' }));
  await expect(precedent).toHaveAttribute('aria-disabled', 'true');
  for (let i = 0; i < 6 && await suivant.getAttribute('aria-disabled') === 'false'; i++) {
    await defilerParFleche(listes, suivant);
    const auBout = await listes.evaluate(e => e.scrollWidth - e.clientWidth - e.scrollLeft <= 1);
    await expect(suivant).toHaveAttribute('aria-disabled', String(auBout));
  }
  await expect(suivant).toHaveAttribute('aria-disabled', 'true');
  await expect(suivant).toBeFocused();
  await suivant.press('Space');
  await expect(suivant).toBeFocused();
  await expect.poll(() => listes.evaluate(e => e.scrollWidth - e.clientWidth - e.scrollLeft)).toBeLessThanOrEqual(1);

  await page.setViewportSize({ width: 1440, height: 900 });
  await titreLong.focus();
  await expect.poll(() => titreLong.evaluate(e => e.scrollHeight - e.clientHeight)).toBeLessThanOrEqual(1);
  await expect(page.getByRole('button', { name: 'Revoir : où mettre mes doigts' })).toBeInViewport({ ratio: 1 });
  await page.screenshot({ path: testInfo.outputPath('accueil-desktop.png') });
});

test('un glissement tactile simulé vers la gauche avance la rangée', async ({ page, context }, testInfo) => {
  const listes = await sixListes(page);
  const precedent = page.getByRole('button', { name: 'Listes précédentes' });
  await expect.poll(() => listes.evaluate(e => e.scrollLeft)).toBeLessThanOrEqual(1);
  await expect(precedent).toHaveAttribute('aria-disabled', 'true');
  const zone = (await listes.boundingBox())!;
  const depart = { x: zone.x + zone.width - 16, y: zone.y + 60 };
  const arriveeX = zone.x + 16;
  expect(await listes.evaluate((e, p) => e.contains(document.elementFromPoint(p.x, p.y)), depart)).toBe(true);

  // Conserver la livraison des événements et les positions, même si le geste échoue.
  const journal: string[] = [];
  page.on('console', message => {
    if (message.text().startsWith('DEFIL_LISTES ')) journal.push(message.text());
  });
  await listes.evaluate(e => {
    e.setAttribute('data-test-defilement', 'en-cours');
    for (const type of ['touchstart', 'touchmove', 'touchend', 'scroll', 'scrollend']) {
      e.addEventListener(type, event => {
        if (type === 'scrollend') e.setAttribute('data-test-defilement', 'fini');
        const touche = event instanceof TouchEvent ? event.touches[0] : null;
        console.info('DEFIL_LISTES ' + JSON.stringify({ type, x: touche?.clientX, scrollLeft: e.scrollLeft }));
      }, { passive: true });
    }
  });
  const cdp = await context.newCDPSession(page);
  try {
    // Coordonnées explicites : le doigt part à droite et se déplace vers la gauche.
    // L'amplitude dépasse une carte ; elle ne dépend pas de la convention xDistance.
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...depart, id: 1 }] });
    for (let i = 1; i <= 12; i++) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: depart.x + (arriveeX - depart.x) * i / 12, y: depart.y, id: 1 }],
      });
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(listes).toHaveAttribute('data-test-defilement', 'fini');
    await expect.poll(() => listes.evaluate(e => e.scrollLeft)).toBeGreaterThan(1);
    await expect(precedent).toHaveAttribute('aria-disabled', 'false');
  } finally {
    await testInfo.attach('geste-tactile-positions', {
      body: JSON.stringify({ depart, arriveeX, journal }, null, 2), contentType: 'application/json',
    });
    await cdp.detach();
  }
});
