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

/** Identifiant SERVEUR du profil que ce test joue. */
const profilDe = new WeakMap<Page, string>();

/**
 * Le profil enfant du parcours. Depuis #4, il appartient au COMPTE : c'est le
 * serveur qui lui donne son identifiant, et la progression locale n'est plus
 * qu'un cache indexé par cet identifiant. Un compte qui en a déjà un le garde
 * — c'est ce qui fait du second navigateur le second APPAREIL d'une famille,
 * et non une seconde famille.
 */
export async function assureProfil(page: Page, prenom = 'Joueur 1'): Promise<string> {
  const liste = await page.request.get('/api/profils');
  if (liste.ok()) {
    const { profils } = (await liste.json()) as { profils: { id: string }[] };
    if (profils.length > 0) {
      profilDe.set(page, profils[0].id);
      return profils[0].id;
    }
  }
  const r = await page.request.post('/api/profils', { data: { prenom } });
  if (!r.ok()) throw new Error(`création du profil impossible (${r.status()}) — API absente ?`);
  const { id } = (await r.json()) as { id: string };
  profilDe.set(page, id);
  return id;
}

/**
 * Une liste de la bibliothèque du foyer, posée par l'API. Le parcours de
 * création par l'écran est couvert par `bibliotheque.spec.ts` ; les tests qui
 * veulent seulement JOUER une liste n'ont pas à le rejouer.
 */
export async function creeListe(page: Page, nom: string, mots: string[]): Promise<string> {
  const r = await page.request.post('/api/listes', { data: { nom, mots } });
  if (!r.ok()) throw new Error(`création de liste impossible (${r.status()})`);
  return ((await r.json()) as { id: string }).id;
}

/** Clé de progression du profil joué par ce test. */
export function cleProfil(page: Page): string {
  const id = profilDe.get(page);
  if (!id) throw new Error('aucun profil : passer par ouvrir() ou assureProfil()');
  return `tapeavecmoi.v1.${id}`;
}

/** Le cache local d'un appareil qui connaît déjà ce profil du compte. */
function graineProfil(page: Page, id: string, nom: string) {
  return page.addInitScript(
    ([idProfil, prenom]) => {
      localStorage.setItem(
        'tapeavecmoi.profils',
        JSON.stringify({ version: 2, actif: idProfil, liste: [{ id: idProfil, nom: prenom }] }),
      );
    },
    [id, nom] as [string, string],
  );
}

/** Progression déjà en place : on démarre sur V1, pas sur l'onboarding. */
export async function ouvrir(
  page: Page,
  id: IdDisposition = 'fr-FR',
  palier = 1,
  sons = false,
  prenom = 'Joueur 1',
): Promise<void> {
  await assureConnexion(page);
  const idProfil = await assureProfil(page, prenom);
  await graineProfil(page, idProfil, prenom);
  await page.addInitScript(
    ([cle, disposition, niveau, avecSons]) => {
      localStorage.setItem(
        cle as string,
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
      /* Cet appareil a VRAIMENT écrit cette progression, à l'instant : c'est
         cette date que la réconciliation compare à celle du serveur. Sans
         elle, le serveur ferait foi sans fusion. */
      localStorage.setItem(
        'tapeavecmoi.maj',
        JSON.stringify({ [String(cle).replace('tapeavecmoi.v1.', '')]: new Date().toISOString() }),
      );
    },
    [cleProfil(page), id, palier, sons] as [string, IdDisposition, number, boolean],
  );
  await page.goto('/');
  await page.waitForSelector('body[data-vue="V1"]');
}

/** Onboarding complet : aucune progression, l'app ouvre sur V2. */
export async function ouvrirNeuf(page: Page): Promise<void> {
  await assureConnexion(page);
  const idProfil = await assureProfil(page);
  await graineProfil(page, idProfil, 'Joueur 1');
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

/** Sauvegarde telle qu'elle est réellement persistée, pour le profil joué. */
export const sauvegarde = (page: Page) =>
  page.evaluate((cle) => JSON.parse(localStorage.getItem(cle) ?? '{}'), cleProfil(page));

export const motCourant = (page: Page) =>
  page.locator('[data-mot]').first().getAttribute('data-mot');

export const curseur = async (page: Page) =>
  Number(await page.locator('[data-mot]').first().getAttribute('data-curseur'));
