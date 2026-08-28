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

---

# Plan détaillé

Sept étapes. Chacune se termine sur un dépôt qui compile, dont les tests
passent, et où **l'app reste jouable hors ligne sans compte**. On peut
s'arrêter après n'importe laquelle.

## Étape 0 — Prérequis hors dépôt (à faire par Vincent)

Le dépôt n'a **aucun remote git** aujourd'hui (`git remote -v` est vide). Sans
lui, pas de déploiement Coolify.

| # | Action | Où |
|---|---|---|
| 0.1 | Créer le dépôt privé `vlebourl/typing_app` et `git push -u origin main` | GitHub |
| 0.2 | Pointer `typing.tiarkaerell.com` (A/CNAME) vers l'hôte Coolify | DNS tiarkaerell.com |
| 0.3 | Créer l'application Coolify (source = le dépôt, build pack Dockerfile) et noter son UUID | UI Coolify, `192.168.1.48` |
| 0.4 | Créer la ressource PostgreSQL et **activer une sauvegarde planifiée** (sans elle, les migrations refuseront de tourner) | UI Coolify |
| 0.5 | Renseigner les secrets GitHub `COOLIFY_TOKEN`, `COOLIFY_APP_UUID` | Settings → Secrets du dépôt |
| 0.6 | Renseigner les variables d'environnement de l'app | UI Coolify |

Je ne fais aucune de ces actions moi-même : elles créent des ressources
publiques et manipulent des secrets.

## Étape 1 — Squelette serveur (≈ 30 min)

**Ajouts** — `server/src/index.ts`, `server/src/env.ts`, `Dockerfile`,
`docker-compose.yml`, `.dockerignore`.

- Dépendances : `hono`, `@hono/node-server`, `zod`. Dev : `tsx`.
- `env.ts` : schéma zod, échoue au démarrage si `DATABASE_URL` ou
  `BETTER_AUTH_SECRET` manquent en production.
- `index.ts` : `GET /api/health` → `{ ok, version, db }` ; sert `dist/` en
  statique avec repli SPA sur `index.html`. Écoute sur `PORT` (défaut 3000).
- `Dockerfile` multi-stage : `node:22-alpine`, stage build (`npm ci` +
  `vite build`), stage runtime (node_modules + `dist/` + `server/`).
- `docker-compose.yml` : `app` + `postgres:17-alpine`, healthcheck
  `curl -f http://localhost:3000/api/health`.
- Scripts npm : `server:dev`, `server:start`.

**Tests** — `server/src/__tests__/health.test.ts` (vitest, `app.request()`) :
`/api/health` répond 200 avec la version du `package.json`, et une route
inconnue hors `/api` renvoie l'`index.html`.

**Fini quand** : `docker compose up` sert l'app buildée sur `:3000` et le
healthcheck passe.

## Étape 2 — Base et migrations (≈ 1 h)

**Ajouts** — `drizzle.config.ts`, `server/src/db/schema.ts`,
`server/src/db/client.ts`, `server/scripts/start-production.ts`,
`server/src/lib/coolify-backup.ts`, `server/drizzle/` (migrations générées).

Schéma (au-delà des tables Better Auth de l'étape 3) :

```ts
profil = { id: text PK, userId: text → user.id ON DELETE CASCADE,
           prenom: text, creeLe: timestamp }
progression = { profilId: text PK → profil.id ON DELETE CASCADE,
                etat: jsonb, majLe: timestamp }
```

`etat` est l'objet `Sauvegarde` de `src/core/storage.ts` tel quel — il est déjà
validé caractère par caractère côté client par `sauvegardeValide()`. Le serveur
revalide avec le **même** code, importé depuis `src/core/` : une seule
définition de la forme, pas deux qui divergent.

`start-production.ts`, joué par le `CMD` du conteneur, dans cet ordre :
1. refuse de tourner si `NODE_ENV !== 'production'` ;
2. `ensureCoolifyBackupBeforeMigration()` — déclenche un backup Coolify et
   attend `success` ; **throw si aucune sauvegarde planifiée n'est activée** ;
3. `drizzle-kit migrate` (jamais `push --force`) ;
4. démarre le serveur.

**Tests** — `coolify-backup.test.ts` (fetch bouchonné : backup absent → throw ;
échec → throw ; timeout → throw ; les deux variables absentes → skip silencieux)
et un aller-retour `etat` → jsonb → `sauvegardeValide()`.

**Fini quand** : `docker compose up` crée le schéma et `/api/health` renvoie
`db: 'ok'`.

## Étape 3 — Comptes parents (≈ 2 h)

**Ajouts** — `server/src/auth.ts`, `server/src/routes/auth.ts`,
`src/core/session.ts`, `src/views/V9Compte.tsx`.

- Better Auth, adaptateur Drizzle, email + mot de passe, cookie de session
  `httpOnly` + `SameSite=Lax` + `Secure` en production. Pas de Google OAuth pour
  l'instant (une décision de moins, des secrets en moins).
- `POST /api/auth/*` monté sur le handler Better Auth.
- Écran **parent** `V9Compte`, atteint depuis les réglages (jamais depuis un
  écran d'enfant) : créer un compte, se connecter, se déconnecter, voir l'état
  de synchronisation. Vocabulaire d'adulte, contrairement au reste de l'app.
- Limitation de débit sur les tentatives de connexion.

**Tests** — unitaires : inscription, connexion, mauvais mot de passe, session
expirée. E2E `compte.spec.ts` : créer un compte, se déconnecter, se reconnecter.

**Fini quand** : un parent peut créer un compte et le retrouver après un
redémarrage du serveur.

## Étape 4 — Profils serveur (≈ 1 h 30)

**Ajouts** — `server/src/routes/profils.ts`, `src/core/profils-sync.ts`.
**Modifs** — `src/core/profils.ts`, `src/views/V0Profils.tsx`.

- `GET /api/profils` → les profils du compte, progression comprise.
- `POST /api/profils` → créer (le `prenom` est le seul champ, borné à 30
  caractères, jamais un nom de famille).
- `DELETE /api/profils/:id` → supprime profil et progression.
- Chaque profil local gagne un champ optionnel `distant?: string` (l'id
  serveur). Les profils créés hors ligne restent purement locaux jusqu'à la
  première connexion, où ils sont poussés.
- Toutes les routes vérifient que le profil appartient à la session : un id
  deviné ne donne accès à rien.

**Tests** — un compte A ne peut ni lire ni écrire un profil du compte B (403).
E2E : « Qui joue ? » liste les profils venus du serveur après connexion.

**Fini quand** : les profils créés sur une machine apparaissent sur l'autre.

## Étape 5 — Synchronisation local-d'abord (≈ 2 h)

**Ajouts** — `src/core/fusion.ts`, `src/core/sync.ts`, `src/core/fusion.test.ts`.

`PUT /api/profils/:id/progression` accepte `{ etat, majLe }` et **rejette en
409 un `majLe` plus ancien** que celui en base — le client refait alors une
fusion et rejoue.

Règles de fusion, champ par champ (`fusion.ts`, fonction pure, testée seule) :

| Champ | Règle |
|---|---|
| `palier` | le plus grand |
| `blocsSurPalier` | celui du palier gagnant ; à palier égal, le plus grand |
| `bloc` | le plus grand (compteur monotone) |
| `maitrise` | union par caractère, listes de blocs fusionnées et dédoublonnées |
| `motsPerso` | union, repassée dans `motsPersoValides()` |
| `guideDoigtVu` | `||` |
| `disposition`, `dispositionChoisieALaMain`, `reglages` | le plus récent (`majLe`) |

Déclencheurs d'envoi : fin de bloc, changement de profil, retour en ligne.
Hors ligne, l'envoi est mis en file dans `localStorage` et rejoué au retour du
réseau. **Aucun appel réseau ne bloque jamais une leçon** : tout est en
arrière-plan, l'échec est silencieux côté enfant et visible côté parent dans
V9Compte.

**Tests** — `fusion.test.ts` couvre chaque règle du tableau, dont les cas
tordus (même palier, maîtrises disjointes, listes de mots qui se recoupent,
horloges désynchronisées). E2E `sync.spec.ts` : deux contextes de navigateur,
même compte, la progression du premier apparaît dans le second.

**Fini quand** : une progression faite sur un ordinateur se retrouve sur
l'autre, et couper le serveur en pleine leçon ne se voit pas.

## Étape 6 — Déploiement Coolify (≈ 1 h)

**Ajouts** — `.github/workflows/deploy.yml`,
`docs/DEPLOIEMENT-RUNBOOK.md`.

- `on: push: branches: [main]`, job sur le runner self-hosted `homelab-runner`.
- `curl -f "http://localhost:8000/api/v1/deploy?uuid=${{ secrets.COOLIFY_APP_UUID }}"`
  avec `Authorization: Bearer ${{ secrets.COOLIFY_TOKEN }}`, puis polling de
  `/api/v1/deployments/<uuid>` toutes les 15 s, 24 tentatives.
- Le job ne part **qu'après** `npm run build`, `npm test` et `npm run e2e` verts.
- Pas de bump de version automatique : contrairement à ecoride, cette app n'a
  pas de PWA à invalider. On garde le workflow le plus court possible.

**Fini quand** : un push sur `main` met `https://typing.tiarkaerell.com` à jour
tout seul.

## Étape 7 — Le garde-fou réseau, réécrit (≈ 30 min)

**Modif** — `tests/e2e/reseau.spec.ts`.

Aujourd'hui le test interdit **toute** requête sortante. Il doit devenir :
toute requête vers un hôte autre que l'origine de l'app fait échouer le test —
Google Fonts, CDN, analytics, pixel, rien ne passe. Les seuls appels tolérés
sont `/api/*` sur notre propre origine.

Le test doit aussi vérifier qu'**aucun appel réseau ne part avant qu'un compte
soit connecté** : un enfant qui joue sans compte ne génère aucun trafic.

**Fini quand** : le test échoue si on ajoute une balise vers un tiers, et passe
sur l'app avec compte.

## Points que je te soumettrai en route

1. **Mot de passe oublié** : sans service d'envoi d'email, il n'y a pas de
   réinitialisation. Option la plus simple : un code de secours affiché à la
   création du compte, à conserver. À trancher à l'étape 3.
2. **Données d'enfant** : je stocke un prénom et une progression, rien d'autre
   — pas d'âge, pas d'école, pas de date de naissance. Si tu veux zéro prénom
   sur le serveur, on chiffre le prénom côté client avec une clé dérivée du mot
   de passe parent. Coût : un prénom perdu si le mot de passe est perdu.
3. **Suppression** : un bouton « supprimer notre compte et tout effacer » dans
   V9Compte, effectif immédiatement, sans corbeille. À faire à l'étape 3.
