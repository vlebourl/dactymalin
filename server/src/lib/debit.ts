import type { MiddlewareHandler } from 'hono';
import type { AvecCompte } from './session';

/** Fenêtre glissante par compte, commune aux routes qui partagent ce middleware. */
export function limiterDebit(max: number, fenetreMs: number, maintenant = Date.now): MiddlewareHandler<AvecCompte> {
  const appels = new Map<string, number[]>();
  let nettoyages = 0;
  return async (c, suivant) => {
    const heure = maintenant();
    const id = c.get('userId');
    const recents = (appels.get(id) ?? []).filter((t) => t > heure - fenetreMs);
    if (recents.length >= max) {
      c.header('Retry-After', String(Math.max(1, Math.ceil((recents[0] + fenetreMs - heure) / 1000))));
      return c.json({ erreur: 'trop de requêtes', code: 'DEBIT_DEPASSE' }, 429);
    }
    recents.push(heure);
    appels.set(id, recents);
    if (++nettoyages % 100 === 0) {
      for (const [compte, dates] of appels) {
        if (dates[dates.length - 1] <= heure - fenetreMs) appels.delete(compte);
      }
    }
    await suivant();
  };
}
