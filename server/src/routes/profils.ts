import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import type { Auth } from '../auth';
import type { Base } from '../db/client';
import { profil, progression } from '../db/schema';
/* Le serveur valide avec le MÊME code que le client : une seule définition de
   la forme d'une progression, pas deux qui divergeraient. */
import { estIntact } from '../../../src/core/storage';
import { memePrenom, PRENOM_MAX, PROFILS_MAX } from '../../../src/core/profils';

const corpsProfil = z.object({ prenom: z.string().trim().min(1).max(PRENOM_MAX) });
const corpsProgression = z.object({ etat: z.unknown(), majLe: z.string().datetime() });

export function routesProfils(base: Base, auth: Auth) {
  const app = new Hono<{ Variables: { userId: string } }>();

  /* Toute route ci-dessous exige une session valide. Un id de profil deviné ne
     donne accès à rien : chaque requête filtre AUSSI sur le compte. */
  app.use('*', async (c, suivant) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) return c.json({ erreur: 'connexion requise' }, 401);
    c.set('userId', session.user.id);
    await suivant();
  });

  app.get('/', async (c) => {
    const lignes = await base
      .select({
        id: profil.id,
        prenom: profil.prenom,
        etat: progression.etat,
        majLe: progression.majLe,
      })
      .from(profil)
      .leftJoin(progression, eq(progression.profilId, profil.id))
      .where(eq(profil.userId, c.get('userId')));
    return c.json({
      profils: lignes.map((l) => ({
        id: l.id,
        prenom: l.prenom,
        etat: l.etat ?? null,
        majLe: l.majLe?.toISOString() ?? null,
      })),
    });
  });

  app.post('/', async (c) => {
    const corps = corpsProfil.safeParse(await c.req.json().catch(() => null));
    if (!corps.success) {
      return c.json({ erreur: 'prénom invalide', code: 'PRENOM_INVALIDE' }, 400);
    }
    const userId = c.get('userId');
    const deja = await base
      .select({ id: profil.id, prenom: profil.prenom })
      .from(profil)
      .where(eq(profil.userId, userId));
    if (deja.length >= PROFILS_MAX) {
      return c.json({ erreur: 'trop de profils', code: 'TROP_DE_PROFILS' }, 409);
    }
    /* Un prénom déjà pris DANS CE FOYER est refusé : deux boutons identiques
       sur « Qui joue ? » ne se distinguent pas, et l'enfant ouvrirait la
       progression de l'autre une fois sur deux. C'est une règle d'ergonomie —
       l'identité d'un profil reste son id, et rien n'est jamais fusionné par
       prénom (#4). La vérification est applicative et non un index unique :
       des homonymes créés AVANT cette règle existent peut-être, et l'index
       refuserait alors d'être créé. */
    if (deja.some((p) => memePrenom(p.prenom, corps.data.prenom))) {
      return c.json({ erreur: 'prénom déjà pris', code: 'PRENOM_DEJA_PRIS' }, 409);
    }
    const id = randomUUID();
    await base.insert(profil).values({ id, userId, prenom: corps.data.prenom });
    return c.json({ id, prenom: corps.data.prenom }, 201);
  });

  /**
   * Renomme un profil. Son identité est son ID, jamais son prénom : c'est ce
   * qui permet de corriger « Timo » en « Timothée » sans rien perdre, et de
   * garder deux homonymes séparés.
   */
  app.patch('/:id', async (c) => {
    const corps = corpsProfil.safeParse(await c.req.json().catch(() => null));
    if (!corps.success) {
      return c.json({ erreur: 'prénom invalide', code: 'PRENOM_INVALIDE' }, 400);
    }
    const id = c.req.param('id');
    const fratrie = await base
      .select({ id: profil.id, prenom: profil.prenom })
      .from(profil)
      .where(eq(profil.userId, c.get('userId')));
    /* Se renommer en soi-même n'est pas un doublon : corriger une casse ou une
       espace ne doit pas être refusé au nom du prénom qu'on porte déjà. */
    if (fratrie.some((p) => p.id !== id && memePrenom(p.prenom, corps.data.prenom))) {
      return c.json({ erreur: 'prénom déjà pris', code: 'PRENOM_DEJA_PRIS' }, 409);
    }
    const renommes = await base
      .update(profil)
      .set({ prenom: corps.data.prenom })
      .where(and(eq(profil.id, id), eq(profil.userId, c.get('userId'))))
      .returning({ id: profil.id, prenom: profil.prenom });
    if (renommes.length === 0) {
      return c.json({ erreur: 'profil introuvable', code: 'PROFIL_INTROUVABLE' }, 404);
    }
    return c.json(renommes[0]);
  });

  app.delete('/:id', async (c) => {
    const userId = c.get('userId');
    const supprimes = await base
      .delete(profil)
      .where(and(eq(profil.id, c.req.param('id')), eq(profil.userId, userId)))
      .returning({ id: profil.id });
    if (supprimes.length === 0) {
      return c.json({ erreur: 'profil introuvable', code: 'PROFIL_INTROUVABLE' }, 404);
    }
    return c.json({ supprime: true });
  });

  /**
   * Pousse une progression. Le serveur REFUSE un état plus ancien que le sien
   * (409) : c'est au client de refaire la fusion et de rejouer, jamais au
   * serveur d'écraser en silence le travail d'un autre appareil.
   */
  app.put('/:id/progression', async (c) => {
    const corps = corpsProgression.safeParse(await c.req.json().catch(() => null));
    if (!corps.success) return c.json({ erreur: 'corps invalide' }, 400);
    if (!estIntact(corps.data.etat)) return c.json({ erreur: 'état invalide' }, 400);

    const userId = c.get('userId');
    const id = c.req.param('id');
    const [leProfil] = await base
      .select({ id: profil.id })
      .from(profil)
      .where(and(eq(profil.id, id), eq(profil.userId, userId)));
    if (!leProfil) return c.json({ erreur: 'profil introuvable' }, 404);

    const majLe = new Date(corps.data.majLe);
    const [existante] = await base
      .select({ majLe: progression.majLe })
      .from(progression)
      .where(eq(progression.profilId, id));
    if (existante && existante.majLe > majLe) {
      return c.json({ erreur: 'version plus récente en base', majLe: existante.majLe }, 409);
    }

    await base
      .insert(progression)
      .values({ profilId: id, etat: corps.data.etat, majLe })
      .onConflictDoUpdate({
        target: progression.profilId,
        set: { etat: corps.data.etat, majLe },
      });
    return c.json({ majLe: majLe.toISOString() });
  });

  return app;
}
