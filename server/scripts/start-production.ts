/**
 * Démarrage de production, dans cet ordre et pas un autre :
 *   1. on refuse de tourner hors production ;
 *   2. si une migration est en attente, on exige une sauvegarde fraîche ;
 *   3. on applique uniquement ces migrations ;
 *   4. on démarre le serveur.
 *
 * Si l'une des étapes échoue, le conteneur meurt et Coolify garde la révision
 * précédente en ligne. Une app figée vaut mieux qu'une base abîmée.
 */
import { readMigrationFiles } from 'drizzle-orm/migrator';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { creerBase } from '../src/db/client';
import { sauvegarderAvantMigration } from '../src/lib/coolify-backup';

async function principal(): Promise<void> {
  if (process.env.NODE_ENV !== 'production') {
    throw new Error('start-production ne démarre qu\'en production (NODE_ENV=production).');
  }
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL manquante.');

  const base = creerBase(process.env.DATABASE_URL);
  const dossier = 'server/drizzle';
  try {
    const migrations = readMigrationFiles({ migrationsFolder: dossier });
    let appliquee = 0;
    try {
      const lignes = await base.$client<{ created_at: string }[]>`
        select created_at from drizzle.__drizzle_migrations order by created_at desc limit 1
      `;
      appliquee = Number(lignes[0]?.created_at ?? 0);
    } catch (e) {
      // Une base neuve n'a pas encore la table de suivi Drizzle.
      if ((e as { code?: string }).code !== '42P01' && (e as { code?: string }).code !== '3F000') throw e;
    }
    if (migrations.some((m) => m.folderMillis > appliquee)) {
      const verdict = await sauvegarderAvantMigration({
        databaseUrl: process.env.DATABASE_URL,
        webhookUrl: process.env.COOLIFY_WEBHOOK_URL,
        apiToken: process.env.COOLIFY_API_TOKEN,
      });
      console.log(`sauvegarde : ${verdict.raison}`);
      await migrate(base, { migrationsFolder: dossier });
    } else {
      console.log('migrations : aucune en attente');
    }
  } finally {
    await base.$client.end();
  }

  await import('../src/index');
}

principal().catch((e: unknown) => {
  console.error('Démarrage refusé :', e instanceof Error ? e.message : e);
  process.exit(1);
});
