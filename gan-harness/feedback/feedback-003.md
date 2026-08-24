# Évaluation — Itération 003

Testé en direct sur http://localhost:3000 (Chromium piloté par le Playwright local du dépôt ; frappes émises en couples `(code, key)` réalistes via `KeyboardEvent` sur `window`). ~200 items tapés : 6 blocs consécutifs FR-FR palier 1, 2 blocs FR-FR palier 7, 1 bloc CH-FR palier 1, 22 items CH-FR palier 6, sondages aux paliers 2/3/5. 5 tailles de fenêtre mesurées **au palier 7** (clavier le plus large, Maj comprises), `prefers-reduced-motion` émulée dans les deux états, niveaux de gris simulés et mesurés en luminance relative, localStorage corrompu, 60 frappes fausses en rafale, 8 clics rapides, 7 vues parcourues.

## Scores

| Critère | Note | Poids | Pondéré |
|---|---|---|---|
| Design | 8 / 10 | 0.3 | 2.4 |
| Originality | 7 / 10 | 0.2 | 1.4 |
| Craft | 7 / 10 | 0.3 | 2.1 |
| Functionality | 7 / 10 | 0.2 | 1.4 |

Score pondéré : 7.3 / 10

## Verdict : PASS (seuil 7.0)

Aucun échec disqualifiant. Vérifié sur ~200 items : aucun WPM ni chiffre de performance, aucun classement, aucun chronomètre ni décompte, aucun rouge / croix / buzzer (60 frappes fausses d'affilée : `data-curseur` reste à `0`, le mot affiché reste `une`), aucune chaîne anglaise, `<title>` = « Tape avec moi », aucune étiquette « mode dyslexie », aucun caractère hors ensemble cumulé (FR-FR paliers 1/2/3/5/7, CH-FR paliers 1 et 6 : ni `ç` ni `ù` en CH-FR palier 6, nombres CH palier 1 tirés du seul `4 5 6 7`). **Zéro erreur et zéro warning console** sur les 7 vues, 9 blocs joués et les 5 tailles de fenêtre.

---

## État des 6 points prioritaires de feedback-002 — vérifiés un par un

| # | Point | Statut | Preuve mesurée |
|---|---|---|---|
| 1 | Touches de la leçon indiscernables en niveaux de gris | **CORRIGÉ** | `ouverte` `rgb(219,233,230)` → luminance **0.791** ; `eteinte` `rgb(222,212,193)` → **0.665**. Écart **0.126** (exigence 0.05). Second porteur : liseré 2 px `rgb(45,128,121)` contre 1 px `rgb(198,185,161)`. Rendu `grayscale(1)` (`iter003-22`) : les 7 touches de la leçon se lisent immédiatement comme un groupe clair et bordé. |
| 2 | Palier 7 : aucune cible, main annoncée fausse | **CORRIGÉ** | Item `918`, curseur 0 : `[data-etat="cible"]` = `["ShiftLeft","Digit9"]`, `data-doigt="index_droit"`, consigne « Main droite ». `9` est bien déclaré `main:'droite'` dans `FR_FR`. |
| 3 | Piège Maj : zéro touche allumée au lieu de deux | **CORRIGÉ** | Frappe `Digit9`+`ç` (sans Maj) sur l'item `918` : curseur immobile, 2 cibles conservées, `data-maj="gauche"` — règle contralatérale respectée (chiffre à droite → Maj gauche) — et texte « Presque : garde la touche Maj avec ta **main gauche**, puis appuie sur la touche allumée. » Les deux touches allumées portent des teintes différentes (orange = cible, teal = Maj), ce qui rend le couple lisible d'un coup d'œil. |
| 4 | `doitProposerV2()` = code mort | **CORRIGÉ** | 4 frappes `(KeyY → "z")` en AZERTY : rien, l'item continue. La **5ᵉ** bascule sur V2 avec sa raison propre : « Tes touches ne sont pas là où je croyais. Appuie sur la touche A. » |
| 5 | V6 : 6 paliers sur 10 hors cadre | **CORRIGÉ** | Deux colonnes de cinq. `document.querySelectorAll('*')` filtré sur `scrollHeight > clientHeight` → **liste vide** ; `scrollHeight == innerHeight == 900`. Les 10 paliers, leurs cadenas et leurs promesses sont visibles simultanément (`iter003-11`). |
| 6 | Lettre courante non agrandie | **CORRIGÉ** | Lettre courante `82.08 px` / graisse **800** / `display:inline-block` / `border-bottom: 5px solid` teinté selon la main ; lettres à venir `72 px` / graisse 500. Trois porteurs dont deux non chromatiques. |
| 7 | Photos de doigts non recadrées | **CORRIGÉ** | `iter003-18` : les 4 pastilles sont au même angle et à la même échelle apparente, chaque doigt actif est identifiable (index tendu, pouce dressé). Plus d'avant-bras, plus de poing de dos. Un défaut résiduel subsiste (point 6 ci-dessous). |

### Les deux « partiels » de feedback-002

| # | Point | Statut |
|---|---|---|
| 10 | Cadrage des pastilles | **CORRIGÉ** (voir ci-dessus). |
| 11 | Overlay du barreau 3 | **PARTIEL**. La flèche pointillée est supprimée : le repère tactile de `J` n'est plus coupé et la main ne recouvre plus la barre d'espace — les deux défauts signalés sont réglés. Mais la bulle du nom de la lettre recouvre désormais la touche `U`, qui est **une des 8 touches de la leçon** (`iter003-07`), et la main schématique, privée de sa flèche, est posée à droite du bloc droit et pointe l'index vers la zone `, ;` — pas vers `J`. |

### Mineurs de feedback-002

| # | Point | Statut | Preuve |
|---|---|---|---|
| 8 | Légendes sous 18 px | **PARTIEL** | Barre d'espace : **18 px** (était 13). Lettres : 25.52 px. Mais la légende secondaire de la rangée des chiffres reste à **16.82 px** à 1440×900, et au palier 7 (deux Maj de plus) tout descend : **22 px / 14.5 px** à 1280×800. |
| 9 | Contraste du texte de la cible | **CORRIGÉ** | Encre `rgb(31,42,45)` sur cible `rgb(237,168,82)` → **7.27:1**. |
| 10 | Teinte « main droite » variable entre vues | **PARTIEL** | La puce de V7 est devenue une touche en réduction : bon. Mais V4 utilise l'orange `#eda852` tandis que V5 et V6 peignent les touches acquises en brun `#7e3a0d` — deux vocabulaires visuels pour la même main. |
| 11 | V2 cochait avant toute frappe | **CORRIGÉ** | Premier lancement : « Je crois avoir reconnu ton clavier. Appuie sur la touche A pour vérifier. » + marque **provisoire** « je crois que c'est celui-là ». Après `(KeyQ → "a")` : la marque devient « c'est celui-là ». Après `(KeyQ→"q")`+`(KeyY→"z")` : la marque passe sur la carte QWERTZ et la ligne contextuelle bascule sur « tu tapes des nombres dès la première leçon ». |
| 12 | V1 sautée à la première session | **CORRIGÉ** | « J'ai compris » (V3) → V1. |
| 13 | « Je tape sans regarder » | **PARTIEL** | Le bouton « Remontre-moi le clavier » existe et fonctionne, le vide est réduit (mot à y≈350 sur 900). Mais le réarmement automatique est cassé (point 2 ci-dessous). |
| 14 | Aucun `ErrorBoundary` | **LIVRÉ** (`src/ui/Garde.tsx` présent ; non re-stressé cette itération). |
| 15 | Main schématique grossière | **AMÉLIORÉ** | Quatre doigts séparés, ongles, jointures — lisible comme une main. Reste le problème de visée décrit au partiel 11. |
| 16 | « Encore un bloc de gagné » | **CORRIGÉ** | Absent des 20 titres de fin de bloc observés. |

**6 critiques/majeurs sur 6 réellement corrigés, mesures à l'appui.** Aucun point n'a été annoncé corrigé sans l'être.

---

## Problèmes majeurs (nouveaux)

1. **Le critère de passage de palier (F8) est inatteignable : l'app passe TOUJOURS par le plafond anti-mur de 6 blocs.**
   Six blocs consécutifs joués **sans une seule erreur** au palier 1 (61 items). État final : `palier: 2`, `blocsSurPalier: 0`, `maitrise: {"j":[1,2,3,4,5,6],"u":[…],"s":[…],"t":[…],"e":[…],"n":[…],"f":[1]}`. Le palier ne s'est pas ouvert au mérite : il s'est ouvert **parce que `blocsSurPalier >= 6`**. Deux causes cumulées :
   - `state.tsx:87` note **une occurrence par caractère et par bloc** (`action.bilan.propres` est un ensemble). Le critère `estMaitrisee` (`length >= 3` ET `Set(blocs).size >= 2`) devient donc « 3 blocs distincts », alors que le cahier dit « **3 occurrences** réparties dans au moins **2** blocs » — 2 occurrences en bloc 1 + 1 en bloc 2 devraient suffire.
   - Le générateur ne place `f` que dans un seul mot du palier 1 (`fut`) : sur 61 items, `f` n'est apparu que dans **1 bloc sur 6**. Même avec le comptage corrigé, `f` resterait le goulot.
   Conséquence concrète : chaque enfant fera exactement 6 blocs par palier, quelle que soit sa réussite, et le message pédagogique « tu avances parce que tu maîtrises » est remplacé par un minuteur de blocs déguisé.
   → (a) noter chaque occurrence propre, pas chaque bloc : passer `bilan.propres` d'un `Set` à une liste de caractères validés ; (b) contraindre le générateur à couvrir toutes les touches à valider du palier dans chaque bloc (ou au moins tous les 2 blocs) — un test `generator.test.ts` : « sur 3 blocs simulés au palier 1, chaque touche de `touchesAValider` apparaît au moins 3 fois ». Test de régression e2e : 3 blocs parfaits au palier 1 ⇒ `palier === 2`.

2. **« Je tape sans regarder » ne se réarme jamais au mot suivant.**
   Mesuré : après le clic, l'ancêtre `_clavierMasque` passe à `height: 0 / opacity: 0 / overflow: hidden` — le masquage fonctionne. Mais après avoir tapé le mot entier (`ses` → item suivant `une`), la chaîne d'ancêtres est **inchangée** (`KeyF` reste à `y=619`, la mise en page masquée) et la barre de boutons affiche toujours `["←","Remontre-moi le clavier"]`. Le cahier (P6) et le critère Craft 10 exigent explicitement « cache le clavier **pour le mot en cours seulement**, se réarme seul au mot suivant ». En l'état, un enfant qui clique une fois joue le reste du bloc à l'aveugle sans s'en rendre compte.
   → Remettre l'indicateur à `false` dans la branche « item suivant » du reducer de `V4Lecon` (là où `curseur` est remis à 0), pas seulement au changement de bloc. Test e2e : cliquer, taper l'item, vérifier que `[data-code="KeyF"]` est de nouveau dans un conteneur de hauteur non nulle.

3. **Le bandeau « Les touches de cette leçon » ne déclare que les touches NOUVELLES du palier, alors que les items utilisent tout l'ensemble cumulé.**
   Mesuré : palier 2 → « A I R V » / premier item `vraie` ; palier 3 → « O L D B M » / item `melon` ; palier 5 → « É È À Ç » / item `cinéma` ; palier 7 → « . 0 1 2 3 4 5 6 7 8 9 » / items `artiste`, `cochon`, `quatre`. Au palier 1 les deux ensembles coïncidaient, ce qui masquait le défaut à l'itération 002. Le critère Craft 8 demande un bandeau « conforme à l'ensemble du palier », et P5 fait de cet ensemble déclaré la référence de ce qui peut être proposé : ici l'enfant lit cinq lettres et on lui en fait taper vingt.
   → Soit afficher l'ensemble cumulé, soit reformuler le bandeau en « Les nouvelles touches : … » et ajouter le rappel de l'ensemble complet ailleurs. La première option est la plus courte et satisfait le rubric tel qu'écrit.

4. **Le bandeau du palier 5 imprime des capitales accentuées : « É È À Ç ».**
   C'est un interdit explicite du cahier (« majuscules accentuées `É À È Ç Œ` ») et cela contredit la règle que l'app applique déjà correctement sur les touches : `legendes()` (`layouts.ts:249`) ne met en capitale que `/^[a-z]$/i` précisément pour éviter ça. Résultat : le bandeau annonce `É È À Ç` pendant que le clavier juste en dessous imprime `é è à ç`.
   → Réutiliser `legendes()` (ou la même garde regex) pour composer le bandeau. Test : le bandeau du palier 5 FR-FR ne contient aucun caractère de `ÉÈÀÇŒ`.

5. **Le palier 7 ne livre que des chiffres : ni majuscules, ni point.**
   20 items échantillonnés sur 2 blocs au palier 7 : `chocolat, boule, 98, nature, océan, avenir, 82, je, jeu, planète, route, 196, avis, mon bateau, fruit, 413, je, chien, jeune, train`. Aucune lettre capitale, aucun point, alors que F8 déclare pour FR-FR « chiffres 0-9, **majuscules**, point (`Maj+;`) » et que V6 promet noir sur blanc « Tu écris les nombres **et les majuscules** ». Le piège Maj — la mécanique signature du palier — ne se déclenche donc jamais que sur des chiffres, et la promesse affichée dans la carte de progression n'est pas tenue.
   → Ajouter au corpus du palier 7 des items à capitale initiale (prénoms, début de phrase court) et au moins un item avec point. Test d'invariant : le corpus du palier 7 FR-FR contient au moins un item avec `[A-Z]` et un avec `.`.

## Problèmes mineurs

6. **La pastille active coupe le bout du doigt.** À 126 px, l'index de « INDEX GAUCHE » dépasse par le haut du cercle et se fait rogner (`iter003-18`). Le recadrage a été calculé sur la largeur de main, pas sur la hauteur du doigt tendu. → Réserver ~8 % de marge haute dans `doigts/recadrage.py`, ou passer le cercle à `object-fit: contain` sur un fond de pastille.

7. **Deux touches portent `data-etat="cible"` dès la première image d'un item shifté, avant toute erreur.** Sur `918` au curseur 0, sans aucune frappe : `["ShiftLeft","Digit9"]`. F5 et le critère Craft 2 réservent le cas à deux touches au **piège** Maj. Le choix est pédagogiquement défendable (on ne peut pas taper `9` sans Maj), mais il rend le piège indiscernable de l'état normal : la seule chose qui change à l'erreur est une phrase de texte. → Soit distinguer les deux états (Maj en « ouverte accentuée » avant erreur, en « cible » pendant le piège), soit assumer et amender le rubric.

8. **Rupture de mise en page à 375 px au palier 7** (`iter003-20-resp-375-p7`) : l'étiquette verticale « LA FRONTIÈRE » chevauche la barre d'espace, les légendes tombent à **7.8-10 px**, et la pastille active est rognée par le bord gauche. Aucun débordement (`scrollWidth == innerWidth`, `scrollHeight == innerHeight` aux 5 tailles), mais l'écran n'est plus lisible. Les deux tailles exigées par le rubric (1280×800 et 1024×768) sont propres.

9. **Légendes secondaires toujours sous le plancher de 18 px** : 16.82 px à 1440×900, 14.5 px à 1280×800 au palier 7. Les mini-claviers de V5/V6 sont plus bas encore (≈11 px).

10. **Typographie du bandeau** : `innerText` donne « Les touches de cette leçon :A I R V » (espace manquante après le deux-points dans le flux ; le rendu visuel s'en sort par une marge CSS, mais l'annonce vocale et la copie de texte non). Au palier 7, le point est trié en tête : « leçon : . 0 1 2 … » se lit comme une ponctuation parasite.

11. **En niveaux de gris, la touche fausse et la touche cible sont toutes deux plus sombres que le reste** (`iter003-22` : `O` enfoncée et `J` cible ont des valeurs voisines). Elles ne se distinguent que par l'agrandissement `scale(1.16)` et le soulignement. Ça passe, mais c'est le point le plus fragile de la redondance non chromatique restante.

12. **Teinte « main droite » encore double** : `#eda852` en jeu, `#7e3a0d` pour les touches acquises de V5/V6.

## Ce qui a progressé depuis l'itération 002

- Les deux bogues critiques sont morts, et bien morts : le palier 7 a enfin une cible unique et une main juste, et la discriminabilité en niveaux de gris est mesurable (Δluminance 0.126 avec un second porteur de forme).
- Le piège Maj est devenu la vraie mécanique à deux touches décrite au cahier, teintes contralatérales comprises — c'est le plus beau geste d'interface de l'app aujourd'hui.
- La surveillance d'incohérence n'est plus du code mort : 5 frappes QWERTZ en AZERTY basculent sur V2 avec une consigne spécifique.
- V6 est passée d'un écran qui cachait 6 paliers sur 10 à un écran qui les montre tous, cadenas et promesses compris, sans un pixel de défilement.
- Les 4 photos de doigts sont enfin des photos de doigts.
- V2 ne ment plus au premier lancement (marque provisoire vs confirmée), V3 renvoie à V1, le contraste de la cible atteint 7.27:1, la lettre courante est réellement en avant.
- Robustesse : 60 frappes fausses en rafale et 8 clics rapides ne cassent rien ; localStorage tronqué démarre sur les défauts ; zéro erreur console sur un parcours plus large qu'à l'itération 002.

## Ce qui a régressé

- **Rien de mesuré comme régression franche.** Le masquage du clavier fonctionne toujours (l'ancêtre `_clavierMasque` passe bien à hauteur 0) ; c'est le réarmement, jamais testé jusqu'ici, qui est absent. L'ajout de la rangée Maj n'a produit **aucun** débordement : `scrollWidth == innerWidth` et `scrollHeight == innerHeight` à 375, 768, 1024×768, 1280×800 et 1440×900 au palier 7. Le seul effet de bord mesuré est la contraction des légendes (25.52 → 22 px pour les lettres, 16.82 → 14.5 px pour les secondaires à 1280 px).

## Suggestions pour l'itération suivante — dans cet ordre

1. **Point 1** : rendre le critère de palier atteignable. C'est le cœur pédagogique du produit et il est aujourd'hui court-circuité par le plafond anti-mur à chaque fois. Deux correctifs courts (comptage par occurrence + couverture des touches par le générateur) et deux tests.
2. **Point 2** : une ligne dans la branche « item suivant » du reducer répare le réarmement de « Je tape sans regarder ». Critère Craft 10 aujourd'hui en échec franc.
3. **Points 3 et 4 ensemble** : le bandeau. Afficher l'ensemble cumulé et le composer avec `legendes()` règle d'un coup l'incohérence de déclaration et les capitales accentuées.
4. **Point 5** : donner au palier 7 les majuscules et le point qu'il promet, sinon retirer la promesse de V6.
5. **Partiel 11** : décaler la bulle du barreau 3 pour qu'elle ne recouvre plus une touche de la leçon, et réancrer la main sous la touche visée (ou rétablir une flèche qui ne traverse pas `F`/`J`).
6. **Points 6, 9, 10** : marge haute dans le recadrage, plancher de légende secondaire, espace après le deux-points.
7. **Point 8** : décider si 375 px est une cible. Si oui, sortir « LA FRONTIÈRE » du flux du clavier et empiler les deux blocs.

## Captures

Toutes dans `gan-harness/screenshots/`, préfixe `iter003-` :
`01` premier lancement (marque provisoire) · `02`/`03` détection AZERTY puis QWERTZ · `04` après confirmation (V3) · `05` V4 premier item · `06` erreur / barreau 2 · `07` barreau 3 (bulle sur la touche `U`, main qui ne vise pas `J`) · `08` palier 7 sur un chiffre · `09` piège Maj (deux touches, teintes contralatérales) · `10` bascule d'incohérence vers V2 · `11` V6 (10 paliers visibles, deux colonnes) · `12` V5 au 4ᵉ bloc (emphase inversée) · `13` V5 · `14` V5 CH-FR · `15` bandeau Verr.Maj · `16` « Je tape sans regarder » · `17` V7 · `18` bande de doigts en gros plan · `19` V1 · `20-resp-{375,768,1024,1280,1440}-p7` responsive au palier 7 · `21` V3 · `22` niveaux de gris (leçon nettement discernable).
