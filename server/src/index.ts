import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { fileURLToPath } from 'node:url';
import { creerApp, VERSION } from './app';
import { creerAuth } from './auth';
import { creerBase, sondeDe } from './db/client';
import { lireEnv } from './env';

const env = lireEnv();
/* Sans base (développement), l'app tourne quand même : le healthcheck le dit
   (`db: "absente"`) et les routes de comptes répondront 503 le moment venu. */
const base = env.DATABASE_URL ? creerBase(env.DATABASE_URL) : undefined;
const racineClient = fileURLToPath(new URL('../../dist', import.meta.url));

/* `serveStatic` rend la main quand le fichier n'existe pas : le repli SPA de
   `creerApp` prend alors le relais. */
const app = creerApp({
  env,
  racineClient,
  statique: serveStatic({ root: './dist' }),
  ...(base ? { base, pingBase: sondeDe(base), auth: creerAuth(base, env) } : {}),
});

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`Tape avec moi ${VERSION} — http://localhost:${info.port} (${env.NODE_ENV})`);
});
