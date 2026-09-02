import { expect, test } from '@playwright/test';
import { coquilleGardee, ouvrir } from './helpers/app';

/**
 * #110 — l'application se DÉCLARE installable. Sans manifeste, Chrome Android
 * n'offre qu'« Ajouter à l'écran d'accueil » : un raccourci qui rouvre le
 * navigateur, barre d'URL et onglets à portée de doigt de l'enfant pendant la
 * leçon.
 *
 * Ce spec vérifie ce que le NAVIGATEUR voit — le document servi, le manifeste
 * qu'il désigne, les fichiers vers lesquels celui-ci pointe. Un test sur la
 * présence d'un fichier au disque, ou sur la forme d'un objet importé, passerait
 * au vert alors que Chrome n'installerait rien.
 *
 * Ces tests-là s'en tiennent à `page.goto` : rien de ce qu'ils affirment ne
 * dépend d'une session. Passer par `ouvrir` inscrirait un compte en base à
 * chaque cas, et une API en panne ferait échouer l'installabilité sur un
 * message qui ne parle pas d'elle. Seul le cas hors ligne, qui a besoin de
 * l'application réellement démarrée, garde `ouvrir`.
 */

/** Le manifeste tel que la page le désigne, suivi comme le ferait le navigateur. */
async function manifeste(page: import('@playwright/test').Page) {
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href, 'le document ne déclare aucun manifeste').toBeTruthy();
  const reponse = await page.request.get(new URL(href!, page.url()).toString());
  expect(reponse.status()).toBe(200);
  return { url: new URL(href!, page.url()).toString(), reponse };
}

test('le document désigne un manifeste, servi comme tel', async ({ page }) => {
  await page.goto('/');
  const { reponse } = await manifeste(page);

  /* Le type de contenu est le point où un manifeste se fait ignorer SANS
     aucune erreur visible : Chrome ne l'analyse pas, et rien ne le dit. */
  const type = reponse.headers()['content-type'] ?? '';
  expect(type).toMatch(/application\/(manifest\+json|json)/);
});

test('le manifeste porte ce que Chrome exige pour installer', async ({ page }) => {
  await page.goto('/');
  const { reponse } = await manifeste(page);
  const m = (await reponse.json()) as Record<string, unknown>;

  expect(m.name).toBe('DactyMalin');
  expect(m.short_name).toBe('DactyMalin');
  expect(m.description).toEqual(expect.any(String));
  expect(m.start_url).toBeTruthy();
  expect(m.scope).toBeTruthy();
  /* `standalone` et pas `fullscreen` : plein écran, mais la barre d'état
     système reste — un parent veut garder l'heure et la batterie. */
  expect(m.display).toBe('standalone');
  expect(m.orientation).toBe('any');
  expect(m.lang).toBe('fr');
  expect(m.dir).toBe('ltr');
  /* Les couleurs viennent des jetons de l'application, pas d'une invention. */
  expect(m.background_color).toMatch(/^#[0-9a-f]{6}$/i);
  expect(m.theme_color).toMatch(/^#[0-9a-f]{6}$/i);
});

test('les icônes couvrent les deux tailles et les deux usages', async ({ page }) => {
  await page.goto('/');
  const { reponse } = await manifeste(page);
  const icones = ((await reponse.json()) as { icons?: { sizes: string; purpose?: string }[] }).icons;
  expect(icones, 'aucune icône déclarée').toBeTruthy();

  const tailles = icones!.map((i) => i.sizes);
  expect(tailles).toContain('192x192');
  expect(tailles).toContain('512x512');

  /* Le lanceur Android DÉCOUPE une forme dans l'icône : sans variante
     masquable, le logo se retrouve rogné ou cerné d'un carré blanc. */
  const usages = icones!.map((i) => i.purpose ?? 'any');
  expect(usages).toContain('any');
  expect(usages).toContain('maskable');
  for (const taille of ['192x192', '512x512']) {
    expect(
      icones!.filter((i) => i.sizes === taille && (i.purpose ?? 'any').includes('maskable')),
      `pas de variante masquable en ${taille}`,
    ).not.toHaveLength(0);
  }
});

/* La régression la plus probable : un fichier renommé, un manifeste qui pointe
   dans le vide, et Chrome qui cesse d'offrir l'installation sans un mot. */
test('chaque icône déclarée existe réellement', async ({ page }) => {
  await page.goto('/');
  const { url, reponse } = await manifeste(page);
  const icones = ((await reponse.json()) as { icons: { src: string }[] }).icons;

  for (const icone of icones) {
    const cible = new URL(icone.src, url).toString();
    const r = await page.request.get(cible);
    expect(r.status(), `icône introuvable : ${icone.src}`).toBe(200);
    expect(r.headers()['content-type'] ?? '').toContain('image/');
  }
});

/* L'installation ne doit rien retirer à #3 : l'app installée démarre dans le
   train, donc le manifeste doit être là lui aussi. */
test('le manifeste survit à la coupure réseau', async ({ page, context }) => {
  await ouvrir(page, 'fr-FR', 1);
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBeTruthy();
  await coquilleGardee(page);

  await context.setOffline(true);
  await page.reload();

  /* `fetch` depuis la page, et non `page.request` : seul le premier passe par
     le service worker, qui est justement ce qu'on met à l'épreuve. */
  const servi = await page.evaluate(async (chemin) => {
    try {
      const r = await fetch(chemin);
      return r.ok;
    } catch {
      return false;
    }
  }, href!);
  expect(servi, 'le manifeste n’est pas gardé pour le hors-ligne').toBe(true);
});

/* L'installabilité est un CONFORT. iOS ne lit pas les icônes du manifeste, et
   un navigateur qui ignore les manifestes doit rester capable de jouer. */
test('les icônes historiques restent déclarées dans le document', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
  expect(await page.locator('link[rel="icon"]').count()).toBeGreaterThan(0);
});

/*
 * Le lanceur Android découpe une forme — cercle, carré arrondi, écusson — dans
 * l'icône masquable. Tout ce qui déborde du cercle central couvrant 80 % de la
 * largeur est rogné. Un logo recadré au plus juste, ou remplacé un jour sans y
 * penser, se retrouverait amputé sur l'écran d'accueil de l'enfant sans qu'un
 * seul test ne bronche : c'est cette mesure-là qui l'attrape.
 */
test('le motif des icônes masquables tient dans la zone de sécurité', async ({ page }) => {
  await page.goto('/');
  const { url, reponse } = await manifeste(page);
  const masquables = ((await reponse.json()) as { icons: { src: string; purpose?: string }[] }).icons
    .filter((i) => (i.purpose ?? 'any').includes('maskable'))
    .map((i) => new URL(i.src, url).toString());
  expect(masquables.length).toBeGreaterThan(0);

  for (const src of masquables) {
    /* On dessine l'icône et on cherche l'étendue de ce qui n'est PAS le fond,
       puis on demande au coin le plus éloigné du centre de rester dans le
       cercle sûr. Le fond est lu au coin haut-gauche : une icône masquable est
       à fond plein par construction. */
    const mesure = await page.evaluate(
      (adresse) =>
        new Promise<{ rayon: number; sur: number }>((resoudre, rejeter) => {
          const image = new Image();
          image.crossOrigin = 'anonymous';
          image.onerror = () => rejeter(new Error(`icône illisible : ${adresse}`));
          image.onload = () => {
            const c = document.createElement('canvas');
            c.width = image.width;
            c.height = image.height;
            const ctx = c.getContext('2d')!;
            ctx.drawImage(image, 0, 0);
            const { data } = ctx.getImageData(0, 0, c.width, c.height);
            const lis = (i: number) => [data[i], data[i + 1], data[i + 2]];
            const [fr, fg, fb] = lis(0);
            const centre = c.width / 2;
            let rayon = 0;
            for (let y = 0; y < c.height; y++) {
              for (let x = 0; x < c.width; x++) {
                const i = (y * c.width + x) * 4;
                const [r, g, b] = lis(i);
                /* Une tolérance, car le redimensionnement lisse les bords du
                   motif contre le fond ; sans elle, chaque icône paraîtrait
                   déborder jusqu'à ses quatre coins. */
                if (Math.abs(r - fr) + Math.abs(g - fg) + Math.abs(b - fb) < 24) continue;
                rayon = Math.max(rayon, Math.hypot(x + 0.5 - centre, y + 0.5 - centre));
              }
            }
            resoudre({ rayon, sur: c.width });
          };
          image.src = adresse;
        }),
      src,
    );

    expect(mesure.rayon, `icône masquable vide : ${src}`).toBeGreaterThan(0);
    /* 80 % de la largeur en DIAMÈTRE, donc 40 % en rayon. */
    expect(mesure.rayon, `le motif déborde du cercle sûr : ${src}`).toBeLessThanOrEqual(
      mesure.sur * 0.4,
    );
  }
});
