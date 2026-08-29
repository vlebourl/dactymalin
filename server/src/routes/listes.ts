import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import type { Auth } from '../auth';
import type { Base } from '../db/client';
import { liste } from '../db/schema';
import { exigeSession, type AvecCompte } from '../lib/session';
/* Le serveur juge avec le MÊME validateur que l'écran : sinon l'écran promet
   une liste que le serveur refuse, ou l'inverse. */
import { LISTES_MAX, listeValidee } from '../../../src/core/listes';

export function routesListes(base: Base, auth: Auth) {
  const app = new Hono<AvecCompte>();

  /* Une bibliothèque appartient au COMPTE : chaque requête filtre sur le
     propriétaire, pas seulement la lecture, et la dictée d'une famille ne fuit
     pas chez la voisine. */
  app.use('*', exigeSession(auth));

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
    /* ponytail: comptage puis insertion, sans contrainte ni transaction — deux
       créations SIMULTANÉES peuvent donc passer le plafond toutes les deux.
       Le compte sert une famille, et le parent prépare ses listes une par une ;
       si un jour ça compte, la borne se pose en base. */
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
