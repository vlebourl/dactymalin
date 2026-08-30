import { expect, test } from '@playwright/test';
import {
  assureProfil,
  connecte,
  courrielUnique,
  inscrit,
  jouerBlocParfait,
  ouvrir,
  sauvegarde,
} from './helpers/app';

/**
 * #64 — ce que l'app observe suit l'enfant d'un appareil à l'autre.
 *
 * Les mesures montaient bien au serveur, mais `fusion.fusionner` reconstruit la
 * sauvegarde champ par champ et ne les nommait pas : la copie serveur les
 * perdait à CHAQUE réconciliation, et le second appareil n'en recevait jamais
 * aucune. L'écran parent de #63 montrait donc une moitié de parcours en la
 * présentant comme le tout.
 *
 * Ce parcours joue une leçon entière au clavier sur un premier ordinateur, puis
 * ouvre le compte sur un second : il traverse le reducer, l'écriture locale, la
 * file d'envoi, la base, et la réconciliation au démarrage de l'autre.
 */
test('une leçon mesurée sur un ordinateur se retrouve sur l’autre', async ({ browser, page }) => {
  const email = courrielUnique();
  await inscrit(page, email);
  await ouvrir(page, 'fr-FR', 1, false, 'Timo');

  await page.getByRole('button', { name: 'On commence !' }).click();
  await jouerBlocParfait(page, 'fr-FR');

  const joue = await sauvegarde(page);
  const lecons = joue.mesures?.decouverte?.lecons ?? [];
  expect(lecons.length, 'la leçon jouée doit avoir laissé une mesure').toBe(1);
  // Une trace qu'aucun appareil neuf ne peut inventer : l'instant de clôture.
  expect(lecons[0].le).toBeGreaterThan(0);
  expect(lecons[0].lettres).toBeGreaterThan(0);

  // Le compte l'a reçue : c'est la moitié « envoi ».
  await expect
    .poll(
      async () => {
        const r = await page.request.get('/api/profils');
        const { profils } = (await r.json()) as {
          profils: { etat: { mesures?: { decouverte?: { lecons: unknown[] } } } | null }[];
        };
        return profils.length === 1
          ? (profils[0].etat?.mesures?.decouverte?.lecons.length ?? 0)
          : -1;
      },
      { timeout: 10_000 },
    )
    .toBe(1);

  // Ordinateur 2 : même compte, jamais joué, rien en stockage.
  const autre = await browser.newContext();
  const page2 = await autre.newPage();
  await connecte(page2, email);
  await assureProfil(page2, 'Timo');
  await page2.goto('/');
  await page2.waitForSelector('body[data-vue="V1"]');

  // Et c'est la moitié « réception » : la leçon de l'autre appareil est là.
  await expect
    .poll(
      async () => {
        const etat = await page2.evaluate(() => {
          const cle = Object.keys(localStorage).find((k) => k.startsWith('tapeavecmoi.v1.'));
          return cle ? JSON.parse(localStorage.getItem(cle) ?? '{}') : null;
        });
        return etat?.mesures?.decouverte?.lecons?.[0]?.le ?? null;
      },
      { timeout: 10_000, message: 'la mesure du premier appareil devrait avoir traversé' },
    )
    .toBe(lecons[0].le);

  await autre.close();
});

/**
 * Le cas qui casse une union naïve : les deux appareils ont mesuré, chacun de
 * son côté. Concaténer doublerait à chaque synchronisation ; départager
 * jetterait la moitié du travail. C'est l'instant de clôture qui tranche.
 */
test('deux appareils qui ont chacun joué se retrouvent avec les deux leçons', async ({
  browser,
  page,
}) => {
  const email = courrielUnique();
  await inscrit(page, email);
  await ouvrir(page, 'fr-FR', 1, false, 'Timo');

  await page.getByRole('button', { name: 'On commence !' }).click();
  await jouerBlocParfait(page, 'fr-FR');
  /* L'écriture locale suit la clôture d'un cheveu : lire la sauvegarde sèche
     juste après l'écran de fin la trouve parfois encore sans sa mesure. */
  await expect
    .poll(async () => (await sauvegarde(page)).mesures?.decouverte?.lecons?.length ?? 0, {
      timeout: 5_000,
    })
    .toBe(1);
  const premier = (await sauvegarde(page)).mesures.decouverte.lecons[0].le as number;

  // Le second appareil joue AVANT d'avoir vu quoi que ce soit du premier.
  const autre = await browser.newContext();
  const page2 = await autre.newPage();
  await connecte(page2, email);
  await ouvrir(page2, 'fr-FR', 1, false, 'Timo');
  await page2.getByRole('button', { name: 'On commence !' }).click();
  await jouerBlocParfait(page2, 'fr-FR');

  /* Le second a réconcilié en démarrant, puis poussé sa propre leçon : le
     serveur porte maintenant les deux, et aucune n'a été jetée. */
  await expect
    .poll(
      async () => {
        const r = await page2.request.get('/api/profils');
        const { profils } = (await r.json()) as {
          profils: { etat: { mesures?: { decouverte?: { lecons: { le: number }[] } } } | null }[];
        };
        const l = profils[0]?.etat?.mesures?.decouverte?.lecons ?? [];
        return l.map((x) => x.le).includes(premier) ? l.length : `sans la première : ${l.length}`;
      },
      { timeout: 15_000, message: 'les deux leçons devraient coexister sur le compte' },
    )
    .toBe(2);

  await autre.close();
});
