import { expect, test } from '@playwright/test';
import { ouvrir } from './helpers/app';

/**
 * Le garde-fou le plus important de l'app.
 *
 * Depuis l'arrivée des comptes, l'app peut parler à SON serveur — et à lui
 * seul. Aucun tiers : ni police distante, ni CDN, ni mesure d'audience, ni
 * pixel. Et tant qu'aucun compte n'est connecté, il ne part rien du tout.
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

  /* Un enfant qui joue sans compte ne doit produire AUCUN trafic : pas d'appel
     d'API, donc rien à intercepter, rien à corréler, rien à conserver. */
  test('sans compte connecté, aucun appel à /api ne part pendant la leçon', async ({ page }) => {
    const api: string[] = [];
    page.on('request', (r) => {
      const chemin = new URL(r.url()).pathname;
      /* `get-session` est la seule question posée, et seulement depuis l'écran
         des parents : elle ne part pas d'une leçon. */
      if (chemin.startsWith('/api/')) api.push(chemin);
    });

    await ouvrir(page, 'fr-FR');
    await page.getByRole('button', { name: 'On commence !' }).click();
    await page.waitForTimeout(1500);

    expect(api).toEqual([]);
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
