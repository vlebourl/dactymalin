import { expect, test } from '@playwright/test';
import { motCourant, ouvrir } from './helpers/app';
import { taper } from './helpers/keyboard';

test.describe('boucle V1 → V4 → V5 → V4', () => {
  /* « Un bloc entier » n'existe plus : la leçon dure un TEMPS, et son nombre
     d'exercices dépend de la vitesse de l'enfant. Ce que le test doit tenir,
     c'est que la boucle se ferme — la leçon finit d'elle-même, l'écran de fin
     annonce ce qui a été joué, et « Encore » ramène à une leçon. */
  test('une leçon se joue au clavier et rend la main sur V5', async ({ page }) => {
    test.slow();
    await ouvrir(page, 'fr-FR');
    await page.getByRole('button', { name: 'On commence !' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');

    const joues: string[] = [];
    for (let i = 0; i < 60; i++) {
      if ((await page.locator('body').getAttribute('data-vue')) === 'V5') break;
      const mot = await motCourant(page);
      if (!mot) break;
      joues.push(mot);
      await taper(page, 'fr-FR', mot);
      // célébration de fin d'item : 0,5 à 1 s, jamais de confettis
      await page.waitForFunction(
        (precedent) =>
          document.body.dataset.vue === 'V5' ||
          document.querySelector('[data-mot]')?.getAttribute('data-mot') !== precedent,
        mot,
        { timeout: 4000 },
      );
    }

    /* Aucune borne sur le nombre d'exercices : c'est tout l'objet du
       changement. On exige seulement que la leçon ait vraiment eu lieu. */
    expect(joues.length).toBeGreaterThan(0);
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V5');

    // Le gain lexical est tiré du bloc réellement joué, pas d'une phrase figée.
    const gain = await page.getByText('Tu écris maintenant').textContent();
    expect(joues.some((m) => gain?.includes(m))).toBe(true);

    await page.getByRole('button', { name: 'Encore' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');
  });

  test('aucun chiffre de performance, de temps ni de compteur sur la leçon', async ({ page }) => {
    await ouvrir(page);
    await page.getByRole('button', { name: 'On commence !' }).click();
    /* La SÉRIGRAPHIE du clavier ne compte pas : `%` est gravé sur Maj+ù d'un
       vrai AZERTY. On mesure le discours de l'app, pas les touches. */
    const texte = (
      await page.evaluate(() => {
        const corps = document.body.cloneNode(true) as HTMLElement;
        for (const t of corps.querySelectorAll('[data-code]')) t.remove();
        return corps.innerText;
      })
    ).toLowerCase();
    /* `erreur` a quitté la liste : le lexique gradué contient le mot, et un
       enfant peut légitimement avoir « erreurs » à taper. Ce qui est interdit
       est un COMPTEUR d'erreurs, pas le mot — la garde le cherche donc sous sa
       forme comptée. */
    for (const interdit of ['wpm', 'score', 'précision', 'vitesse', '%']) {
      expect(texte).not.toContain(interdit);
    }
    expect(texte).not.toMatch(/\d+\s*(erreur|faute)/);
    // « bloc » est du vocabulaire d'implémentation : il ne se montre pas (§4.4)
    expect(texte).not.toContain('bloc');
  });

  test('Tab garde la main : les boutons restent atteignables au clavier', async ({ page }) => {
    await ouvrir(page);
    await page.getByRole('button', { name: 'On commence !' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');
    for (let i = 0; i < 4; i++) await page.keyboard.press('Tab');
    const focalise = await page.evaluate(() => document.activeElement?.tagName ?? '');
    expect(focalise).toBe('BUTTON');
  });
});
