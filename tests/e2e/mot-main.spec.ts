import { expect, test } from '@playwright/test';
import { ouvrir, motCourant, curseur } from './helpers/app';

/* Demande du 2026-08-28 : en plus de la consigne du doigt, le mot GAUCHE ou
   DROITE s'affiche en gros, dans la couleur de sa main (teal/orange). Le mot,
   le data-doigt et la couleur doivent rester d'accord entre eux, pour les
   DEUX mains au fil de la frappe. */

const TEAL_VIF = 'rgb(11, 90, 85)';
const ORANGE_VIF = 'rgb(126, 58, 13)';

test('le mot GAUCHE/DROITE suit la main cible, en gros et en couleur', async ({ page }) => {
  await ouvrir(page, 'fr-FR', 1);
  await page.getByRole('button', { name: 'On commence !' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');

  const { frapper } = await import('./helpers/keyboard');
  const vus = new Set<string>();

  const verifier = async () => {
    const doigt = (await page.locator('[data-doigt]').getAttribute('data-doigt'))!;
    const cote = doigt.includes('gauche') ? 'gauche' : 'droite';
    const mot = page.locator('[data-cote-main]');
    await expect(mot).toHaveAttribute('data-cote-main', cote);
    await expect(mot).toHaveText(cote === 'gauche' ? 'GAUCHE' : 'DROITE');
    const style = await mot.evaluate((el) => {
      const s = getComputedStyle(el);
      return { couleur: s.color, taille: parseFloat(s.fontSize) };
    });
    expect(style.couleur).toBe(cote === 'gauche' ? TEAL_VIF : ORANGE_VIF);
    // « en gros » : nettement plus grand que la consigne courante (15-20 px)
    expect(style.taille).toBeGreaterThanOrEqual(22);
    vus.add(cote);
  };

  // au fil de la frappe, les deux mains doivent finir par être annoncées
  for (let i = 0; i < 40 && vus.size < 2; i++) {
    await verifier();
    const texte = (await motCourant(page))!;
    const c = await curseur(page);
    await frapper(page, 'fr-FR', texte[c]);
    await page.waitForTimeout(60);
    if ((await page.locator('body').getAttribute('data-vue')) !== 'V4') break;
  }
  expect([...vus].sort()).toEqual(['droite', 'gauche']);
});
