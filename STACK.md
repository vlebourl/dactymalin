# Stack technique — « Tape avec moi »

> Proposée par l'agent architecte (2026-08-24), revue adversarialement par Codex, arbitrée. Statut : DÉCIDÉ (voir arbitrage en fin de document).

## Décision

**Vite + React + TypeScript, application 100 % statique, zéro backend.**

Dépendances (7) :
- runtime : `react`, `react-dom`
- dev : `vite`, `@vitejs/plugin-react`, `typescript`, `vitest`, `@playwright/test` (+ `@types/react`, `@types/react-dom`)

## Choix et justifications

- **React + TS plutôt que vanilla** : la leçon dérive ~8 états visuels d'un même état logique (touche cible, barreau d'aide 1→3, fenêtre de rappel par touche, pastille de doigt, pastilles d'avancement, piège Maj à deux touches). `DOM = f(state)` élimine la classe de bugs que P3/P4/P6 rendent inacceptables. React plutôt que Preact/Svelte : masse d'entraînement maximale pour un agent-développeur solo.
- **Build : Vite** (`react-ts`), `vite.config.ts` porte aussi la config vitest.
- **État : `useReducer` + Context, aucune lib.** Persistant (disposition, palier, maîtrise, réglages) → reducer racine sérialisé à chaque action. Éphémère de session → reducer local à la vue leçon. Pas de Zustand/Redux : pas de prop-drilling sur 7 vues.
- **Routeur : aucun.** `view` est une valeur du reducer. Pas de deep-link ni de bouton retour à gérer.
- **Style : CSS Modules + `tokens.css`.** Contraste 7:1, discriminabilité en niveaux de gris, pas de rouge/vert, `prefers-reduced-motion` : des variables et deux media queries. Pas de Tailwind (illisible face à la règle P1 « teinte de base jamais repeinte »).
- **Persistance : `localStorage`, clé `tapeavecmoi.v1`, JSON versionné.** Validation obligatoire au chargement (frontière de confiance) : champ absent ou hors domaine → défaut. Pas de zod (~20 lignes de gardes testables).
- **Tests : vitest sur `src/core/` (env node, sans DOM, aucun import React) + Playwright pour tout le visuel.** Pas de jsdom ni @testing-library. Tests noyau : tables de layouts (ç direct FR-FR vs Maj+4 CH-FR, ù touche morte exclue en CH-FR), invariant corpus×palier (« aucune exception » P5), palier vide = build cassé, critère de progression 3 occ./2 blocs + plafond anti-mur, escalade d'aide 1→3 et latences 0/0,8/1,5/2,5 s. E2e : boucle V1→V4→V5→V4, frappe fausse muette, détection en une frappe, bascule V2, bandeau Verr.Maj.
- **Backend : aucun.** Pas de compte, pas de synchro, corpus embarqué dans le bundle, télémétrie §7 locale (`?instrumentation=1`). Livraison : `vite build` → `dist/` servi par n'importe quoi.
- **APIs natives** : `navigator.keyboard.getLayoutMap()` (détection silencieuse, repli « appuie sur A »), `getModifierState('CapsLock')`, `speechSynthesis` fr-FR pour le nom de lettre du barreau 3.

## Arborescence

```
index.html  package.json  tsconfig.json  vite.config.ts  playwright.config.ts
public/doigts/  public/sons/reussite.mp3
src/
  main.tsx  App.tsx
  core/     layouts.ts detect.ts paliers.ts corpus.ts generator.ts
            progression.ts aide.ts storage.ts encouragements.ts   ← 0 import React
  hooks/    useKeyInput.ts useProgress.ts
  ui/       Keyboard.tsx Key.tsx FingerBar.tsx Stars.tsx SpeakerButton.tsx
  views/    V1Accueil.tsx V2Clavier.tsx V3GuideDoigt.tsx V4Lecon.tsx
            V5FinDeBloc.tsx V6Carte.tsx V7Reglages.tsx
  styles/tokens.css
tests/e2e/  boucle.spec.ts detection.spec.ts erreur.spec.ts capslock.spec.ts
            helpers/keyboard.ts   ← frappes (code, key) réalistes via CDP
```

Écarté : eslint, prettier, router, lib d'état, lib de test de composants, service worker, backend.

## Risques identifiés par l'architecte

1. **Playwright simule un clavier QWERTY US** — toute la logique repose sur `(code, key)`. Mitigation dès le premier test : helper CDP `Input.dispatchKeyEvent` alimenté par les mêmes tables que `core/layouts.ts`. E2e en Chromium ; test dédié du repli « appuie sur A » (getLayoutMap absent de Firefox/Safari).
2. **`localStorage` perdable** (navigation privée, ITP Safari ~7 jours). Mitigation : export/import JSON dans V7, recommandation Chrome. Pas de backend pour ça.
3. **Minuteries dans React** (rappel par touche, barreau 2 à ~3 s, célébration 0,5-1 s) : closures périmées, `setTimeout` orphelins. Mitigation structurelle : `core/aide.ts` en fonctions pures `(état, tempsÉcoulé) → état` testées avec faux timers ; un seul `requestAnimationFrame` dans la vue leçon. Aucun `setTimeout` disséminé.

---

## Arbitrage post-revue adversariale Codex (2026-08-24) — STATUT : DÉCIDÉ

Codex (GPT) a validé : Vite+React+TS statique zéro backend, CSS Modules + tokens. Contesté et arbitré comme suit — **ces amendements sont contraignants** :

1. **État** : Contexts séparés (state vs dispatch ; durable vs leçon). La progression est checkpointée **en fin d'item ou de bloc**, jamais à chaque frappe (feedback < 100 ms, P3).
2. **Persistance** : localStorage conservé (pas d'IndexedDB — sur-ingénierie pour quelques Ko), MAIS : deuxième clé `tapeavecmoi.v1.backup` contenant la dernière progression valide (un schéma corrompu ne remet jamais à zéro) ; `navigator.storage.persist()` demandé au premier lancement si disponible. **L'export/import JSON de V7 est SUPPRIMÉ** : le cahier §6 l'exclut explicitement — Codex a détecté la contradiction.
3. **Tests UI** : couche ciblée de tests composants ajoutée (deps : `jsdom`, `@testing-library/react`) UNIQUEMENT pour `useKeyInput` (focus, cleanup des listeners, `repeat`, Maj, CapsLock, touche inconnue) et la vue leçon (frappe fausse muette, timers avec faux timers). Le reste de l'UI reste couvert par Playwright seul.
4. **Validation clavier** : le helper CDP demeure, mais les tests contractuels de `core/layouts.ts` utilisent des **fixtures indépendantes écrites à la main** (échantillon de couples (code,key) attendus par disposition, PAS dérivées des tables de prod — oracle circulaire cassé). Playwright ajoute des projets **firefox et webkit** pour le seul chemin de repli « appuie sur A » (getLayoutMap absent). Une matrice de recette manuelle Windows/macOS × FR-FR/CH-FR sur clavier physique est requise AVANT mise en service réelle — hors périmètre de la boucle autonome, consignée ici.
5. **Audio** : `speechSynthesis` reste le mécanisme MVP, avec détection de voix fr — si aucune voix française : l'aide du barreau 3 reste purement visuelle (déjà prévue au cahier). Option post-MVP notée : pré-générer les fichiers audio des lettres (`say -v` macOS) et ne garder speechSynthesis qu'en repli.
6. **Hébergement** : contexte sécurisé requis (HTTPS ou localhost) pour getLayoutMap/storage.persist.

### Registre des risques (remplace la liste architecte)
1. Interopérabilité clavier réelle (key/code/modificateurs/répétition selon OS-navigateur) — mitigations : fixtures contractuelles, multi-navigateurs sur le repli, instrumentation locale (code, key, modificateurs) via `?instrumentation=1`, recette manuelle finale.
2. Automatisation du balayage à deux index (risque produit n°1 du cahier §7.1) — mitigation : instrumentation du nombre de blocs par palier, exposée localement.
3. Validité de la matrice de tests (vert synthétique ≠ produit réel) — mitigations : point 4 ci-dessus.
4. Durabilité de la progression — mitigations : point 2 ci-dessus.
5. Audio/accessibilité opérationnelle — mitigation : point 5 ci-dessus.
(Les minuteries React sont reléguées « implémentation maîtrisable » : fonctions pures + un seul rAF, inchangé.)

Dépendances finales (9) : react, react-dom | vite, @vitejs/plugin-react, typescript, vitest, @playwright/test, jsdom, @testing-library/react (+ @types/*).
