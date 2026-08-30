import { expect, test } from '@playwright/test';
import { jouerBlocParfait, ouvrir, sauvegarde } from './helpers/app';
import { ETAPE_MAX, LECONS_PAR_ETAPE } from '../../src/core/parcours';

/* La progression était entièrement muette : rien à l'écran ne disait où on en
   était, et changer d'étape ne se voyait nulle part. Ces tests tiennent les
   deux bouts — l'affichage pendant la leçon, et l'annonce au moment du
   passage.

   Ce qu'ils vérifiaient de la v1 et qui n'existe plus : la barre suivait le
   plus avancé de DEUX chemins concurrents — touches maîtrisées ou plafond de
   blocs — et pouvait sauter sans prévenir. Il n'en reste qu'un, le compte de
   leçons, annoncé d'avance. */
test.describe('progression explicite', () => {
  test("l'en-tête annonce l'étape, la leçon et à qui appartient la progression", async ({
    page,
  }) => {
    await ouvrir(page, 'fr-FR', 3, false, 'Lila');
    await page.getByRole('button', { name: 'On commence !' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');

    /* Le texte visible dit la leçon, le nom accessible de la jauge dit
       l'étape : un lecteur d'écran doit entendre les deux. */
    await expect(page.getByText(`Leçon 1 sur ${LECONS_PAR_ETAPE}`)).toBeVisible();
    await expect(page.getByLabel(`Étape 3 · Leçon 1 sur ${LECONS_PAR_ETAPE}`)).toBeVisible();
    await expect(page.getByText('Lila')).toBeVisible();
  });

  /* Le quota est LISIBLE D'AVANCE : c'est tout l'intérêt du changement. À la
     dernière étape, il n'y a plus rien à promettre au-delà. */
  test('à la dernière étape, rien ne promet une étape suivante', async ({ page }) => {
    await ouvrir(page, 'fr-FR', ETAPE_MAX);
    await page.getByRole('button', { name: 'On commence !' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');

    await expect(page.getByLabel(`Étape ${ETAPE_MAX} ·`, { exact: false })).toBeVisible();
    await expect(page.getByText(`Étape ${ETAPE_MAX + 1}`)).toHaveCount(0);
  });

  /* Changer d'étape ne se voyait NULLE PART : même titre d'encouragement, même
     bouton « Encore ». L'enfant changeait de contenu sans le savoir. */
  test("passer d'étape est annoncé, et le bouton mène à la suivante", async ({ page }) => {
    test.slow();
    // placé à une leçon de la fin : la prochaine termine l'étape
    await ouvrir(page, 'fr-FR', 1, false, 'Joueur 1', 'decouverte', LECONS_PAR_ETAPE - 1);
    await page.getByRole('button', { name: 'On commence !' }).click();

    await jouerBlocParfait(page, 'fr-FR');
    expect((await sauvegarde(page)).palier).toBe(2);

    await expect(page.getByRole('heading', { name: /débloquée !/ })).toBeVisible();
    await expect(page.getByText(/Elle t'apporte/)).toBeVisible();
  });
});
