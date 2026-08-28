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

  // ni trait ni étiquette de frontière
  await expect(page.getByText('la frontière')).toHaveCount(0);

  /* Régression : chaque moitié était une COLONNE, large comme sa rangée la
     plus longue. Le trou à la jointure changeait donc d'une rangée à l'autre
     (T|Y béant de 58 px, B|N collé à 0). Une rangée = une ligne continue. */
  const rangees = await page.evaluate(() => {
    const clavier = document.querySelector('[data-bloc="gauche"]')!.closest('div')!.parentElement!;
    return [...clavier.children].map((r) => {
      const g = r.querySelector('[data-bloc="gauche"]')!;
      const d = r.querySelector('[data-bloc="droite"]')!;
      const der = g.lastElementChild!.getBoundingClientRect();
      const pre = d.firstElementChild!.getBoundingClientRect();
      /* On compare au `gap` DÉCLARÉ, pas à l'écart entre deux touches voisines :
         la touche cible est agrandie, et fausserait la mesure quand elle tombe
         au bord du segment. */
      return { jointure: pre.x - (der.x + der.width), gap: parseFloat(getComputedStyle(r).gap) };
    });
  });
  expect(rangees.length).toBeGreaterThanOrEqual(4);
  for (const { jointure, gap } of rangees) {
    expect(Math.abs(jointure - gap)).toBeLessThanOrEqual(1);
  }

  /* …et chaque moitié garde SA couleur : c'est elle, désormais, qui dit la
     main. On lit la teinte portée par la touche, pas le fond du moment : au
     palier 1 la plupart des touches sont encore éteintes. */
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

test('3 bis. le champ de la liste ne rogne pas les mots', async ({ page }) => {
  await ouvrir(page, 'fr-FR', 1);
  await page.getByRole('button', { name: 'Notre liste à nous' }).click();
  const champ = page.getByLabel('Notre liste à nous');
  await champ.fill('dinosaure');
  const m = await champ.evaluate((el) => {
    const s = getComputedStyle(el);
    const b = el.getBoundingClientRect();
    const panneau = el.parentElement!.getBoundingClientRect();
    return {
      rayon: parseFloat(s.borderRadius),
      hauteur: b.height,
      largeur: b.width,
      largeurPanneau: panneau.width,
      debordeEnHauteur: (el as HTMLTextAreaElement).scrollHeight - el.clientHeight,
    };
  });
  /* Régression : `--r-bouton` (une gélule) était appliqué au textarea ; les
     coins rognaient le premier et le dernier caractère de chaque ligne. */
  expect(m.rayon).toBeLessThanOrEqual(m.hauteur / 4);
  // et le champ occupe le panneau au lieu d'une colonne étroite au milieu
  expect(m.largeur).toBeGreaterThan(m.largeurPanneau * 0.85);
  expect(m.debordeEnHauteur).toBeLessThanOrEqual(1);
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
