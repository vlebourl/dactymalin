import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import type { Auth } from '../auth';
import type { Base } from '../db/client';
import { liste } from '../db/schema';
import { exigeSession, type AvecCompte } from '../lib/session';
import type { Synthese } from '../lib/voix';

/**
 * La voix de la dictée (#124). Sans Piper, `synthese` est `null` : `/etat` le
 * dit, `/mot` répond 503, et le client retombe sur la voix du navigateur.
 */
export function routesVoix(base: Base, auth: Auth, synthese: Synthese | null) {
  const app = new Hono<AvecCompte>();

  app.use('*', exigeSession(auth));

  app.get('/etat', (c) => c.json({ disponible: synthese !== null }));

  /**
   * Le son d'UN mot — et seulement d'un mot d'une liste de CE compte. Une
   * synthèse ouverte à n'importe quel texte serait un service vocal gratuit
   * pour qui possède un compte, payé par le CPU de la maison.
   */
  app.get('/mot', async (c) => {
    const mot = c.req.query('mot') ?? '';
    const lignes = await base
      .select({ mots: liste.mots })
      .from(liste)
      .where(eq(liste.userId, c.get('userId')));
    if (!mot || !lignes.some((l) => l.mots.includes(mot))) {
      return c.json({ erreur: 'mot inconnu', code: 'MOT_INCONNU' }, 404);
    }
    const son = synthese ? await synthese(mot) : null;
    if (!son) return c.json({ erreur: 'voix indisponible', code: 'VOIX_INDISPONIBLE' }, 503);
    return c.body(new Uint8Array(son), 200, {
      'Content-Type': 'audio/wav',
      /* `private` : la réponse dépend de la session. Un mois : le son d'un mot
         ne change que si la voix change, et un déploiement n'arrive pas à
         chaque dictée. */
      'Cache-Control': 'private, max-age=2592000',
    });
  });

  return app;
}
