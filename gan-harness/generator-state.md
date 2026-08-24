# Generator State — Iteration 003

## Ce qui a changé, point par point (feedback-002)

### Critiques

**1. Touches de la leçon indiscernables en niveaux de gris.**
Deux porteurs non chromatiques, mesurés par test :
- fond `ouverte` (`--teal-pale` / `--orange-pale`, luminance ≈ 0,79) contre fond
  `eteinte` (nouveau jeton `--touche-eteinte-fond: #ded4c1`, luminance 0,665) —
  écart **0,126**, largement au-dessus des 0,05 exigés ;
- liseré `ouverte` 2,5 px `--teinte-moyenne` contre `eteinte` 1 px.
`--encre-touche-eteinte` passe à `#4a4f45` pour rester à 5,7:1 sur le fond plus
sombre. Test : `tests/e2e/touches.spec.ts`.

**2. Palier 7 : aucune touche cible, main annoncée fausse.**
Racine : `mainDe()` ne consultait que `toucheDirecte()`. Ajout de `toucheDe()`
(direct **ou** shifté) et de `exigeMaj()` dans `core/layouts.ts` ; `mainDe()` et
la résolution de la cible dans `V4Lecon` passent toutes deux par `toucheDe()`.
Corrigé aussi dans `Keyboard.etatDe()` : la rangée des chiffres AZERTY portait
`1` en `maj` et restait éteinte au palier qui l'ouvre.
Tests : `layouts.test.ts` (10 chiffres + `.` + `ç`), `tests/e2e/palier7.spec.ts`.

### Majeurs

**3. Piège Maj = deux touches allumées.**
`ShiftLeft` / `ShiftRight` sont déclarées dans les DEUX tables (`modificateur:
true`, `large: 1.7`) et ne sont **dessinées qu'au palier 7** (`avecMaj`), pour ne
pas élargir le clavier des paliers 1-6. Dès qu'un caractère exige Maj, la touche
porteuse ET la Maj contralatérale portent `data-etat="cible"`. La consigne
annonce la bonne main et sa teinte suit cette main.
Tests : `maj.test.ts` (`mainDeLaMaj('fr-FR','8') === 'gauche'`), `palier7.spec.ts`
(exactement 2 cibles, quasi-réussite qui ne bouge pas le curseur).

**4. `doitProposerV2()` était du code mort.**
Compteur d'incohérence câblé dans le reducer de `V4Lecon` : chaque frappe porte
son verdict `frappeCoherente(id, code, key)` ; 5 d'affilée incohérentes, ou 3
items enchaînés saturés au barreau 3, dispatchent `{vue:'V2', raison:'incoherence'}`.
Toute frappe cohérente remet le compteur à zéro.
Test : `tests/e2e/incoherence.spec.ts` (bascule + remise à zéro).

**5. V6 : 6 paliers sur 10 hors cadre.**
Liste en **deux colonnes de cinq** : les dix paliers, verrous et promesses
compris, tiennent sans défilement de 1024×768 à 1440×900 (vérifié : 10 lignes
visibles). Sous 820 px ou 640 px de haut, retour à une colonne défilante **avec
dégradé de masquage** qui annonce le défilement.

**6. Lettre courante non agrandie.**
`1.14 em` + graisse 800 + soulignement : trois porteurs, dont deux non chromatiques.

**7. Recadrage commun des 4 photos.**
`doigts/recadrage.py` (PIL) repart des masters 1200-1600 px et produit un carré
unique : côté proportionnel à la largeur de main mesurée sur la boîte alpha (les
quatre carrés font 1353-1389 px de source, soit la même échelle apparente),
centré sur le doigt actif. Plus d'avant-bras, plus de poing de dos. Les
correctifs `--zoom` / `--decale` par pastille sont supprimés.

**11 (partiel iter-001). Overlay du barreau 3.**
La flèche pointillée est **supprimée** : c'est elle qui coupait le repère
tactile du `J`. La bulle du nom de la lettre porte désormais une pointe qui
désigne la touche. La main schématique est bornée par le rectangle réel de la
barre d'espace : elle ne peut plus la recouvrir.

### Mineurs

- **8.** `--legende-min` passe à 18 px (14 px sous 1100 px, 10 px sous 700 px) ;
  la barre d'espace et la rangée des chiffres suivent le même plancher.
  Test : aucune légende sous 14 px à 1280 px.
- **9.** `--teal-cible` → `#63c7b7` (7,3:1 avec `--encre`), `--orange-cible` →
  `#eda852` (7,2:1). La cible reste plus claire que l'encre et plus sombre que
  les touches éteintes. Test dans `touches.spec.ts`.
- **10.** La puce de légende de V7 est une **touche en réduction** (fond pâle +
  liseré `--teinte-moyenne`), le même vocabulaire que dans le jeu.
- **11.** V2 ne coche plus rien avant verdict, et quand le verdict vient de la
  carte du navigateur elle le DIT : « Je crois avoir reconnu ton clavier. Appuie
  sur la touche A pour vérifier. »
- **12.** « J'ai compris » (V3) mène à V1, jamais directement à V4.
- **13.** Clavier replié : hauteur nulle, le mot remonte au centre optique, et un
  bouton « Remontre-moi le clavier » revient dessus à tout moment.
- **14.** `ErrorBoundary` (`ui/Garde.tsx`) autour de l'app + `try/catch` autour de
  `speechSynthesis`.
- **15.** `MainSchematique` redessinée : quatre doigts séparés qui dépassent
  franchement, ongles, jointures, et **pouce du côté intérieur** (une main gauche
  à plat pointe son pouce vers le centre du clavier).
- **16.** « Encore un bloc de gagné » → « Encore un bloc, tranquillement ».

## Vérifications

- `npx tsc --noEmit` : vert.
- `npm run test` : 149 tests, 9 fichiers, vert.
- `npx playwright test --project=chromium` : 18 tests, vert (5 nouveaux).
- Débordement : aucun (`scrollWidth == innerWidth`, `scrollHeight == innerHeight`)
  à 375, 768, 1024×768, 1280×800, 1440×900 — V4 palier 7 (clavier le plus large,
  Maj comprises) et V6.

## Limites connues

- Sous 700 px de large, les légendes descendent à 10 px : le clavier virtuel y
  est une carte, pas une cible de frappe (l'app suppose un clavier physique).
- Les paliers 8-10 sont nommés et verrouillés, pas jouables (hors MVP).
- `illuminee` (V5/V6) reste au ton `--teinte-vive` : c'est un état d'acquisition,
  distinct de la cible, dans la même famille de teinte.

## Serveur de développement

- URL : http://localhost:3000
- Statut : en fonctionnement (nohup, `npm run dev`)
