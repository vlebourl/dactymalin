import { expect, test, type Page } from '@playwright/test';
import { ouvrir } from './helpers/app';

/* #89 — V3 disait la MÊME consigne aux deux parcours : « l'index est ton
   outil », ce que Dactylo n'enseigne pas (le cahier l. 996 demande une version
   par parcours, l. 1005 précise index surligné en Découverte, main au repos en
   Dactylo). Et les deux mains étaient dessinées `tendu={false}` en dur : même
   en Découverte, aucun index n'était mis en avant. */

/** Retient ce que le bouton « Réécouter » envoie vraiment à la voix. */
async function espionnerLaVoix(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const dites: string[] = [];
    (window as unknown as { __dites: string[] }).__dites = dites;
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        cancel() {},
        getVoices: () => [],
        speak: (p: { text: string }) => dites.push(p.text),
      },
    });
  });
}

const dites = (page: Page) => page.evaluate(() => (window as unknown as { __dites: string[] }).__dites);

async function ouvrirLeGuide(page: Page, parcours: 'decouverte' | 'dactylo'): Promise<void> {
  await espionnerLaVoix(page);
  await ouvrir(page, 'fr-FR', 1, false, 'Joueur 1', parcours);
  await page.getByRole('button', { name: 'Revoir : où mettre mes doigts' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V3');
}

/** L'état des deux mains dessinées, dans l'ordre gauche puis droite. */
const mains = (page: Page) =>
  page.locator('[data-main-schematique]').evaluateAll((els) =>
    els.map((e) => `${(e as HTMLElement).dataset.mainSchematique}:${(e as HTMLElement).dataset.tendu}`),
  );

test('en Découverte, la consigne garde l’index et les deux mains le tendent', async ({
  page,
}: {
  page: Page;
}) => {
  await ouvrirLeGuide(page, 'decouverte');

  const consigne = page.locator('[data-consigne-guide]');
  await expect(consigne).toContainText('Chaque main garde son côté');
  await expect(consigne).toContainText(/index/i);
  await expect(consigne).toContainText(/pouces font l['’]espace/i);

  expect(await mains(page)).toEqual(['gauche:oui', 'droite:oui']);

  await page.getByRole('button', { name: 'Réécouter' }).click();
  expect(await dites(page)).toEqual([await consigne.innerText()]);
});

test('en Dactylo, la consigne ne promet aucun index et les mains restent au repos', async ({
  page,
}: {
  page: Page;
}) => {
  await ouvrirLeGuide(page, 'dactylo');

  const consigne = page.locator('[data-consigne-guide]');
  await expect(consigne).toContainText('Chaque main garde son côté');
  await expect(consigne).not.toContainText(/index/i);
  await expect(consigne).toContainText(/doigt/i);
  await expect(consigne).toContainText(/pouces font l['’]espace/i);

  expect(await mains(page)).toEqual(['gauche:non', 'droite:non']);

  await page.getByRole('button', { name: 'Réécouter' }).click();
  expect(await dites(page)).toEqual([await consigne.innerText()]);
});
