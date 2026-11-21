import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import type { Auth } from '../auth';
import type { Base } from '../db/client';
import { cleAnthropic } from '../db/schema';
import { chiffrer } from '../lib/chiffrement';
import type { VerifierCle } from '../lib/grammaire';
import { exigeSession, type AvecCompte } from '../lib/session';
import { limiterDebit } from '../lib/debit';

const corpsValide = z.object({
  cle: z.string().trim().min(20).max(300).startsWith('sk-ant-'),
});

/**
 * La clé Anthropic du compte, pour le mode grammaire. Elle entre par `PUT`,
 * est VÉRIFIÉE auprès d'Anthropic, puis stockée chiffrée. Elle ne ressort
 * jamais : le navigateur n'en revoit que les 4 derniers caractères.
 * Comme `/api/compte`, aucune route ne prend d'identifiant : on ne touche
 * qu'à la clé du compte de la session.
 */
export function routesCleAnthropic(base: Base, auth: Auth, secret: string, verifierCle: VerifierCle) {
  const app = new Hono<AvecCompte>();

  app.use('*', exigeSession(auth));
  /* Chaque PUT coûte un appel payant (sur la clé du parent) : borné. */
  const debit = limiterDebit(10, 60_000);
  app.use('*', async (c, suivant) => (c.req.method === 'PUT' ? debit(c, suivant) : suivant()));

  app.get('/', async (c) => {
    const [l] = await base
      .select({ fin: cleAnthropic.fin })
      .from(cleAnthropic)
      .where(eq(cleAnthropic.userId, c.get('userId')));
    return c.json(l ? { enregistree: true, fin: l.fin } : { enregistree: false });
  });

  app.put('/', async (c) => {
    const lu = corpsValide.safeParse(await c.req.json().catch(() => null));
    if (!lu.success) return c.json({ erreur: 'clé invalide', code: 'CLE_INVALIDE' }, 400);
    const { cle } = lu.data;

    const verdict = await verifierCle(cle);
    if (verdict === 'refusee') return c.json({ erreur: 'clé refusée', code: 'CLE_REFUSEE' }, 400);
    if (verdict !== 'valide') {
      return c.json({ erreur: 'vérification impossible', code: 'VERIFICATION_IMPOSSIBLE' }, 502);
    }

    const ligne = { chiffre: chiffrer(cle, secret), fin: cle.slice(-4), majLe: new Date() };
    await base
      .insert(cleAnthropic)
      .values({ userId: c.get('userId'), ...ligne })
      .onConflictDoUpdate({ target: cleAnthropic.userId, set: ligne });
    return c.json({ enregistree: true, fin: ligne.fin });
  });

  app.delete('/', async (c) => {
    await base.delete(cleAnthropic).where(eq(cleAnthropic.userId, c.get('userId')));
    return c.json({ enregistree: false });
  });

  return app;
}
