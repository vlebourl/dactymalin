import { expect, test, type Page } from '@playwright/test';
import { curseur, motCourant, ouvrir } from './helpers/app';
import { coteMajAttendu, coteMajHomolateral, frapper, frapperCouple } from './helpers/keyboard';
import { toucheDe } from '../../src/core/layouts';

/** Compte les sons réellement synthétisés, sans jouer quoi que ce soit. */
async function espionnerLeSon(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const compteur = { n: 0 };
    (window as unknown as { __sons: { n: number } }).__sons = compteur;
    const noeud = { connect: () => noeud };
    class FauxContexte {
      currentTime = 0;
      destination = noeud;
      createOscillator() {
        compteur.n++;
        return { type: '', frequency: { setValueAtTime() {} }, connect: () => noeud, start() {}, stop() {} };
      }
      createGain() {
        return {
          gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
          connect: () => noeud,
        };
      }
    }
    (window as unknown as { AudioContext: unknown }).AudioContext = FauxContexte;
    (window as unknown as { webkitAudioContext: unknown }).webkitAudioContext = FauxContexte;
  });
}

const sons = (page: Page) =>
  page.evaluate(() => (window as unknown as { __sons: { n: number } }).__sons.n);

/** Avance jusqu'au premier item qui commence par un chiffre (piège Maj). */
async function allerAUnChiffre(page: Page): Promise<string> {
  for (let i = 0; i < 12; i++) {
    const mot = await motCourant(page);
    if (!mot || /^[0-9]/.test(mot)) break;
    for (const c of mot) {
      await frapper(page, 'fr-FR', c);
      await page.waitForTimeout(20);
    }
    await page.waitForTimeout(820);
  }
  const mot = await motCourant(page);
  expect(mot, 'aucun item numérique servi au palier 7').toMatch(/^[0-9]/);
  return mot!;
}

/**
 * Gate Codex : la vue déclenchait le son de réussite dès que
 * `caractere === attendu`, alors que le reducer venait de REFUSER la frappe
 * (Maj homolatérale). L'enfant entendait « c'est bon » sur un geste faux.
 */
test.describe('son de réussite', () => {
  test('reste muet quand la frappe est refusée pour mauvaise Maj', async ({ page }) => {
    await espionnerLeSon(page);
    await ouvrir(page, 'fr-FR', 8, true);
    await page.getByRole('button', { name: 'On commence !' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');

    const mot = await allerAUnChiffre(page);
    const chiffre = mot[0];
    const code = toucheDe('fr-FR', chiffre)!.code;
    const avant = await curseur(page);
    await page.evaluate(() => ((window as unknown as { __sons: { n: number } }).__sons.n = 0));

    // bonne touche, MAUVAISE Maj (celle de la même main) : quasi-réussite
    await frapperCouple(page, code, chiffre, { maj: coteMajHomolateral('fr-FR', chiffre) });
    await page.waitForTimeout(150);
    expect(await curseur(page), 'la frappe fausse a fait avancer le curseur').toBe(avant);
    expect(await sons(page), 'un son de réussite a été joué sur une frappe refusée').toBe(0);

    // la même touche avec la Maj CONTRALATÉRALE : réussite, et son
    await frapperCouple(page, code, chiffre, { maj: coteMajAttendu('fr-FR', chiffre) });
    await page.waitForTimeout(150);
    if (mot.length > 1) expect(await curseur(page)).toBe(avant + 1);
    expect(await sons(page)).toBeGreaterThan(0);
  });
});
