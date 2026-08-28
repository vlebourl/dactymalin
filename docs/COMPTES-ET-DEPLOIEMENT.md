# Comptes persistants et déploiement Coolify

Décidé le 2026-08-28. Ce document est le plan de la seule évolution qui casse
une promesse du cahier des charges (« zéro backend ») : il dit pourquoi, ce qui
change, et ce qui ne change surtout pas.

## Ce qui ne change pas

- L'enfant peut jouer **hors ligne**, sans compte, exactement comme aujourd'hui.
  `localStorage` reste la source de vérité de la partie en cours.
- Aucune requête vers un **tiers**. Le test `tests/e2e/reseau.spec.ts` passe de
  « aucune requête externe » à « aucun hôte autre que le nôtre » : ni Google
  Fonts, ni CDN, ni analytics, jamais.
- Pas de publicité, pas de tracking, pas de données d'enfant vendues ou
  partagées.

## Ce qui change

Un parent peut créer un compte pour **retrouver la progression de ses enfants
depuis un autre ordinateur**. Le compte est au parent ; les profils enfants
n'ont ni email ni mot de passe.

```
compte parent (Better Auth)
  └── profil enfant « Timo »   → progression (palier, maîtrise, mots à nous)
  └── profil enfant « Iris »   → progression
```

## Architecture

| Couche | Choix | Pourquoi |
|---|---|---|
| Client | Vite + React, inchangé | rien à réécrire |
| Serveur | Hono sur Node (`@hono/node-server`) | le repo est en npm/Node, on ne bascule pas sur Bun juste pour copier ecoride |
| ORM | Drizzle | même outillage qu'ecoride, migrations versionnées |
| Base | PostgreSQL, ressource Coolify séparée | idem ecoride, sauvegardes planifiées incluses |
| Auth | Better Auth, email + mot de passe | socle éprouvé sur ecoride ; Google OAuth possible plus tard |
| Hébergement | Coolify sur `192.168.1.48`, domaine `typing.tiarkaerell.com` | même instance, même proxy TLS |

Un seul conteneur sert l'API **et** le `dist/` du client, comme ecoride.

### Synchronisation : local d'abord

1. L'app joue toujours sur `localStorage`.
2. Après chaque bloc terminé, si un compte est connecté, la progression du
   profil actif part au serveur (`PUT /api/profils/:id/progression`).
3. À la connexion sur une nouvelle machine, on tire les progressions et on
   réconcilie **« le plus avancé gagne »** : palier le plus haut, union des
   maîtrises, union des mots personnalisés.
4. Hors ligne, la file d'envoi attend. Aucune leçon n'est jamais interrompue
   par le réseau — c'est la règle non négociable de cette app.

### Schéma

- tables Better Auth (`user`, `session`, `account`, `verification`)
- `profil` : `id`, `userId`, `prenom`, `cree_le`
- `progression` : `profilId` (PK), `etat` (jsonb — le même objet que
  `localStorage`, validé par `storage.ts`), `maj_le`

Le `jsonb` évite de dupliquer en SQL un schéma déjà validé côté client, et
absorbe les évolutions du parcours sans migration.

### API

| Route | Rôle |
|---|---|
| `GET /api/health` | healthcheck Coolify : `{ ok, version, db }` |
| `POST /api/auth/*` | Better Auth |
| `GET /api/profils` | les profils du compte connecté, progression comprise |
| `POST /api/profils` | créer un profil enfant |
| `PUT /api/profils/:id/progression` | pousser un état (rejette si `maj_le` est plus ancien) |

## Déploiement

Copie du modèle ecoride, vérifié le 2026-08-28 :

- **Build pack** : Dockerfile multi-stage (build Vite + serveur), port 3000,
  healthcheck `GET /api/health`.
- **Domaine** : `typing.tiarkaerell.com`, TLS par le proxy Coolify.
- **Déclencheur** : GitHub Actions sur `main` → runner self-hosted
  `homelab-runner` → `GET http://localhost:8000/api/v1/deploy?uuid=<app>` avec
  `Bearer $COOLIFY_TOKEN`, puis polling du déploiement.
- **Migrations** : `drizzle-kit migrate` au démarrage du conteneur, précédé du
  **backup Coolify obligatoire** (même garde-fou qu'ecoride : pas de backup
  réussi ⇒ pas de migration ⇒ la révision ne démarre pas).
- **Variables d'environnement** (valeurs saisies dans l'UI Coolify, jamais dans
  le dépôt) : `PORT`, `NODE_ENV`, `DATABASE_URL`, `BETTER_AUTH_SECRET`,
  `BETTER_AUTH_URL`, `FRONTEND_URL`, `COOLIFY_WEBHOOK_URL`, `COOLIFY_API_TOKEN`.

## Ordre de chantier

1. `server/` : Hono + `/api/health` + Dockerfile + docker-compose de dev.
2. Drizzle + Postgres + migrations + le garde-fou de backup.
3. Better Auth (email/mot de passe), écrans parent : créer un compte,
   se connecter, se déconnecter.
4. Profils serveur reliés à l'écran « Qui joue ? » existant.
5. Sync local-d'abord + réconciliation « le plus avancé gagne ».
6. Coolify : application, base, domaine, workflow GitHub Actions.
7. `reseau.spec.ts` réécrit : notre origine seule est autorisée.

Chaque étape garde l'app jouable sans compte. Si le serveur est éteint,
« Tape avec moi » redevient exactement l'app d'aujourd'hui.
