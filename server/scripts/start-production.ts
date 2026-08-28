/**
 * Démarrage de production, dans cet ordre et pas un autre :
 *   1. on refuse de tourner hors production ;
 *   2. on exige une SAUVEGARDE réussie de la base ;
 *   3. on applique les migrations (jamais un `push --force`) ;
 *   4. on démarre le serveur.
 *
 * Si l'une des étapes échoue, le conteneur meurt et Coolify garde la révision
 * précédente en ligne. Une app figée vaut mieux qu'une base abîmée.
 */
import { spawnSync } from 'node:child_process';
import { sauvegarderAvantMigration } from '../src/lib/coolify-backup';

async function principal(): Promise<void> {
  if (process.env.NODE_ENV !== 'production') {
    throw new Error('start-production ne démarre qu\'en production (NODE_ENV=production).');
  }
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL manquante.');

  const verdict = await sauvegarderAvantMigration({
    databaseUrl: process.env.DATABASE_URL,
    webhookUrl: process.env.COOLIFY_WEBHOOK_URL,
    apiToken: process.env.COOLIFY_API_TOKEN,
  });
  console.log(`sauvegarde : ${verdict.raison}`);

  const migration = spawnSync('npx', ['drizzle-kit', 'migrate', '--config', 'drizzle.config.ts'], {
    stdio: 'inherit',
    env: process.env,
  });
  if (migration.status !== 0) throw new Error('Les migrations ont échoué : on ne démarre pas.');

  await import('../src/index');
}

principal().catch((e: unknown) => {
  console.error('Démarrage refusé :', e instanceof Error ? e.message : e);
  process.exit(1);
});
