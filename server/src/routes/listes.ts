import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import type { Auth } from '../auth';
import type { Base } from '../db/client';
import { liste } from '../db/schema';
/* Le serveur juge avec le MÊME validateur que l'écran : sinon l'écran promet
   une liste que le serveur refuse, ou l'inverse. */
import { LISTES_MAX, listeValidee } from '../../../src/core/listes';

export function routesListes(base: Base, auth: Auth) {
  const app = new Hono<{ Variables: { userId: string } }>();

  /* Une bibliothèque appartient au COMPTE. Comme pour les profils, chaque
     requête filtre sur le propriétaire : un identifiant deviné ne donne rien,
     et la dictée d'une famille ne fuit pas chez la voisine. */
  app.use('*', async (c, suivant) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) return c.json({ erreur: 'connexion requise' }, 401);
    c.set('userId', session.user.id);
    await suivant();
  });

  app.get('/', async (c) => {
    const lignes = await base
      .select({ id: liste.id, nom: liste.nom, mots: liste.mots, creeLe: liste.creeLe })
      .from(liste)
      .where(eq(liste.userId, c.get('userId')));
    return c.json({
      listes: lignes.map((l) => ({ ...l, creeLe: l.creeLe.toISOString() })),
    });
  });

  app.post('/', async (c) => {
    const corps = (await c.req.json().catch(() => null)) as { nom?: unknown; mots?: unknown } | null;
    const valide = listeValidee(corps?.nom, corps?.mots);
    if (!valide) return c.json({ erreur: 'liste invalide', code: 'LISTE_INVALIDE' }, 400);

    const userId = c.get('userId');
    const dejaLa = await base.select({ id: liste.id }).from(liste).where(eq(liste.userId, userId));
    if (dejaLa.length >= LISTES_MAX) {
      return c.json({ erreur: 'trop de listes', code: 'TROP_DE_LISTES' }, 409);
    }

    const [creee] = await base
      .insert(liste)
      .values({ id: randomUUID(), userId, nom: valide.nom, mots: valide.mots })
      .returning({ id: liste.id, nom: liste.nom, mots: liste.mots, creeLe: liste.creeLe });
    return c.json({ ...creee, creeLe: creee.creeLe.toISOString() }, 201);
  });

  return app;
}
