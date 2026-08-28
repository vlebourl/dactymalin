import { expect, test } from '@playwright/test';
import { ouvrir, motCourant, sauvegarde } from './helpers/app';

/* Trois corrections demandées le 2026-08-28 :
   1. GAUCHE/DROITE en GROS, dans le coin haut du côté concerné ;
   2. le clavier n'est plus coupé en deux — seules les couleurs distinguent
      les mains ;
   3. le choix « parcours » / « notre liste » est offert dès l'accueil, et la
      liste s'écrit sur place. */

test('1. le mot de la main est en gros, dans le coin haut de son côté', async ({ page }) => {
  await ouvrir(page, 'fr-FR', 1);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.getByRole('button', { name: 'On commence !' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');

  const mot = page.locator('[data-cote-main]');
  await expect(mot).toBeVisible();
  const info = await mot.evaluate((el) => {
    const b = el.getBoundingClientRect();
    return {
      cote: (el as HTMLElement).dataset.coteMain,
      texte: el.textContent,
      taille: parseFloat(getComputedStyle(el).fontSize),
      centreX: b.left + b.width / 2,
      bas: b.bottom,
      largeurFenetre: window.innerWidth,
      hauteurFenetre: window.innerHeight,
    };
  });
  expect(info.texte).toBe(info.cote === 'gauche' ? 'GAUCHE' : 'DROITE');
  // « en gros » : au moins le double de la consigne de la bande basse
  expect(info.taille).toBeGreaterThanOrEqual(30);
  // « en haut » : entièrement dans le premier cinquième de l'écran
  expect(info.bas).toBeLessThan(info.hauteurFenetre * 0.2);
  // « à gauche ou à droite selon la main »
  if (info.cote === 'gauche') expect(info.centreX).toBeLessThan(info.largeurFenetre * 0.4);
  else expect(info.centreX).toBeGreaterThan(info.largeurFenetre * 0.6);
});

test('2. le clavier est d’un seul tenant, les mains se lisent à la couleur', async ({ page }) => {
  await ouvrir(page, 'fr-FR', 1);
  await page.getByRole('button', { name: 'On commence !' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');

  const g = (await page.locator('[data-bloc="gauche"]').first().boundingBox())!;
  const d = (await page.locator('[data-bloc="droite"]').first().boundingBox())!;
  // accolés : plus d'écart physique entre les deux moitiés
  expect(d.x - (g.x + g.width)).toBeLessThanOrEqual(2);
  // ni trait ni étiquette de frontière
  await expect(page.getByText('la frontière')).toHaveCount(0);
  /* …mais chaque moitié garde SA couleur : c'est elle, désormais, qui dit la
     main. (On lit la teinte portée par la touche, pas le fond du moment : au
     palier 1 la plupart des touches sont encore éteintes.) */
  const couleurs = await page.evaluate(() => {
    const teinte = (sel: string) =>
      getComputedStyle(document.querySelector(sel) as HTMLElement)
        .getPropertyValue('--teinte-vive')
        .trim();
    return { q: teinte('[data-code="KeyQ"]'), m: teinte('[data-code="KeyM"]') };
  });
  expect(couleurs.q).not.toBe(couleurs.m);
  expect(couleurs.q).not.toBe('');
});

test('3. depuis l’accueil : notre liste s’écrit et se joue en trois gestes', async ({ page }) => {
  await ouvrir(page, 'fr-FR', 1);
  const NOS_MOTS = ['dinosaure', 'papillon'];

  await page.getByRole('button', { name: 'Notre liste à nous' }).click();
  await page.getByLabel('Notre liste à nous').fill(NOS_MOTS.join('\n'));
  await page.getByRole('button', { name: 'On tape notre liste !' }).click();

  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');
  expect(NOS_MOTS).toContain((await motCourant(page))!);
  // la liste est mémorisée, et le parcours n'a pas bougé
  const s = await sauvegarde(page);
  expect(s.motsPerso).toEqual(NOS_MOTS);
  expect(s.palier).toBe(1);
});
