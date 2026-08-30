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
    /* Toutes les origines d'où le navigateur a le droit d'appeler cette API.
       « Le front et l'API partagent l'origine » ne suffit PAS quand plusieurs
       domaines servent la même application : celui qui n'est pas déclaré ici
       reçoit un 403 « Invalid origin » sur toute connexion, y compris la
       création de compte. `FRONTEND_URL` en accepte donc plusieurs.
       En développement, Vite sert sur :3000 et proxifie vers :3001 — l'origine
       du navigateur diffère alors de baseURL, et Better Auth refusait tout. */
    trustedOrigins: [
      ...(env.FRONTEND_URL ?? []),
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
         * `enabled: true` autorise le rattachement EXPLICITE — celui qu'un
         * parent déjà connecté demande depuis l'espace parent (#32). À
         * `false`, celui-là aussi était refusé, et le parent qui avait
         * commencé par une méthode restait enfermé dedans.
         *
         * Ce drapeau ne rouvre PAS la liaison automatique. C'est
         * `requireLocalEmailVerified` qui la gouverne, et il reste à sa valeur
         * par défaut (`true`) : nos comptes mot de passe ont
         * `emailVerified = false`, donc une connexion Google ne les rejoint
         * jamais toute seule. Ne pas le poser à `false` — ce serait rouvrir
         * exactement ce que le paragraphe ci-dessous décrit.
         */
        enabled: true,
        /**
         * AUCUNE liaison automatique.
         *
         * La raison n'est pas le confort : la vérification d'adresse est
         * désactivée (aucun courriel ne part). Lier automatiquement
         * permettrait donc à un tiers de créer un compte mot de passe avec
         * une adresse Gmail qu'il ne possède pas, puis de RECEVOIR le
         * titulaire légitime dans son propre compte à sa première connexion
         * Google. L'état souhaitable est « liaison + vérification
         * d'adresse » ; il exige une infrastructure d'envoi qui n'existe pas.
         *
         * Ce qui arrive VRAIMENT, et que l'épopée décrivait mal en parlant de
         * « deux comptes distincts » : `user.email` est UNIQUE en base, donc
         * une adresse ne peut pas ouvrir un second compte. Elle est refusée.
         * Google ramène alors le parent sur le portail avec
         * `?error=account_not_linked`, et l'écran lui dit quoi faire — depuis
         * #32, il lui dit de rattacher Google depuis l'espace parent.
         */
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
