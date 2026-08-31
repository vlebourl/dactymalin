import { expect, test } from '@playwright/test';
import { motCourant, ouvrir } from './helpers/app';
import { frapper, taper } from './helpers/keyboard';

/**
 * #79 — Quitter une leçon.
 *
 * L'en-tête n'offrait qu'une flèche `←` muette, et un seul clic renvoyait à
 * l'accueil : la leçon en cours était perdue par accident, sans un mot. Ce
 * fichier tient les deux moitiés du correctif — le bouton se LIT, et répondre
 * « non » rend la leçon exactement où elle était.
 */
const DISPO = 'fr-FR';
/* Deux minutes : la leçon ne doit pas se terminer d'elle-même au milieu du
   parcours de test, sans quoi l'assertion porterait sur l'écran de fin. */
const DUREE = 120_000;

/** Amène l'enfant sur un exercice d'au moins deux caractères. */
async function motEnCours(page: import('@playwright/test').Page): Promise<string> {
  for (let essai = 0; essai < 10; essai++) {
    const mot = await motCourant(page);
    if (mot && mot.length >= 2) return mot;
    if (!mot) throw new Error('aucun exercice à l’écran');
    await taper(page, DISPO, mot);
    await page.waitForTimeout(900); // la célébration, puis l'item suivant
  }
  throw new Error('aucun exercice de deux caractères ou plus');
}

test.describe('quitter une leçon', () => {
  test('le bouton de sortie porte un mot, pas seulement une flèche', async ({ page }) => {
    await ouvrir(page, DISPO, 1, false, 'Joueur 1', 'decouverte', 0, DUREE);
    await page.getByRole('button', { name: 'On commence !' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');

    const quitter = page.locator('[data-quitter="bouton"]');
    /* Lisible SANS survol : le mot est dans le bouton, pas dans une bulle. */
    await expect(quitter).toContainText('Quitter');
    /* Le dessin est un SVG, jamais un glyphe système. */
    await expect(quitter.locator('svg')).toHaveCount(1);
  });

  test('annuler la question rend la leçon au même point', async ({ page }) => {
    await ouvrir(page, DISPO, 1, false, 'Joueur 1', 'decouverte', 0, DUREE);
    await page.getByRole('button', { name: 'On commence !' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');

    const mot = await motEnCours(page);
    const zone = page.locator('[data-mot]').first();

    // une lettre tapée : la leçon est COMMENCÉE, et le curseur le prouve
    await frapper(page, DISPO, mot[0]);
    await expect(zone).toHaveAttribute('data-curseur', '1');

    /* Volontairement désigné par son RÔLE et son nom accessible, pas par un
       attribut de test : ce sélecteur trouvait aussi l'ancienne flèche muette
       « Revenir à l'accueil ». Avant le correctif, ce clic partait donc sur
       l'accueil et les assertions qui suivent tombaient sur le COMPORTEMENT —
       pas sur un attribut manquant. */
    await page.getByRole('button', { name: /Quitter la leçon|Revenir à l'accueil/ }).click();

    /* La question s'annonce comme telle aux lecteurs d'écran, et son choix par
       défaut a déjà le focus : elle est atteignable au clavier sans un clic. */
    const question = page.getByRole('dialog');
    await expect(question).toBeVisible();
    await expect(question).toHaveAttribute('aria-modal', 'true');
    await expect(question).toContainText('Tu veux arrêter la leçon');
    await expect(page.locator('[data-quitter="rester"]')).toBeFocused();

    await page.locator('[data-quitter="rester"]').click();

    // AVANT le correctif : la vue est déjà V1, et tout ce qui suit tombe.
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');
    expect(await motCourant(page)).toBe(mot);
    await expect(zone).toHaveAttribute('data-curseur', '1');

    /* Reprendre ne veut pas dire seulement « rester à l'écran » : la leçon
       écoute de nouveau, et le mot se finit là où il en était. */
    await taper(page, DISPO, mot.slice(1));
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');
    await page.waitForFunction(
      (precedent) => document.querySelector('[data-mot]')?.getAttribute('data-mot') !== precedent,
      mot,
      { timeout: 6000 },
    );
  });

  test('la question se referme au clavier, et « oui » quitte vraiment', async ({ page }) => {
    await ouvrir(page, DISPO, 1, false, 'Joueur 1', 'decouverte', 0, DUREE);
    await page.getByRole('button', { name: 'On commence !' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');

    // Échap répond « non » : on reste dans la leçon.
    await page.locator('[data-quitter="bouton"]').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');

    // « Oui » quitte — l'action reste possible, elle est seulement demandée.
    await page.locator('[data-quitter="bouton"]').click();
    await page.locator('[data-quitter="partir"]').click();
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V1');
  });
});
