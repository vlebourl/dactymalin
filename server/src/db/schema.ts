import { boolean, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/* Tables Better Auth (utilisateur, session, compte, vérification). Elles sont
   décrites ici pour que les migrations soient versionnées comme le reste :
   Better Auth les lit via l'adaptateur Drizzle. */
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  /* Better Auth attend un BOOLÉEN ici, pas une date : déclaré en timestamp,
     l'insertion mourait sur « value.toISOString is not a function ». */
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  /* `issuer` est attendu par Better Auth 1.7 : absent, l'inscription échouait
     en 500 avec « The field "issuer" does not exist ». */
  issuer: text('issuer'),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  idToken: text('id_token'),
  password: text('password'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Un profil d'enfant. Le compte appartient au PARENT ; l'enfant n'a ni email
 * ni mot de passe. On ne stocke qu'un prénom — pas d'âge, pas d'école, pas de
 * date de naissance.
 */
export const profil = pgTable('profil', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  prenom: text('prenom').notNull(),
  creeLe: timestamp('cree_le', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * La progression d'un profil, telle qu'elle vit dans `localStorage`. On la
 * garde en `jsonb` plutôt que dépliée en colonnes : la forme est déjà validée
 * champ par champ côté client (`sauvegardeValide`), et le parcours évoluera
 * sans migration.
 */
export const progression = pgTable('progression', {
  profilId: text('profil_id')
    .primaryKey()
    .references(() => profil.id, { onDelete: 'cascade' }),
  etat: jsonb('etat').notNull(),
  majLe: timestamp('maj_le', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Une liste de mots de la bibliothèque du foyer. Elle pend au COMPTE et non au
 * profil : les deux enfants voient les mêmes listes, et le parent ne saisit la
 * dictée qu'une fois (#9).
 *
 * Les mots sont en `jsonb` plutôt qu'une ligne par mot, comme `progression.etat`
 * : on ne requête jamais un mot isolé, on charge toujours la liste entière.
 */
export const liste = pgTable('liste', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  nom: text('nom').notNull(),
  mots: jsonb('mots').notNull().$type<string[]>(),
  creeLe: timestamp('cree_le', { withTimezone: true }).notNull().defaultNow(),
});
