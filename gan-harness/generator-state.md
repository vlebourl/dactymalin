# Generator State — Iteration 001

## What Was Built

### Noyau `src/core/` (zéro import React, testé en env node — 128 tests vitest verts)
- `layouts.ts` — deux tables déclaratives DISTINCTES fr-FR AZERTY et fr-CH QWERTZ
  (`ç` direct FR-FR / `Maj+4` CH-FR, `ù` touche morte exclue en CH-FR, chiffres shiftés
  FR-FR vs directs CH-FR, point `Maj+;` FR-FR vs direct CH-FR, repères `F`/`J`,
  double légende exacte de la rangée des chiffres).
- `paliers.ts` — paliers 1-7 jouables + 8-10 nommés et verrouillés, ensembles cumulés.
- `corpus.ts` — corpus de vrais mots, filtré par `ensembleTouches(disposition, palier)` :
  l'invariant P5 est vrai par construction, pas par relecture.
- `generator.ts` — bloc de 8-12 items, ordre vrai mot > nombre > syllabe, réinjection
  des items aidés, PRNG déterministe pour les tests.
- `aide.ts` — barreaux 1→3 et latences 0/0,8/1,5/2,5 s en fonctions pures `(état, écoulé) → état`.
- `progression.ts` — 3 occurrences propres réparties sur ≥ 2 blocs, plafond anti-mur 6 blocs.
- `storage.ts` — clé `tapeavecmoi.v1` + `tapeavecmoi.v1.backup`, gardes manuelles.
- `detect.ts` — verdict `(code, key)`, `getLayoutMap()`, seuils d'incohérence, Verr.Maj.
- `encouragements.ts` — 18 formulations, jamais deux fois de suite la même.

### Vues
- **V1** accueil complet (titre, clavier à plat, « On commence ! », ligne de disposition,
  liens carte + guide-doigt, engrenage).
- **V4 leçon** — les trois zones de l'addendum : mot en 48-72 px effectifs → clavier en
  trois blocs disjoints avec frontière graphique → bande basse permanente de 4 pastilles
  photo. Bandeau des touches, pastilles d'avancement sans chiffre, touche cible unique,
  frappe fausse muette, escalade 1→3 avec overlay main + flèche, bandeau Verr.Maj,
  bouton « Je tape sans regarder ».
- **V5** fin de bloc — titre variable, étoiles figuratives, gain lexical, clavier
  miniature illuminé, inversion d'emphase au 4ᵉ bloc.
- **V2** (détection + cartes + ligne contextuelle), **V3** (guide-doigt statique),
  **V6** (carte, paliers 8-10 verrouillés), **V7** (réglages) livrés en version compacte —
  aucun lien mort dans l'application.

### Craft
- Un seul `requestAnimationFrame` dans la vue leçon, aucun `setTimeout` disséminé.
- Palette crème/teal/orange, contraste mesuré 13:1 sur le mot cible, aucun rouge/vert,
  chaque état discriminable en niveaux de gris (taille + anneau + position).
- `prefers-reduced-motion` + interrupteur « Animations douces » ont le même effet.
- Son doux WebAudio sur la réussite uniquement, silence total sur l'erreur.

## What Changed This Iteration
Première itération — tout est nouveau.

Corrections faites en auto-contrôle avant livraison :
- Légendes de touche et cadenas mis à l'échelle de la touche (illisibles sur les
  claviers miniatures de V5/V6 sinon).
- Frontière transformée en trait plein étiqueté verticalement (l'étiquette recouvrait
  la barre d'espace).
- Repli de détection Verr.Maj (`core/detect.ts:verrMajActif`) : `getModifierState`
  n'est pas pilotable par CDP ; une MAJUSCULE arrivée sans Maj maintenue suffit.
  Couvert par trois tests.
- Photos de doigts recadrées à échelle apparente homogène (`pouce_gauche` est coupé
  au ras des doigts à la source).
- Haut-parleurs et cadenas emoji remplacés par des SVG dessinés.

## Known Issues
- Le piège Maj (palier 7) et la bascule automatique vers V2 sur incohérence sont
  implémentés dans `core/` mais pas encore câblés dans la vue leçon (Sprint 2-3).
- Aucun test e2e Playwright versionné : la boucle a été validée par un script CDP
  jetable. `tests/e2e/` est à écrire au Sprint 2.
- Le corpus tient les 8-12 items par bloc à tous les paliers, mais reste mince aux
  paliers 1-2 en FR-FR (risque 7.2 du cahier).
- `V7 → « Refaire une leçon à quatre doigts »` renvoie sur la leçon du palier courant :
  le vrai repli de sas n'a de sens qu'après le palier 6.

## Dev Server
- URL: http://localhost:3000
- Status: running (vite, strictPort)
- Command: `npm run dev`
- Tests: `npm run test` (128 verts) · `npx tsc --noEmit` (propre)
