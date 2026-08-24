import type { Page } from '@playwright/test';
import type { IdDisposition } from '../../../src/core/layouts';

/** Progression déjà en place : on démarre sur V1, pas sur l'onboarding. */
export async function ouvrir(
  page: Page,
  id: IdDisposition = 'fr-FR',
  palier = 1,
): Promise<void> {
  await page.addInitScript(
    ([disposition, niveau]) => {
    localStorage.setItem(
      'tapeavecmoi.v1',
      JSON.stringify({
        version: 1,
        disposition,
        dispositionChoisieALaMain: true,
        palier: niveau,
        blocsSurPalier: 0,
        maitrise: {},
        guideDoigtVu: true,
        reglages: { sons: false, texteEspace: false, animationsDouces: false },
      }),
    );
    },
    [id, palier] as [IdDisposition, number],
  );
  await page.goto('/');
  await page.waitForSelector('body[data-vue="V1"]');
}

/** Onboarding complet : localStorage vierge, l'app ouvre sur V2. */
export async function ouvrirNeuf(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForSelector('body[data-vue="V2"]');
}

export const motCourant = (page: Page) =>
  page.locator('[data-mot]').first().getAttribute('data-mot');

export const curseur = async (page: Page) =>
  Number(await page.locator('[data-mot]').first().getAttribute('data-curseur'));
