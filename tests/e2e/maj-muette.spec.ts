import { expect, test } from '@playwright/test';
import { jouerBlocParfait, ouvrir } from './helpers/app';
import { frapperCouple } from './helpers/keyboard';
import { MAJ_DROITE, toucheDirecte } from '../../src/core/layouts';

/**
 * #87 — avant l'étape qui enseigne la Majuscule, une frappe avec Maj tenue est
 * MUETTE.
 *
 * Le garde des modificateurs testait le PARCOURS (`app.parcours ===
 * 'decouverte'`) et non l'étape. La Majuscule s'enseigne à l'étape 7 en
 * Découverte mais dès l'étape 3 en Dactylo : les étapes 1 et 2 de Dactylo
 * laissaient donc passer la frappe, elle produisait une capitale, et elle
 * était comptée FAUTE dans les mesures montrées au parent — l'inverse de ce
 * que P2 (l. 229) demande, où le modificateur n'est « ni affiché, ni requis,
 * ni accepté ».
 *
 * Le test porte sur le COMPORTEMENT : le mot reste intact, le curseur ne
 * bouge pas, et la leçon finit à 100 % de frappes justes.
 */
test('en Dactylo étape 1, une frappe avec Maj ne produit rien et ne compte aucune faute', async ({
  page,
}) => {
  await ouvrir(page, 'fr-FR', 1, false, 'Joueur 1', 'dactylo');
  await page.getByRole('button', { name: 'On commence !' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');

  const mot = page.locator('[data-mot]');
  const avant = await mot.getAttribute('data-mot');
  expect(avant, 'un mot doit être proposé').toBeTruthy();
  await expect(mot).toHaveAttribute('data-curseur', '0');

  /* La LETTRE ATTENDUE, tenue avec Maj : c'est le pire cas, celui qui devient
     une capitale fausse au lieu de rester sans effet. */
  const attendue = avant![0];
  const touche = toucheDirecte('fr-FR', attendue);
  expect(touche, `« ${attendue} » doit être une touche directe en AZERTY`).toBeTruthy();
  for (let i = 0; i < 3; i++) {
    await frapperCouple(page, touche!.code, attendue.toUpperCase(), { maj: MAJ_DROITE });
    await page.waitForTimeout(30);
  }

  // Rien n'a été écrit, rien n'a avancé.
  await expect(mot).toHaveAttribute('data-mot', avant!);
  await expect(mot).toHaveAttribute('data-curseur', '0');

  // …et surtout : la leçon jouée sans erreur reste à 100 % pour le parent.
  await jouerBlocParfait(page, 'fr-FR');
  /* Retour par l'ÉCRAN, jamais par un rechargement : le harnais réécrit toute
     la sauvegarde à chaque navigation, et emporterait les mesures. */
  await page.getByRole('button', { name: 'Retour' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V1');
  await page.getByLabel('Réglages').click();
  await page.getByRole('button', { name: 'Ouvrir' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V9');
  await expect(page.locator('[data-observation="dactylo"]')).toContainText(
    '100 % de frappes justes',
  );
});
