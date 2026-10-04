# DactyMalin (« Tape avec moi »)

Application d'apprentissage de la dactylographie pour enfants. Client Vite +
React + TypeScript, serveur Hono + Drizzle + PostgreSQL, voix Piper, déployés
dans un seul conteneur par Coolify. L'enfant joue toujours hors ligne, sans
compte : `localStorage` reste la source de vérité de la partie en cours ; un
compte parent optionnel permet seulement de retrouver la progression sur un
autre appareil (voir `docs/COMPTES-ET-DEPLOIEMENT.md`).

## Démarrer

```sh
npm ci
docker compose up -d postgres   # base locale pour le compte parent (facultatif)
DATABASE_URL=postgresql://tapeavecmoi:tapeavecmoi@localhost:5432/tapeavecmoi npm run db:migrate

npm run dev          # client Vite      → http://localhost:3000
npm run server:dev   # API Hono, dans un autre terminal → http://localhost:3001
```

Sans base ni serveur, `npm run dev` seul suffit pour jouer : la leçon ne
dépend jamais du réseau.

## Tester

```sh
npm run build     # tsc --noEmit puis vite build
npm test          # vitest — noyau métier (src/core, 0 import React) et composants
npm run test:db   # tests serveur, exige TEST_DATABASE_URL (Postgres sur :55432)
npm run e2e       # Playwright — démarre l'API et lit le même Postgres de test
```

`.github/workflows/verifications.yml` joue ces quatre étapes sur chaque PR et
sur `main`, avec un Postgres éphémère sur le port 55432.

## Déployer

Un push sur `main` déclenche le déploiement une fois la CI (`Vérifications`)
verte : le workflow `deploy.yml` appelle l'API Coolify depuis le runner
auto-hébergé, sans webhook. Détails, vérifications et retour arrière :
`docs/DEPLOIEMENT-RUNBOOK.md`. `npm run deploy` redéploie sans pousser.

## Carte des dossiers

```
src/
  core/     noyau métier pur (0 import React) — lecon, sync, fusion, storage,
            generator, progression, layouts, listes, profils, session, mesures…
  hooks/    useKeyInput.ts
  ui/       composants réutilisables — Keyboard, Key, MainSchematique, Stars, voix…
  views/    une vue par écran — V0Profils … V7Reglages, V9Compte, Connexion
  state.tsx état racine (useReducer + Context)
  data/     corpus embarqué dans le bundle (lexique, parcours)
server/
  src/      index.ts, app.ts, auth.ts (Better Auth), env.ts (schéma zod)
            routes/   profils, listes, voix, compte
            lib/      session, voix (Piper), coolify-backup (garde-fou migration)
            db/       schema Drizzle, client Postgres
  drizzle/  migrations générées (`npm run db:generate`)
  scripts/  start-production.ts — backup, migration, puis démarrage
tests/e2e/  ~45 specs Playwright (boucle, sync, compte, google, dictee…)
docs/       runbook de déploiement, décision comptes/serveur, bibliothèque de
            leçons, docs pour agents (docs/agents/)
archive/    traces de la phase de conception (cahier des charges, maquettes,
            recherche, gan-harness…) — hors image Docker
```

## Graphe des modules

Tiré des imports relatifs réels. Les flèches vont de l'appelant vers l'appelé.

```mermaid
flowchart LR
  subgraph Client
    main[main.tsx] --> App[App.tsx]
    main --> V0[V0Profils] & Cx[Connexion] & Band[ui/BandeauCompte]
    App --> V1[V1 Accueil] & V2[V2 Clavier] & V3[V3 Guide] & V4[V4 Leçon] & V5[V5 Fin] & V6[V6 Carte] & V7[V7 Réglages] & V9[V9 Compte]
    V1 & V2 & V3 & V4 & V5 & V6 & V7 & V9 --> state[state.tsx]
    V4 --> hook[hooks/useKeyInput]
    V2 --> hook
    V4 --> UI[ui/ Keyboard, Key, Mains, Stars, voix]
  end
  subgraph Noyau["src/core — pur, 0 import React"]
    lecon[lecon] --> aide & generator & maj & mesures
    session
    generator --> contenu & parcours & progression & layouts
    sync --> fusion & storage & listes & profils
    fusion --> generator & mesures & progression & storage
    storage --> generator & parcours & mesures
    parcours --> layouts
    contenu --> lexique[(data/lexique-v3.json)]
    parcours --> pjson[(data/parcours.json)]
  end
  state --> sync & storage & generator & progression & listes & profils
  V4 --> lecon & session
  V9 & V7 & V0 & Cx --> sync
  subgraph Serveur
    idx[index.ts] --> app[app.ts] --> rp[routes/profils] & rl[routes/listes] & rv[routes/voix] & rc[routes/compte]
    rp & rl & rv & rc --> sess[lib/session] --> auth[auth.ts]
    rl & rv --> piper[lib/voix → Piper]
    rp & rl & rc & rv --> db[(db/schema + client)]
  end
  sync -. fetch /api .-> app
  rp --> storage & profils
  rl --> listes
```

**Modules les plus importés (fan-in)** : `core/layouts` (19), `core/parcours`
(14), `state` (10), `core/profils` (9), `core/storage` (8), `core/sync` (7) —
ce sont les modules où un changement a le plus de répercussions.

## Graphe des notions métier

```mermaid
flowchart TD
  Parent((Compte parent)) -->|1..n| Profil((Profil enfant))
  Parent -->|0..n| Liste((Liste de la maison))
  Profil -->|1 par disposition| Progression((Progression))
  Progression --> Parcours{{Parcours : Découverte / Dactylo}}
  Parcours -->|10| Etape((Étape))
  Etape -->|7 leçons| Lecon((Leçon))
  Lecon -->|8 à 12| Exercice((Exercice : mot, nombre, syllabe))
  Exercice --> Touche((Touche)) --> Doigt((Doigt / main))
  Touche --> Disposition{{AZERTY FR-FR / QWERTZ CH-FR}}
  Lecon --> Aide((Barreaux d'aide 1→3))
  Aide -->|barreau 3| Voix[Voix : Piper, repli navigateur]
  Liste --> Dictee((Dictée, mot masqué)) --> Voix
  Progression --> Maitrise((Maîtrise par touche)) --> Generateur[Générateur piloté par contrainte]
  Generateur --> Exercice
  Progression --> Mesures((Mesures : vitesse, précision)) -->|montrées au parent seul| V9[Espace parent, gardé par un calcul]
  Progression <-->|fusion multi-appareil| Serveur[(PostgreSQL)]
```

Ces deux graphes viennent du document « audit » du 27/09/2026 (issue TIA-69) ;
`STACK.md` documente les choix et l'arbitrage qui ont mené à cette
architecture, `AGENTS.md` et `docs/agents/` les conventions pour les agents.
