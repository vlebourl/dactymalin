# Runbook de déploiement

Tout est en place. Ce document sert le jour où quelque chose cloche.

## En une phrase

Un push sur `main` déclenche le déploiement. GitHub appelle le webhook de
Coolify, qui reconstruit l'image depuis le `Dockerfile` et remplace le
conteneur ; celui-ci sauvegarde la base, migre, puis démarre.

Ce qui a rendu l'automatisme possible : le dépôt est passé sur **GitHub**, et
GitHub appelle Coolify par son **domaine public**. Le montage précédent visait
`192.168.1.48` depuis Gitea, qui refuse par défaut d'appeler une adresse privée
(`ALLOWED_HOST_LIST`) — le webhook existait, actif, et n'a jamais rien livré.
La leçon n'est pas « ouvrir Gitea » mais « ne pas viser une adresse privée
depuis l'extérieur ».

## Les coordonnées

| Quoi | Où |
|---|---|
| Dépôt | `https://github.com/vlebourl/dactymalin` (public) |
| Clone par Coolify | `https://github.com/vlebourl/dactymalin.git`, dépôt public, aucune clé |
| Hôte Coolify | `192.168.1.48`, `ssh lyra@coolify`, API sur `localhost:8000/api/v1` |
| Application | `typing-app`, UUID `x9tbvf1mbspphk7ml1c68dlv`, projet `tape-avec-moi` (noms Coolify, pas renommés) |
| Webhook | GitHub → `https://coolify.tiarkaerell.com/webhooks/source/github/events/manual`, secret partagé stocké dans Coolify |
| Base | `typing-app-db`, UUID `hrfpcwechi8tb7imlir13b1a`, PostgreSQL 17 |
| Sauvegarde planifiée | UUID `i101zg9ef5sh78fy1yheqtkw`, tous les jours à 03:00 |
| Port hôte | **3003** → 3000 dans le conteneur |
| Domaine | `typing.tiarkaerell.com`, publié par **Nginx Proxy Manager** vers `192.168.1.48:3003` |
| Jetons API | fichiers `root` sur l'hôte : `/root/.coolify-claude-token`, `/root/.typing-app-coolify-token` |

## Vérifier que tout va bien

```sh
curl -s http://192.168.1.48:3003/api/health
# {"ok":true,"status":"healthy","version":"0.1.0","db":"ok"}
```

`db: "ok"` = la base répond. `db: "absente"` = l'application tourne sans
`DATABASE_URL` : les comptes sont indisponibles, mais l'app reste jouable.

## Déployer

Pousser sur `main` suffit. `npm run deploy` reste utile pour redéployer sans
pousser, ou quand on veut le verdict et les logs sous les yeux :

```sh
npm run deploy      # scripts/deployer.sh : déclenche, attend, montre les logs si ça casse
```

## Revenir en arrière

Coolify garde les révisions précédentes : dans l'interface, application
`typing-app` → onglet des déploiements → « Redeploy » sur la dernière révision
saine. Le conteneur en cours n'est remplacé qu'une fois le nouveau démarré.

## Les pièges déjà rencontrés

| Symptôme | Cause | Correctif |
|---|---|---|
| `ssh: Could not resolve hostname ssh` | Coolify n'accepte pas `ssh://` : il coupe l'URL au premier `:` | écrire `git@hôte:port/chemin.git` |
| `vite: not found` au build | Coolify injecte `NODE_ENV=production` dès le build, `npm ci` saute les devDependencies | `ENV NODE_ENV=development` + `npm ci --include=dev` dans l'étage de build |
| Le conteneur démarre puis meurt | pas de sauvegarde planifiée ACTIVE sur la base | l'activer dans Coolify — c'est volontaire : pas de sauvegarde, pas de migration |
| `Invalid origin` en développement | Vite sert sur `:3000` et proxifie vers `:3001` | déjà traité : les origines locales sont déclarées de confiance hors production |
| `Démarrage refusé : fetch failed` en boucle | `host.docker.internal` ne résout pas dans un conteneur sous Linux | `COOLIFY_WEBHOOK_URL` pointe sur `http://192.168.1.48:8000/api/v1/deploy` |
| Un push ne déclenche rien | le runner `homelab-runner` est hors ligne | `sudo systemctl status actions.runner.vlebourl-dactymalin.homelab-runner` sur l'hôte Coolify |
| Webhook GitHub renvoyant 403 | Cloudflare défie les POST de GitHub (« Just a moment… ») | ne pas utiliser de webhook : le runner appelle Coolify en localhost |
| Le bouton Google est absent en production | une seule des deux variables du fournisseur est posée, ou aucune | vérifier `GET /api/config` ; poser `GOOGLE_CLIENT_ID` **et** `GOOGLE_CLIENT_SECRET` dans Coolify, puis redéployer |
| Google répond `redirect_uri_mismatch` | l'URI déclarée dans la console Google diffère du chemin réel | déclarer `https://typing.tiarkaerell.com/api/auth/callback/google` — le chemin vient de `basePath: '/api/auth'` |
| Un appareil de la famille sert une VIEILLE version | le service worker (`public/sw.js`) garde la coquille de l'application sur la machine | il est en RÉSEAU D'ABORD : un rechargement en ligne suffit. S'il faut forcer, changer le nom `CACHE` dans `sw.js` — l'activation efface alors tous les caches d'avant |

## Le service worker

Depuis #3, l'application démarre sans réseau : `public/sw.js` garde sa coquille
(document, scripts, styles, polices) sur la machine de la famille.

- Il est en **réseau d'abord** : en ligne, on a toujours la dernière version
  déployée ; hors ligne, la dernière connue. Un déploiement n'exige donc aucune
  manœuvre côté famille.
- Il ne garde **jamais `/api`**. Une session, une progression ou une liste
  resservie depuis un cache serait une réponse périmée présentée comme fraîche.
  Toute route de données doit donc rester sous le préfixe `/api/`, sinon elle
  deviendrait cachable sans que personne le remarque.
- Le cache **enfle lentement** : chaque déploiement ajoute ses fichiers au nom
  haché sans retirer les précédents. Le ménage se fait en changeant le nom
  `CACHE` dans `sw.js`, ce qui efface tous les caches antérieurs à l'activation.

## Google SSO — la vérification qui ne s'automatise pas

Le parcours Google ne se teste pas en machine : un faux serveur OAuth
vérifierait surtout notre capacité à écrire un serveur OAuth. Ce qui casse en
pratique — clé, secret, URI de redirection — ne se voit que sur le vrai Google.
**Après chaque déploiement qui touche à l'authentification**, dérouler ceci et
cocher :

| # | Geste | Attendu |
|---|---|---|
| 1 | Ouvrir `https://typing.tiarkaerell.com` en navigation privée | l'écran de connexion, avec le bouton « Continuer avec Google » |
| 2 | Cliquer le bouton | redirection vers `accounts.google.com`, pas une page d'erreur |
| 3 | Choisir un compte Google | retour sur `typing.tiarkaerell.com`, connecté |
| 4 | Créer un enfant, jouer un bloc | la progression est bien enregistrée |
| 5 | Se déconnecter, créer un compte par ADRESSE avec une *autre* adresse, s'en déconnecter, puis cliquer « Continuer avec Google » et choisir le compte Google dont l'adresse est celle-là | **refus explicite** : retour au portail avec « Cette adresse a déjà un compte avec mot de passe… ». C'est le comportement VOULU — la liaison automatique est désactivée (#7), et `user.email` est unique : une adresse n'ouvre jamais deux comptes |

**Si le bouton n'apparaît pas** : les deux variables `GOOGLE_CLIENT_ID` et
`GOOGLE_CLIENT_SECRET` ne sont pas toutes les deux posées dans Coolify.
`GET /api/config` répond `{"google":false}` — c'est le diagnostic le plus court.

**Attendu, pas un défaut** : un compte Google et un compte mot de passe de même
adresse ne coexistent pas. La seconde tentative est refusée, dans un sens comme
dans l'autre. C'est le prix assumé de « pas de liaison sans vérification
d'adresse » — et la vérification d'adresse exige un envoi de courriels qui
n'existe pas.

**Si Google répond `redirect_uri_mismatch`** : l'URI déclarée dans la console
ne correspond pas au chemin réel, qui est
`https://typing.tiarkaerell.com/api/auth/callback/google`. Il vient de la base
de montage de Better Auth (`basePath: '/api/auth'`) ; une lettre de travers
suffit.

## Ce qui protège les données

1. **Avant chaque migration**, le conteneur déclenche une sauvegarde Coolify et
   attend son succès. Échec, absence de sauvegarde planifiée, ou temps dépassé :
   le démarrage est refusé et l'ancienne révision reste en ligne.
2. Les migrations sont appliquées par `drizzle-kit migrate`, jamais par un
   `push --force`.
3. Le workflow `Vérifications` (types, tests unitaires, tests serveur, e2e,
   build) tourne sur chaque PR et sur `main`. **Le déploiement n'est déclenché
   qu'après son verdict vert** : une fusion rouge n'atteint pas la production.
4. Le hook `.githooks/pre-push` refuse de pousser sur `main` si les types, les
   tests unitaires ou les e2e échouent. À activer sur chaque clone :
   `git config core.hooksPath .githooks`.
