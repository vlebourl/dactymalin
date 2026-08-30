import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import type { Base } from './db/client';
import * as schema from './db/schema';
import type { Env } from './env';

/**
 * Le fournisseur Google est déclaré SI ET SEULEMENT SI ses deux variables sont
 * là. Une seule des deux ne suffit pas : un bouton qui mène à une erreur est
 * pire qu'un bouton absent, et c'est ce que produirait un secret oublié.
 */
export const googleDisponible = (env: Env): boolean =>
  Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

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
    /* En production, le front et l'API partagent l'origine : rien à ajouter.
       En développement, Vite sert sur :3000 et proxifie vers :3001 — l'origine
       du navigateur diffère alors de baseURL, et Better Auth refusait tout
       avec « Invalid origin ». */
    trustedOrigins: [
      ...(env.FRONTEND_URL ? [env.FRONTEND_URL] : []),
      ...(env.NODE_ENV === 'production' ? [] : ['http://localhost:3000', 'http://127.0.0.1:3000']),
    ],
    ...(googleDisponible(env)
      ? {
          socialProviders: {
            google: {
              clientId: env.GOOGLE_CLIENT_ID!,
              clientSecret: env.GOOGLE_CLIENT_SECRET!,
            },
          },
        }
      : {}),
    account: {
      accountLinking: {
        /**
         * AUCUNE liaison automatique. Un compte Google et un compte
         * mot de passe portant la même adresse restent deux comptes
         * distincts, avec deux bibliothèques.
         *
         * La raison n'est pas le confort : la vérification d'adresse est
         * désactivée (aucun courriel ne part). Lier automatiquement
         * permettrait donc à un tiers de créer un compte mot de passe avec
         * une adresse Gmail qu'il ne possède pas, puis de RECEVOIR le
         * titulaire légitime dans son propre compte à sa première connexion
         * Google. L'état souhaitable est « liaison + vérification
         * d'adresse » ; il exige une infrastructure d'envoi qui n'existe pas.
         */
        enabled: false,
      },
    },
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
