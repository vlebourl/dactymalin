import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { fileURLToPath } from 'node:url';
import { creerApp, VERSION } from './app';
import { lireEnv } from './env';

const env = lireEnv();
const racineClient = fileURLToPath(new URL('../../dist', import.meta.url));

/* `serveStatic` rend la main quand le fichier n'existe pas : le repli SPA de
   `creerApp` prend alors le relais. */
const app = creerApp({ env, racineClient, statique: serveStatic({ root: './dist' }) });

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`Tape avec moi ${VERSION} — http://localhost:${info.port} (${env.NODE_ENV})`);
});
