import type { Page } from '@playwright/test';
import type { IdDisposition } from '../../../src/core/layouts';

export const MDP_TEST = 'motdepasse-solide';

/** Adresse jamais vue deux fois : chaque test a son compte à lui. */
export const courrielUnique = () =>
  `parent-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@exemple.fr`;

/**
 * Inscrit un compte parent par l'API et pose le cookie de session dans le
 * contexte. La connexion est OBLIGATOIRE : sans cet appel, tout parcours
 * s'arrête sur le portail. `page.request` partage le pot à cookies du
 * contexte, donc la page suivante est déjà connectée.
 */
export async function inscrit(page: Page, email = courrielUnique()): Promise<string> {
  const r = await page.request.post('/api/auth/sign-up/email', {
    data: { email, password: MDP_TEST, name: 'Parent' },
  });
  if (!r.ok()) throw new Error(`inscription impossible (${r.status()}) — API ou base absente ?`);
  return email;
}

/** Rejoint un compte DÉJÀ créé — le second appareil d'une même famille. */
export async function connecte(page: Page, email: string): Promise<void> {
  const r = await page.request.post('/api/auth/sign-in/email', {
    data: { email, password: MDP_TEST },
  });
  if (!r.ok()) throw new Error(`connexion impossible (${r.status()}) pour ${email}`);
}

/**
 * Garantit une session, sans en imposer une : un test qui s'est déjà connecté
 * à un compte précis garde le sien. C'est ce que `ouvrir` appelle, pour que
 * tout parcours franchisse le portail sans avoir à y penser.
 */
export async function assureConnexion(page: Page): Promise<void> {
  const r = await page.request.get('/api/auth/get-session');
  const session = r.ok() ? ((await r.json().catch(() => null)) as { user?: unknown } | null) : null;
  if (!session?.user) await inscrit(page);
}

/** Progression déjà en place : on démarre sur V1, pas sur l'onboarding. */
export async function ouvrir(
  page: Page,
  id: IdDisposition = 'fr-FR',
  palier = 1,
  sons = false,
): Promise<void> {
  await page.addInitScript(
    ([disposition, niveau, avecSons]) => {
    localStorage.setItem(
      'tapeavecmoi.v1',
      JSON.stringify({
        version: 1,
        disposition,
        dispositionChoisieALaMain: true,
        palier: niveau,
        blocsSurPalier: 0,
        bloc: 1,
        maitrise: {},
        guideDoigtVu: true,
        reglages: { sons: avecSons, texteEspace: false, animationsDouces: false },
      }),
    );
    },
    [id, palier, sons] as [IdDisposition, number, boolean],
  );
  await assureConnexion(page);
  await page.goto('/');
  await page.waitForSelector('body[data-vue="V1"]');
}

/** Onboarding complet : localStorage vierge, l'app ouvre sur V2. */
export async function ouvrirNeuf(page: Page): Promise<void> {
  await assureConnexion(page);
  await page.goto('/');
  await page.waitForSelector('body[data-vue="V2"]');
}

/** Tape l'item courant et attend l'item suivant (ou la fin de bloc). */
export async function jouerItem(page: Page, id: IdDisposition): Promise<string | null> {
  const mot = await motCourant(page);
  if (!mot) return null;
  const { taper } = await import('./keyboard');
  await taper(page, id, mot);
  await page.waitForFunction(
    (precedent) =>
      document.body.dataset.vue !== 'V4' ||
      document.querySelector('[data-mot]')?.getAttribute('data-mot') !== precedent,
    mot,
    { timeout: 6000 },
  );
  return mot;
}

/** Joue un bloc entier sans une seule faute, puis enchaîne depuis V5. */
export async function jouerBlocParfait(page: Page, id: IdDisposition): Promise<void> {
  for (let i = 0; i < 14; i++) {
    if ((await page.locator('body').getAttribute('data-vue')) !== 'V4') break;
    if (!(await jouerItem(page, id))) break;
  }
  await page.waitForSelector('body[data-vue="V5"]', { timeout: 6000 });
}

/** Sauvegarde telle qu'elle est réellement persistée. */
export const sauvegarde = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('tapeavecmoi.v1') ?? '{}'));

export const motCourant = (page: Page) =>
  page.locator('[data-mot]').first().getAttribute('data-mot');

export const curseur = async (page: Page) =>
  Number(await page.locator('[data-mot]').first().getAttribute('data-curseur'));
