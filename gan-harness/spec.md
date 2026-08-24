# Product Specification: Tape avec moi
> Generated from brief + CAHIER-DES-CHARGES.md (source d'autorité)

## Vision (2-3 phrases)

« Tape avec moi » est une application web qui apprend à un enfant de 7 à 12 ans où poser ses doigts sur *son* clavier réel (FR-FR AZERTY ou CH-FR QWERTZ, détecté automatiquement). À l'écran : un mot ou un nombre en français, le dessin fidèle du clavier en usage avec la touche cible mise en avant, et le doigt à utiliser. Gamification légère et non compétitive : aucun score, aucun chrono, aucun classement, aucun compteur d'erreurs — une erreur déclenche une aide, jamais une perte.

## Règle d'autorité

- **CAHIER-DES-CHARGES.md (racine du repo) est la source d'autorité** : en cas de doute ou d'ambiguïté dans cette spec, le cahier prime.
- Les maquettes `maquettes/*.png` sont **indicatives** ; le texte prime (artefact de rendu Stitch documenté : la rangée de chiffres des maquettes porte des symboles inventés — la vraie spec est `1 &`, `2 é`, `3 "`, `4 '`, `5 (`, `6 -`, `7 è`, `8 _`, `9 ç`, `0 à` — et le nom du produit dérive sur certains écrans ; le seul nom valide est **« Tape avec moi »**).
- L'addendum du commanditaire (2026-08-23) **prime sur le corps du cahier** : l'écran de leçon a TROIS zones (voir Design Direction).

## Design Direction

**Typographie** : **Lexend**, sans-serif. Mot cible **48-72 px** effectifs, étiquettes de touches **18-24 px minimum**, interlettrage augmenté. `I`/`l`/`1` et `0`/`O` impérativement distincts. Le mot cible s'affiche **en minuscules** ; les touches du clavier virtuel portent des **capitales** (comme la machine physique).

**Palette** (hiérarchique, P1) :
- Fond **légèrement crème** — jamais blanc pur ni noir pur. Contraste **7:1** sur le texte cible.
- Deux teintes de base : **teal = main gauche**, **orange = main droite** (teintes de l'addendum, pastilles 1-2 teal, 3-4 orange). Le mode complet (post-MVP) ne fera que subdiviser ces teintes en nuances — aucune touche ne change jamais de couleur de base.
- Chaque état de touche doit rester **discriminable en niveaux de gris** (le porteur d'information est la POSITION et la forme, la couleur est redondante).

**Principes P1-P8 en règles actionnables :**
- **P1 (moitiés, pas colonnes)** : chaque touche appartient à une MAIN selon la ligne médiane physique (`T`/`G`/`B` à gauche, `Y`-ou-`Z`/`H`/`N` à droite). Indication de niveau main : « Main gauche · ton index », jamais « annulaire ».
- **P2 (zéro modificateur en débutant)** : ni Maj, ni AltGr, ni Verr.Maj — ni affichée, ni requise, ni acceptée. FR-FR : aucun chiffre avant le palier 7. CH-FR : chiffres directs dès le palier 1. La rangée des chiffres reste **toujours dessinée** avec ses deux légendes réelles et un **cadenas** quand verrouillée — jamais un vide gris.
- **P3 (frappe fausse muette)** : une frappe erronée n'écrit RIEN, ne déplace pas le curseur. Feedback < 100 ms, exclusivement sur le clavier virtuel (touche pressée s'assombrit et retombe en 150-200 ms, cible s'intensifie). Jamais sur le texte, jamais de rouge, jamais de croix, jamais de buzzer. Le mot affiché est toujours orthographiquement vrai. Célébration identique que l'item ait pris 1 ou 9 essais.
- **P4 + addendum (trois zones)** : mot/nombre → clavier → **bande basse permanente de pastilles doigt** (voir Must-Have). Clavier scindé en **trois blocs spatialement disjoints** : moitié gauche, moitié droite, barre d'espace détachée. La frontière est un élément graphique explicite. Pas de panneau de mains fixe sur le clavier lui-même ; les mains schématiques n'existent qu'en V3 (statiques) et au barreau 3 (transitoire).
- **P5 (générateur contraint)** : chaque leçon déclare un ensemble explicite de touches ; **rien hors ensemble n'est jamais proposé à taper**, sans exception. Ordre de préférence : vrai mot > nombre > syllabe. **Jamais de pseudo-mot.** Syllabe = étiquetée « on lit et on tape », jamais présentée comme un mot.
- **P6 (latence, pas masquage)** : le clavier n'est JAMAIS masqué par l'app. La surbrillance de la cible apparaît après une fenêtre de rappel silencieuse par touche : **0 s → 0,8 s → 1,5 s → 2,5 s max**, retombée **instantanée à 0 s** sur erreur ou dépassement. Aucun décompte, aucune barre, aucun signal de chronométrage. En mode débutant : **plafonnée à 0 s** (aide toujours immédiate). Seule exception : bouton « Je tape sans regarder », déclenché par l'enfant, cache le clavier pour le mot en cours, se réarme au mot suivant.
- **P7 (forme)** : axe vertical unique, un item = un écran, aucun défilement. Triple redondance sur la cible (agrandissement dans le mot + saturation pleine + halo pulsé), **un seul marqueur actif** (sauf piège Maj). Son doux court sur réussite, **silence sur l'erreur**. Pas de clignotement > 3 Hz ; `prefers-reduced-motion` respectée. Aucune pénalité de lenteur.
- **P8** : l'espace se frappe du **pouce de la main opposée** à la lettre précédente. L'auriculaire arrive au palier 7 uniquement comme porteur de Maj (règle **contralatérale** : Maj droite pour une lettre gauche).

**Interdits absolus (partout, tout le MVP) :**
- WPM, vitesse, précision affichée, courbes, historique de sessions.
- Score chiffré, classement, combo, vies/cœurs, badge de perfection.
- Chronomètre visible, compte à rebours, temps écoulé.
- Compteur d'erreurs, récapitulatif d'erreurs, « à refaire », « réussi avec aide », comparaison à une séance précédente.
- Rouge/vert comme opposition succès/erreur ; toute information portée par la seule couleur.
- Rouge sur erreur, croix, buzzer, son d'erreur.
- Étoile retirée, niveau échoué — une étoile n'est jamais retirée.
- Confettis plein écran.
- Pseudo-mots, majuscules accentuées dans le contenu tapé (`É À È Ç Œ`), caractères AltGr (`@ # € [ ] { } \ | ~`), apostrophe typographique `’` (corpus normalisé sur `'`), phrases complètes, mot contenant une touche hors ensemble.
- Étiquette « mode dyslexie » (le réglage s'appelle « Texte plus espacé »).
- Texte anglais, nom de produit autre que « Tape avec moi ».
- Dark patterns : l'app propose d'arrêter au 4ᵉ bloc mais ne bloque jamais et ne félicite pas d'arrêter.

## Features (prioritized)

### Must-Have (Sprint 1-2) — le MVP jouable

#### F1. Boucle jouable V1 → V4 → V5 → V4
- V1 Accueil : titre « Tape avec moi », icône engrenage (→V7), illustration clavier à plat (sans mains ni personnage), gros bouton « On commence ! », ligne « Ton clavier : Français (AZERTY) » + bouton « Changer » (→V2), liens « Ma carte du clavier » (→V6) et « Revoir : où mettre mes doigts » (→V3).
- V4 Leçon : bandeau permanent « Les touches de cette leçon : … », rangée de 8-12 pastilles d'avancement (pleines quand réussies, **aucun chiffre**), Zone 1 mot en très gros (lettres tapées estompées, lettre courante agrandie et soulignée), Zone 2 clavier en trois blocs, Zone 3 bande de pastilles doigt (F4), bouton « Je tape sans regarder ». Repères tactiles visibles sur `F` et `J` dès la première leçon.
- V5 Fin de bloc : titre d'encouragement variable, rangée d'étoiles (figuratives, aucun chiffre), phrase « Tu écris maintenant : juste, jeune, sujet », clavier miniature avec nouvelles touches illuminées, deux boutons « Encore » (primaire) / « Retour ». **À partir du 4ᵉ bloc consécutif** : emphase inversée (« Retour » primaire) + « Tu as bien travaillé. On peut s'arrêter là. »
- **Acceptance criteria** :
  - « On commence ! » → V4 en un clic ; bloc de 8 à 12 items (60-90 s) ; fin de bloc → V5 ; « Encore » → V4 ; « Retour » → V1.
  - Une étoile par item validé, identique quel que soit le nombre d'essais ; jamais retirée.
  - Célébration par item : 0,5 à 1 s, jamais de confettis plein écran.
  - Aucun chiffre de performance, temps, pourcentage ou compteur nulle part sur V4/V5.

#### F2. Tables de disposition fr-FR AZERTY et fr-CH QWERTZ
- Deux tables **déclaratives** distinctes (`core/layouts.ts`), jamais partagées. Rendu du clavier ET filtrage du contenu par disposition.
- **Acceptance criteria** :
  - AZERTY : `ç` direct (`Digit9`, palier 5), chiffres sous Maj (palier 7), `ù` direct (palier 6), point sous Maj.
  - QWERTZ CH : chiffres directs (palier 1), `ç` = `Maj+4` (palier 7), `ù` = touche morte → **exclu du MVP**, point direct.
  - Rangée de chiffres AZERTY : double légende exacte `1 &`, `2 é`, `3 "`, `4 '`, `5 (`, `6 -`, `7 è`, `8 _`, `9 ç`, `0 à`.
  - Changer de disposition change **le contenu proposé** (ex. *garçon* : palier 5 en FR-FR, palier 7 en CH-FR), pas seulement le dessin.

#### F3. Frappe : validation stricte (P3)
- **Acceptance criteria** :
  - Frappe correcte : la lettre courante s'estompe, le curseur avance, la touche s'illumine, son doux (< 100 ms).
  - Frappe fausse : **rien ne s'écrit**, curseur immobile, touche pressée s'assombrit et retombe (150-200 ms), touche cible s'intensifie, **aucun son**, aucun rouge.
  - Retour arrière : dessiné, éteint, aucun rôle (rien à effacer).
  - Le mot affiché ne contient jamais un caractère faux.

#### F4. Mode débutant 4 doigts + bande de pastilles PHOTO (addendum)
- Bande basse permanente, pleine largeur, séparée du clavier par un liseré. Exactement **quatre pastilles** : index gauche (teal), pouce gauche (teal), pouce droit (orange), index droit (orange) — **photographies détourées** depuis `public/doigts/` (copiées de `doigts/web/*.png`, 512 px + `@2x`).
- **Acceptance criteria** :
  - Une seule pastille active : nettement agrandie, saturée, anneau épais + halo ; les trois autres petites, pâles, plates. État actif lisible **en niveaux de gris** (taille + anneau, pas seulement couleur).
  - À gauche de la bande : consigne de niveau main, ex. « Main gauche · ton index ».
  - Quatre états de guide-doigt et quatre seulement ; aucune indication composée.
  - Lettre moitié gauche → pastille index gauche ; moitié droite → index droit ; espace → **pouce de la main opposée** à la lettre précédente.
  - Aucun modificateur affiché/requis/accepté ; latence de rappel **plafonnée à 0 s** ; retour visuel de l'index à son repère `F`/`J` après chaque frappe.
  - Cadrage : prévoir un recadrage commun des 4 photos (`pouce_gauche` est coupé au ras des doigts) pour une échelle apparente homogène.

#### F5. Touche cible unique
- **Acceptance criteria** :
  - Une seule touche en avant à la fois : saturation pleine + halo pulsé + léger agrandissement. Seule exception : piège Maj (Should-Have) où cible + Maj s'allument ensemble.
  - Touches hors ensemble de la leçon : dessinées mais éteintes, jamais supprimées.

#### F6. Échelle d'aide 1→3 (P3/4.5)
- **Acceptance criteria** :
  - Barreau 1 : à l'affichage de l'item (après expiration de la fenêtre de rappel ; immédiat en débutant) — cible en saturation pleine + halo + agrandissement.
  - Barreau 2 : 1ʳᵉ erreur **ou ~3 s sans frappe** — le **bloc** du côté concerné pulse.
  - Barreau 3 : 2ᵉ erreur sur le même caractère — overlay **transitoire** d'une main schématique ancrée au bord du clavier, index tendu vers la touche + flèche doigt→touche (+ nom de la lettre prononcé, Should-Have). S'efface à la réussite.
  - Barreau 3 **terminal et permanent** pour l'item : aucune escalade au-delà, aucun compte d'essais, aucun message.
  - Aucun palier textuel ; l'aide n'enlève jamais une information déjà donnée.

#### F7. Détection de disposition (4.6) + V2 Choix du clavier
- **Acceptance criteria** :
  - Ordre : (1) `navigator.keyboard.getLayoutMap()` si dispo → verdict silencieux ; (2) sinon test déguisé « Appuie sur la touche A » — une frappe suffit (lecture `code` + `key`) ; (3) disposition affichée en permanence (V1) avec sélecteur à un clic ; (4) **choix manuel = priorité absolue**, mémorisé ; (5) surveillance continue en jeu.
  - Discriminants : `KeyQ`→`a` = AZERTY ; `KeyQ`→`q` et `KeyY`→`z` = QWERTZ ; `Semicolon`→`é` / `BracketLeft`→`è` / `Quote`→`à` = CH-FR (vs CH-DE).
  - V2 : titre « Regarde ton vrai clavier », consigne « Appuie sur la touche A », deux cartes illustrées (mini-clavier fidèle 2 rangées, la détectée cochée), bouton « C'est celui-là » par carte, **ligne d'explication contextuelle obligatoire** (FR-FR : « Sur ce clavier, les chiffres arrivent au palier de la touche Majuscule. » / CH-FR : « Sur ce clavier, tu tapes des nombres dès la première leçon. »).
  - Incohérence en jeu : **5 frappes consécutives** cohérentes avec l'autre disposition, ou **3 items enchaînés saturant au barreau 3** → l'app interrompt et affiche V2. C'est la seule sortie automatique d'un item.

#### F8. Paliers, corpus et générateur (P5, 4.3, 4.7)
- Paliers 1-6 (sas 4 doigts) + palier 7 (Maj) ; paliers 8-10 dessinés/nommés/verrouillés dans V6, non implémentés.
- Table des paliers (nouvelles touches) :
  - P1 : `e f j n s t u` + espace (CH : + `4 5 6 7`) — un, tu, nu, une, jus, fut, net, tenu, sujet, juste, jeune.
  - P2 : + `a i r v` (CH : + `2 3 8 9`) — vrai, faire, avis, train, suivant, univers, fruit, juin.
  - P3 : + `o l d b m` (CH : + `1 0`) — maison, bateau, lundi, soleil, tableau, bandit, monde, dinosaure.
  - P4 : + `g h p c` — chat, papa, cheval, chien, grand, poisson, chocolat, gomme.
  - P5 : + `é è à ç` (CH : + `é è à` seulement, `ç` reporté P7) — école, élève, très, après, bébé, à, éléphant, garçon (FR-FR seulement).
  - P6 : + `q w x y z ù` (CH : sans `ù`) — quatre, wagon, taxi, zèbre, yeux, où, quinze.
  - P7 : auriculaire = Maj maintenue, contralatérale. FR-FR : chiffres 0-9, majuscules, point (`Maj+;`). CH-FR : majuscules, `ç`, ponctuation shiftée.
- **Acceptance criteria** :
  - **Critère de passage** : chaque touche du palier validée **sans erreur et sans aide** sur **3 occurrences** réparties dans au moins **2 blocs** différents. Aucun quota de volume ni de temps.
  - **Plafond anti-mur** : critère non atteint après **6 blocs** sur le même palier → le palier suivant s'ouvre quand même, silencieusement.
  - Composition d'un bloc : 8-12 items, majoritairement palier courant + items ayant atteint barreau 2/3 réinjectés espacés comme contenu ordinaire. Aucun récapitulatif d'erreurs.
  - Générateur : vrai mot > nombre (1 à 3 chiffres, là où ouverts) > syllabe étiquetée. Aucun item hors ensemble ; un palier sans une poignée de vrais mots = build cassé (test).
  - Sas borné : après le palier 6, le mode débutant devient un repli depuis V7, la leçon par défaut est le palier courant. Aucun écran ne dit que la façon précédente était incorrecte.

#### F9. Progression persistée (localStorage)
- **Acceptance criteria** :
  - Clé `tapeavecmoi.v1`, JSON versionné : disposition, palier, maîtrise par touche, réglages.
  - Validation au chargement : champ absent ou hors domaine → valeur par défaut (pas de crash).
  - Après rechargement de la page : palier, disposition et réglages inchangés.

#### F10. V3 Guide-doigt (premier lancement)
- **Acceptance criteria** :
  - Affiché une seule fois après le choix du clavier, puis uniquement à la demande (V1/V7). Jamais automatiquement.
  - Titre « Chaque main garde son côté », clavier scindé avec séparateur épais étiqueté « la frontière », étiquettes « main gauche »/« main droite », **deux mains schématiques STATIQUES** (silhouettes vectorielles neutres — la levée photo de l'addendum ne s'applique qu'aux 4 pastilles), barre d'espace « tes deux pouces », boutons « Réécouter » et « J'ai compris ».

### Should-Have (Sprint 3-4)

#### F11. V2 complète avec audio
- Bouton haut-parleur qui lit la consigne (« Appuie sur la touche A » ; consigne d'incohérence : « Regarde la touche à côté du A »).

#### F12. V3 audio
- Consigne lue : la frontière, « chaque main garde son côté, l'index est ton outil, les pouces font l'espace ».

#### F13. V6 Carte de progression
- Grand clavier : touches acquises colorées, à venir en gris, cadenas sur la rangée des chiffres si verrouillée. Liste verticale des paliers **nommés par ce qu'ils ouvrent** (jamais par une rangée), paliers 8-10 verrouillés avec cadenas et leur promesse (« Les majeurs viennent aider tes index », « Les annulaires », « Les auriculaires prennent leurs lettres »). **Aucune date, aucun pourcentage, aucune durée, aucun compteur de séances.** Bouton « Continuer la leçon ».

#### F14. V7 Réglages
- Clavier (radio illustrés), Sons (interrupteur), « Texte plus espacé » (interrupteur — **jamais « mode dyslexie »**), « Animations douces » (interrupteur), légende des couleurs (seul endroit hors onboarding), « Revoir : où mettre mes doigts », lien discret « Refaire une leçon à quatre doigts » (repli mode débutant — arbitrage Codex : le mode débutant est 2 pouces + 2 index).

#### F15. Palier 7 : Verr.Maj + piège Maj + Majuscules
- **Verr.Maj** : détecté en continu (`getModifierState('CapsLock')`). Actif → bandeau enfant avec illustration de la touche : « Appuie sur la touche avec le petit cadenas pour l'éteindre. »
- **Piège Maj** : touche physique correcte, modificateur manquant (l'app reçoit `è` au lieu de `7`) → état de **quasi-réussite** : cible reste en surbrillance « correcte » + touche Maj s'allume avec son doigt. Seul cas à deux touches simultanées. Règle contralatérale (Maj droite pour lettre/chiffre de gauche).

#### F16. speechSynthesis fr-FR
- Nom de la lettre prononcé au barreau 3. Sons coupables dans V7.

### Nice-to-Have

- Bouton « Je tape sans regarder » avec réarmement automatique au mot suivant (si non livré en Sprint 1-2).
- Fenêtre de rappel P6 complète hors mode débutant (paliers de latence 0/0,8/1,5/2,5 s par touche) — nécessaire seulement quand un enfant sort du sas.
- Micro-feedback qualitatif distinct sur frappe autonome (étincelle) — jamais un chiffre.
- Télémétrie locale `?instrumentation=1` (fréquence barreau 3, blocs par palier — §7).
- Compatibilité touches rémanentes système ; peaufinage `prefers-reduced-motion` au-delà du réglage « Animations douces ».
- Item dédié amusant pour `ù`/« où » au palier 6 (FR-FR).

## Technical Stack

- **Vite + React + TypeScript, 100 % statique, zéro backend.** 7 dépendances : `react`, `react-dom` (runtime) ; `vite`, `@vitejs/plugin-react`, `typescript`, `vitest`, `@playwright/test` (dev).
- État : `useReducer` + Context, aucun routeur (`view` dans le reducer), CSS Modules + `tokens.css`.
- Persistance : `localStorage` clé `tapeavecmoi.v1` + clé `tapeavecmoi.v1.backup` (dernière progression valide — une corruption ne remet jamais à zéro), gardes manuelles (~20 lignes, pas de zod), `navigator.storage.persist()` au premier lancement, checkpoint en fin d'item/bloc jamais à chaque frappe.
- `src/core/` (layouts, detect, paliers, corpus, generator, progression, aide, storage, encouragements) : **zéro import React**, testable en env node.
- APIs natives : `navigator.keyboard.getLayoutMap()`, `getModifierState('CapsLock')`, `speechSynthesis` fr-FR.
- **Voir STACK.md (contraignant) : ne pas ajouter de dépendance non listée.**

## Assets disponibles

- `public/doigts/` ← copier depuis `doigts/web/*.png` (4 doigts : `index_gauche`, `pouce_gauche`, `pouce_droit`, `index_droit`, en @1x — 512 px de haut — et @2x). Photos détourées fond transparent, montre/alliance retirées. Prévoir recadrage commun (cadrage non homogène, `pouce_gauche` coupé au ras des doigts).
- `maquettes/*.png` (référence visuelle, **non contraignante** — le texte du cahier prime ; maquette de référence de la bande de pastilles : `maquettes/V4-debutant-A.png`).

## Sprint Plan

**Le dev server doit tourner sur le port 3000 pour l'Evaluator** (`vite --port 3000`, strictPort).

### Sprint 1 — Noyau + boucle minimale
Scaffold Vite react-ts, `tokens.css` (palette, contraste 7:1), `core/` complet (layouts FR-FR/CH-FR, paliers, corpus, générateur, progression, aide) avec tests vitest, V1 + V4 + V5 jouables en AZERTY palier 1, frappe correcte/fausse (F3), touche cible unique, bande de pastilles photo, persistance localStorage, bandeau Verr.Maj (arbitrage Codex : Must-Have Sprint 1).
**DoD** : `npm run dev` sert sur :3000 ; boucle V1→V4→V5→V4 complète au clavier ; tests vitest noyau verts ; aucune erreur console.

### Sprint 2 — Détection + débutant complet
V2 (détection getLayoutMap + repli « Appuie sur A », cartes, ligne contextuelle), V3 statique, échelle d'aide 1→3 complète, CH-FR jouable (chiffres palier 1), critère 3 occ./2 blocs + plafond 6 blocs, réinjection des items aidés, inversion d'emphase au 4ᵉ bloc.
**DoD** : e2e Playwright `boucle.spec.ts` + `detection.spec.ts` + `erreur.spec.ts` verts via helper CDP ; bascule AZERTY↔QWERTZ change contenu et légendes.

### Sprint 3 — Vues périphériques + palier 7
V6, V7, palier 7 (Maj contralatérale, piège Maj, majuscules, chiffres FR-FR), sortie de sas (repli V7).
**DoD** : `capslock.spec.ts` vert ; piège Maj = deux touches en avant ; V6 montre paliers 8-10 verrouillés nommés.

### Sprint 4 — Audio + polish
consignes lues V2/V3 (speechSynthesis), sons réussite (coupables), « Je tape sans regarder », fenêtre de rappel P6 hors débutant, `prefers-reduced-motion`, revue complète des interdits.
**DoD** : suite e2e complète verte ; audit manuel de la liste des interdits ; aucune erreur console sur les 7 vues.

## Contraintes de test

- **vitest sur `src/core/`** (env node, sans DOM, aucun import React) + tests composants jsdom/@testing-library UNIQUEMENT pour `useKeyInput` et la vue leçon (arbitrage Codex, STACK.md). Tests obligatoires (liste STACK.md) :
  - Tables de layouts : `ç` direct FR-FR vs `Maj+4` CH-FR ; `ù` touche morte exclue en CH-FR.
  - Invariant corpus×palier : aucun mot ne contient une touche hors ensemble (« aucune exception » P5).
  - Palier vide (sans vrais mots) = build cassé.
  - Critère de progression 3 occurrences/2 blocs + plafond anti-mur 6 blocs.
  - Escalade d'aide 1→3 et latences 0/0,8/1,5/2,5 s (`core/aide.ts` en fonctions pures `(état, tempsÉcoulé) → état`, faux timers).
- **Playwright (Chromium) pour tout le visuel**, avec **helper CDP `Input.dispatchKeyEvent` alimenté par les mêmes tables que `core/layouts.ts`** (Playwright simule un QWERTY US : chaque frappe doit émettre le couple `(code, key)` réaliste de la disposition testée). Helper dans `tests/e2e/helpers/keyboard.ts`.
- E2e obligatoires : boucle V1→V4→V5→V4 ; frappe fausse muette (rien ne s'écrit) ; détection en une frappe ; bascule V2 ; bandeau Verr.Maj ; test dédié du repli « Appuie sur A » (getLayoutMap absent).
- Minuteries : un seul `requestAnimationFrame` dans la vue leçon, aucun `setTimeout` disséminé (STACK.md risque 3).


## Arbitrages Codex sur les ambiguïtés du cahier (2026-08-24, contraignants)

1. **Palette** : aucun hex imposé — le générateur choisit librement sous contraintes mesurables (teal/orange/crème, contraste 7:1, lisible en niveaux de gris, jamais rouge/vert sémantique).
2. **Typo** : Lexend partout (titres ET mot à taper).
3. **Barre d'espace** : base crème neutre (ni teal ni orange) ; anneau/halo teal ou orange selon le pouce actif au moment de la frappe (P1 : la teinte de base d'une touche n'est jamais repeinte).
4. **V7** : « Refaire une leçon à quatre doigts » (le « deux doigts » du cahier est un lapsus).
5. **Bandeau Verr.Maj** : **Must-Have Sprint 1** — la détection continue protège le débutant d'un blocage silencieux, indépendamment du palier 7.
6. **Voix du barreau 3** (nom de la lettre, speechSynthesis avec détection de voix fr et dégradation visuelle) : **Must-Have Sprint 2**.
7. **Pastille d'un item réussi après aide** : pleine, strictement identique aux autres — aucune marque « réussi avec aide », jamais.
