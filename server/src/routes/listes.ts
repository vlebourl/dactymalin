import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import type { Auth } from '../auth';
import type { Base } from '../db/client';
import { liste } from '../db/schema';
import { exigeSession, type AvecCompte } from '../lib/session';
import type { Synthese } from '../lib/voix';
/* Le serveur juge avec le MÊME validateur que l'écran : sinon l'écran promet
   une liste que le serveur refuse, ou l'inverse. */
import { LISTES_MAX, listeValidee } from '../../../src/core/listes';

export function routesListes(base: Base, auth: Auth, synthese: Synthese | null = null) {
  const app = new Hono<AvecCompte>();

  /* La liste vient d'être enregistrée : ses mots sont synthétisés TOUT DE
     SUITE, en arrière-plan, pour que l'enfant n'attende jamais le moteur (#124).
     Jamais attendu, jamais fatal — la route `/api/voix/mot` synthétise de toute
     façon à la demande ce qui manquerait. */
  const prechauffer = (mots: string[]) => {
    if (synthese) for (const mot of mots) void synthese(mot).catch(() => null);
  };

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
    prechauffer(creee.mots);
    return c.json({ ...creee, creeLe: creee.creeLe.toISOString() }, 201);
  });

  /**
   * Modifie une liste : ses mots, son nom, ou les deux. La dictée change chaque
   * semaine — on réécrit la liste, on n'en crée pas une nouvelle, sinon la
   * grille de l'enfant se remplit de semaines mortes.
   *
   * Le filtre sur le propriétaire est DANS la requête d'écriture, pas dans une
   * lecture préalable : c'est ce qui rend un identifiant deviné inoffensif,
   * même entre les deux moments.
   */
  app.put('/:id', async (c) => {
    const corps = (await c.req.json().catch(() => null)) as { nom?: unknown; mots?: unknown } | null;
    const valide = listeValidee(corps?.nom, corps?.mots);
    if (!valide) return c.json({ erreur: 'liste invalide', code: 'LISTE_INVALIDE' }, 400);

    const modifiees = await base
      .update(liste)
      .set({ nom: valide.nom, mots: valide.mots })
      .where(and(eq(liste.id, c.req.param('id')), eq(liste.userId, c.get('userId'))))
      .returning({ id: liste.id, nom: liste.nom, mots: liste.mots, creeLe: liste.creeLe });
    if (modifiees.length === 0) {
      return c.json({ erreur: 'liste introuvable', code: 'LISTE_INTROUVABLE' }, 404);
    }
    prechauffer(modifiees[0].mots);
    return c.json({ ...modifiees[0], creeLe: modifiees[0].creeLe.toISOString() });
  });

  app.delete('/:id', async (c) => {
    const supprimees = await base
      .delete(liste)
      .where(and(eq(liste.id, c.req.param('id')), eq(liste.userId, c.get('userId'))))
      .returning({ id: liste.id });
    if (supprimees.length === 0) {
      return c.json({ erreur: 'liste introuvable', code: 'LISTE_INTROUVABLE' }, 404);
    }
    return c.json({ supprime: true });
  });

  return app;
}
