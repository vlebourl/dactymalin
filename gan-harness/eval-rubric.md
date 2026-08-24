# Evaluation Rubric — Tape avec moi

> Grille de l'agent Evaluator du harness GAN. Application testée en direct sur http://localhost:3000 (Chromium ; frappes via helper CDP `(code, key)`).
> **Source d'autorité : CAHIER-DES-CHARGES.md** (racine du repo). Les maquettes sont indicatives, le texte prime.

**Score global = design×0.3 + originality×0.2 + craft×0.3 + functionality×0.2** — chaque critère noté 1-10, moyenne par catégorie.

---

## Design (poids 0.3)

Vérifiable dans le navigateur, cahier §P1, P4, P7, addendum :

1. **Lisibilité enfant** : mot cible entre 48 et 72 px effectifs ; étiquettes de touches ≥ 18 px ; interlettrage augmenté ; `I`/`l`/`1` et `0`/`O` distincts ; typo Lexend (ou sans-serif équivalente) chargée.
2. **Casse correcte** : mot cible en **minuscules**, touches du clavier virtuel en **capitales**.
3. **Hiérarchie / axe vertical unique** : ordre descendant mot → clavier → bande de pastilles ; rien d'informatif sur les côtés ; un item = un écran, aucun défilement.
4. **Palette respectée** : fond légèrement crème (ni `#fff` ni `#000`) ; teal = main gauche, orange = main droite, cohérent sur clavier ET pastilles ; aucune touche ne change de teinte de base entre états.
5. **AUCUN rouge/vert sémantique** : aucune opposition rouge/vert succès/erreur, nulle part ; aucune information portée par la seule couleur (vérifier chaque état en simulant les niveaux de gris : cible, pressée-fausse, éteinte, acquise, pastille active).
6. **Contraste** : ≥ 7:1 sur le texte cible (mesurer fond/texte au DevTools).
7. **Frontière visible** : clavier en trois blocs spatialement disjoints (moitié G, moitié D, espace détachée) ; la séparation est un élément graphique explicite, pas une simple marge. La barre d'espace garde une base crème neutre — seul un anneau/halo teal ou orange signale le pouce actif.
8. **Rangée des chiffres jamais vide** : toujours dessinée avec ses deux légendes réelles (`1 &`, `2 é`, `3 "`, `4 '`, `5 (`, `6 -`, `7 è`, `8 _`, `9 ç`, `0 à`) + cadenas quand verrouillée (débutant FR-FR). Jamais un vide gris, jamais des symboles inventés façon maquette Stitch.
9. **Écran de leçon = trois zones** (addendum) : bande basse permanente pleine largeur, séparée du clavier par un liseré, avec les 4 pastilles photo ; consigne de niveau main à gauche (« Main gauche · ton index »).
10. **Sobriété V4** : aucun panneau de mains fixe sur le clavier, aucune légende couleur→doigt (réservée à V3/V7), aucune barre de progression latérale.

## Originality (poids 0.2)

1. **Chaleur non compétitive** : le ton célèbre le geste, jamais la performance ; aucun vocabulaire de score/vitesse/record ; la fin de séance est proposée (4ᵉ bloc : « Tu as bien travaillé. On peut s'arrêter là. ») sans culpabiliser ni féliciter l'arrêt.
2. **Encouragements variés** : V5 tire d'une rotation d'**au moins 15 formulations distinctes** — enchaîner ≥ 5 blocs et vérifier qu'aucun titre ne se répète immédiatement.
3. **Identité « Tape avec moi »** : ce nom exact partout (titre V1, `<title>`) ; aucun nom inventé (« ClavierCopains », « DactyloApprenti »… = artefact Stitch interdit).
4. **Français uniquement, registre enfant** : aucune chaîne anglaise visible ; consignes courtes, tutoiement, niveau main (« Main gauche · ton index »), jamais de nom de doigt technique en débutant, jamais « mode dyslexie » (le réglage dit « Texte plus espacé »).
5. **La progression comme récompense** : V5 montre le gain lexical (« Tu écris maintenant : … ») et les nouvelles touches illuminées ; V6 nomme les paliers par ce qu'ils débloquent, jamais par une rangée de clavier ; paliers 8-10 visibles, nommés, verrouillés avec leur promesse.
6. **Pastilles photo** : les 4 pastilles utilisent les photographies détourées de `public/doigts/` (pas des pictogrammes), à échelle apparente homogène ; mains schématiques uniquement en V3 et au barreau 3.

## Craft (poids 0.3)

1. **États clavier corrects** : une **seule** touche cible en avant (saturation + halo pulsé + agrandissement) ; touches hors ensemble dessinées mais éteintes, jamais supprimées ; repères tactiles visibles sur `F` et `J`.
2. **Cas Maj = deux touches** (palier 7) : sur piège Maj (touche bonne, modificateur absent — l'app reçoit `è` au lieu de `7`), la cible reste en surbrillance « correcte » ET la touche Maj **contralatérale** s'allume — seul cas à deux touches ; jamais deux touches en avant ailleurs.
3. **Feedback d'erreur localisé** : touche pressée s'assombrit et retombe en 150-200 ms ; rien sur le texte ; aucun son d'erreur (son doux sur réussite uniquement).
4. **Transitions douces** : célébration d'item 0,5-1 s sans casser le rythme ; jamais de confettis plein écran ; aucun clignotement > 3 Hz ; halo pulsé discret.
5. **prefers-reduced-motion** : émuler la préférence au DevTools → animations réduites/supprimées ; le réglage « Animations douces » de V7 a un effet observable.
6. **Responsive** : lisible et jouable à 1280×800 et 1024×768 ; le clavier reste entièrement visible sans défilement pendant la frappe.
7. **Aucune erreur console** : parcourir les 7 vues et un bloc complet → zéro erreur/warning React dans la console.
8. **État cohérent** : pastilles d'avancement (8-12, pleines quand réussies, sans chiffre) ; bandeau « Les touches de cette leçon : … » conforme à l'ensemble du palier ; lettres tapées estompées, lettre courante agrandie/soulignée.
9. **Latences maîtrisées** : en mode débutant l'aide est immédiate (latence 0 s) ; barreau 2 après ~3 s sans frappe ; aucun décompte ni signal de chronométrage visible pendant la fenêtre de rappel.
10. **« Je tape sans regarder »** : cache le clavier pour le mot en cours seulement, se réarme seul au mot suivant ; c'est le seul masquage possible du clavier.

## Functionality (poids 0.2)

Parcours critiques, pas à pas :

1. **Détection de disposition** : au premier lancement, V2 s'affiche ; frapper `(KeyQ → "a")` → carte Français AZERTY cochée ; frapper `(KeyQ → "q")` puis `(KeyY → "z")` → carte Suisse QWERTZ cochée ; la ligne contextuelle change (FR-FR : « les chiffres arrivent au palier de la touche Majuscule » / CH-FR : « tu tapes des nombres dès la première leçon ») ; « C'est celui-là » confirme et mémorise ; un choix manuel prime sur toute détection ultérieure.
2. **Frappe correcte avance** : sur V4, émettre la touche cible → la lettre s'estompe, le curseur passe à la suivante, l'item se valide au bout du mot, une étoile apparaît.
3. **Frappe fausse n'écrit rien** : émettre une mauvaise touche → le mot affiché est inchangé (orthographiquement vrai), le curseur n'a pas bougé, aucun caractère faux, aucun rouge, aucun son.
4. **Escalade d'aide aux bons délais** : item affiché → barreau 1 (cible en avant, immédiat en débutant) ; 1ʳᵉ erreur **ou** ~3 s d'inactivité → barreau 2 (le bloc du côté concerné pulse) ; 2ᵉ erreur sur le même caractère → barreau 3 (overlay main schématique + flèche, + lettre prononcée si audio livré) ; barreau 3 terminal : une 3ᵉ erreur n'ajoute rien ; l'overlay s'efface à la réussite ; la célébration est identique à un item réussi du premier coup.
5. **Mode débutant restreint aux 4 doigts** : bande de 4 pastilles photo ; lettre de la moitié gauche → pastille « index gauche » active (agrandie, anneau, saturée), les 3 autres pâles ; lettre de droite → « index droit » ; espace → pouce de la main **opposée** à la lettre précédente (vérifier les deux cas) ; aucun item ne requiert Maj/AltGr/Verr.Maj ; en FR-FR débutant, aucun chiffre proposé ; en CH-FR, des nombres dès le palier 1.
6. **Bascule AZERTY/QWERTZ change les légendes ET le contenu** : passer en QWERTZ dans V7 → `Z`↔`Y` échangés, `A`/`Q` et `M` déplacés, chiffres directs (plus de cadenas), `ç` n'apparaît plus qu'en `Maj+4` (palier 7 — *garçon* absent du palier 5), `ù` absent du MVP ; revenir en AZERTY → `ç` direct au palier 5, chiffres cadenassés.
7. **Progression persistée** : jouer jusqu'à débloquer un palier, recharger la page → même palier, même disposition, mêmes réglages (clé `tapeavecmoi.v1`) ; localStorage corrompu ou tronqué → l'app démarre sur les défauts sans crash.
8. **Critère de palier** : chaque touche validée sans erreur et sans aide 3 fois sur ≥ 2 blocs → palier suivant ; après 6 blocs sans y arriver → il s'ouvre quand même, sans message.
9. **Verr.Maj détecté** : émettre CapsLock actif → bandeau enfant « Appuie sur la touche avec le petit cadenas pour l'éteindre » avec illustration ; il disparaît quand CapsLock est relâché.
10. **Incohérence de disposition** : en AZERTY configuré, émettre 5 frappes consécutives cohérentes QWERTZ → l'app interrompt d'elle-même et affiche V2.
11. **Boucle et fin de séance** : V1 → « On commence ! » → V4 (8-12 items) → V5 → « Encore » → V4 ; au 4ᵉ bloc consécutif, V5 inverse l'emphase des boutons (« Retour » primaire) et affiche « Tu as bien travaillé. On peut s'arrêter là. » — « Encore » reste possible.

---

## Échecs disqualifiants — score global plafonné à 4 si UN SEUL est présent

- **WPM visible**, ou tout chiffre de vitesse/précision/performance à l'écran.
- **Classement**, leaderboard, comparaison entre sessions ou entre enfants.
- **Chronomètre visible**, compte à rebours, temps écoulé affiché, ou tout signal que l'enfant est chronométré (y compris pendant la fenêtre de rappel).
- **Rouge sur erreur** (ou croix, buzzer, son d'erreur, caractère faux écrit dans le mot).
- **Mots hors palier** : un item à taper contient un caractère hors de l'ensemble déclaré de la leçon (accents et modificateurs compris — ex. un chiffre en débutant FR-FR, *garçon* au palier 5 en CH-FR, *où* en CH-FR, un pseudo-mot).
- **Texte anglais** dans l'interface.

Autres violations graves à traiter comme disqualifiantes (mêmes interdits du cahier) : compteur d'erreurs ou récapitulatif d'échecs, étoile retirée, vies/cœurs, nom de produit autre que « Tape avec moi », clavier masqué par l'app hors bouton « Je tape sans regarder », étiquette « mode dyslexie ».
