import { expect, test } from '@playwright/test';
import { inscrit, ouvrir } from './helpers/app';

/**
 * #32 — le parent n'est plus enfermé dans la méthode par laquelle il a
 * commencé : il rattache la seconde depuis l'espace parent, une fois connecté.
 *
 * Le parcours Google lui-même ne s'automatise pas (voir #7 et le runbook) ;
 * ce qui se vérifie ici, c'est l'écran, ce qu'il annonce, et la route qu'il
 * emprunte.
 */
const parent = async (page: import('@playwright/test').Page) => {
  await page.getByLabel('Réglages').click();
  await page.getByRole('button', { name: 'Ouvrir' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-vue', 'V9');
};

test('l’espace parent dit par quoi le compte s’ouvre', async ({ page }) => {
  await inscrit(page);
  await ouvrir(page, 'fr-FR', 1);
  await parent(page);

  const methodes = page.getByRole('listitem').filter({ hasText: /Mot de passe|Google/ });
  await expect(methodes.filter({ hasText: 'Mot de passe' })).toContainText('en place');

  /* Le serveur d'e2e n'a pas de fournisseur Google : on ne propose pas un
     rattachement qui mènerait à une erreur, on dit pourquoi. */
  await expect(methodes.filter({ hasText: 'Google' })).toContainText('indisponible');
  await expect(page.getByRole('button', { name: 'Rattacher Google' })).toHaveCount(0);
});

test('quand Google existe, le bouton emprunte la route de RATTACHEMENT', async ({ page }) => {
  await inscrit(page);
  await page.route('**/api/config', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"google":true}' }),
  );
  await ouvrir(page, 'fr-FR', 1);
  await parent(page);

  const bouton = page.getByRole('button', { name: 'Rattacher Google' });
  await expect(bouton).toBeVisible();

  /* `link-social` et NON `sign-in/social` : la première rattache au compte
     ouvert, la seconde en ouvrirait un. Confondre les deux, c'est reperdre la
     propriété de sécurité de tout ce ticket. */
  const envoi = page.waitForRequest(
    (r) => r.url().endsWith('/api/auth/link-social') && r.method() === 'POST',
  );
  await bouton.click();
  expect(JSON.parse((await envoi).postData() ?? '{}')).toMatchObject({ provider: 'google' });
});

/* Le message d'échec de #7 a désormais une suite : il ne laisse plus le parent
   sans issue, il lui indique le rattachement. */
test('le refus de connexion Google indique le rattachement', async ({ page }) => {
  await page.goto('/?error=account_not_linked');
  await expect(page.getByRole('alert')).toContainText(/rattachez Google depuis l’espace parent/i);
});
