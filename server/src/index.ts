import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { fileURLToPath } from 'node:url';
import { creerApp, IDENTIFIANT } from './app';
import { creerAuth } from './auth';
import { creerBase, sondeDe } from './db/client';
import { lireEnv } from './env';
import { creerSynthese } from './lib/voix';

const env = lireEnv();
/* Sans base (développement), l'app tourne quand même : le healthcheck le dit
   (`db: "absente"`) et les routes de comptes répondront 503 le moment venu. */
const base = env.DATABASE_URL ? creerBase(env.DATABASE_URL) : undefined;
/* `null` hors de l'image de production : Piper n'y est pas (#124). */
const piper = creerSynthese(env);
/* Un mot d'essai AU DÉMARRAGE : un binaire présent mais incapable de tourner
   (bibliothèque manquante, modèle corrompu) annoncerait une voix qui ne dit
   rien — et sur un appareil sans voix française, une dictée muette. */
const synthese = piper && (await piper('bonjour')) ? piper : null;
if (piper && !synthese) console.error('Piper est là mais ne synthétise rien : la dictée parlera avec la voix du navigateur.');
const racineClient = fileURLToPath(new URL('../../dist', import.meta.url));

/* `serveStatic` rend la main quand le fichier n'existe pas : le repli SPA de
   `creerApp` prend alors le relais. */
const app = creerApp({
  env,
  racineClient,
  statique: serveStatic({ root: './dist' }),
  synthese,
  ...(base ? { base, pingBase: sondeDe(base), auth: creerAuth(base, env) } : {}),
});

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  /* Le commit et l'heure de démarrage dans la première ligne des logs :
     c'est là qu'on les cherche quand on doute de ce qui tourne (#105). */
  console.log(
    /* …et si la voix du serveur est là : sans elle la dictée marche, mais
       avec la voix du navigateur — autant le lire ici que le deviner. */
    `DactyMalin ${IDENTIFIANT.version} ${IDENTIFIANT.commit ?? 'sans commit'} ` +
      `démarré ${IDENTIFIANT.demarre} — http://localhost:${info.port} (${env.NODE_ENV}, ` +
      `voix ${synthese ? 'Piper' : 'du navigateur'})`,
  );
});
