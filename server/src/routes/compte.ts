import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import type { Auth } from '../auth';
import type { Base } from '../db/client';
import { user } from '../db/schema';
import { exigeSession, type AvecCompte } from '../lib/session';

export function routesCompte(base: Base, auth: Auth) {
  const app = new Hono<AvecCompte>();

  app.use('*', exigeSession(auth));

  /**
   * « Partir sans laisser de trace » (#6). La route ne prend AUCUN identifiant :
   * elle supprime le compte de la session, et rien d'autre. C'est ce qui rend
   * structurellement impossible de supprimer celui du voisin — il n'y a pas de
   * paramètre à deviner.
   *
   * Une seule ligne part d'ici ; tout le reste suit par cascade, déclarée au
   * schéma : sessions, comptes de fournisseurs, profils, progressions, listes.
   * Les énumérer ici serait les énumérer DEUX fois, et la seconde liste
   * finirait par oublier la table ajoutée l'an prochain.
   */
  app.delete('/', async (c) => {
    await base.delete(user).where(eq(user.id, c.get('userId')));
    return c.json({ supprime: true });
  });

  return app;
}
