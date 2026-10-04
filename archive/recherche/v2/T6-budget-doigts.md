# T6 — Que coûte un mapping doigt→touche définitif, et à partir de combien de doigts ?

**Objet.** T3 a mesuré le rendement lexical des paliers **sans contrainte de
doigt** : il suppose qu'en mode débutant l'index de chaque main couvre toute sa
moitié de clavier, donc que les 31 caractères directs de l'AZERTY sont
atteignables dès la première leçon. C'est exactement la décision remise en
cause. T2 (§2.2, §6) et T4 (§1.4, §2.2) convergent : **le doigt est l'unité
pédagogique**, et ce qui prédit la performance n'est pas le nombre de doigts
mais la **stabilité du mapping doigt→touche** (Feit, Weir & Oulasvirta, CHI
2016). T4 §1.4 formule la variante conforme mot pour mot : *« mêmes paliers de
touches, mais chaque touche attribuée dès le départ à son doigt définitif, la
main restant réduite à une moitié de clavier »*. Ce rapport la chiffre.

**Verdict, en trois nombres.**

1. **Le mapping définitif ne coûte RIEN par lui-même : 0,00 point d'AUC.**
   Attribuer chaque touche à son doigt définitif ne retire aucune touche du
   pool. Tout le coût vient du **budget de doigts**, c'est-à-dire de la décision
   séparée de n'en ouvrir que quelques-uns au début.
2. **Le sas à 2 doigts (les deux index seuls) est lexicalement mort : 5 mots.**
   Pas 5 mots pour un palier de 7 touches — **5 mots avec les 12 touches des
   deux index réunies**, plafond absolu, optimum exact : *nu, but, brun, brut,
   futur*. Il faut 48 à 72 items distincts (T3 §6) pour tenir une première
   étape. L'écart est d'un facteur 10.
3. **À 4 doigts (2 index + 2 majeurs) le problème disparaît : 70 mots à
   7 touches**, contre 89 pour l'optimum sans aucune contrainte de doigt.
   **Le prix du sas à quatre doigts est donc de 19 mots, soit −21 %** — pas
   d'un ordre de grandeur.

Scripts reproductibles : `scripts/analyse/doigts.py` (carte des doigts +
solveur exact) et `scripts/analyse/t6.py` (runner). Voir
`scripts/analyse/README.md` pour les données.

---

## 0. Méthode, et ce qui change par rapport à T3

**Même lexique, mêmes métriques que T3**, pour que les chiffres soient
directement comparables : Dubois-Buyse échelon ≤ 27 croisé avec Lexique 3.83,
**3 362 mots**, pondérés par la fréquence d'usage ; métriques = *mots distincts
cumulés*, *couverture fréquentielle pondérée*, et *AUC* = moyenne de la
couverture sur les 6 paliers.

**Une amélioration de méthode.** Là où T3 cherchait le meilleur jeu de k
touches par énumération exhaustive **sur les 15 caractères les plus porteurs**
(donc une borne inférieure), T6 calcule l'**optimum exact sur tout le pool**.
Le solveur (`doigts.Solveur`) construit la transformée zeta du lexique sur les
sous-ensembles de l'alphabet (jusqu'à 2³⁰ masques, 4 Gio) puis prend l'argmax
sur les masques de popcount exactement k. Deux réductions préalables, toutes
deux **sans perte** : on ne garde que les mots entièrement typables avec
l'alphabet considéré, et on retire les caractères présents dans aucun de ces
mots (les ajouter à un jeu ne change ni le compte ni le poids — c'est le cas de
`ù`, qu'aucun des 3 362 mots ne contient, comme T3 l'avait déjà noté).

**Contrôle de cohérence avec T3.** Le solveur exact retrouve *exactement* les
chiffres heuristiques de T3 §3.b — k=5 → **27** mots (`einrt`), k=7 → **89**
(`aeimnrt`), k=9 → **227** (`aeinoprst`) — et la couverture 13,46 % de
`anoprsu` du §3.a. Les bornes inférieures de T3 étaient donc les optima.

---

## 1. La carte doigt→touche, et les écarts avec l'énoncé

Le doigt d'une touche ne dépend **pas** du caractère qu'elle produit : il dépend
de sa **position physique**. La carte est donc établie sur le `code` physique
(`KeyQ`, `Digit7`, `Semicolon`…), identique d'une disposition à l'autre, puis
`src/core/layouts.ts` dit quel caractère chaque code produit sur chaque
disposition. **Le mapping CH-FR est ainsi dérivé, pas recopié.**

### 1.a FR-FR (AZERTY) — pool débutant 31 caractères

| Doigt | Touches (caractères directs du pool) | n |
|---|---|---|
| auriculaire gauche | `a q w` | 3 |
| annulaire gauche | `s x z` **`é`** | 4 |
| majeur gauche | `c d e` | 3 |
| index gauche | `b f g r t v` | 6 |
| index droit | `h j n u y` **`è`** | 6 |
| majeur droit | `i k` | 2 |
| annulaire droit | `l o` **`ç`** | 3 |
| auriculaire droit | `m p ù` **`à`** | 4 |

### 1.b Écarts avec le mapping donné dans l'énoncé

Le mapping de l'énoncé est **exact pour les 26 lettres**. Trois écarts, tous
signalés :

| Point | Énoncé | Position physique réelle (AZERTY) | Effet sur les chiffres |
|---|---|---|---|
| `é è à ç` | non mentionnés | `é` = `Digit2` → **annulaire gauche** ; `è` = `Digit7` → **index droit** ; `ç` = `Digit9` → **annulaire droit** ; `à` = `Digit0` → **auriculaire droit** | pris en compte ; aucun effet sur les optima (§5) |
| virgule | majeur droit | `,` est sur `KeyM` en AZERTY, colonne de l'**index droit** | **nul** — aucun mot ne contient de virgule |
| point | annulaire droit | `.` est **Maj + `Comma`** en AZERTY, colonne du **majeur droit** ; il exige Maj, donc il est hors du pool débutant (palier 7) | **nul** |

Une remarque de conception, pas un écart : les quatre accentuées de l'AZERTY
vivent sur la **rangée des chiffres**, une rangée que la méthode à dix doigts
atteint par extension du doigt, pas par sa position de repos. Le §5 vérifie que
les retirer ne change aucun des optima à 5, 7 ou 9 touches.

### 1.c CH-FR (QWERTZ suisse romand) — pool débutant 29 caractères

Dérivé des mêmes codes physiques via la table `FR_CH` de `layouts.ts`.

| Doigt | Touches (caractères directs du pool) | n |
|---|---|---|
| auriculaire gauche | `a q y` | 3 |
| annulaire gauche | `s w x` | 3 |
| majeur gauche | `c d e` | 3 |
| index gauche | `b f g r t v` | 6 |
| index droit | `h j m n u z` | 6 |
| majeur droit | `i k` | 2 |
| annulaire droit | `l o` | 2 |
| auriculaire droit | `p` **`à è é`** | 4 |

**Deux différences structurelles avec l'AZERTY, et elles comptent :**

1. **Sur CH-FR, les trois accentuées sont sur le même doigt — l'auriculaire
   droit** (`è` = `BracketLeft`, `é` = `Semicolon`, `à` = `Quote`). Sur AZERTY
   elles sont réparties sur trois doigts différents. Conséquence : **un enfant
   suisse n'écrit aucun mot accentué tant que l'auriculaire droit n'est pas
   ouvert**, c'est-à-dire au dernier étage du budget. Sur AZERTY, `é` — la plus
   fréquente — arrive dès l'annulaire gauche, un étage plus tôt.
2. **`m` est sur l'index droit en CH-FR** (`KeyM`) et sur l'**auriculaire
   droit** en AZERTY (`Semicolon`). C'est la seule lettre qui change de doigt
   entre les deux dispositions, et elle change de l'extrême à l'extrême.
   Le budget « 2 index » suisse contient donc `m`, ce qui lui vaut *un* mot de
   plus que le français (6 contre 5).

L'annulaire droit suisse ne porte que **2 touches** (`l o`) contre 3 en AZERTY,
et l'annulaire gauche 3 contre 4 : le budget 6 doigts suisse plafonne à
**22 touches** contre 24 en AZERTY.

---

## 2. Ce que chaque budget de doigts permet réellement

Optimum **exact** (pas une heuristique) pour chaque budget et chaque taille de
palier. « Plafond » = ce qu'on obtient en ouvrant **toutes** les touches du
budget d'un coup ; c'est le maximum absolu que ce budget puisse jamais donner.

### 2.a FR-FR

| Budget | Doigts | Touches dispo | k | Meilleur jeu (max **mots**) | Mots | Couv. | Meilleur jeu (max **couv.**) | Mots | Couv. |
|---|---|---|---|---|---|---|---|---|---|
| **(a) index** | 2 | 12 | 5 | `bnrtu` | **4** | 0,04 % | `bnrtu` | 4 | 0,04 % |
| | | | 7 | `bfgnrtu` | **5** | 0,05 % | `bfgnrtu` | 5 | 0,05 % |
| | | | 9 | `bfghjnrtu` | **5** | 0,05 % | `bfghjnrtu` | 5 | 0,05 % |
| | | | **12 (plafond)** | `bfghjnrtuvyè` | **5** | **0,05 %** | — | — | — |
| **(b) + majeurs** | 4 | 17 | 5 | `einrt` | **27** | 1,65 % | `beinr` | 6 | 2,27 % |
| | | | 7 | `deinrtv` | **70** | 3,48 % | `beinrtv` | 52 | 4,00 % |
| | | | 9 | `deginrtuv` | **115** | 4,56 % | `bdeinrtuv` | 100 | 5,63 % |
| | | | **17 (plafond)** | `bcdefghijknrtuvyè` | **221** | **8,41 %** | — | — | — |
| **(c) + annulaires** | 6 | 24 | 5 | `einrt` | **27** | 1,65 % | `inosu` | 12 | 4,06 % |
| | | | 7 | `einorst` | **80** | 6,13 % | `inorstu` | 38 | 7,97 % |
| | | | 9 | `ceinorstu` | **207** | 12,86 % | `eilnorstu` | 188 | 13,15 % |
| | | | **24 (plafond)** | — | **1 185** | **36,04 %** | — | — | — |
| **(d) + auriculaires** | 8 | 31 | 5 | `einrt` | **27** | 1,65 % | `aprsç` | 4 | 8,37 % |
| | | | 7 | **`aeimnrt`** | **89** | 3,72 % | `anoprsu` | 18 | 13,46 % |
| | | | 9 | `aeinoprst` | **227** | 16,82 % | `ailnoprsu` | 81 | 20,67 % |
| | | | **31 (plafond)** | — | **3 256** | **97,47 %** | — | — | — |

### 2.b CH-FR

| Budget | Doigts | Touches dispo | k | Meilleur jeu (max **mots**) | Mots | Couv. | Meilleur jeu (max **couv.**) | Mots | Couv. |
|---|---|---|---|---|---|---|---|---|---|
| **(a) index** | 2 | 12 | 5 | `bnrtu` | **4** | 0,04 % | `bmrtu` | 3 | 0,07 % |
| | | | 7 | `bfmnrtu` | **6** | 0,09 % | `bfmnrtu` | 6 | 0,09 % |
| | | | 9 | `bfghmnrtu` | **6** | 0,09 % | `bfghmnrtu` | 6 | 0,09 % |
| | | | **12 (plafond)** | `bfghjmnrtuvz` | **6** | **0,09 %** | — | — | — |
| **(b) + majeurs** | 4 | 17 | 5 | `einrt` | **27** | 1,65 % | `beinr` | 6 | 2,27 % |
| | | | 7 | `deinrtv` | **70** | 3,48 % | `beinrtv` | 52 | 4,00 % |
| | | | 9 | `deimnrtuv` | **127** | 4,73 % | `bdeinrtuv` | 100 | 5,63 % |
| | | | **17 (plafond)** | `bcdefghijkmnrtuvz` | **281** | **9,73 %** | — | — | — |
| **(c) + annulaires** | 6 | 22 | 5 | `einrt` | **27** | 1,65 % | `inosu` | 12 | 4,06 % |
| | | | 7 | `einorst` | **80** | 6,13 % | `inorstu` | 38 | 7,97 % |
| | | | 9 | `ceinorstu` | **207** | 12,86 % | `eilnorstu` | 188 | 13,15 % |
| | | | **22 (plafond)** | — | **1 166** | **38,91 %** | — | — | — |
| **(d) + auriculaires** | 8 | 29 | 5 | `einrt` | **27** | 1,65 % | `adnps` | 6 | 8,28 % |
| | | | 7 | **`aeimnrt`** | **89** | 3,72 % | `anoprsu` | 18 | 13,46 % |
| | | | 9 | `aeinoprst` | **227** | 16,82 % | `ailnoprsu` | 81 | 20,67 % |
| | | | **29 (plafond)** | — | **3 249** | **95,10 %** | — | — | — |

### 2.c Les mots, en entier là où c'est court

- **(a) 2 index, AZERTY, plafond 12 touches — les 5 mots :** *nu, but, brun,
  brut, futur*. Avec 7 touches (`bfgnrtu`) : *nu, but, brun, brut, futur*
  — les mêmes cinq ; les cinq touches supplémentaires (`h j v y è`) n'en
  ajoutent aucun.
- **(a) 2 index, CH-FR, plafond — les 6 mots :** *nu, but, mur, brun, brut,
  futur*. Le seul gain est *mur*, offert par le `m` d'index droit.
- **(b) 4 doigts, k=7 (`deinrtv`), 70 mots** : *ni, net, nid, ver, vie, vin,
  dent, dire, ivre, rien, rire, rive, vent, vert, vide, vite, dette, divin,
  entre, envie, reine, rider, tenir, tente, terre, tirer, titre, veine, venir,
  vente, verre, vider, vitre, vivre, entier, entrer, envier, inerte, redire,
  rendre*… (40 premiers sur 70).
- **(c) 6 doigts, k=7 (`einorst`), 80 mots** : *ni, or, os, si, net, non, oie,
  roi, son, sot, ton, noir, note, oser, rien, rire, rose, sens, sien, soie,
  soin, soir, sort, toit, tort, entre, orner, osier, reine, reste, sinon,
  sorte, tenir, tente, terre, tirer, titre, trois, entier, entrer*… (40 sur 80).
- **(d) 8 doigts, k=7 (`aeimnrt`), 89 mots** : la liste intégrale est en
  T3 §3.b.

### 2.d Lecture

Le saut décisif est **entre 2 et 4 doigts** : de 5 mots à 221 (plafond), de
5 à 70 à 7 touches. Les deux étages suivants sont des **améliorations
marginales à taille de palier fixe** : de 70 à 80 mots en ajoutant les
annulaires, de 80 à 89 en ajoutant les auriculaires. Autrement dit, **passé
4 doigts, le budget de doigts n'est presque plus le facteur limitant du
palier 1 — c'est le nombre de touches qui l'est.**

La raison est lisible dans la carte : les deux index ne portent **aucune
voyelle sauf `u`** (`b f g r t v` / `h j n u y è`). Un mot français exige des
voyelles ; sans `e`, `i`, `a` ni `o`, il n'y a pas de mots. Les majeurs
apportent `e` et `i` — les deux voyelles les plus fréquentes — d'un seul coup.
**Le sas à deux index n'échoue pas par manque de touches (il en a 12), il
échoue par manque de voyelles.**

---

## 3. Comparaison frontale avec les deux lignes de base de T3

Toutes les valeurs sont l'**optimum exact** du jeu de 7 touches, même lexique,
même métrique.

| Ligne | Jeu de 7 touches | Doigts distincts mobilisés | Mots | Couverture | vs palier 1 actuel |
|---|---|---|---|---|---|
| **Palier 1 actuel** (T3 §2) | `e f j n s t u` | **4** — MaG, AnG, InG, InD | **13** | 0,64 % | — |
| **Optimum sans contrainte de doigt** (T3 §3.b) | `a e i m n r t` | **6** — AuG, MaG, InG, InD, MaD, AuD | **89** | 3,72 % | ×6,8 |
| Budget **(a) 2 index** | `b f g n r t u` | **2** — InG, InD | **5** | 0,05 % | **×0,38** |
| Budget **(b) 4 doigts** | `d e i n r t v` | **4** — MaG, InG, InD, MaD | **70** | 3,48 % | ×5,4 |
| Budget **(c) 6 doigts** | `e i n o r s t` | **6** — AnG, MaG, InG, InD, MaD, AnD | **80** | 6,13 % | ×6,2 |
| Budget **(d) 8 doigts** | `a e i m n r t` | **6** (8 autorisés) | **89** | 3,72 % | ×6,8 |

*(AuG/AnG/MaG/InG = auriculaire, annulaire, majeur, index gauches ; InD/MaD/AnD/AuD à droite.)*

Trois constats.

1. **Le palier 1 actuel mobilise déjà quatre doigts distincts** — `e`(majeur
   gauche), `s`(annulaire gauche), `f t`(index gauche), `j n u`(index droit).
   Ce ne sont pas les quatre doigts du budget (b) : il utilise l'**annulaire
   gauche** là où le budget (b) utilise le **majeur droit**, et il n'ouvre
   qu'**un seul doigt de la main droite**. Le mode « 4 doigts » de l'app n'a
   donc jamais été une contrainte sur le *choix* des touches — c'est une
   consigne sur le *doigt qui les frappe*. Et cette consigne est **déjà
   conforme à la carte définitive pour 5 des 7 touches** : en mode 4 doigts,
   `f t` sont frappés par l'index gauche et `j n u` par l'index droit — ce
   sont bien leurs doigts définitifs. Seuls **`e` (majeur gauche) et `s`
   (annulaire gauche)** sont frappés par le mauvais doigt. Le passage au
   mapping définitif ne rééduque donc que deux touches sur sept au palier 1.
2. **Le budget 2 index fait pire que le palier 1 actuel** — 5 mots contre 13.
   C'est le seul budget qui dégrade une ligne de base que T3 jugeait déjà
   insuffisante.
3. **Dès 4 doigts, on récupère 79 % de l'optimum libre** (70/89) et on bat le
   palier 1 actuel d'un facteur 5,4. Et l'optimum libre `a e i m n r t`
   n'exige lui-même que **6 doigts** — jamais 8.

---

## 4. Le meilleur parcours complet en 6 étapes sous contrainte de doigt

### 4.a Le point de méthode qui décide de tout

**Attribuer chaque touche à son doigt définitif ne restreint aucun jeu de
touches.** La carte est une bijection touche→doigt : si les huit doigts sont
autorisés, toute touche du pool reste ouvrable, donc l'espace de recherche est
exactement celui de T3. **Le coût de la contrainte « doigt définitif », prise
seule, est de 0,00 point d'AUC — et ce n'est pas une mesure, c'est une
identité.** Le calcul le confirme (variante V4 ci-dessous : AUC identique à
R0 au centième près).

Tout ce qui coûte vient d'une **seconde** décision, séparable : n'ouvrir que
certains doigts au début. C'est ce budget qu'on chiffre ici, sur une échelle de
quatre variantes, à profil de tailles identique à T3 (FR-FR 7-5-5-5-5-4,
CH-FR 7-5-5-5-4-3), l'ordre des paires suivant la dextérité
(index → majeurs → annulaires → auriculaires).

### 4.b FR-FR

Références : ordre **actuel** de l'app AUC couv. **54,62 %** / AUC mots 1 674,7.
Optimum **sans contrainte de doigt** (R0, méthode T3, faisceau + recuit) :
AUC couv. **67,86 %** / AUC mots 2 019,3 — `arsonup / eitml / cdvfb / éhgqè /
jxçày / zwkù`. *(T3 §3.a publiait 67,41 % sous contrainte d'équilibre des
mains ; la recherche relancée ici, sans cette contrainte, trouve 67,86 %.
Comme dans T3, ce sont des bornes inférieures.)*

| Variante | Doigts à l'étape 1 | Étapes d'ouverture des paires | Mots à l'étape 1 | AUC couv. | **Δ vs R0** | AUC mots | Parcours |
|---|---|---|---|---|---|---|---|
| **V1** index seuls, puis 1 paire/étape | 2 | (1, 2, 3, 4) | 5 | 53,63 % | **−14,23 pt** | 1 786,0 | `rnutvfb / eicdh / solég / apmqè / jxçày / zwkù` |
| **V2** index+majeurs, puis 1 paire/étape | 4 | (1, 1, 2, 3) | 52 | 63,29 % | **−4,56 pt** | 1 989,3 | `erintvb / soucl / apmdf / éhgqè / jxçày / zwkù` |
| **V3** 6 doigts, auriculaires à l'étape 2 | 6 | (1, 1, 1, 2) | 38 | 66,94 % | **−0,91 pt** | 2 022,7 | `risonut / eapml / cdvfb / éhgqè / jxçày / zwkù` |
| **V4** doigt définitif, aucun budget | 8 | (1, 1, 1, 1) | 18 | **67,86 %** | **±0,00 pt** | 2 019,3 | `arsonup / eitml / cdvfb / éhgqè / jxçày / zwkù` |

Détail du meilleur parcours utilisable, **V2 (4 doigts au départ)** :

| Palier | Nouvelles touches | Doigts ouverts | Mots cumulés | Nouveaux | Couverture cumulée | Gain |
|---|---|---|---|---|---|---|
| 1 | `e r i n t v b` | 4 (index + majeurs) | 52 | +52 | 4,00 % | +4,00 pt |
| 2 | `s o u c l` | 6 (+ annulaires) | 482 | +430 | 21,55 % | +17,55 pt |
| 3 | `a p m d f` | 8 (+ auriculaires) | 1 897 | +1 415 | 71,30 % | +49,75 pt |
| 4 | `é h g q è` | 8 | 3 019 | +1 122 | 88,44 % | +17,14 pt |
| 5 | `j x ç à y` | 8 | 3 230 | +211 | 97,00 % | +8,56 pt |
| 6 | `z w k ù` | 8 | 3 256 | +26 | 97,47 % | +0,46 pt |

**AUC couverture 63,29 % — soit −4,56 pt contre l'optimum libre, mais
+8,67 pt contre l'ordre actuellement livré.**

### 4.c CH-FR

Références : ordre **actuel** AUC couv. **53,83 %** / AUC mots 1 672,3 ;
R0 **67,07 %** / 2 017,0 — `rasonup / eitml / cdvfb / éhgqè / jxày / zwk`.

| Variante | Doigts à l'étape 1 | Ouvertures | Mots à l'étape 1 | AUC couv. | **Δ vs R0** | AUC mots | Parcours |
|---|---|---|---|---|---|---|---|
| **V1** index seuls | 2 | (1, 2, 3, 4) | 6 | 53,61 % | **−13,45 pt** | 1 797,7 | `rnutmfb / eicdv / solhg / apéqè / jxày / zwk` |
| **V2** index+majeurs | 4 | (1, 1, 2, 3) | 41 | 62,66 % | **−4,41 pt** | 1 990,5 | `erintcb / souml / apdfv / éhgqè / jxày / zwk` |
| **V3** 6 doigts | 6 | (1, 1, 1, 2) | 38 | 66,15 % | **−0,91 pt** | 2 020,3 | `risonut / eapml / cdvfb / éhgqè / jxày / zwk` |
| **V4** aucun budget | 8 | (1, 1, 1, 1) | 18 | **67,07 %** | **±0,00 pt** | 2 017,0 | `rasonup / eitml / cdvfb / éhgqè / jxày / zwk` |

**Les deux dispositions donnent le même verdict au dixième de point près**
(−14,23 / −13,45 à 2 doigts ; −4,56 / −4,41 à 4 doigts ; −0,91 / −0,91 à
6 doigts). La contrainte de doigt ne pénalise pas la Suisse plus que la France.

### 4.d Balayage libre de l'ordre des paires de doigts

462 calendriers réalisables pour FR-FR, 410 pour CH-FR (24 ordres de paires ×
assignations monotones aux 6 étapes ; faisceau allégé pour le balayage, top 8
re-raffiné au faisceau plein — donc bornes inférieures, comme dans T3).

**Aucun ordre d'ouverture des doigts ne fait mieux que tout ouvrir d'emblée.**
Le maximum du balayage est exactement R0 (67,86 % FR-FR, 67,07 % CH-FR),
atteint par toutes les variantes qui ouvrent les 8 doigts à l'étape 1.

Un résultat non trivial en sort : **une variante à 6 doigts atteint le maximum
absolu** — `index → annulaires → auriculaires → majeurs`, majeurs ouverts à
l'étape 2, AUC 67,86 %, identique à R0. La raison est lisible dans le jeu
optimal `a r s o n u p` : `a`(AuG) `r`(InG) `s`(AnG) `o`(AnD) `n`(InD) `u`(InD)
`p`(AuD) — il n'utilise **aucun majeur**. Le meilleur palier 1 du français
n'a pas besoin des majeurs ; il a besoin des auriculaires et des annulaires,
c'est-à-dire **exactement les doigts que l'ordre de dextérité met en dernier**.

**Le coût de 4,56 points de V2 n'est donc pas le prix des « quatre doigts » :
c'est le prix d'avoir choisi *ces* quatre doigts-là.**

---

## 5. Sensibilité : et sans la rangée des chiffres ?

Les quatre accentuées de l'AZERTY (`é è à ç`) sont sur la rangée des chiffres,
que la méthode à dix doigts atteint par extension. En les retirant du pool
(31 → 27 caractères ; CH-FR est inchangé, ses accentuées sont sur les rangées
alphabétiques) :

| Budget | k=5 | k=7 | k=9 | Plafond avec / sans les chiffres |
|---|---|---|---|---|
| (a) 2 index | 4 → **4** | 5 → **5** | 5 → **5** | 5 → 5 |
| (b) 4 doigts | 27 → **27** | 70 → **70** | 115 → **115** | 221 → 210 |
| (c) 6 doigts | 27 → **27** | 80 → **80** | 207 → **207** | 1 185 → 951 |
| (d) 8 doigts | 27 → **27** | 89 → **89** | 227 → **227** | 3 256 → 2 653 |

**Aucun optimum à 5, 7 ou 9 touches ne change.** Les accentuées ne sont jamais
dans un jeu de palier 1 optimal — elles ne pèsent que sur les plafonds, donc
sur les paliers tardifs. La conclusion du §2 est insensible à ce choix.

---

## 6. La question décisive : à partir de quel budget y a-t-il de quoi taper ?

Besoin établi par T3 §6 : **48 items distincts** au minimum (6 blocs de 8),
**72** pour ne jamais répéter au plafond anti-mur de 6 blocs de 12.

| Budget | Touches dispo | Plafond mots | k mini pour **48** | k mini pour **72** |
|---|---|---|---|---|
| **(a) 2 index** — FR | 12 | **5** | **jamais** | **jamais** |
| **(a) 2 index** — CH | 12 | **6** | **jamais** | **jamais** |
| **(b) 4 doigts** — FR | 17 | 221 | **6** (`einrtv` → 50) | **8** (`deinrtuv` → 91) |
| **(b) 4 doigts** — CH | 17 | 281 | **6** (`einrtv` → 50) | **8** (`eimnrtuv` → 92) |
| **(c) 6 doigts** — FR | 24 | 1 185 | **6** (`einrtv` → 50) | **7** (`einorst` → 80) |
| **(c) 6 doigts** — CH | 22 | 1 166 | **6** (`einrtv` → 50) | **7** (`einorst` → 80) |
| **(d) 8 doigts** — FR | 31 | 3 256 | **6** (`einrtv` → 50) | **7** (`aeimnrt` → 89) |
| **(d) 8 doigts** — CH | 29 | 3 249 | **6** (`einrtv` → 50) | **7** (`aeimnrt` → 89) |

**Réponse : quatre doigts. Et le résultat est identique sur les deux
dispositions.**

- **À 2 doigts, le seuil est inatteignable par construction**, quelle que soit
  la taille du palier : le plafond absolu est de 5 mots (FR) et 6 (CH). Il
  manque un facteur 10. **Ce n'est pas un problème d'optimisation, c'est une
  impossibilité** — les deux index ne portent qu'une seule voyelle, `u`.
- **À 4 doigts, 6 touches suffisent pour 48 items** (`e i n r t v`, 50 mots) et
  **8 touches pour 72** (`d e i n r t u v`, 91 mots FR ; `e i m n r t u v`,
  92 mots CH). Avec les 7 touches du profil actuel : **70 mots** — au-delà de
  48, juste en deçà de 72.
- Les 6 et 8 doigts ne font gagner qu'**une touche** sur le seuil de 72 (7 au
  lieu de 8). C'est le seul bénéfice mesurable des annulaires et des
  auriculaires sur cette question.

**Recommandation chiffrée : un palier 1 à 4 doigts et 8 touches
(`d e i n r t u v`, 91 mots FR / `e i m n r t u v`, 92 mots CH) satisfait les
deux seuils de T3 et coûte une touche de plus à valider.** À 7 touches, il faut
accepter 70 mots — suffisant pour 6 blocs de 8, à 2 items près de 6 blocs de 12.

---

## 7. Vérification de l'hypothèse inverse : le prix réel du sas à quatre doigts

Le mode actuel (index = toute la moitié de clavier) ouvre 31 caractères dès
l'étape 1. Combien un palier 1 y gagne-t-il **réellement** contre le meilleur
budget de 4 doigts ? C'est cet écart, et lui seul, qui chiffre le prix du sas.

| Taille du palier 1 | Mode actuel (31 car.) | 2 doigts | 4 doigts | 6 doigts | **Prix du sas à 4 doigts** |
|---|---|---|---|---|---|
| **k = 5** | 27 (`einrt`) | 4 | **27** (`einrt`) | 27 | **0 mot — 0 %** |
| **k = 7** | 89 (`aeimnrt`) | 5 | **70** (`deinrtv`) | 80 | **19 mots — −21 %** |
| **k = 9** | 227 (`aeinoprst`) | 5 | **115** (`deginrtuv`) | 207 | **112 mots — −49 %** |

CH-FR : k=5 → 0 mot d'écart ; k=7 → 19 mots (−21 %) ; k=9 → **100 mots**
(−44 %, 127 contre 227).

**Trois lectures, dans l'ordre de ce qu'elles impliquent.**

1. **À la taille de palier réellement livrée (7 touches), le sas à quatre
   doigts coûte 19 mots sur 89, soit 21 %.** Ce n'est pas un effondrement.
   L'ordre de grandeur est le même que le déficit que T3 reproche déjà à
   l'ordre actuel — et il va dans le sens inverse : le palier 1 actuel en est
   à 13 mots, donc **passer au meilleur palier 1 sous contrainte de 4 doigts
   (70 mots) reste un gain de ×5,4**, même en payant les 19 mots du sas.
2. **Le prix croît vite avec la taille du palier.** À 5 touches il est nul, à
   7 il est de 21 %, à 9 il est de 49 %. Le sas à quatre doigts est donc
   compatible avec des **paliers courts** et incompatible avec des paliers
   larges — ce qui contraint le profil de tailles autant que le choix des
   touches.
3. **Le sas à deux doigts, lui, n'a pas de prix : il a un plafond.** 5 mots,
   quelle que soit la taille du palier, quel que soit le nombre de blocs. Sur
   cet axe la question n'est pas « combien ça coûte » mais « est-ce que ça
   fonctionne », et la réponse est non.

---

## 8. Conclusion

**Le mapping doigt→touche définitif ne coûte rien : 0,00 point d'AUC.** C'est
une identité, pas une mesure — la carte est une bijection, elle ne retire aucune
touche du pool. La recommandation de T4 §1.4 (*« chaque touche attribuée dès le
départ à son doigt définitif »*) est **gratuite en rendement lexical**, et elle
supprime le risque de ré-apprentissage que T4 §2.1 documente. Il n'y a pas
d'arbitrage à faire sur ce point : c'est un gain sec.

**Ce qui coûte, c'est le budget de doigts, et le coût est très inégal.**

| Budget à l'étape 1 | Mots au palier 1 (7 touches) | AUC couv. FR-FR | Δ vs optimum libre | Tient 48 items ? | Tient 72 ? |
|---|---|---|---|---|---|
| 2 doigts (index) | **5** | 53,63 % | −14,23 pt | **non, jamais** | **non, jamais** |
| 4 doigts (+ majeurs) | **70** | 63,29 % | −4,56 pt | **oui** (dès 6 touches) | à 8 touches |
| 6 doigts | **80** | 66,94 % | −0,91 pt | oui | à 7 touches |
| 8 doigts | **89** | 67,86 % | ±0,00 pt | oui | à 7 touches |

1. **Le sas à deux index est à écarter, et pour une raison qui n'est pas
   pédagogique mais arithmétique.** Les deux index ne portent qu'une voyelle
   (`u`). Le plafond absolu est de **5 mots français** (`nu, but, brun, brut,
   futur`) avec les douze touches réunies, contre 48 à 72 requis. Aucun choix
   de touches, aucune taille de palier, aucun corpus n'y change quoi que ce
   soit. C'est cohérent avec T4 §1.4 : *« la restriction aux index n'existe
   nulle part »* dans les curricula, et KWT progresse par « moins de touches,
   moins de mains, **mais les bons doigts** ».
2. **Quatre doigts suffisent, et c'est le seuil.** 70 mots à 7 touches, 91 à 8,
   50 dès 6. Le passage de 2 à 4 doigts vaut **+9,66 points d'AUC** ; les deux
   étages suivants n'en valent que +3,65 puis +0,92. Le rendement décroît d'un
   facteur 10 après le deuxième étage.
3. **Le prix du sas à quatre doigts, à la taille de palier livrée, est de
   19 mots sur 89 — 21 %.** Il est nul à 5 touches et atteint 49 % à
   9 touches : le sas contraint le profil de tailles vers des paliers courts.
4. **Le coût des 4,56 points de V2 n'est pas dû au nombre de doigts mais à
   leur choix.** Le meilleur palier 1 du français, `a r s o n u p`, mobilise
   les index, les annulaires et les auriculaires — et **aucun majeur**. Une
   ouverture à 6 doigts dans cet ordre atteint exactement l'optimum libre
   (67,86 %). L'ordre de dextérité index→majeurs→annulaires→auriculaires, qui
   est le consensus du marché relevé par T2 §2.2, est donc **le pire ordre
   possible du point de vue du rendement lexical français** : il garde pour la
   fin les doigts qui portent `a`, `o`, `s` et `p`.
5. **CH-FR ne change pas le verdict** : mêmes seuils, mêmes plafonds à l'unité
   près, écarts d'AUC identiques au dixième de point. Deux particularités à
   noter tout de même — `m` y est sur l'index droit (et non sur l'auriculaire),
   ce qui vaut un mot de plus au budget 2 index et 12 mots de plus au budget
   4 doigts à 9 touches (127 contre 115) ; et **les trois accentuées `à è é`
   y sont toutes sur l'auriculaire droit**, donc inaccessibles tant que le
   dernier étage du budget n'est pas ouvert.

### Ce que ces chiffres tranchent, et ce qu'ils ne tranchent pas

Ils tranchent que **le sas doit être à quatre doigts au minimum**, que le
mapping définitif est gratuit, et que l'ordre de dextérité coûte des points
qu'un ordre `index → annulaires/auriculaires → majeurs` ne coûterait pas.

Ils ne tranchent **pas** le choix entre l'ordre de dextérité et l'ordre
lexicalement optimal : le premier a pour lui le consensus curriculaire (T2
§2.2, §6) et la dextérité différentielle des doigts, le second a pour lui
4,56 points d'AUC. Un enfant qui n'arrive pas à frapper `a` de l'auriculaire
gauche ne tapera aucun des 18 mots de `a r s o n u p`, et **aucune donnée de
T2 ni de T4 ne dit à quel âge l'auriculaire est utilisable** — T4 §1.3 note
qu'aucune mesure anthropométrique main-enfant/clavier n'existe, et que
« les deux camps argumentent sans données ». Ce rapport chiffre le côté
lexical de la balance ; l'autre côté reste non mesuré.

### Limites

- **Le lexique est celui de T3**, avec les mêmes faiblesses reconnues
  (Dubois-Buyse omet 47 des 100 formes les plus fréquentes). T3 §4 a vérifié
  que le verdict survit sur Lexique383 top-5000 ; ce contrôle n'a **pas** été
  refait ici pour les budgets de doigts. Le sens des écarts ne peut pas
  s'inverser — le budget 2 index n'a qu'une voyelle quel que soit le lexique —
  mais leur amplitude pourrait varier, comme elle variait de 12,8 à 11,9 points
  dans T3 §4.
- **Les optima de jeux de k touches (§2, §3, §6, §7) sont EXACTS**, pas des
  bornes inférieures : transformée zeta sur tous les sous-ensembles, argmax sur
  les masques de popcount k. **Les AUC de parcours (§4) restent des bornes
  inférieures** (faisceau + recuit), comme dans T3.
- **Le pouce et la barre d'espace sont hors périmètre** : l'espace n'est jamais
  une lettre de mot, il n'entre dans aucune des métriques.
- La carte doigt→touche retenue est le **doigté standard à dix doigts** (index
  sur deux colonnes, auriculaire sur la colonne extérieure plus la rangée des
  chiffres à sa gauche). D'autres doigtés existent — Feit et al. 2016 en
  relèvent 4 pour la main gauche et 6 pour la droite chez les autodidactes.
  Le calcul ne vaut que pour le doigté standard, qui est celui qu'un curriculum
  enseigne.
- Le mode « 4 doigts » actuel de l'app n'a **aucune carte doigt→touche dans le
  code** : `src/core/doigts.ts` ne déclare que quatre états
  (`index_gauche`, `pouce_gauche`, `pouce_droit`, `index_droit`). Adopter le
  mapping définitif exige d'écrire cette table — elle n'existe pas encore.

---

*Données : échelle Dubois-Buyse (o.bacquet.free.fr) ; Lexique 3.83
(lexique.org, CC-BY-SA) ; carte doigt→touche dérivée des codes physiques de
`src/core/layouts.ts`. Scripts : `scripts/analyse/doigts.py` et
`scripts/analyse/t6.py`. Analyse menée le 29 août 2026 sur le code du dépôt à
cette date.*

RAPPORT T6 TERMINÉ
