import { expect, test } from '@playwright/test';
import { ouvrir } from './helpers/app';

/**
 * Le garde-fou le plus important de l'app.
 *
 * L'app peut parler à SON serveur — et à lui seul. Aucun tiers : ni police
 * distante, ni CDN, ni mesure d'audience, ni pixel.
 *
 * La promesse est désormais « AUCUN TIERS PENDANT LA LEÇON » : la connexion
 * est obligatoire, donc « l'enfant joue sans compte » n'est plus un état
 * possible. Ce qui reste vérifiable, et qui compte autant, c'est que la leçon
 * n'échange rien d'autre que la progression de l'enfant.
 */
test.describe('aucun hôte étranger', () => {
  const nôtre = (url: string) => {
    const u = new URL(url);
    return u.hostname === 'localhost' || u.hostname === '127.0.0.1';
  };

  test("l'app ne contacte jamais un autre hôte que le nôtre", async ({ page }) => {
    const etrangers: string[] = [];
    page.on('request', (r) => {
      if (!nôtre(r.url())) etrangers.push(r.url());
    });

    await ouvrir(page, 'fr-FR');
    await page.getByRole('button', { name: 'On commence !' }).click();
    await page.waitForTimeout(1500);

    expect(etrangers).toEqual([]);
  });

  /* Pendant la leçon, la SEULE chose qui part est la progression de l'enfant.
     Ni mesure d'audience, ni interrogation répétée de la session, ni rien qui
     puisse être corrélé à ce qu'il tape. */
  test('pendant la leçon, seule la progression circule', async ({ page }) => {
    /* Écoute posée AVANT l'ouverture : sinon tout le trafic de démarrage
       (session, appariement) sortirait du champ et le test ne mesurerait
       qu'une fenêtre choisie pour être vide. */
    const api: string[] = [];
    page.on('request', (r) => {
      const { pathname } = new URL(r.url());
      if (pathname.startsWith('/api/')) api.push(`${r.method()} ${pathname}`);
    });

    await ouvrir(page, 'fr-FR');
    const avantLaLecon = api.length;

    await page.getByRole('button', { name: 'On commence !' }).click();
    await page.waitForTimeout(1500);

    /* Une seule chose a le droit de partir pendant que l'enfant tape :
       l'enregistrement de SA progression. Pas une lecture, pas une création,
       pas une interrogation de session — rien d'autre. */
    const pendantLaLecon = api.slice(avantLaLecon);
    const intrus = pendantLaLecon.filter(
      (appel) => !/^PUT \/api\/profils\/[^/]+\/progression$/.test(appel),
    );
    expect(intrus).toEqual([]);
  });

  test('la police Lexend est servie localement', async ({ page }) => {
    await ouvrir(page, 'fr-FR');
    const chargee = await page.evaluate(() =>
      [...document.fonts].some(
        (f) => f.family.replace(/['"]/g, '') === 'Lexend' && f.status === 'loaded',
      ),
    );
    expect(chargee).toBe(true);
  });
});
