# Évaluation — Itération 004

Testé en direct sur http://localhost:3000 (Chromium du dépôt, frappes émises en couples `(code, key)` réalistes via `KeyboardEvent` sur `window`). Périmètre mesuré : ~230 items tapés — 2 blocs parfaits FR-FR palier 1, 7 blocs enchaînés depuis le palier 3 (jusqu'au palier 6 par le mérite), sondages FR-FR paliers 2/3/5/6/7, 4 paliers CH-FR (1, 5, 6, 7), 10 mesures de mise en page (5 tailles × paliers 1 et 7), `prefers-reduced-motion` dans les deux états × réglage « Animations douces » dans les deux états, niveaux de gris en luminance relative, localStorage tronqué **et** hors domaine, 60 frappes fausses en rafale, 15 frappes redondantes sur la dernière lettre d'un item, 10 clics rapides, navigation Tab, balayage automatique anti-interdits sur 15 écrans.

## Scores

| Critère | Note | Poids | Pondéré |
|---|---|---|---|
| Design | 8 / 10 | 0.3 | 2.4 |
| Originality | 7 / 10 | 0.2 | 1.4 |
| Craft | 8 / 10 | 0.3 | 2.4 |
| Functionality | 9 / 10 | 0.2 | 1.8 |

Score pondéré : 8.0 / 10

## Verdict : PASS (seuil 7.5)

**Aucun échec disqualifiant.** Balayage automatisé (regex anglais + regex performance) sur 15 écrans : rien. Aucun WPM, aucun pourcentage, aucune seconde affichée, aucun classement, aucun compteur d'erreurs. 60 frappes fausses d'affilée : `data-curseur` reste à `0`, le mot affiché reste intact, la touche pressée passe `data-etat="fausse"` (`rgb(185,213,208)`, `scale(0.94)`) puis retombe à `ouverte` en < 400 ms, sans son. `<title>` = « Tape avec moi ». Réglage nommé « Texte plus espacé ». Aucun caractère hors ensemble sur 4 paliers CH-FR et 6 paliers FR-FR (ni `ç` ni `ù` en CH-FR avant le palier 7 ; `ç` apparaît bien au palier 7 CH-FR : *leçon*, *Garçon.*). **Zéro erreur et zéro warning console** sur les 7 vues, 12 blocs joués et les 5 tailles de fenêtre.

---

## Statut des points de feedback-003 — vérifiés un par un

| # | Point | Statut | Preuve mesurée |
|---|---|---|---|
| 1 | Critère de palier inatteignable (toujours le plafond 6 blocs) | **CORRIGÉ** | 2 blocs parfaits au palier 1 (24 items) → `palier: 2`, `blocsSurPalier: 0`. La maîtrise est bien comptée **par occurrence** : `"f":[1,1,2,2]`, `"s":[1,1,1,2,2,2,2,2,2,2]` — deux blocs distincts, ≥ 3 occurrences. Couverture du générateur vérifiée : `f`, le goulot de l'itération 003, apparaît 2 fois par bloc (*neuf*, *fut*). Enchaînement depuis le palier 3 : 7 blocs parfaits → palier 6 atteint, un palier par 1-2 blocs, jamais par le plafond. |
| 2 | « Je tape sans regarder » ne se réarme pas | **CORRIGÉ** | Clic → l'ancêtre de `KeyF` passe à hauteur 0 (`KeyF` de y=446 à y=620, masqué), bouton « Remontre-moi le clavier ». Après l'item (*ses* → *neuf*), `KeyF` revient à y=446, conteneur visible, bouton réarmé sur « Je tape sans regarder ». |
| 3 | Bandeau limité aux touches nouvelles | **CORRIGÉ** | P2 : `A E F I J N R S T U V` (11) ; P5 : `A à B C ç D E é è F G H I J L M N O P R S T U V` ; P7 : ensemble complet + `0-9` + `.`. Conforme aux items proposés. |
| 4 | Capitales accentuées « É È À Ç » | **CORRIGÉ** | Test `/[ÉÈÀÇŒ]/` sur les bandeaux des paliers 2, 3, 5, 6, 7 (FR-FR et CH-FR) : aucune occurrence. Les accentuées s'impriment en bas de casse, les ASCII en capitale. |
| 5 | Palier 7 sans majuscules ni point | **CORRIGÉ** | Bloc FR-FR : `155, 497, 219, Instant., 444, Poésie., 678, 660, 283, 300`. Bloc CH-FR : `leçon, Escargot., 144, Faire., Français., Lundi., 687, Garçon., Route.`. Sur `Rive.` : la cible est `KeyR` (main gauche, teal) **et** `ShiftRight` (orange) — règle contralatérale correcte ; sur `Poisson.` : `KeyP` (droite) + `ShiftLeft`, `data-maj="gauche"`. Piège Maj : taper `r` au lieu de `R` laisse `data-curseur` à 0 et affiche « Presque : garde la touche Maj avec ta **main droite** » ; la frappe avec Maj écrit la capitale. |
| Bulle du barreau 3 | Recouvrait la touche `U` | **CORRIGÉ** | Bulle « S » mesurée à `x:423 y:255 w:51 h:38` ; intersection avec les 41 rectangles `[data-code]` : **liste vide**. Aucune touche sous la bulle. |
| Orange unique | Deux vocabulaires (`#eda852` en jeu, `#7e3a0d` acquis) | **CORRIGÉ** | V5 et V6 : les touches illuminées mesurent `rgb(99,199,183)` (teal) et `rgb(237,168,82)` (orange) — exactement les teintes de jeu. Le brun n'est plus qu'un liseré. |
| Légendes ≥ 16 px | Plancher promis | **PARTIEL — voir majeur 2** | 16,82 px (légende secondaire) et 16 px (libellé « MAJ ») aux trois tailles utiles. Le plancher du rubric et du cahier est **18 px**, pas 16. |
| Main du barreau 3 | Ne visait pas la touche | **PARTIEL — voir majeur 3** | La main est désormais sous le bloc, index tendu vers le haut dans la colonne de `S`. Mais la touche que l'index désigne visuellement est `X` (immédiatement au-dessus du bout du doigt), pas `S` deux rangées plus haut. |
| Recadrage des pastilles | Bout du doigt rogné | **NON TRAITÉ (assumé)** | `iter004-22` : « INDEX GAUCHE » et « POUCE GAUCHE » sont coupés net par le haut du cercle. Voir majeur 1. |
| 375 px au palier 7 | Mise en page dégradée | **NON TRAITÉ (assumé) — aggravé visuellement** | `iter004-24` : les deux blocs de touches **chevauchent la barre d'espace**, l'étiquette « LA FRONTIÈRE » traverse le mot « ESPACE », légendes à 10-12 px. Voir mineur 6. |
| Deux touches `cible` avant toute erreur | Piège Maj indiscernable | **NON TRAITÉ (non annoncé)** | Voir majeur 4. |

---

## Problèmes majeurs

1. **Les photos de doigts sont amputées par le cercle de la pastille — l'asset signature de F4 est abîmé.**
   `iter004-22` : sur « INDEX GAUCHE », l'index tendu sort par le haut du cercle et se termine par un bord droit net ; sur « POUCE GAUCHE », le pouce est tranché en haut à gauche. À l'état actif (126 px) c'est frontal, à l'état pâle (74 px) c'est encore lisible. Le cahier demande explicitement « prévoir un recadrage commun des 4 photos pour une échelle apparente homogène » — l'homogénéité est atteinte, l'intégrité du doigt ne l'est pas, et le doigt EST l'information.
   → Dans `doigts/recadrage.py`, calculer la boîte sur la hauteur du doigt tendu (pas la largeur de main) et réserver 8-10 % de marge haute. Correctif de secours en une ligne : `object-fit: contain` sur l'image + fond de pastille en `background-color`, la photo n'étant alors plus clipée par le cercle. Test : la ligne de pixels du haut du cercle doit être transparente sur les 4 fichiers.

2. **Le plancher de légende annoncé à 16 px est sous l'exigence de 18 px, aux trois tailles utiles.**
   Mesuré au palier 7 : `legendeHaut` = 16 px et libellé « MAJ » = 16 px à 1024×768, 1280×800 et 1440×900 ; au palier 1 la légende secondaire de la rangée des chiffres reste à 16,82 px. Les légendes principales sont conformes (20,88-25,52 px au palier 1 ; 22 px au palier 7). Le cahier dit « étiquettes de touches 18-24 px minimum » sans distinguer principale et secondaire, et c'est la **troisième** itération où le point revient avec un plancher volontairement placé plus bas.
   → Passer `--legende-min-secondaire` à 18 px et absorber la différence sur la hauteur de touche (les blocs ont 60 px de marge basse disponible à 1024×768, cf. `iter004-25`). Si 18 px force un dépassement quelque part, l'arbitrage à documenter est de retirer la légende secondaire à cette taille, pas de la rétrécir.

3. **Au barreau 3, la main désigne la mauvaise touche.**
   `iter004-08`, cible `S` : la main est ancrée sous le bloc gauche, bout d'index à x≈437 / y≈570 ; la touche immédiatement au-dessus de ce point est `X` (y=513-567), pas `S` (y=447-503). Un enfant suit un doigt jusqu'au premier obstacle, pas jusqu'à l'extrémité d'un rayon. L'inclinaison ±38° ne résout pas le cas des colonnes centrales, où l'obstacle est aligné.
   → Faire pointer l'index **dans l'intervalle** entre les touches (décaler l'ancre d'une demi-largeur de touche), ou rétablir un trait de visée court qui parte du bout de l'index et s'arrête au bord de la touche cible en passant **entre** les touches intermédiaires — le trait n'a plus de raison de traverser `F`/`J` s'il est court et vertical.

4. **Deux touches sont `data-etat="cible"` dès la première image de tout item shifté — le piège Maj n'a plus de signature visuelle propre.**
   Mesuré sur `Rive.` avant toute frappe : `KeyR` = `bg rgb(99,199,183)`, `scale(1.16)`, `animation halo` ; `ShiftRight` = `bg rgb(237,168,82)`, `scale(1.16)`, `animation halo-droite`. Après la frappe piège (`r` sans Maj) : **snapshot strictement identique**, seule change la phrase (« Tiens la touche Maj… » → « Presque : garde la touche Maj… ») et la classe `rappelMajInsiste` sur ce texte. Le critère Craft 2 et F5 réservent le cas à deux touches au piège ; le commentaire du code (`V4Lecon.tsx:448` « seul cas où DEUX touches sont mises en avant ensemble ») décrit un comportement que le rendu ne tient pas. Conséquence pédagogique : le seul retour sur le geste raté est textuel, dans un produit dont tout le reste évite de faire porter l'information par le texte.
   → Deux états distincts sur la touche Maj : avant erreur, un état intermédiaire (liseré épais + saturation partielle, pas de halo, pas d'agrandissement) ; pendant le piège, l'état `cible` plein avec halo. Le changement est alors visible sur le clavier, là où l'enfant regarde. Test e2e : `[data-etat="cible"]` compte **1** élément au curseur 0 d'un item shifté, **2** après la frappe piège.

## Problèmes mineurs

5. **Le générateur introduit un genre « phrase » absent de P5.** Items mesurés au palier 1 : *un sujet*, *une tente*, *un jus* ; au palier 3 : *un ballon*, *mon bateau*, *la maison*. L'ordre de préférence du cahier est « vrai mot > nombre > syllabe » — le groupe de deux mots n'y figure pas. Il est défendable (c'est le seul moyen de faire taper l'espace, qui appartient à l'ensemble du palier 1, et la règle du pouce opposé est correctement exercée : *une tente* → `e` puis `pouce_droit`, *un sujet* → `n` puis `pouce_gauche`), mais c'est un genre non déclaré. → L'inscrire explicitement dans la spec/`generator.ts` comme « groupe nominal court, uniquement pour porter l'espace », ou l'aligner sur l'étiquetage des syllabes.

6. **375 px au palier 7 : chevauchement, pas seulement compression.** `iter004-24` : les deux blocs de touches recouvrent la barre d'espace (le mot « ESPACE » est traversé), l'étiquette verticale « LA FRONTIÈRE » passe par-dessus. Aucun débordement de document (`scrollWidth == innerWidth` et `scrollHeight == innerHeight` aux 5 tailles), mais deux éléments de la zone 2 se superposent. Les deux tailles exigées par le rubric (1280×800, 1024×768) sont propres — d'où le classement en mineur. → Si 375 px n'est pas une cible, le dire dans la spec ; sinon empiler bloc gauche / espace / bloc droit verticalement et sortir « LA FRONTIÈRE » du flux.

7. **La lettre courante mesure 82,08 px, au-dessus du plafond de 72 px du cahier.** Les lettres à venir sont à 72 px (plafond exact), l'agrandissement de la cible passe au-dessus. Choix cohérent avec la triple redondance, mais hors de la fourchette écrite. → Baisser la base à 64 px pour que l'agrandi retombe à ~73 px, ou amender la fourchette.

8. **En niveaux de gris, cible et touche fausse restent voisines.** `iter004-23` : `N` (cible) et `O` (pressée fausse) sont toutes deux plus sombres que le reste ; elles se séparent par l'agrandissement et l'épaisseur de liseré, pas par la valeur. Ça tient, c'est le maillon le plus fin de la redondance non chromatique.

9. **Le cadenas de la rangée des chiffres porte deux sens.** En FR-FR il signifie « il faut Maj » (10 cadenas jusqu'au palier 7, 0 ensuite) ; en CH-FR il signifie « pas encore à ton palier » (CH P1 : cadenas sur `1 2 3 8 9 0`, rien sur `4 5 6 7` ; CH P6 : aucun). Le rubric F6 attend « chiffres directs (plus de cadenas) » en QWERTZ. Le comportement observé est plus informatif que la lettre du rubric, mais le même pictogramme dit deux choses différentes selon la disposition. → Trancher explicitement dans la spec, ou distinguer les deux (cadenas = modificateur requis ; grisé simple = hors palier).

10. **Grands vides verticaux sur V4 à 1440×900.** Bande vide de 60 à 140 px (sous le bandeau) et de 690 à 760 px (entre le bouton et la bande de doigts), pendant que la rangée de pastilles d'avancement est réduite à des points de 8 px. La composition tient l'axe vertical mais ne remplit pas l'écran large.

## Ce qui a progressé depuis l'itération 003

- **Le cœur pédagogique fonctionne enfin** : le palier s'ouvre au mérite (2 blocs parfaits), le plafond anti-mur redevient un filet et non le chemin normal. C'est le correctif le plus important de l'itération et il est vérifié bout en bout, comptage d'occurrences et couverture du générateur compris.
- Le palier 7 tient sa promesse affichée dans V6 : chiffres, majuscules ASCII et point, avec la règle contralatérale correcte dans les deux sens (`KeyR`+`ShiftRight`, `KeyP`+`ShiftLeft`).
- Le bandeau dit maintenant la vérité sur ce qui va être tapé, sans capitale accentuée, avec une typographie propre dans le flux de texte.
- « Je tape sans regarder » respecte enfin sa règle : masquage pour le mot en cours, réarmement automatique.
- La bulle du barreau 3 ne recouvre plus aucune touche (intersection nulle avec les 41 rectangles de touches).
- L'orange est unique : V4, V5 et V6 peignent la même main avec la même teinte.
- Robustesse confirmée sur un périmètre élargi : 15 frappes redondantes après la fin d'un mot ne sautent aucun item, 10 clics rapides sur le masquage laissent l'état cohérent, localStorage tronqué **et** localStorage hors domaine (`palier: 99`, `disposition: "klingon"`, `maitrise: "nope"`) démarrent tous deux sur les défauts sans crash, `prefers-reduced-motion` neutralise les animations même avec le réglage « Animations douces » actif.
- 7 titres de fin de bloc consécutifs, tous distincts ; inversion d'emphase et phrase « Tu as bien travaillé. On peut s'arrêter là. » à partir du 4ᵉ bloc, « Encore » toujours accessible.

## Ce qui a régressé

- **Rien.** Aucune mesure de l'itération 003 ne s'est dégradée : contraste (9,63 sur le mot, 7,23-7,27 sur la cible), absence de débordement aux 5 tailles, zéro erreur console, détection en une frappe, bascule d'incohérence à la 5ᵉ frappe exactement (V4 après 4, V2 après 5), bandeau Verr.Maj qui apparaît et disparaît — tout est reconduit. Le chevauchement à 375 px au palier 7 est plus visible qu'à l'itération 003, mais il provient du même défaut non traité, pas d'un changement.

## Suggestions pour l'itération suivante — dans cet ordre

1. **Majeur 1** : recadrer les 4 photos avec marge haute (ou `object-fit: contain`). C'est l'asset le plus regardé de l'écran et il est visiblement coupé.
2. **Majeur 4** : donner au piège Maj une signature sur le clavier (état intermédiaire avant erreur), avec le test e2e « 1 cible au curseur 0, 2 après le piège ».
3. **Majeur 2** : monter le plancher secondaire à 18 px, ou masquer la légende secondaire plutôt que la rétrécir.
4. **Majeur 3** : viser entre les touches au barreau 3 (décalage d'une demi-touche ou trait de visée court).
5. **Mineurs 5 et 9** : déclarer le genre « groupe nominal » dans la spec et trancher la sémantique du cadenas.
6. **Mineurs 6, 7, 10** : décider si 375 px est une cible, ramener le mot cible sous 72 px agrandissement compris, resserrer les vides verticaux à 1440 px.

## Captures

Toutes dans `gan-harness/screenshots/`, préfixe `iter004-` :
`01` V4 palier 1 · `02` V5 au moment de la montée de palier · `03` palier 7 sur une capitale · `04` piège Maj · `05`/`06` masquage puis réarmement · `07` barreau 2 par inactivité · `08` barreau 3 (bulle dégagée, index qui désigne `X` au lieu de `S`) · `09-resp-{1024,768,375}-p{1,7}` responsive · `10` V5 au 4ᵉ bloc · `11` V5 · `12` V1 · `13` V6 · `14` V7 · `15` CH-FR palier 1 · `16` espace au pouce opposé · `17`/`18` V2 premier lancement puis détection QWERTZ · `19` bandeau Verr.Maj · `20` bascule d'incohérence · `21` V4 par défaut · `22` gros plan des pastilles (doigts coupés par le cercle) · `23` niveaux de gris · `24` 375 px palier 7 (chevauchement de la barre d'espace) · `25` 1024×768 palier 7 (propre) · `26` V3.
