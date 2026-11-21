import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import type { Auth } from '../auth';
import type { Base } from '../db/client';
import { cleAnthropic } from '../db/schema';
import { dechiffrer } from '../lib/chiffrement';
import { creerGenerateur, demanderAvecAnthropic, type Generateur } from '../lib/grammaire';
import { exigeSession, type AvecCompte } from '../lib/session';
import { limiterDebit } from '../lib/debit';

const fabriqueReelle = (cle: string) => creerGenerateur(demanderAvecAnthropic(cle));

/**
 * Les phrases du mode grammaire, payées par la clé Anthropic DU COMPTE
 * (saisie dans l'espace parent, `routes/cle-anthropic.ts`). Sans clé, `/etat`
 * le dit et `/phrase` répond 503. Le débit est borné : chaque appel coûte un
 * appel payant au modèle.
 */
export function routesGrammaire(
  base: Base,
  auth: Auth,
  secret: string,
  fabrique: (cle: string) => Generateur = fabriqueReelle,
) {
  const app = new Hono<AvecCompte>();

  app.use('*', exigeSession(auth));
  app.use('*', limiterDebit(30, 60_000));

  const chiffreDuCompte = async (userId: string) =>
    (await base.select({ chiffre: cleAnthropic.chiffre }).from(cleAnthropic).where(eq(cleAnthropic.userId, userId)))[0]
      ?.chiffre;

  app.get('/etat', async (c) => c.json({ disponible: (await chiffreDuCompte(c.get('userId'))) !== undefined }));

  app.get('/phrase', async (c) => {
    const chiffre = await chiffreDuCompte(c.get('userId'));
    /* Un chiffré illisible (secret du serveur changé) vaut « pas de clé ». */
    const cle = chiffre === undefined ? null : dechiffrer(chiffre, secret);
    /* ponytail: un client Anthropic neuf par phrase ; un cache par compte si ça pèse un jour. */
    const phrase = cle ? await fabrique(cle)() : null;
    if (!phrase) {
      return c.json({ erreur: 'phrases indisponibles', code: 'GRAMMAIRE_INDISPONIBLE' }, 503);
    }
    /* Une phrase tirée au hasard : jamais rejouée depuis un cache. */
    c.header('Cache-Control', 'no-store');
    return c.json(phrase);
  });

  return app;
}
