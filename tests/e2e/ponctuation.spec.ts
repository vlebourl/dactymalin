import { expect, test } from '@playwright/test';
import { jouerItem, motCourant, ouvrir } from './helpers/app';

/**
 * #99 — l'étape 9 promet « la ponctuation » et ouvre `, ; : ! ?`.
 *
 * Deux choses se vérifient ici, et l'une ne se vérifie que dans un vrai
 * navigateur : que ces signes soient réellement FRAPPABLES sur les deux
 * dispositions — le `!` suisse vient d'une Maj sur une touche dont la base est
 * morte (#98) — et que la phrase ponctuée, plus longue qu'un mot, tienne
 * encore sur un écran de 375 px sans défiler (P7 : un item = un écran).
 */
const LARGEUR = 375;

/* Sous ce seuil, un enfant de huit ans ne lit plus l'item qu'il doit copier.
   `V4Lecon` dimensionne le texte à 148/n vw : à 375 px, la borne de 28
   caractères du lexique le pose à ~20 px. */
const TAILLE_MIN_PX = 18;

for (const id of ['fr-FR', 'fr-CH'] as const) {
  test(`${id} : l'étape 9 sert de la ponctuation, lisible et frappable à 375 px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: LARGEUR, height: 900 });
    await ouvrir(page, id, 9, false, 'Joueur 1', 'decouverte', 0, 600_000);
    await page.getByRole('button', { name: 'On commence !' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');
    await page.evaluate(() => document.fonts.ready);

    const signesVus = new Set<string>();
    for (let k = 0; k < 24; k++) {
      const mot = await motCourant(page);
      if (!mot) break;

      const boite = await page.locator('[data-mot]').boundingBox();
      expect(boite, mot).not.toBeNull();
      expect(boite!.x, `« ${mot} » sort du cadre à gauche`).toBeGreaterThanOrEqual(-0.5);
      expect(boite!.x + boite!.width, `« ${mot} » sort du cadre à droite`).toBeLessThanOrEqual(
        LARGEUR + 0.5,
      );
      const taille = await page
        .locator('[data-mot]')
        .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
      expect(taille, `« ${mot} » est écrit trop petit`).toBeGreaterThanOrEqual(TAILLE_MIN_PX);

      for (const c of ',;:!?') if (mot.includes(c)) signesVus.add(c);
      if (!(await jouerItem(page, id))) break;
    }

    /* La preuve que l'étape n'est plus un doublon de l'étape 8 : elle a servi
       de la ponctuation, et l'enfant a pu la taper — sans quoi `jouerItem`
       aurait échoué avant d'arriver ici. */
    expect([...signesVus].sort().join(''), 'aucun signe de ponctuation servi').not.toBe('');
  });
}
