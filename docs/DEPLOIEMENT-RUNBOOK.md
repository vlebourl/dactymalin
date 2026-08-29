# Runbook de déploiement

Tout est en place. Ce document sert le jour où quelque chose cloche.

## En une phrase

`npm run deploy` demande à Coolify de reconstruire l'image depuis le
`Dockerfile` et de remplacer le conteneur ; celui-ci sauvegarde la base, migre,
puis démarre.

**Il n'y a pas de webhook**, et il ne peut pas y en avoir : l'hôte Coolify est
en `192.168.1.48`, une adresse privée que GitHub ne peut pas appeler. Seul le
port 3003 est publié vers l'extérieur, pas l'API sur 8000. D'où le déclenchement
explicite, qui est la règle et non un contournement.

## Les coordonnées

| Quoi | Où |
|---|---|
| Dépôt | `https://github.com/vlebourl/dactymalin` (**public**) |
| Clone par Coolify | `https://github.com/vlebourl/dactymalin.git`, branche `main`, HTTPS anonyme — pas de clé de déploiement |
| Hôte Coolify | `192.168.1.48`, `ssh lyra@coolify`, API sur `localhost:8000/api/v1` |
| Application | `typing-app`, UUID `x9tbvf1mbspphk7ml1c68dlv`, projet `tape-avec-moi` |
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
| Un push sur `main` ne déploie pas | c'est normal : il n'y a pas de webhook, Coolify est sur le LAN | `npm run deploy` |

## Ce qui protège les données

1. **Avant chaque migration**, le conteneur déclenche une sauvegarde Coolify et
   attend son succès. Échec, absence de sauvegarde planifiée, ou temps dépassé :
   le démarrage est refusé et l'ancienne révision reste en ligne.
2. Les migrations sont appliquées par `drizzle-kit migrate`, jamais par un
   `push --force`.
3. Le hook `.githooks/pre-push` refuse de pousser sur `main` si les types, les
   tests unitaires ou les e2e échouent. À activer sur chaque clone :
   `git config core.hooksPath .githooks`.
