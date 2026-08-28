import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import type { Base } from './db/client';
import * as schema from './db/schema';
import type { Env } from './env';

/**
 * Le compte est au PARENT. Ni email ni mot de passe pour l'enfant : il choisit
 * son profil sur l'écran « Qui joue ? », et c'est tout.
 *
 * Pas de service d'envoi d'email ici, donc pas de vérification d'adresse ni de
 * réinitialisation par lien : ce serait promettre ce qu'on ne peut pas tenir.
 */
export function creerAuth(base: Base, env: Env) {
  return betterAuth({
    database: drizzleAdapter(base, { provider: 'pg', schema }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL ?? `http://localhost:${env.PORT}`,
    basePath: '/api/auth',
    trustedOrigins: env.FRONTEND_URL ? [env.FRONTEND_URL] : [],
    emailAndPassword: {
      enabled: true,
      /* Rien à vérifier par email tant qu'aucun email ne part. */
      requireEmailVerification: false,
      minPasswordLength: 10,
    },
    session: {
      /* Un parent installe l'app une fois et n'y revient qu'aux réglages :
         une session courte le ferait ressaisir son mot de passe sans cesse. */
      expiresIn: 60 * 60 * 24 * 60,
      updateAge: 60 * 60 * 24,
    },
    advanced: {
      cookiePrefix: 'tapeavecmoi',
      useSecureCookies: env.NODE_ENV === 'production',
    },
    rateLimit: {
      /* Uniquement en production : en test, une suite qui crée cinq comptes
         d'affilée se faisait refouler en 429. */
      enabled: env.NODE_ENV === 'production',
      window: 60,
      max: 20,
    },
  });
}

export type Auth = ReturnType<typeof creerAuth>;
