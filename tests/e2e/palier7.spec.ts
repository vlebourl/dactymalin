import { expect, test } from '@playwright/test';
import { motCourant, ouvrir } from './helpers/app';
import { coteMajAttendu, coteMajHomolateral, frapper, frapperCouple } from './helpers/keyboard';
import { toucheDe } from '../../src/core/layouts';

/**
 * Régression itération 002, point critique n°2 et majeur n°3.
 * Au palier 7, `mainDe()` ne consultait que la table des caractères DIRECTS :
 * les dix chiffres FR-FR n'avaient aucune touche cible et la bande de doigts
 * annonçait systématiquement « main gauche ». Le piège Maj, lui, n'allumait
 * aucune touche au lieu des DEUX exigées (porteuse + Maj contralatérale).
 */
test.describe('palier 7 : chiffres et piège Maj', () => {
  test.beforeEach(async ({ page }) => {
    await ouvrir(page, 'fr-FR', 8);
    await page.getByRole('button', { name: 'On commence !' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-vue', 'V4');
  });

  test('un item numérique allume DEUX touches : la porteuse et la Maj opposée', async ({ page }) => {
    // avance jusqu'au premier item qui commence par un chiffre
    for (let i = 0; i < 12; i++) {
      const mot = await motCourant(page);
      if (mot && /^[0-9]/.test(mot)) break;
      if (!mot) break;
      // on saute l'item en le tapant
      for (const c of mot) {
        await frapper(page, 'fr-FR', c);
        await page.waitForTimeout(20);
      }
      await page.waitForTimeout(820);
    }

    const mot = await motCourant(page);
    expect(mot, 'aucun item numérique servi au palier 7').toMatch(/^[0-9]/);
    const chiffre = mot![0];

    const cibles = page.locator('[data-etat="cible"]');
    await expect(cibles).toHaveCount(2);

    // la touche porteuse du chiffre est bien la cible
    const porteuse = toucheDe('fr-FR', chiffre)!;
    await expect(page.locator(`[data-code="${porteuse.code}"]`)).toHaveAttribute(
      'data-etat',
      'cible',
    );

    // la Maj allumée est CONTRALATÉRALE
    const majAttendue = porteuse.main === 'gauche' ? 'ShiftRight' : 'ShiftLeft';
    await expect(page.locator(`[data-code="${majAttendue}"]`)).toHaveAttribute('data-etat', 'cible');
    await expect(page.locator(`[data-code="${majAttendue}"]`)).toBeVisible();

    /* La main annoncée est celle de la touche porteuse, pas un défaut
       « gauche ». Depuis #37 elle se lit sur le DESSIN — le mot a disparu. */
    const cote = porteuse.main === 'gauche' ? 'gauche' : 'droite';
    await expect(page.locator(`[data-main="${cote}"] img`)).toHaveAttribute(
      'src',
      `/doigts/index_${cote}.png`,
    );
    expect(await page.locator('[data-doigt]').getAttribute('data-doigt')).toBe(
      porteuse.main === 'gauche' ? 'index_gauche' : 'index_droit',
    );

    // et le rappel Maj annonce l'autre main
    await expect(page.locator('[data-maj]')).toHaveAttribute(
      'data-maj',
      porteuse.main === 'gauche' ? 'droite' : 'gauche',
    );
  });

  test('la bonne touche sans Maj reste une quasi-réussite : les deux cibles tiennent', async ({
    page,
  }) => {
    for (let i = 0; i < 12; i++) {
      const mot = await motCourant(page);
      if (!mot) break;
      if (/^[0-9]/.test(mot)) {
        const porteuse = toucheDe('fr-FR', mot[0])!;
        // frappe SANS Maj : l'app reçoit le caractère direct de la touche
        await frapperCouple(page, porteuse.code, porteuse.base!);
        await expect(page.locator('[data-etat="cible"]')).toHaveCount(2);
        // rien ne s'écrit, le curseur ne bouge pas, aucune touche « fausse »
        expect(await page.locator('[data-mot]').getAttribute('data-curseur')).toBe('0');
        await expect(page.locator('[data-etat="fausse"]')).toHaveCount(0);
        return;
      }
      for (const c of mot) {
        await frapper(page, 'fr-FR', c);
        await page.waitForTimeout(20);
      }
      await page.waitForTimeout(820);
    }
    throw new Error('aucun item numérique servi au palier 7');
  });

  /* Régression gate Codex n°5 : le hook n'exposait qu'un booléen `avecMaj`.
     La Maj HOMOLATÉRALE (celle de la main qui tape déjà) validait donc la
     frappe, alors que l'app affiche l'autre — la règle contralatérale n'était
     enseignée qu'en peinture. */
  test('la Maj HOMOLATÉRALE ne valide pas ; la contralatérale, si', async ({ page }) => {
    test.slow();
    for (let i = 0; i < 12; i++) {
      const mot = await motCourant(page);
      if (!mot) break;
      if (/^[0-9]/.test(mot)) {
        const chiffre = mot[0];
        const porteuse = toucheDe('fr-FR', chiffre)!;

        // mauvais côté : quasi-réussite, rien ne s'écrit, aucune touche fausse
        await frapperCouple(page, porteuse.code, chiffre, {
          maj: coteMajHomolateral('fr-FR', chiffre),
        });
        await page.waitForTimeout(60);
        expect(await page.locator('[data-mot]').getAttribute('data-curseur')).toBe('0');
        await expect(page.locator('[data-etat="fausse"]')).toHaveCount(0);
        await expect(page.locator('[data-etat="cible"]')).toHaveCount(2);

        // bon côté : la frappe passe
        await frapperCouple(page, porteuse.code, chiffre, {
          maj: coteMajAttendu('fr-FR', chiffre),
        });
        await expect(page.locator('[data-mot]')).toHaveAttribute('data-curseur', '1');
        return;
      }
      for (const c of mot) {
        await frapper(page, 'fr-FR', c);
        await page.waitForTimeout(20);
      }
      await page.waitForTimeout(820);
    }
    throw new Error('aucun item numérique servi au palier 7');
  });

  /* Régression itération 003, point 5 : le palier 7 ne servait QUE des chiffres,
     alors que V6 promet « les nombres et les majuscules » et que le point
     s'écrit lui aussi avec Maj en FR-FR. */
  test('le palier sert aussi des capitales, et la capitale se tape bien avec Maj', async ({
    page,
  }) => {
    test.slow();
    for (let i = 0; i < 12; i++) {
      const mot = await motCourant(page);
      if (!mot) break;
      if (/^[A-Z]/.test(mot)) {
        expect(mot).toContain('.'); // capitale initiale ET point final
        const porteuse = toucheDe('fr-FR', mot[0])!;
        await expect(page.locator(`[data-code="${porteuse.code}"]`)).toHaveAttribute(
          'data-etat',
          'cible',
        );
        // sans Maj : quasi-réussite, le curseur ne bouge pas
        await frapperCouple(page, porteuse.code, porteuse.base!);
        expect(await page.locator('[data-mot]').getAttribute('data-curseur')).toBe('0');
        // avec Maj : la capitale s'écrit
        await frapperCouple(page, porteuse.code, mot[0], { maj: coteMajAttendu('fr-FR', mot[0]) });
        await expect(page.locator('[data-mot]')).toHaveAttribute('data-curseur', '1');
        return;
      }
      for (const c of mot) {
        await frapper(page, 'fr-FR', c);
        await page.waitForTimeout(20);
      }
      await page.waitForTimeout(820);
    }
    throw new Error('aucun item à capitale servi au palier 7');
  });
});
