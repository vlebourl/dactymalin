import { expect, test, type Page } from '@playwright/test';
import { ouvrir } from './helpers/app';

const CATS = ['passe', 'present', 'futur'] as const;
const FILE = Array.from({ length: 22 }, (_, i) => ({
  phrase: `Phrase numéro ${i + 1} de Maël.`,
  categorie: CATS[i % 3],
}));
const LIBELLE = { passe: 'Passé', present: 'Présent', futur: 'Futur' };

/* Mène l'app jusqu'au menu des exercices, `phrase` étant simulé. `urls` reçoit
   chaque URL de phrase demandée. */
async function versMenu(
  page: Page,
  phrase: (n: number) => { status: number; json: unknown },
  urls: string[] = [],
) {
  await ouvrir(page);
  await page.route('**/api/grammaire/etat', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '{"disponible":true}' }),
  );
  let n = 0;
  await page.route('**/api/grammaire/phrase?*', (r) => {
    urls.push(r.request().url());
    const { status, json } = phrase(n++);
    return r.fulfill({ status, contentType: 'application/json', body: JSON.stringify(json) });
  });
  await page.reload();
  await page.getByRole('button', { name: 'Grammaire' }).click();
  await page.waitForSelector('body[data-vue="MENU_GRAMMAIRE"]');
}
/* Puis jusqu'à l'exercice « temps », niveaux par défaut (tous cochés). */
async function versNiveaux(page: Page, phrase: (n: number) => { status: number; json: unknown }, urls?: string[]) {
  await versMenu(page, phrase, urls);
  await page.getByRole('button', { name: 'Passé, présent ou futur ?' }).click();
  await page.waitForSelector('body[data-vue="GRAMMAIRE"]');
  await expect(page.getByRole('heading', { name: 'Quels niveaux ?' })).toBeVisible();
}
async function versGrammaire(page: Page, phrase: (n: number) => { status: number; json: unknown }) {
  await versNiveaux(page, phrase);
  await page.getByRole('button', { name: 'Commencer' }).click();
}
const file = (n: number) => ({ status: 200, json: FILE[n] });
const finDeSerie = async (page: Page) => {
  for (let i = 0; i < 10; i++) {
    await expect(page.getByText(FILE[i].phrase)).toBeVisible();
    await bouton(page, FILE[i].categorie).click();
    if (i < 9) await expect(page.getByText(FILE[i + 1].phrase)).toBeVisible();
  }
};
const bouton = (page: Page, c: keyof typeof LIBELLE) =>
  page.getByRole('button', { name: LIBELLE[c], exact: false });

test('bonne réponse : retour positif, puis phrase suivante seule', async ({ page }) => {
  await versGrammaire(page, file);
  await page.waitForSelector('body[data-vue="GRAMMAIRE"]');
  await expect(page.getByText(FILE[0].phrase)).toBeVisible();
  for (const c of CATS) await expect(bouton(page, c)).toBeVisible();
  await bouton(page, FILE[0].categorie).click();
  // Mode grammaire : « Bravo ! » seul, sans phrase d'encouragement du clavier.
  await expect(page.getByRole('status')).toHaveText('Bravo !');
  await expect(page.getByText(FILE[1].phrase)).toBeVisible();
});

test('mauvaise réponse : la bonne est marquée, « Suivant » passe à la suite', async ({ page }) => {
  await versGrammaire(page, file);
  await expect(page.getByText(FILE[0].phrase)).toBeVisible();
  await bouton(page, 'present').click(); // FILE[0] est « passe »
  await expect(page.getByText("C'était : Passé")).toBeVisible();
  await expect(page.locator('[data-juste="oui"]')).toHaveText(/Passé/);
  await page.getByRole('button', { name: 'Suivant' }).click();
  await expect(page.getByText(FILE[1].phrase)).toBeVisible();
});

test('série de 10 : score x / 10, puis Encore relance une série', async ({ page }) => {
  await versGrammaire(page, file);
  for (let i = 0; i < 10; i++) {
    await expect(page.getByText(FILE[i].phrase)).toBeVisible();
    await bouton(page, FILE[i].categorie).click();
    if (i < 9) await expect(page.getByText(FILE[i + 1].phrase)).toBeVisible();
  }
  await expect(page.getByText('10 / 10')).toBeVisible();
  await page.getByRole('button', { name: 'Encore' }).click();
  await expect(page.getByText(FILE[10].phrase)).toBeVisible();
});

test('fin de série : Autre exercice ramène au menu', async ({ page }) => {
  await versGrammaire(page, file);
  await finDeSerie(page);
  await page.getByRole('button', { name: 'Autre exercice' }).click();
  await page.waitForSelector('body[data-vue="MENU_GRAMMAIRE"]');
});

test('fin de série : Changer de mode', async ({ page }) => {
  await versGrammaire(page, file);
  await finDeSerie(page);
  await page.getByRole('button', { name: 'Changer de mode' }).click();
  await page.waitForSelector('body[data-vue="MODE"]');
});

test('phrase en 503 : message et retour au choix du mode', async ({ page }) => {
  await versGrammaire(page, () => ({ status: 503, json: { code: 'GRAMMAIRE_INDISPONIBLE' } }));
  await expect(page.getByText('Les phrases ne sont pas disponibles pour le moment.')).toBeVisible();
  await page.getByRole('button', { name: 'Changer de mode' }).click();
  await page.waitForSelector('body[data-vue="MODE"]');
});

test('double-clic rapide : une seule réponse comptée', async ({ page }) => {
  await versGrammaire(page, file);
  await expect(page.getByText(FILE[0].phrase)).toBeVisible();
  await bouton(page, FILE[0].categorie).dblclick();
  await expect(page.getByText(FILE[1].phrase)).toBeVisible();
  await expect(page.getByText('Phrase 1 sur 10')).toHaveCount(0);
  await expect(page.getByText('Phrase 2 sur 10')).toBeVisible();
});

test('après Grammaire : le menu propose l’exercice et Changer de mode', async ({ page }) => {
  await versMenu(page, file);
  await expect(page.getByRole('heading', { name: 'Quel exercice ?' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Passé, présent ou futur ?' })).toBeVisible();
  await page.getByRole('button', { name: 'Changer de mode' }).click();
  await page.waitForSelector('body[data-vue="MODE"]');
});

test('niveaux : tous cochés au départ, au moins un exigé, envoyés au serveur', async ({ page }) => {
  const urls: string[] = [];
  await versNiveaux(page, file, urls);
  const cases = ['Marqueurs de temps', 'Imparfait', 'Passé composé'].map((n) =>
    page.getByRole('checkbox', { name: new RegExp(n) }),
  );
  for (const c of cases) await expect(c).toBeChecked();
  for (const c of cases) await c.uncheck();
  await expect(page.getByRole('button', { name: 'Commencer' })).toBeDisabled();
  expect(urls).toHaveLength(0);
  await cases[0]!.check();
  await cases[1]!.check();
  await page.getByRole('button', { name: 'Commencer' }).click();
  await expect(page.getByText(FILE[0].phrase)).toBeVisible();
  expect(new URL(urls[0]!).searchParams.get('niveaux')).toBe('marqueurs,imparfait');
});
