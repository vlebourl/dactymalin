import { eq } from 'drizzle-orm';
import { Hono, type Context } from 'hono';
import type { Auth } from '../auth';
import type { Base } from '../db/client';
import { liste } from '../db/schema';
import { exigeSession, type AvecCompte } from '../lib/session';
import { LENTEUR_CONSIGNE, type Synthese } from '../lib/voix';
import { estUneConsigne } from '../../../src/core/consignes';
import { nomDeLettre } from '../../../src/core/nomDeLettre';

/** Un son, ou 503 : sans Piper ou synthèse en échec, le client a son repli. */
function rendreLeSon(c: Context, son: Buffer | null) {
  if (!son) return c.json({ erreur: 'voix indisponible', code: 'VOIX_INDISPONIBLE' }, 503);
  return c.body(new Uint8Array(son), 200, {
    'Content-Type': 'audio/wav',
    /* `private` : la réponse vit derrière une session. Un mois : un son ne
       change que si la voix change, et un déploiement n'arrive pas à chaque
       dictée. */
    'Cache-Control': 'private, max-age=2592000',
  });
}

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
    return rendreLeSon(c, synthese ? await synthese(mot) : null);
  });

  /**
   * Le nom d'UN caractère, dit au barreau 3 (#126). Ensemble fermé : seuls les
   * caractères que `nomDeLettre` sait nommer — une soixantaine de sons, les
   * mêmes pour tous les comptes.
   */
  app.get('/lettre', async (c) => {
    const nom = nomDeLettre(c.req.query('c') ?? '');
    if (nom === null) return c.json({ erreur: 'caractère inconnu', code: 'LETTRE_INCONNUE' }, 404);
    return rendreLeSon(c, synthese ? await synthese(nom) : null);
  });

  /** Une consigne lue à voix haute — et seulement une consigne de l'app (#126). */
  app.get('/consigne', async (c) => {
    const texte = c.req.query('t') ?? '';
    if (!estUneConsigne(texte)) {
      return c.json({ erreur: 'consigne inconnue', code: 'CONSIGNE_INCONNUE' }, 404);
    }
    return rendreLeSon(c, synthese ? await synthese(texte, LENTEUR_CONSIGNE) : null);
  });

  return app;
}
