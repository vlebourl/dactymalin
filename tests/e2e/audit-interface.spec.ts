import { expect, test, type Page } from '@playwright/test';
import { creeListe, ouvrir } from './helpers/app';
import { frapperFausse } from './helpers/keyboard';
import { LECONS_PAR_ETAPE } from '../../src/core/parcours';

/**
 * Audit de l'interface (polish / distill / clarify), deux bugs vus à l'écran, et deux allègements (D1-a, D2-a).
 *
 * B1 — la carte ne défilait pas : à 1280×800, son titre sortait par le haut et
 *      « Continuer la leçon » par le bas, hors d'atteinte.
 * B2 — au barreau 3, la main dessinée venait d'en bas : le bout de son index
 *      se posait sur la rangée du bas (§ pour P, < pour A), donc sur la
 *      mauvaise touche.
 */

const LONGUE = 600_000;

test('B1 — la carte défile : titre visible, bouton du bas atteignable à la molette', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await ouvrir(page, 'fr-FR', 2, false, 'Lila', 'decouverte', 1);
  await page.getByRole('button', { name: 'Ma carte du clavier' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V6');

  const titre = page.getByRole('heading', { name: 'Ma carte du clavier' });
  await expect(titre).toBeInViewport();

  const continuer = page.getByRole('button', { name: 'Continuer la leçon' });
  await titre.hover();
  await page.mouse.wheel(0, 4000);
  await expect(continuer).toBeInViewport();
});

async function aideBarreau3(page: Page): Promise<void> {
  await ouvrir(page, 'fr-FR', 3, false, 'Joueur 1', 'decouverte', 2, LONGUE);
  await creeListe(page, 'Semaine 12', ['papa']);
  await page.reload();
  await page.waitForSelector('body[data-vue="V1"]');
  await page.getByRole('button', { name: /Semaine 12/ }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');
  for (let k = 0; k < 2; k++) await frapperFausse(page, 'fr-FR', 'x');
}

test('B2 — au barreau 3, la bulle désigne la touche et aucune main ne pointe ailleurs', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await aideBarreau3(page);

  const bulle = page.locator('[class*="aideNom"]');
  await expect(bulle).toHaveText('P');
  /* Le dessin qui désignait la mauvaise touche n'existe plus. */
  await expect(page.locator('[class*="aideOverlay"] svg')).toHaveCount(0);

  /* La pointe de la bulle est au-dessus de la touche visée. */
  const cible = await page.locator('[data-etat="cible"]').first().boundingBox();
  const boite = await bulle.boundingBox();
  expect(cible && boite).toBeTruthy();
  const centre = boite!.x + boite!.width / 2;
  expect(centre).toBeGreaterThanOrEqual(cible!.x);
  expect(centre).toBeLessThanOrEqual(cible!.x + cible!.width);
});

/* D1-a — « Les touches de cette leçon : E A S I… » doublait le clavier. Il
   part ; tout le reste de l'entête reste, et d'abord le compteur d'exercices
   (#107), qui ne doit pas régresser. */
test("D1-a — l'entête perd la liste des touches, garde les pastilles et l'exercice", async ({ page }) => {
  await ouvrir(page, 'fr-FR', 3, false, 'Lila', 'decouverte', 2, LONGUE);
  await page.getByRole('button', { name: 'On commence !' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');

  const entete = page.locator('header');
  await expect(entete).not.toContainText('touches de cette leçon');
  await expect(entete.locator('[data-exercice]')).toHaveText(/^Exercice 1 sur \d+$/);
  await expect(entete.locator('[data-serie-total]')).toBeVisible();
  await expect(entete.getByText('Mots de cet exercice')).toBeVisible();
  await expect(entete.getByText("Avancement de l'étape")).toBeVisible();
});

/* D2-a — le « ✓ » de la carte avance le parcours sans jouer : il passe par la
   question réservée aux adultes, une fois par visite de la carte. */
test('D2-a — marquer une leçon faite depuis la carte demande la question pour adulte', async ({ page }) => {
  await ouvrir(page, 'fr-FR', 2, false, 'Lila', 'decouverte', 1);
  /* Le harnais ouvre la porte d'office ; ici, c'est elle qu'on éprouve. */
  await page.addInitScript(() => {
    (globalThis as { __porteAdulteOuverte?: boolean }).__porteAdulteOuverte = false;
  });
  await page.reload();
  await page.waitForSelector('body[data-vue="V1"]');
  await page.getByRole('button', { name: 'Ma carte du clavier' }).click();

  const porte = page.locator('[data-porte-carte]');
  await page.getByRole('button', { name: 'Étape 2, leçon 2 faite', exact: true }).click();
  await expect(porte).toBeVisible();

  /* Une mauvaise réponse ne marque rien, et change de question. */
  await porte.getByRole('textbox').fill('1');
  await porte.getByRole('button', { name: 'Entrer' }).click();
  await expect(porte.getByRole('alert')).toHaveText("Ce n'est pas ça. En voici une autre.");

  const libelle = (await porte.getByRole('textbox').getAttribute('aria-label'))!;
  const [, a, b] = libelle.match(/(\d+) fois (\d+)/)!;
  await porte.getByRole('textbox').fill(String(Number(a) * Number(b)));
  await porte.getByRole('button', { name: 'Entrer' }).click();
  await expect(porte).toHaveCount(0);

  /* La porte reste ouverte pour la visite : le « ✓ » suivant ne redemande rien. */
  await page.getByRole('button', { name: 'Étape 2, leçon 3 faite', exact: true }).click();
  await expect(porte).toHaveCount(0);

  await page.getByRole('button', { name: 'Revenir' }).click();
  await expect(page.getByText(`Étape 2, leçon 4 sur ${LECONS_PAR_ETAPE}`)).toBeVisible();
});

test('D2-a — « Laisser tomber » referme la question sans rien marquer', async ({ page }) => {
  await ouvrir(page, 'fr-FR', 2, false, 'Lila', 'decouverte', 1);
  await page.addInitScript(() => {
    (globalThis as { __porteAdulteOuverte?: boolean }).__porteAdulteOuverte = false;
  });
  await page.reload();
  await page.waitForSelector('body[data-vue="V1"]');
  await page.getByRole('button', { name: 'Ma carte du clavier' }).click();

  await page.getByRole('button', { name: 'Étape 2, leçon 2 faite', exact: true }).click();
  await page.getByRole('button', { name: 'Laisser tomber' }).click();
  await expect(page.locator('[data-porte-carte]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Revenir' }).click();
  await expect(page.getByText(`Étape 2, leçon 2 sur ${LECONS_PAR_ETAPE}`)).toBeVisible();
});
