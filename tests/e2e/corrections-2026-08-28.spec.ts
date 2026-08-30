import { expect, test } from '@playwright/test';
import { ouvrir } from './helpers/app';

/* Trois corrections demandées le 2026-08-28 :
   1. GAUCHE/DROITE en GROS — RETIRÉ par #37 : c'est le dessin de la main qui
      porte le doigt, plus aucun mot ne dit la main. Ce qui l'a remplacé est
      vérifié par `mains-dessinees.spec.ts` ;
   2. le clavier n'est plus coupé en deux — seules les couleurs distinguent
      les mains ;
   3. le choix « parcours » / « notre liste » est offert dès l'accueil, et la
      liste s'écrit sur place. */

test('1 bis. les deux mains encadrent le clavier à chaque tour', async ({ page }) => {
  await ouvrir(page, 'fr-FR', 1);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.getByRole('button', { name: 'On commence !' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');

  /* Demande du 2026-08-28 : les schémas de main sont là À CHAQUE TOUR, de part
     et d'autre du clavier — ils n'apparaissaient qu'à l'aide du barreau 3. */
  const g = (await page.locator('[data-main="gauche"]').boundingBox())!;
  const d = (await page.locator('[data-main="droite"]').boundingBox())!;
  const clavier = (await page.locator('[data-bloc="gauche"]').first().boundingBox())!;
  const clavierD = (await page.locator('[data-bloc="droite"]').first().boundingBox())!;
  expect(g.x + g.width).toBeLessThanOrEqual(clavier.x);
  expect(d.x).toBeGreaterThanOrEqual(clavierD.x + clavierD.width);
  // à la même hauteur, de part et d'autre
  expect(Math.abs(g.y + g.height / 2 - (d.y + d.height / 2))).toBeLessThanOrEqual(2);
  // celle qui joue est allumée, l'autre reste visible mais en retrait
  const opacites = await page.evaluate(() => ({
    gauche: getComputedStyle(document.querySelector('[data-main="gauche"]')!).opacity,
    droite: getComputedStyle(document.querySelector('[data-main="droite"]')!).opacity,
  }));
  expect(Number(opacites.gauche)).toBeGreaterThan(0);
  expect(Number(opacites.droite)).toBeGreaterThan(0);
  expect(opacites.gauche).not.toBe(opacites.droite);
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
    /* On remonte au CLAVIER : `[data-bloc]` est un segment de rangée, son
       parent est la rangée, et le parent de la rangée est le clavier. */
    const clavier = document.querySelector('[data-bloc="gauche"]')!.parentElement!.parentElement!;
    return [...clavier.children].map((r) => {
      const g = r.querySelector('[data-bloc="gauche"]')!;
      const d = r.querySelector('[data-bloc="droite"]')!;
      /* `offsetLeft`/`offsetWidth` : la boîte de MISE EN PAGE, pas la boîte
         peinte. La touche cible est agrandie par une transformation ; sur la
         rangée où elle tombe au bord du segment, sa boîte peinte mangeait
         4,5 px de la jointure et le test échouait pour rien. */
      const der = g.lastElementChild as HTMLElement;
      const pre = d.firstElementChild as HTMLElement;
      return {
        jointure: pre.offsetLeft - (der.offsetLeft + der.offsetWidth),
        gap: parseFloat(getComputedStyle(r).gap),
      };
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

/* Le champ a déménagé dans l'espace parent (#12) — c'est le parent qui saisit
   les mots, plus l'enfant. La régression qu'il porte, elle, n'a pas bougé. */
test('3 bis. le champ de la liste ne rogne pas les mots', async ({ page }) => {
  await ouvrir(page, 'fr-FR', 1);
  await page.getByLabel('Réglages').click();
  await page.getByRole('button', { name: 'Ouvrir' }).click();
  const champ = page.getByLabel('Les mots de la liste');
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


/**
 * #12 — l'accueil redevient l'écran qui dit « appuie ici pour jouer » : le
 * bouton du parcours et les cartes des listes, rien d'autre. Le champ de
 * saisie a quitté l'accueil ET les réglages ; c'est un geste de parent, il vit
 * dans l'espace parent.
 */
test("l'accueil et les réglages n'ont plus de champ de saisie de mots", async ({ page }) => {
  await ouvrir(page, 'fr-FR', 1);

  await expect(page.getByRole('button', { name: 'On commence !' })).toBeVisible();
  await expect(page.locator('textarea')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /liste à nous/i })).toHaveCount(0);

  await page.getByLabel('Réglages').click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V7');
  await expect(page.locator('textarea')).toHaveCount(0);

  /* La carte du clavier ne propose plus « Notre leçon » non plus : elle n'a
     plus de mots à elle à jouer. */
  await page.getByLabel('Revenir').click();
  await page.getByRole('button', { name: 'Ma carte du clavier' }).click();
  await expect(page.getByRole('button', { name: /Notre leçon/ })).toHaveCount(0);
});
