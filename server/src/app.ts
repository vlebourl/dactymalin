import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Hono, type MiddlewareHandler } from 'hono';
import type { Env } from './env';

export type Deps = {
  env: Env;
  /** Racine du `dist/` du client. Absente = API seule (tests). */
  racineClient?: string;
  /** Sonde de base de données ; absente à l'étape 1. */
  pingBase?: () => Promise<boolean>;
  /**
   * Middleware de fichiers statiques. Il est monté APRÈS `/api` et AVANT le
   * repli SPA : Hono sert les routes dans l'ordre d'enregistrement, et le
   * repli, posé en premier, avalait les images et les polices en leur
   * répondant l'index.html.
   */
  statique?: MiddlewareHandler;
};

/** Version du paquet, lue une fois : elle sert de repère de déploiement. */
function versionApp(): string {
  try {
    const brut = readFileSync(new URL('../../package.json', import.meta.url), 'utf8');
    return (JSON.parse(brut) as { version?: string }).version ?? 'inconnue';
  } catch {
    return 'inconnue';
  }
}

export const VERSION = versionApp();

export function creerApp(deps: Deps) {
  const app = new Hono();

  /**
   * Healthcheck Coolify. Il répond 200 même sans base : un conteneur qui tourne
   * avec une base momentanément absente reste préférable à une boucle de
   * redémarrage — `db` dit la vérité, et c'est elle qu'on surveille.
   */
  app.get('/api/health', async (c) => {
    const db = deps.pingBase ? ((await deps.pingBase().catch(() => false)) ? 'ok' : 'ko') : 'absente';
    return c.json({ ok: true, status: db === 'ko' ? 'degraded' : 'healthy', version: VERSION, db });
  });

  // Toute autre route /api est une erreur d'appel, jamais l'index.html du client.
  app.all('/api/*', (c) => c.json({ erreur: 'route inconnue' }, 404));

  if (deps.statique) app.use('/*', deps.statique);

  /* Le client est une SPA : chaque chemin inconnu rend l'index.html, qui
     amorce React. Les fichiers réels sont servis par le middleware statique
     monté dans index.ts (il a besoin du système de fichiers). */
  if (deps.racineClient) {
    const racine = deps.racineClient;
    app.get('*', (c) => {
      try {
        return c.html(readFileSync(join(racine, 'index.html'), 'utf8'));
      } catch {
        return c.text("Le client n'est pas construit (npm run build).", 503);
      }
    });
  }

  return app;
}
