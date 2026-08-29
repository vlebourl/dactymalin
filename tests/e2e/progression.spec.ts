import { expect, test } from '@playwright/test';
import { jouerBlocParfait, ouvrir, sauvegarde } from './helpers/app';

/* La progression était entièrement muette : rien à l'écran ne disait à quelle
   leçon on en était, et franchir un palier ne se voyait nulle part. Ces tests
   tiennent les deux bouts — l'affichage pendant la leçon, et l'annonce au
   moment du franchissement. */
test.describe('progression explicite', () => {
  test("l'en-tête annonce la leçon, le bloc et à qui appartient la progression", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'tapeavecmoi.profils',
        JSON.stringify({ version: 1, actif: 'p1', liste: [{ id: 'p1', nom: 'Lila' }] }),
      );
    });
    await ouvrir(page, 'fr-FR', 3);
    await page.getByRole('button', { name: 'On commence !' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');

    await expect(page.getByText('Leçon 3 sur 7')).toBeVisible();
    await expect(page.getByText('Bloc 1 de cette leçon')).toBeVisible();
    await expect(page.getByText('Lila')).toBeVisible();
  });

  /* La jauge doit atteindre son maximum EXACTEMENT quand le palier tombe : une
     barre pleine sur un palier qui continue, ou un saut sans barre pleine,
     rendraient l'indice mensonger. Le dernier palier n'ouvre sur rien. */
  test('au dernier palier, la leçon est annoncée comme la dernière', async ({ page }) => {
    await ouvrir(page, 'fr-FR', 7);
    await page.getByRole('button', { name: 'On commence !' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');

    await expect(page.getByText('Leçon 7 sur 7')).toBeVisible();
    await expect(page.getByText('dernière leçon')).toBeVisible();
  });
  /* Franchir un palier ne se voyait NULLE PART : même titre d'encouragement,
     même bouton « Encore ». L'enfant changeait de leçon sans le savoir. */
  test('franchir un palier est annoncé, et le bouton mène à la leçon suivante', async ({
    page,
  }) => {
    test.slow();
    await ouvrir(page, 'fr-FR');
    await page.getByRole('button', { name: 'On commence !' }).click();

    for (let bloc = 0; bloc < 4; bloc++) {
      await jouerBlocParfait(page, 'fr-FR');
      if ((await sauvegarde(page)).palier > 1) break;
      await page.getByRole('button', { name: 'Encore' }).click();
      await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');
    }

    await expect(page.getByRole('heading', { name: 'Leçon 2 débloquée !' })).toBeVisible();
    await expect(page.getByText(/Elle t'apporte/)).toBeVisible();

    const suivant = page.getByRole('button', { name: 'Commencer la leçon 2' });
    await expect(suivant).toBeVisible();
    await suivant.click();
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');
    await expect(page.getByText('Leçon 2 sur 7')).toBeVisible();
  });
});
