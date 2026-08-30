import { expect, test, type Page } from '@playwright/test';
import { ouvrir, motCourant, curseur } from './helpers/app';

/* #37 — deux mains DESSINÉES encadrent le clavier, et c'est le dessin qui
   porte le doigt. Ce qui remplace l'ancien mot GAUCHE/DROITE : la main qui
   joue montre son doigt surligné, l'autre reste affichée au repos. Le test
   suit la frappe pour voir les DEUX mains prendre leur tour. */

test('la main qui joue montre son doigt, l’autre reste au repos', async ({ page }: { page: Page }) => {
  await ouvrir(page, 'fr-FR', 1);
  await page.getByRole('button', { name: 'On commence !' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');

  const vus = new Set<string>();

  /* Lecture ATOMIQUE : lire le doigt puis les deux images en trois allers-
     retours laisserait la cible changer entre-temps sous charge. */
  const verifier = async () => {
    const etat = await page.evaluate(() => {
      const doigt = document.querySelector<HTMLElement>('[data-doigt]')?.dataset.doigt;
      const img = (c: string) =>
        document.querySelector<HTMLImageElement>(`[data-main="${c}"] img`)?.getAttribute('src');
      return { doigt, gauche: img('gauche'), droite: img('droite') };
    });
    if (!etat.doigt || etat.doigt === 'aucun' || !etat.gauche || !etat.droite) return;
    const cote = etat.doigt.endsWith('gauche') ? 'gauche' : 'droite';
    const nom = etat.doigt.slice(0, etat.doigt.indexOf('_'));
    // la main qui joue porte son doigt…
    expect(cote === 'gauche' ? etat.gauche : etat.droite).toBe(`/doigts/${nom}_${cote}.png`);
    // …et l'autre reste affichée, aucun doigt marqué
    expect(cote === 'gauche' ? etat.droite : etat.gauche).toBe(
      cote === 'gauche' ? '/doigts/aucun_droite.png' : '/doigts/aucun_gauche.png',
    );
    vus.add(cote);
  };

  const { frapper } = await import('./helpers/keyboard');
  for (let i = 0; i < 40 && vus.size < 2; i++) {
    await verifier();
    const texte = await motCourant(page);
    const lettre = texte?.[await curseur(page)];
    /* Pendant la célébration de fin de mot, le curseur est déjà au-delà du
       dernier caractère : il n'y a rien à frapper, on laisse passer l'image. */
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

test('les deux images chargent vraiment, et aucun mot ne dit la main', async ({ page }: { page: Page }) => {
  await ouvrir(page, 'fr-FR', 1);
  await page.getByRole('button', { name: 'On commence !' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');

  /* Un chemin faux ne casse rien à l'écran — l'image manquante laisse un
     trou muet. `naturalWidth` est le seul témoin qui le voie. */
  for (const cote of ['gauche', 'droite']) {
    const img = page.locator(`[data-main="${cote}"] img`);
    await expect(img).toHaveAttribute('src', new RegExp(`_${cote}\\.png$`));
    await expect(async () => {
      expect(await img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
    }).toPass();
  }

  // le mot GAUCHE / DROITE a disparu de l'écran de leçon (#37)
  await expect(page.locator('[data-cote-main]')).toHaveCount(0);
  await expect(page.getByText('GAUCHE', { exact: true })).toHaveCount(0);
  await expect(page.getByText('DROITE', { exact: true })).toHaveCount(0);

  /* Mais la consigne de NIVEAU MAIN reste, à côté de la main active : P4 dit
     que le dessin porte le doigt, pas que l'écran se taise. Elle avait disparu
     avec le mot GAUCHE, et rien ne l'avait vu. */
  await expect(page.getByText(/^Main (gauche|droite) · ton /)).toHaveCount(1);

  // une seule touche cible, et aucune légende couleur → doigt
  await expect(page.locator('[data-etat="cible"]')).toHaveCount(1);
  await expect(page.getByText(/légende/i)).toHaveCount(0);
});
