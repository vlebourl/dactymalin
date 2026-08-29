import type { MiddlewareHandler } from 'hono';
import type { Auth } from '../auth';

/** Ce que toute route derrière une session sait de son appelant. */
export type AvecCompte = { Variables: { userId: string } };

/**
 * Exige une session valide et pose le compte sur la requête. Une seule
 * définition pour toutes les routes : c'est la porte du serveur, et deux
 * copies finissent toujours par diverger.
 *
 * Elle ne dit RIEN de la propriété des lignes. Chaque requête doit filtrer
 * elle-même sur `userId` — un identifiant deviné ne donne alors accès à rien.
 */
export const exigeSession = (auth: Auth): MiddlewareHandler<AvecCompte> =>
  async function (c, suivant) {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) return c.json({ erreur: 'connexion requise' }, 401);
    c.set('userId', session.user.id);
    await suivant();
  };
