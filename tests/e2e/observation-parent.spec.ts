import { expect, test, type Page } from '@playwright/test';
import { cleProfil, jouerBlocParfait, ouvrir } from './helpers/app';

/**
 * #63 — le parent lit enfin ce que l'app observe.
 *
 * Les cinq mesures étaient comptées et conservées depuis #40 et #61, et
 * personne ne les ouvrait : les deux garde-fous du cahier (§7.1 et §7.5)
 * étaient outillés sans être observables. Ce parcours part de mesures déjà
 * enregistrées et vérifie qu'elles arrivent au parent — avec leurs deux
 * alertes, au bon seuil, et pas en dessous.
 */

type Lecon = { etape: number; ms: number; lettres: number; fautes: number; barreau3: number };
type Serie = { touches: Record<string, never>; lecons: Lecon[] };

const lecons = (n: number, l: Lecon): Lecon[] => Array.from({ length: n }, () => ({ ...l }));

/**
 * Pose des mesures dans la sauvegarde locale du profil joué, puis recharge.
 *
 * Par `addInitScript` et non par `evaluate` : `ouvrir` en a déjà posé un qui
 * réécrit toute la sauvegarde, et il rejoue à CHAQUE navigation. Une écriture
 * faite après coup serait balayée par le rechargement. Les scripts d'amorçage
 * s'exécutent dans leur ordre d'enregistrement — celui-ci passe donc en
 * dernier, et se contente d'ajouter le champ `mesures` à ce qui existe.
 */
async function avecMesures(page: Page, mesures: Record<string, Serie>): Promise<void> {
  await page.addInitScript(
    ([cle, m]) => {
      const sauvegarde = JSON.parse(localStorage.getItem(cle as string) ?? '{}');
      (sauvegarde as { mesures?: unknown }).mesures = m;
      localStorage.setItem(cle as string, JSON.stringify(sauvegarde));
    },
    [cleProfil(page), mesures] as [string, Record<string, Serie>],
  );
  await page.reload();
  await page.waitForSelector('body[data-vue="V1"]');
}

/** Réglages, puis l'espace parent — le seul chemin vers ces chiffres. */
async function espaceParent(page: Page): Promise<void> {
  await page.getByLabel('Réglages').click();
  await page.getByRole('button', { name: 'Ouvrir' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V9');
}

test('le parent lit les deux séries, et l’app lui propose Dactylo au bon moment', async ({
  page,
}) => {
  await ouvrir(page, 'fr-FR', 3, false, 'Joueur 1', 'decouverte');
  await avecMesures(page, {
    // 100 lettres en une minute = 20 mots/min : au-dessus des quinze de §7.1.
    decouverte: {
      touches: {},
      lecons: lecons(2, { etape: 3, ms: 60_000, lettres: 100, fautes: 0, barreau3: 0 }),
    },
    // L'autre parcours, joué mollement : sa vitesse ne doit rien déclencher.
    dactylo: {
      touches: {},
      lecons: lecons(1, { etape: 1, ms: 60_000, lettres: 20, fautes: 5, barreau3: 0 }),
    },
  });
  await espaceParent(page);

  const decouverte = page.locator('[data-observation="decouverte"]');
  await expect(decouverte).toContainText('Étape 3');
  await expect(decouverte).toContainText('2 leçon(s) sur cette étape');
  await expect(decouverte).toContainText('20 mots/min');

  // Les deux séries sont là, côte à côte, et surtout PAS additionnées : le
  // parcours lent garde sa vitesse lente.
  const dactylo = page.locator('[data-observation="dactylo"]');
  await expect(dactylo).toContainText('4 mots/min');
  await expect(dactylo).toContainText('80 % de frappes justes');

  await expect(page.locator('[data-alerte="passage-dactylo"]')).toBeVisible();
  await expect(page.locator('[data-alerte="barreau3"]')).toHaveCount(0);

  // Les chiffres appartiennent à UN enfant : une fratrie doit savoir lequel.
  await expect(page.getByRole('heading', { name: "Ce que l'app observe chez Joueur 1" })).toBeVisible();
  // Et la fenêtre est dite : « 20 mots/min » sur sept leçons, pas sur la vie entière.
  await expect(decouverte).toContainText('(sur 2 leçon(s))');
});

test('sous les seuils, l’app ne propose rien du tout', async ({ page }) => {
  await ouvrir(page, 'fr-FR', 2, false, 'Joueur 1', 'decouverte');
  await avecMesures(page, {
    // 70 lettres en une minute = 14 mots/min : l'enfant peut rester en Découverte.
    decouverte: {
      touches: {},
      lecons: lecons(3, { etape: 2, ms: 60_000, lettres: 70, fautes: 2, barreau3: 13 }),
    },
  });
  await espaceParent(page);

  await expect(page.locator('[data-observation="decouverte"]')).toContainText('14 mots/min');
  await expect(page.locator('[data-alerte="passage-dactylo"]')).toHaveCount(0);
  // 13 lettres sur 70 : sous la lettre sur cinq de §7.5.
  await expect(page.locator('[data-alerte="barreau3"]')).toHaveCount(0);
});

test('l’aide poussée trop souvent se signale, sur le parcours concerné', async ({ page }) => {
  await ouvrir(page, 'fr-FR', 5, false, 'Joueur 1', 'dactylo');
  await avecMesures(page, {
    dactylo: {
      touches: {},
      lecons: lecons(7, { etape: 5, ms: 60_000, lettres: 100, fautes: 0, barreau3: 25 }),
    },
  });
  await espaceParent(page);

  await expect(page.locator('[data-observation="dactylo"]')).toContainText(
    'aide poussée sur 25 % des lettres',
  );
  await expect(page.locator('[data-alerte="barreau3"]')).toBeVisible();
  // Le garde-fou §7.1 ne parle que de Découverte : rapide en Dactylo, c'est le but.
  await expect(page.locator('[data-alerte="passage-dactylo"]')).toHaveCount(0);
});

test('un enfant qui n’a rien joué n’invente aucun chiffre', async ({ page }) => {
  await ouvrir(page, 'fr-FR', 1);
  await espaceParent(page);

  await expect(page.getByText('Aucune leçon jouée sur cet appareil')).toBeVisible();
  await expect(page.locator('[data-observation]')).toHaveCount(0);
  await expect(page.locator('[data-alerte]')).toHaveCount(0);
});

test('à 14,6 mots par minute, l’app affiche 14 et ne conseille rien', async ({ page }) => {
  // Arrondi au plus proche, ce cumul afficherait « 15 mots/min » juste à côté
  // d'un conseil de passage qui, lui, ne se déclenche qu'à 15 pile.
  await ouvrir(page, 'fr-FR', 2, false, 'Joueur 1', 'decouverte');
  await avecMesures(page, {
    decouverte: {
      touches: {},
      lecons: lecons(1, { etape: 2, ms: 60_000, lettres: 73, fautes: 0, barreau3: 0 }),
    },
  });
  await espaceParent(page);

  await expect(page.locator('[data-observation="decouverte"]')).toContainText('14 mots/min');
  await expect(page.locator('[data-alerte="passage-dactylo"]')).toHaveCount(0);
});

test('une fois passé à Dactylo, le conseil de passer à Dactylo disparaît', async ({ page }) => {
  /* Plus aucune leçon de Découverte ne s'enregistre après la bascule : sans
     ce garde-fou, les sept dernières resteraient au-dessus du seuil pour
     toujours, et le parent lirait éternellement un conseil qu'il a suivi. */
  await ouvrir(page, 'fr-FR', 1, false, 'Joueur 1', 'dactylo');
  await avecMesures(page, {
    decouverte: {
      touches: {},
      lecons: lecons(3, { etape: 6, ms: 60_000, lettres: 120, fautes: 0, barreau3: 0 }),
    },
  });
  await espaceParent(page);

  await expect(page.locator('[data-observation="decouverte"]')).toContainText('24 mots/min');
  await expect(page.locator('[data-alerte="passage-dactylo"]')).toHaveCount(0);
});

test('l’étape affichée est celle que l’enfant vient d’atteindre', async ({ page }) => {
  /* `progressions` n'est réécrit qu'au changement de parcours : une étape
     franchie à l'instant s'y lit encore à l'ancienne, à côté d'un compte de
     leçons qui, lui, est frais. Les deux moitiés de la ligne se
     contredisaient. Ce parcours joue la septième leçon d'une étape, franchit,
     et va lire le panneau SANS recharger. */
  await ouvrir(page, 'fr-FR', 1, false, 'Joueur 1', 'decouverte', 6);
  await page.getByRole('button', { name: 'On commence !' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');
  await jouerBlocParfait(page, 'fr-FR');
  await page.getByRole('button', { name: 'Retour' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V1');
  await espaceParent(page);

  await expect(page.locator('[data-observation="decouverte"]')).toContainText('Étape 2');
});
