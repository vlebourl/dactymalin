import { z } from 'zod';

/**
 * L'environnement est validé AU DÉMARRAGE, pas au premier appel : un conteneur
 * à qui il manque une variable doit refuser de démarrer, pas servir des pages
 * qui échoueront plus tard sur la route d'un enfant.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  /** Postgres. Absent en développement : le serveur tourne alors sans base. */
  DATABASE_URL: z.string().url().optional(),
  BETTER_AUTH_SECRET: z.string().min(32).optional(),
  BETTER_AUTH_URL: z.string().url().optional(),
  /**
   * Les origines de navigateur autorisées à parler à cette API. PLUSIEURS,
   * séparées par des virgules : deux domaines servent la même application, et
   * celui qui n'était pas déclaré ici recevait un 403 « Invalid origin » sur
   * TOUTE connexion — création de compte comprise. Une seule valeur reste
   * valide, c'est le cas ordinaire.
   */
  FRONTEND_URL: z
    .string()
    .transform((v) =>
      v
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.string().url()))
    .optional(),
  /**
   * Client OAuth Google. Les DEUX ou AUCUNE : un fournisseur déclaré à moitié
   * afficherait un bouton qui mène à une erreur. Absentes, l'application
   * démarre normalement et seul le chemin mot de passe existe (#7).
   */
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  /** Sauvegarde Coolify avant migration (étape 2). */
  COOLIFY_WEBHOOK_URL: z.string().url().optional(),
  COOLIFY_API_TOKEN: z.string().min(1).optional(),
});

export type Env = z.infer<typeof schema>;

export function lireEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const r = schema.safeParse(source);
  if (!r.success) {
    const details = r.error.issues.map((i) => `${i.path.join('.')} : ${i.message}`).join('\n  ');
    throw new Error(`Environnement invalide :\n  ${details}`);
  }
  const env = r.data;
  /* En production, l'app SERT des comptes : sans base ni secret de session,
     elle ne peut pas tenir sa promesse. On échoue fort et tôt. */
  if (env.NODE_ENV === 'production') {
    const manquantes = (['DATABASE_URL', 'BETTER_AUTH_SECRET'] as const).filter((c) => !env[c]);
    if (manquantes.length > 0) {
      throw new Error(`Variables obligatoires en production : ${manquantes.join(', ')}`);
    }
  }
  return env;
}
