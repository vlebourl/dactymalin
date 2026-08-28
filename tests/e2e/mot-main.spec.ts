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

  /* Lecture ATOMIQUE (un seul evaluate) : lire le doigt puis le mot en deux
     allers-retours laissait la main changer entre les deux sous charge. */
  const verifier = async () => {
    const info = await page.evaluate(() => {
      const doigt = document.querySelector<HTMLElement>('[data-doigt]')?.dataset.doigt;
      const mot = document.querySelector<HTMLElement>('[data-cote-main]');
      if (!doigt || !mot) return null;
      const s = getComputedStyle(mot);
      return {
        doigt,
        cote: mot.dataset.coteMain,
        texte: mot.textContent,
        couleur: s.color,
        taille: parseFloat(s.fontSize),
      };
    });
    if (!info) return;
    const cote = info.doigt.includes('gauche') ? 'gauche' : 'droite';
    expect(info.cote).toBe(cote);
    expect(info.texte).toBe(cote === 'gauche' ? 'GAUCHE' : 'DROITE');
    expect(info.couleur).toBe(cote === 'gauche' ? TEAL_VIF : ORANGE_VIF);
    // « en gros » : nettement plus grand que la consigne courante (15-20 px)
    expect(info.taille).toBeGreaterThanOrEqual(22);
    vus.add(cote);
  };

  // au fil de la frappe, les deux mains doivent finir par être annoncées
  for (let i = 0; i < 40 && vus.size < 2; i++) {
    await verifier();
    const texte = await motCourant(page);
    const c = await curseur(page);
    /* Pendant la célébration de fin de mot, le curseur est déjà au-delà du
       dernier caractère : il n'y a rien à frapper, on laisse passer l'image. */
    const lettre = texte?.[c];
    if (lettre === undefined) {
      await page.waitForTimeout(60);
      continue;
    }
    await frapper(page, 'fr-FR', lettre);
    await page.waitForTimeout(60);
    if ((await page.locator('body').getAttribute('data-vue')) !== 'V4') break;
  }
  expect([...vus].sort()).toEqual(['droite', 'gauche']);
});
