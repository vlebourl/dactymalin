import { expect, test } from '@playwright/test';
import { creeListe, ouvrir } from './helpers/app';

/**
 * Régression signalée le 2026-08-29 : un mot de liste contenant un CHIFFRE
 * (« le 20 octobre ») restait injouable en AZERTY. Maj était traité comme un
 * concept réservé au palier 7 — les deux touches Maj n'étaient pas dessinées,
 * et surtout le sas débutant jetait toute frappe tenue avec Maj AVANT qu'elle
 * n'atteigne le reducer. La consigne réclamait donc une Maj que l'application
 * refusait ensuite de compter.
 *
 * Une liste peut exiger Maj à n'importe quel palier : c'est le BESOIN qui
 * commande, pas le numéro. Le test passait par « Notre leçon », la liste
 * unique retirée en #12 ; il passe maintenant par une carte de l'accueil, ce
 * qui ne change rien à ce qu'il protège.
 */
test('un chiffre AZERTY est jouable dans une liste, dès le palier 1', async ({ page }) => {
  await ouvrir(page, 'fr-FR', 1);
  await creeListe(page, 'Les dates', ['le 20 octobre']);

  await page.reload();
  await page.getByRole('button', { name: /Les dates/ }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');

  const { taper } = await import('./helpers/keyboard');
  // « le » puis l'espace : on arrive sur le « 2 », qui exige Maj en AZERTY.
  await taper(page, 'fr-FR', 'le ');

  // Les deux Maj doivent être DESSINÉES, et la contralatérale visée.
  await expect(page.locator('[data-code="ShiftLeft"]')).toBeVisible();
  await expect(page.locator('[data-code="ShiftRight"]')).toBeVisible();
  await expect(page.locator('[data-code="ShiftRight"]')).toHaveAttribute('data-etat', 'cible');

  // …et la frappe Maj+2 doit être COMPTÉE : le curseur avance sur le « 0 ».
  await taper(page, 'fr-FR', '2');
  await expect(page.locator('[data-code="Digit0"]')).toHaveAttribute('data-etat', 'cible');
});
