import { Hono } from 'hono';
import type { Auth } from '../auth';
import type { Generateur } from '../lib/grammaire';
import { exigeSession, type AvecCompte } from '../lib/session';
import { limiterDebit } from '../lib/debit';

/**
 * Les phrases du mode grammaire. Sans clé Anthropic, `generer` est `null` :
 * `/etat` le dit et `/phrase` répond 503. Le débit est borné : chaque appel
 * coûte un appel payant au modèle.
 */
export function routesGrammaire(auth: Auth, generer: Generateur | null) {
  const app = new Hono<AvecCompte>();

  app.use('*', exigeSession(auth));
  app.use('*', limiterDebit(30, 60_000));

  app.get('/etat', (c) => c.json({ disponible: generer !== null }));

  app.get('/phrase', async (c) => {
    const phrase = generer ? await generer() : null;
    if (!phrase) {
      return c.json({ erreur: 'phrases indisponibles', code: 'GRAMMAIRE_INDISPONIBLE' }, 503);
    }
    /* Une phrase tirée au hasard : jamais rejouée depuis un cache. */
    c.header('Cache-Control', 'no-store');
    return c.json(phrase);
  });

  return app;
}
