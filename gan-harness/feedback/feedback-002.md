# Évaluation — Itération 002

Testé en direct sur http://localhost:3000 (Chromium headless piloté par le Playwright local, frappes émises en couples `(code, key)` réalistes via CDP `Input.dispatchKeyEvent`). ~150 items tapés : 5 blocs consécutifs FR-FR palier 1, 3 blocs CH-FR palier 1, 1 bloc FR-FR palier 3, 1 bloc FR-FR palier 7 (seed localStorage). 5 tailles de fenêtre mesurées, `prefers-reduced-motion` émulée, niveaux de gris simulés, localStorage corrompu, 7 vues parcourues.

## Scores

| Critère | Note | Poids | Pondéré |
|---|---|---|---|
| Design | 7 / 10 | 0.3 | 2.1 |
| Originality | 7 / 10 | 0.2 | 1.4 |
| Craft | 6 / 10 | 0.3 | 1.8 |
| Functionality | 7 / 10 | 0.2 | 1.4 |

Score pondéré : 6.7 / 10

## Verdict : FAIL (seuil 7.0)

Aucun échec disqualifiant. Vérifié explicitement sur ~150 items : aucun WPM ni chiffre de performance, aucun classement, aucun chronomètre ni décompte, aucun rouge / croix / buzzer (l'erreur est un enfoncement désaturé, le mot reste intact après 30 frappes fausses d'affilée), aucun caractère hors ensemble (FR-FR paliers 1/3/7 et CH-FR palier 1 : les nombres CH ne contiennent que `4 5 6 7`), aucune chaîne anglaise, `<title>` = « Tape avec moi », `lang="fr"`, aucune étiquette « mode dyslexie », **zéro erreur et zéro warning console** sur les 7 vues et 10 blocs.

---

## État des 18 points de feedback-001 — vérifiés un par un

| # | Point | Statut | Preuve mesurée |
|---|---|---|---|
| 1 | `legendes()` inverse la rangée CH | **CORRIGÉ** | `Digit4` : `4` @20.88 px dominante / `ç` @16.82 px secondaire. `Digit7` : `7` / `/`. Bandeau CH palier 1 = `E F J N S T U 4 5 6 7 ESPACE`, touches cohérentes. |
| 2 | `preventDefault` sur `Tab` | **CORRIGÉ** | `keydown` Tab → `defaultPrevented = false`. 3 × Tab depuis V2 → `BUTTON` à chaque fois, anneau `outline: rgb(11,90,85) solid 3px`. |
| 3 | Contraste du mot < 7:1 | **CORRIGÉ** | lettre courante `rgb(31,42,45)` = 13.3:1 ; lettres à venir `rgb(51,65,63)` = **8.9:1** ; lettres tapées `rgb(154,163,152)`. Trois états distincts. |
| 4 | CH-FR ne propose jamais de nombre | **CORRIGÉ** | 3 blocs CH joués : `["tentes","te","474",…,"675",…]`, `[…"645"…"55"…]`, `[…"576"…"644"…]` — exactement 2 nombres par bloc, tous dans l'ensemble `4 5 6 7`. |
| 5 | Gain lexical figé en V5 | **CORRIGÉ** | 5 blocs consécutifs : « tente, tenue, un sujet » / « un jus, jeunes, un » / « te, jeune, se » / « tentes, sent, juste » / « jeune, un, une ». Touches illuminées limitées aux nouvellement maîtrisées. |
| 6 | Traîne `motPrecedent` | **CORRIGÉ** | Un seul mot à l'écran, centré sur l'axe (`iter002-07`). |
| 7 | Couple cible / erreur inversé | **CORRIGÉ** | Cible = `rgb(47,162,148)` teal ou `rgb(224,138,46)` orange, `scale(1.16)`, halo `1.4s`. Erreur = teinte de base conservée + `saturate(0.1) brightness(0.72)` + `translateY` + ombre interne, disparue avant 260 ms. |
| 8 | Légendes illisibles sur les mini-claviers | **CORRIGÉ** | V5 : 20.88 px / 16.82 px. V6 et V3 lisibles. |
| 9 | Rupture à 375 px | **CORRIGÉ** | `scrollWidth == innerWidth` et `scrollHeight == innerHeight` à 375, 768, 1024×768, 1280×800, 1440×900. Mot à 48 px sous 768. |
| 10 | Bande de pastilles désalignée / illisible | **PARTIEL** | Centrage correct (groupe centré à x≈720 sur 1440). Mais le **recadrage commun exigé par F4 n'est toujours pas fait** : « index gauche » montre un avant-bras, « pouce gauche » un poing de dos, les 4 photos sont à des échelles et des angles différents (`iter002-42`). |
| 11 | Overlay du barreau 3 mal ancré | **PARTIEL** | Main ancrée au bord bas du bloc, bulle de lettre à 21 px : bien. Mais la flèche pointillée **traverse toujours la touche `J`** (repère tactile), la main recouvre la barre d'espace et la bulle recouvre la touche `7 è` (`iter002-09`). |
| 12 | Touches hors leçon à 2:1 | **CORRIGÉ** | `rgb(107,112,102)` sur `rgb(239,232,217)` = **4.16:1**. |
| 13 | Titre « VERR. MAJ » | **CORRIGÉ** | « Ton clavier écrit en grandes lettres. » + « Appuie sur la touche avec le petit cadenas pour l'éteindre. » Apparaît/disparaît avec `getModifierState`. |
| 14 | Glyphes bruts `⚙` / `🔒` | **CORRIGÉ** | Aucun `⚙ 🔒 ⭐` dans `innerText` de V1/V6. |
| 15 | V7 dispositions nues | **CORRIGÉ** | Radios illustrés (mini-claviers 2 rangées) + noms complets, bascule écrit `disposition: "fr-CH"` en storage. |
| 16 | `tu es` / phrases | **CORRIGÉ** | Absent de ~150 items ; multi-mots observés : `un sujet`, `une tente`, `un jus` — tous des groupes nominaux. |
| 17 | Aucune `aria-live` | **CORRIGÉ** | Région masquée annonçant « un sujet — Main droite, ton index » ; bandeau Verr.Maj annoncé. |
| 18 | V3 sous-dimensionné | **CORRIGÉ** | Clavier agrandi, mains 150 px, frontière étiquetée lisible (`iter002-34`). |

**15 corrigés, 2 partiels, 1 partiel.** C'est une itération sérieuse : aucun point n'a été annoncé corrigé sans l'être (contrairement au point 8 de l'itération 001).

---

## Problèmes critiques (nouveaux, à corriger)

1. **Les touches de la leçon sont indiscernables des touches éteintes en niveaux de gris.**
   Mesuré : état `ouverte` (touches de la leçon) `background: rgb(219,233,230)` → luminance relative **0.812** ; état `eteinte` `rgb(239,232,217)` → **0.804**. Écart 0.008. En simulant `grayscale(1)` (`iter002-41-greyscale-v4.png`), toutes les touches du clavier sont exactement le même gris : impossible de savoir lesquelles font partie de la leçon. L'appartenance à la leçon est portée **par la seule couleur**, ce que le cahier (P1) et le critère Design 5 interdisent explicitement — et c'est justement l'information la plus utile de l'écran après la cible.
   → Ajouter un porteur non chromatique à l'état `ouverte` : bordure 2 px pleine (les éteintes en 1 px transparent), ou un fond plus clair que le fond des éteintes d'au moins 0.06 de luminance relative, ou une ombre portée légère. Vérifier par un test : `abs(lum(ouverte) − lum(eteinte)) ≥ 0.05`, ou une différence de largeur de bordure. Le même contrôle vaut pour la pastille active (elle passe déjà : taille + anneau).

2. **Au palier 7, aucune touche cible n'est jamais allumée et le doigt annoncé est faux.**
   Bloc palier 7 joué (`iter002-24`, `iter002-25`) : items `["santé","océan","684","physique","vraie","bandit","820","problème","domino","papillon"]`. Sur l'item `840`, au curseur 0 : `document.querySelectorAll('[data-etat="cible"]').length === 0`, et `[data-code="Digit8"].dataset.etat === "eteinte"`. La bande de doigts annonce « Main gauche · ton index » alors que `Digit8` est déclarée `main: 'droite'` dans `FR_FR`. Idem pour `6` (`684`).
   Cause racine : `mainDe()` (`src/core/layouts.ts:205`) ne consulte que `toucheDirecte()`. En FR-FR aucune touche n'a `base === '8'` (la base est `_`), donc tout caractère shifté renvoie `undefined` et retombe sur un défaut « gauche » + aucune cible. Tout le contenu du palier 7 FR-FR (les 10 chiffres, le point) et le `ç` de CH-FR sont concernés : l'enfant voit un nombre et un clavier sans le moindre indice. F5 « touche cible unique » est cassé sur la totalité d'un palier livré.
   → Faire tomber `mainDe()` sur `toucheMaj()` quand `toucheDirecte()` échoue (une ligne), et faire de même partout où la cible est résolue dans `V4Lecon`. Test de régression `layouts.test.ts` : `mainDe('fr-FR','8') === 'droite'`, `mainDe('fr-CH','ç') === 'gauche'` ; test e2e : au palier 7 sur un item numérique, `[data-etat="cible"]` a exactement 1 élément.

## Problèmes majeurs (à corriger)

3. **Le piège Maj n'allume pas deux touches — il n'en allume aucune.**
   Item `840`, frappe `Digit8` sans modificateur (l'app reçoit `_`) : `cibles.length === 0`, `Digit8` reste `eteinte`, aucune touche Maj n'existe dans le dessin du clavier. Seul apparaît le texte « Presque : garde cette touche appuyée avec ta main droite ». Le critère Craft 2 demande explicitement que la cible **reste** en surbrillance « correcte » **et** que la Maj contralatérale s'allume — c'est le seul cas à deux touches du MVP, il est aujourd'hui à zéro touche.
   De plus la main annoncée est fausse : `8` est une touche de la **main droite**, la Maj doit donc être la **gauche** (règle contralatérale P8) ; l'app dit « main droite ».
   → Dessiner `ShiftLeft` / `ShiftRight` dans les deux tables (elles ont déjà le champ `nom` et `large` pour ça), puis dans l'état de quasi-réussite : conserver `data-etat="cible"` sur la touche du caractère et poser `data-etat="cible"` sur la Maj opposée à `mainDe(caractère)`. Test : `mainDeLaMaj('fr-FR','8') === 'gauche'` — le test actuel de `core/maj.ts` passe alors que l'intégration est fausse, il teste la fonction et pas le câblage.

4. **La surveillance d'incohérence de disposition n'est pas branchée — la fonction est du code mort.**
   `doitProposerV2()` (`src/core/detect.ts:75`) n'est appelée **nulle part** dans `src/` en dehors de son propre test. Vérifié en jeu : en AZERTY confirmé, 6 frappes consécutives `(KeyY → "z")` — parfaitement cohérentes QWERTZ — ne produisent rien, l'app reste sur l'item (`iter002-17-incoherence.png`). Le critère Functionality 10 et l'acceptance F7 (« 5 frappes consécutives … → l'app interrompt et affiche V2 ») sont non livrés, alors que F7 est un Must-Have Sprint 2 et que le générateur déclare Sprint 2 poursuivi.
   → Compter dans `useKeyInput` les frappes dont le couple `(code, key)` correspond à l'autre table et à aucune touche de la table courante ; remettre à 0 sur toute frappe cohérente ; à 5, dispatcher `{type:'vue', vue:'V2'}`. Idem pour les 3 items saturés au barreau 3. Ajouter `detection.spec.ts` : 5 frappes QWERTZ en AZERTY ⇒ le titre devient « Regarde ton vrai clavier ».

5. **V6 : 6 paliers sur 10 sont hors du cadre visible, dans un conteneur défilant sans aucune affordance.**
   Mesuré : `._listePaliers_1w5vb_419` a `scrollHeight 785 / clientHeight 306` sur 1440×900, sans barre de défilement visible, sans dégradé de bord, sans flèche. À l'écran on ne voit que les paliers 1 à 4 (`iter002-33-v6.png`) puis directement « Continuer la leçon ». Les paliers 8-10 verrouillés avec leur promesse — le point le plus fort de l'écran selon Originality 5 — sont invisibles pour qui ne devine pas qu'il faut faire défiler une zone qui ne l'annonce pas.
   → Soit passer la liste en deux colonnes de 5 (l'espace horizontal est libre : la liste fait 552 px de large dans 1440), soit garder une colonne et ajouter un dégradé de masquage bas + une flèche, soit réduire la hauteur des cartes. Deux colonnes est la solution la plus courte et fait tenir les 10 paliers sans défilement.

6. **La lettre courante n'est pas agrandie dans le mot.**
   Mesuré : toutes les lettres de `un sujet` à `font-size: 72px`, y compris la courante. La triple redondance de P7 (« agrandissement dans le mot + saturation pleine + halo pulsé ») se réduit à deux porteurs, et le seul porteur non chromatique restant dans le mot est le soulignement — l'écart de couleur 13.3:1 vs 8.9:1 est quasi imperceptible à l'œil.
   → Passer la lettre courante à ~1.12 em avec `display:inline-block` (pour ne pas décaler la ligne de base), ou augmenter sa graisse de 400 à 700. Le soulignement seul est trop discret pour un enfant de 7 ans.

7. **Les 4 photos de doigts ne sont toujours pas recadrées.**
   `iter002-42-sans-regarder.png` : la pastille active « index gauche » à 96 px montre un **avant-bras** vu de trois quarts, sans index identifiable ; « pouce gauche » est un poing de dos ; « pouce droit » une main à plat ; « index droit » un poing. Échelles apparentes et angles tous différents. La spec F4 demande nommément « un recadrage commun des 4 photos … pour une échelle apparente homogène » et c'est la deuxième itération où le point est signalé sans effet. C'est l'élément signature de l'addendum et il ne communique rien.
   → Recadrer les 4 sources sur un carré centré sur la **jointure du doigt actif**, même échelle de main, même angle de prise ; à défaut, remplacer par des silhouettes vectorielles cohérentes avec celles de V3. Une photo qu'on ne lit pas vaut moins qu'un pictogramme qu'on lit.

## Problèmes mineurs

8. **Deux légendes de touche sous le plancher de 18 px du cahier** : barre d'espace 13 px, rangée des chiffres verrouillée 17 px (les lettres sont à 25.5 px, conformes).
9. **La touche cible a le pire contraste de texte de toutes les touches allumées** : encre `rgb(31,42,45)` sur teal `rgb(47,162,148)` = **4.71:1**, contre 11.78:1 sur les touches ouvertes. La lettre la plus importante de l'écran est la moins lisible. Passer l'encre de la cible en crème (`#f7f3e9` sur teal donnerait ≈ 3.4:1 — insuffisant aussi) ou foncer le teal de la cible à ≈ `#1d7a6f` pour dépasser 7:1 avec l'encre foncée.
10. **La teinte « main droite » change entre les vues** : orange `rgb(224,138,46)` sur la cible de V4, brun foncé `≈#7e3a0d` pour les touches acquises de V5/V6 et pour la puce de légende de V7. Le cahier interdit qu'une touche change de teinte de base ; ici c'est le vocabulaire qui change de vue en vue. Décliner l'orange en nuances d'un même ton, ou aligner la légende V7 sur l'orange du jeu.
11. **V2 coche « Français (AZERTY) » avant la moindre frappe** au tout premier lancement (`iter002-01`), alors que la consigne dit « Appuie sur la touche A ». Un enfant suisse voit la mauvaise carte cochée sans avoir rien fait. Ne cocher qu'après un verdict réel (`getLayoutMap` concluant ou une frappe).
12. **V1 est sautée à la première session** : « J'ai compris » (V3) mène directement à V4. La boucle spécifiée est V1 → « On commence ! » → V4 ; l'enfant ne voit jamais l'accueil ni les liens « Ma carte du clavier » / « Revoir : où mettre mes doigts » avant d'avoir joué un bloc entier.
13. **« Je tape sans regarder » laisse ~500 px de vide** entre le mot et la bande de doigts, et **retire son propre bouton** : impossible de faire revenir le clavier avant la fin du mot. Remonter le mot au centre optique et garder un bouton « Remontre-moi le clavier ».
14. **Aucun `ErrorBoundary`.** En remplaçant `speechSynthesis` par un stub dont `getVoices()` renvoie un objet non conforme, l'affectation de `utterance.voice` lève et **démonte `V4Lecon`** (« The above error occurred in the `<V4Lecon>` component »). Provoqué artificiellement, mais le chemin `speechSynthesis` n'est protégé par aucun `try` et un navigateur exotique suffirait à effacer la leçon en cours. Envelopper l'appel et ajouter une frontière d'erreur autour de la vue.
15. **La main schématique (V3 et barreau 3) est une forme grossière** — une mitaine à quatre doigts collés posée sur un demi-cercle, qui se lit plus comme une tasse que comme une main. Elle détonne avec la qualité du reste du dessin.
16. **« Encore un bloc de gagné »** dans la rotation des encouragements : « gagné » est le seul mot de la liste qui relève du gain/score. Le remplacer.

## Ce qui a progressé depuis l'itération 001

- Les deux bogues critiques de blocage (légendes CH-FR, `Tab`) sont réellement corrigés, avec des régressions vérifiables.
- L'écran de leçon est passé de « maquette AI correcte » à quelque chose qu'un développeur professionnel pourrait montrer : mot centré, cible franchement lisible, séparateur « LA FRONTIÈRE » explicite, repères `F`/`J`, pastilles d'avancement propres.
- Le vocabulaire cible/erreur est enfin cohérent : la cible est claire et saturée, l'erreur est un enfoncement sombre qui retombe en moins de 260 ms.
- Le responsive est réglé aux 5 tailles testées, sans débordement ni défilement.
- V5 est vivante : titre variable (18 formulations), gain lexical tiré des items réellement joués, touches nouvellement acquises seulement.
- V6 et V7 sont passés de brouillons à des écrans finis (SVG, radios illustrés, paliers nommés par ce qu'ils ouvrent).
- Toujours zéro erreur et zéro warning console, sur davantage de parcours qu'à l'itération 001.

## Ce qui a régressé

Rien de mesuré. Les comportements validés à l'itération 001 (frappe muette, escalade 1→3, règle du pouce contralatéral, 4ᵉ bloc avec emphase inversée et « Tu as bien travaillé. On peut s'arrêter là. », persistance, corruption, Verr.Maj, reduced-motion) sont tous encore justes après vérification individuelle.

## Suggestions pour l'itération suivante — dans cet ordre

1. **Point 2** : une ligne dans `mainDe()` (repli sur `toucheMaj`) répare la cible et le doigt de tout le palier 7. C'est le plus gros ratio valeur/diff du lot. Test de régression obligatoire (`mainDe('fr-FR','8') === 'droite'`).
2. **Point 1** : donner à l'état `ouverte` un porteur non chromatique (bordure) et écrire le test de luminance. C'est le seul critère du rubric Design en échec franc.
3. **Point 4** : brancher `doitProposerV2` — la fonction et son test existent déjà, il ne manque que le compteur dans `useKeyInput` et le dispatch. Sans ça, un Must-Have Sprint 2 est absent.
4. **Point 3** : dessiner les deux Maj et faire du piège Maj le vrai cas à deux touches.
5. **Point 5** : V6 en deux colonnes de 5 paliers pour rendre 8-10 visibles sans défilement caché.
6. **Point 6** puis **point 9** : agrandir la lettre courante, foncer le teal de la cible à ≥ 7:1.
7. **Point 7** : recadrer les 4 photos. Troisième demande.
8. Points 11, 12, 13, 14 ensemble : ce sont quatre correctifs de moins de 10 lignes chacun sur des chemins que l'enfant emprunte réellement.

## Captures

Toutes dans `gan-harness/screenshots/`, préfixe `iter002-` :
`01` premier lancement (carte déjà cochée) · `02`/`03` détection AZERTY puis QWERTZ · `04` focus Tab · `05` V3 · `06`/`23`/`30` V1 · `07` V4 premier item · `08` erreur 1 · `09` barreau 3 (flèche à travers `J`, main sur l'ESPACE) · `10` après 30 frappes fausses · `11` V5 · `12` mi-mot · `13` règle du pouce · `14` V5 au 4ᵉ bloc (emphase inversée) · `15` bandeau Verr.Maj · `16`/`42` « Je tape sans regarder » · `17` incohérence non détectée · `20` V4 en QWERTZ · `24` V4 palier 7 (aucune cible) · `25` piège Maj · `26`/`31`/`32` V7 · `33` V6 (paliers 5-10 hors cadre) · `34` V3 · `35-resp-375|768|1024|1280|1440` · `40` états de touche · `41` niveaux de gris (leçon indiscernable) · `43` reduced-motion · `44` erreur mesurée.
