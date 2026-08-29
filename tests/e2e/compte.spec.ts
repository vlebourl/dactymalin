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
 * Comptes parents et synchronisation. L'API et sa base sont désormais
 * INDISPENSABLES — la connexion est obligatoire, donc il n'y a plus rien à
 * sauter : `playwright.config.ts` démarre le serveur et son Postgres.
 *
 * La création de compte et le refus d'un mauvais mot de passe sont vérifiés
 * par `connexion.spec.ts`, sur le portail où ils vivent désormais. Ici ne
 * reste que ce qu'un seul écran ne peut pas montrer : deux appareils.
 */
test.describe('comptes parents', () => {
  /* Le cœur de l'étape 5 : la progression suit l'enfant d'un ordinateur à
     l'autre, et c'est TOUJOURS la plus avancée qui gagne. */
  test('la progression passe d’un ordinateur à l’autre, la plus avancée gagne', async ({
    browser,
    page,
  }) => {
    const email = courrielUnique();

    // ordinateur 1 : palier 4, sur un compte tout neuf
    await inscrit(page, email);
    await ouvrir(page, 'fr-FR', 4);
    await page.getByLabel('Réglages').click();
    await page.getByRole('button', { name: 'Ouvrir' }).click();
    await expect(page.getByText('palier 4')).toBeVisible();

    // ordinateur 2 : tout neuf, même compte
    const autre = await browser.newContext();
    const page2 = await autre.newPage();
    await connecte(page2, email);
    /* Graine à 2, PAS à 1 : `ouvrir` la réécrit à chaque navigation, donc
       finir à 4 prouve deux choses d'un coup — la fusion a bien eu lieu, et
       c'est la progression la PLUS AVANCÉE qui gagne, pas la dernière écrite.
       (On ne vérifie plus « il démarre à 1 » : l'appariement a lieu au
       démarrage, avant le premier rendu, donc l'appareil arrive déjà à jour —
       c'est précisément ce que le portail apporte.) */
    await ouvrir(page2, 'fr-FR', 2);
    await page2.getByLabel('Réglages').click();
    await page2.getByRole('button', { name: 'Ouvrir' }).click();
    await expect(page2.getByText(email)).toBeVisible();

    // la progression du premier a rejoint le second
    await expect.poll(async () => (await sauvegarde(page2)).palier, { timeout: 5000 }).toBe(4);
    await autre.close();
  });

  /**
   * #8 — la promesse centrale du compte, jamais vérifiée jusqu'ici : une
   * progression RÉELLEMENT JOUÉE sur un ordinateur se retrouve sur l'autre.
   *
   * Le test au-dessus part d'une progression SEMÉE dans le stockage ; il
   * prouve la règle de fusion, pas le chemin qu'emprunte une frappe d'enfant.
   * Celui-ci joue un bloc entier au clavier, donc il traverse tout : le
   * reducer, l'écriture locale, la file d'envoi, la base, puis la
   * réconciliation au démarrage de l'autre appareil.
   */
  test('une progression JOUÉE sur un ordinateur se retrouve sur l’autre', async ({
    browser,
    page,
  }) => {
    const email = courrielUnique();
    await inscrit(page, email);
    await ouvrir(page, 'fr-FR', 1, false, 'Timo');

    // l'enfant joue un bloc entier, sans une faute
    await page.getByRole('button', { name: 'On commence !' }).click();
    await jouerBlocParfait(page, 'fr-FR');

    const joue = await sauvegarde(page);
    /* Ce bloc a laissé une trace qu'aucun appareil neuf ne peut inventer :
       un compteur avancé, et des touches marquées comme tapées proprement. */
    expect(joue.bloc).toBe(2);
    expect(Object.keys(joue.maitrise).length).toBeGreaterThan(0);

    // le compte l'a reçue : c'est la moitié « envoi » de la promesse
    await expect
      .poll(
        async () => {
          const r = await page.request.get('/api/profils');
          const { profils } = (await r.json()) as { profils: { etat: { bloc: number } | null }[] };
          return profils[0]?.etat?.bloc ?? null;
        },
        { timeout: 10_000 },
      )
      .toBe(joue.bloc);

    // ordinateur 2 : même compte, jamais joué, rien en stockage
    const autre = await browser.newContext();
    const page2 = await autre.newPage();
    await connecte(page2, email);
    await assureProfil(page2, 'Timo');
    await page2.goto('/');

    /* Et c'est la moitié « réception ». Arriver sur l'ACCUEIL et non sur le
       choix du clavier est déjà une preuve : cet appareil-ci n'a jamais choisi
       de disposition, il tient ce choix du premier. */
    await expect(page2.locator('body')).toHaveAttribute('data-vue', 'V1');
    const recu = await sauvegarde(page2);
    expect(recu.bloc).toBe(joue.bloc);
    expect(recu.maitrise).toEqual(joue.maitrise);
    expect(recu.palier).toBe(joue.palier);

    await autre.close();
  });
});