# T3 — L'ordre des paliers est-il « optimisé par rendement lexical » ?

**Objet.** Le cahier (§4.3) écrit : *« Paliers 1 à 6 — le sas débutant, quatre
doigts. […] Ordre optimisé par rendement lexical, pas par rangée. »* Cette
affirmation n'avait jamais été confrontée à des données. Elle l'est ici.

**Verdict, en une ligne : l'affirmation est fausse telle qu'elle est écrite.**
L'ordre actuel est optimisé sur la **fréquence des lettres**, pas sur le
**rendement en mots**. Le palier 1 ouvre **13 mots** du lexique 7-12 ans quand
un palier de 7 touches peut en ouvrir **89**. Chiffres et alternatives ci-dessous.

Scripts reproductibles : `scripts/analyse/` (voir son `README.md`).
Données extraites du code réel (`src/core/paliers.ts`, `corpus.ts`,
`layouts.ts`) via `scripts/analyse/dump-app.mjs`, jamais recopiées du cahier.

---

## 1. Le lexique de référence

`src/core/corpus.ts` ne contient pas un lexique mais **le corpus de jeu** :
321 items écrits à la main (286 mots simples + 35 suites de mots). Il ne peut
pas servir de juge — il a été écrit *pour* les paliers actuels, donc les valider
avec lui est circulaire. Deux sources libres ont été téléchargées à la place.

| Source | Ce qu'elle apporte | Taille | Licence / accès |
|---|---|---|---|
| **Échelle Dubois-Buyse** (Ters, Mayer, Reichenbach — OCDL), version texte diffusée par `o.bacquet.free.fr` | l'**adéquation à l'âge** : chaque mot porte un « échelon » scolaire de 1 à 43 | 3 726 mots | libre au téléchargement |
| **Lexique 3.83** (lexique.org) | la **fréquence d'usage** : `freqlivres` et `freqfilms2`, occurrences par million | 142 694 formes | CC-BY-SA |

Manulex (fréquences en manuels scolaires) aurait été la source idéale : elle
n'est distribuée que sur demande nominative par formulaire, donc inutilisable ici.

**Lexique retenu** : mots Dubois-Buyse d'échelon ≤ 27 — la table du barème donne
CP = 1-7, CE1 = 8-11, CE2 = 12-15, CM1 = 16-19, CM2 = 20-23, 6ᵉ = 24-27, soit
exactement **6 à 12 ans** — pondérés par la fréquence Lexique383 de la forme.
Après retrait des formes à espace, trait d'union ou apostrophe (interdites par
le cahier §4.7) : **3 362 mots**, dont 4 seulement absents de Lexique383.

### Faiblesse de ce lexique, dite franchement

Dubois-Buyse est une **échelle de difficulté orthographique**, pas un lexique
d'usage : elle omet la quasi-totalité des mots grammaticaux. Sur les 100 formes
les plus fréquentes de Lexique383, **47 sont absentes** — *de, la, et, à, le,
il, les, un, je, des, une, en, qui, ne, elle, du, se, est, au, on, me, nous, sa,
était, vous, avait, ses, y, que, ce, a, ils, dit, tu, ou, cette, mon, ai, aux,
moi, où, ma, ces, mes, leurs, te, quelques*. Le mot **`où` n'y figure pas**, et
**aucun des 3 726 mots ne contient `ù`** — ce qui prive le palier 6 de sa
justification écrite dans le cahier (« `ù` fait un item dédié amusant »).

Tout le §4 rejoue donc la mesure sur un second lexique indépendant (les 5 000
formes les plus fréquentes de Lexique383, mots grammaticaux inclus) pour
vérifier que le verdict ne tient pas au choix de la source. Il tient.

### Deux métriques, pas une

- **Mots distincts cumulés** : combien de mots l'enfant peut réellement taper.
  C'est la métrique qui décide s'il y a de quoi remplir des blocs.
- **Couverture pondérée par la fréquence** : quelle part du texte français
  courant devient typable. C'est la métrique « rendement » au sens usuel.
- **AUC** : moyenne de la métrique sur les 6 paliers. Elle récompense un
  déblocage **précoce** — c'est la traduction chiffrée de « au plus tôt ».

---

## 2. L'ordre actuel, mesuré — FR-FR

Pool ouvrable dans le sas débutant : les 31 caractères que l'AZERTY produit
**sans modificateur** (26 lettres + `é è à ç ù`). Sur les 3 362 mots du lexique,
**3 256 (96,8 %)** sont atteignables avec tout le pool ; les 106 restants
exigent `ê â î ô û ï` (touches mortes, palier 10, hors MVP) — *même, être, tête,
côté, plutôt, âge, bientôt, fenêtre*…

| Palier | Nouvelles touches | Mots cumulés | Nouveaux mots | Couverture fréq. cumulée | Gain |
|---|---|---|---|---|---|
| 1 | `e f j n s t u` | **13** | +13 | **0,64 %** | +0,64 pt |
| 2 | `a i r v` | 247 | +234 | 12,64 % | +12,00 pt |
| 3 | `o l d b m` | 1 155 | +908 | 45,36 % | +32,72 pt |
| 4 | `g h p c` | 2 408 | +1 253 | 80,60 % | +35,25 pt |
| 5 | `é è à ç` | 2 972 | +564 | 91,04 % | +10,43 pt |
| 6 | `q w x y z ù` | 3 253 | +281 | 97,46 % | +6,43 pt |

**AUC couverture = 54,62 % — AUC mots = 1 674,7.**

Les 13 mots du palier 1, en entier : *nu, feu, jeu, net, neuf, sens, effet,
jeune, juste, sujet, tente, tenue, jeunesse*.

### Ce sur quoi l'ordre est réellement optimisé

Classement des 30 caractères du pool par fréquence pondérée dans le lexique :

```
e1 r2 a3 i4 s5 n6 o7 u8 t9 p10 m11 l12 c13 d14 v15 f16 b17 é18 h19 g20 q21 j22 è23 x24 ç25 à26 y27 z28 w29 k30
```

Le palier 1 prend `e`(1), `s`(5), `n`(6), `u`(8), `t`(9) — **cinq des neuf
lettres les plus fréquentes** — plus `f`(16) et `j`(22), qui sont les deux
**repères tactiles** imposés par §4.4. C'est un choix cohérent et défendable :
il est optimisé **par lettre**. Mais taper un mot exige *toutes* ses lettres :
en laissant `a`, `i`, `r`, `o` au palier suivant, ce jeu ne ferme presque aucun
mot. D'où 13 mots, et 0,64 % de couverture.

**Caractère du pool jamais ouvert en P1-P6 : `k`.** Il n'apparaît nulle part
dans les paliers 1 à 7 — l'enfant termine le MVP sans avoir jamais tapé une
lettre de l'alphabet. Le coût lexical est nul (3 mots concernés : *kilogramme,
kilomètre, képi*), le coût symbolique ne l'est pas.

---

## 3. Un meilleur ordre existe — FR-FR

Recherche par faisceau (largeur 25, 13 candidats par palier) puis recuit par
échanges, objectif = AUC de couverture. **Contrainte respectée dans tous les
cas** : chaque touche est une touche directe, donc atteignable par l'index de
sa moitié de clavier en mode 4 doigts ; aucune touche shiftée ni morte.

### 3.a Optimum sous contrainte d'équilibre des mains (recommandé)

Contrainte ajoutée : **au moins 2 touches de chaque moitié du clavier par
palier** — pour que le mode 4 doigts fasse travailler les deux mains dès le
début. Elle ne coûte rien : ce découpage est le meilleur trouvé, toutes
recherches confondues.

| Palier | Nouvelles touches | Mots cumulés | Nouveaux mots | Couverture fréq. cumulée | Gain | Mains |
|---|---|---|---|---|---|---|
| 1 | `a n o p r s u` | 18 | +18 | **13,46 %** | +13,46 pt | 3G/4D |
| 2 | `d e i m t` | 658 | +640 | 38,98 % | +25,52 pt | 3G/2D |
| 3 | `c f h l v` | 1 822 | +1 164 | 69,86 % | +30,89 pt | 3G/2D |
| 4 | `b g ç è é` | 2 915 | +1 093 | 87,67 % | +17,81 pt | 3G/2D |
| 5 | `j q x y à` | 3 230 | +315 | 97,00 % | +9,34 pt | 2G/3D |
| 6 | `k w z ù` | 3 256 | +26 | 97,47 % | +0,46 pt | 2G/2D |

**AUC couverture = 67,41 % (+12,78 pt) — AUC mots = 1 983,2 (+308,5, soit +18,4 %).**

Le palier 2 seul rend typables 658 mots, là où l'ordre actuel en est à 247.
L'ordre actuel ne franchit ce seuil qu'au cours du **palier 3**.

### 3.b Le palier 1 pris isolément : le vrai écart

Recherche exhaustive sur les 15 caractères les plus porteurs (donc une **borne
inférieure** du maximum) :

| Taille du palier 1 | Max mots distincts | Jeu de touches | Couverture fréq. |
|---|---|---|---|
| 5 | 27 | `e i n r t` | 1,65 % |
| 6 | 50 | `e i n r t v` | 2,72 % |
| **7** | **89** | **`a e i m n r t`** | 3,72 % |
| 8 | 137 | `a e i m n r s t` | 7,59 % |
| 9 | 227 | `a e i n o p r s t` | 16,82 % |
| 10 | 347 | `a e i m n o p r s t` | 22,30 % |
| 12 | 713 | `a c e i l n o p r s t u` | 37,36 % |

> **`e f j n s t u` (actuel) : 13 mots. `a e i m n r t`, même taille, même
> équilibre 4G/3D : 89 mots. Rapport ×6,8.**

Les 89 mots : *an, ni, air, ami, art, mai, mer, net, rat, aire, amer, arme,
main, mare, mari, mien, mine, rame, rare, rien, rire, tant, tram, aimer, armer,
entre, maire, maman, marin, matin, mener, mirer, rater, reine, riant, taire,
tante, tarte, tenir, tente, terme, terre, tirer, titre, train, trait, amener,
animer, ennemi, entier, entrer, imiter, inerte, intime, manier, marier, mentir,
mettre, miette, teinte, tenter, tinter, trente, attente, attirer, entrain,
irriter, ramener, ranimer, rentrer, retenir, retirer, tartine, terrain,
terrier, traiter, enterrer, marraine, rarement, remettre, retentir, retraite,
terminer, entretien, maintenir, entretenir, maintenant, traitement,
enterrement*.

### 3.c Si l'on tient à garder `f` et `j` au palier 1

Le cahier §4.4 exige les repères `F` et `J` **visibles** dès la première leçon,
ce qui n'oblige pas à les taper. Mais si on veut les taper :

| Taille P1 | Max mots (F et J imposés) | Jeu | Couverture |
|---|---|---|---|
| 7 | **44** | `e f j o r t u` | 1,94 % |
| 8 | 70 | `e f j o r s t u` | 5,12 % |
| 9 | 124 | `e f i j n o r t u` | 6,71 % |

**`e f j o r t u` est un correctif à deux touches** (`n s` → `o r`), garde
l'équilibre 4G/3D, garde `e f j t u`, et multiplie par 3,4 le nombre de mots du
palier 1 (13 → 44). Sur l'ordre complet, il porte l'AUC couverture à 64,00 %
(+9,38 pt) et l'AUC mots à 1 943 (+268).

### 3.d Récapitulatif des ordres testés (FR-FR)

| Ordre | Mots au P1 | AUC couverture | AUC mots |
|---|---|---|---|
| **Actuel** `efjnstu / airv / oldbm / ghpc / éèàç / qwxyzù` | 13 | 54,62 % | 1 674,7 |
| Correctif 2 touches, P1 = `efjortu` | 44 | 64,00 % (+9,38) | 1 943,0 (+268) |
| Optimum sous contrainte F/J | 21 | 64,45 % (+9,83) | 1 939,2 (+265) |
| Optimum libre, P1 = `aeimnrt` | **89** | 66,23 % (+11,61) | 2 031,2 (+357) |
| **Optimum équilibre des mains** (§3.a) | 18 | **67,41 % (+12,78)** | 1 983,2 (+309) |

Les deux dernières lignes montrent la tension entre les deux métriques :
`aeimnrt` maximise les **mots** au palier 1 (89), `anoprsu` maximise la
**couverture fréquentielle** (13,46 %, grâce aux mots outils courts). Pour une
app où l'enfant doit avoir de quoi taper, **c'est le nombre de mots qui compte**,
donc `a e i m n r t` est le meilleur palier 1 de 7 touches.

---

## 4. Robustesse : le verdict tient-il avec un autre lexique ?

Même mesure sur les **5 000 formes les plus fréquentes de Lexique383**
(mots grammaticaux et formes fléchies inclus, aucune notion d'âge), avec
ré-optimisation sur ce lexique-là.

| Lexique | Mots au P1, actuel | Mots au P1, optimum | AUC couv. actuel | AUC couv. optimum | Écart |
|---|---|---|---|---|---|
| Dubois-Buyse ≤27 (3 362 mots) | 13 | 18 | 54,62 % | 67,41 % | **+12,78 pt** |
| Lexique383 top-5000 | 55 | 64 | 62,53 % | 74,40 % | **+11,87 pt** |

Optimum ré-optimisé sur Lexique383 : `adelnsu / ioprt / cmvàé / bfhjq / gxyçè / kwzù`
(P1 = 64 formes typables, 27,99 % de couverture, contre 55 formes et 13,45 %
pour l'ordre actuel).

**Le déficit est du même ordre (≈ 12 points d'AUC) sur les deux lexiques.**
La conclusion ne dépend pas du choix de la source. En revanche le chiffre
spectaculaire « 13 mots au palier 1 » est en partie un artefact de
Dubois-Buyse : avec les mots outils, le palier 1 actuel ouvre 55 formes — dont
*e, s, et, un, je, en, ne, se, tu, te, une, est, ses, tes, jeu, feu, net, sens,
neuf, jeune, juste, sujet, tenue, jeunesse*. Le déficit reste réel, mais
la formulation honnête est **« 55 formes au lieu de 64 possibles, et 12 points
d'AUC de retard »**, pas « quasi rien à taper ».

---

## 5. CH-FR (QWERTZ suisse romand)

Pool débutant : 29 caractères (26 lettres + `é è à`, tous directs). `ç` exige
Maj → palier 7 ; `ù` est une touche morte → hors MVP. Les chiffres sont directs
et sont ouverts dès P1-P3, sans effet sur le rendement en mots.

Sur les 3 362 mots, **3 249 (96,6 %)** sont atteignables ; 113 ne le sont pas
(les 106 à accent circonflexe/tréma + 7 à `ç` : *ça, façon, garçon, français,
leçon, façade, commerçant* — 2,37 % du poids fréquentiel reporté au palier 7).

**L'ordre CH-FR est le même que FR-FR pour les lettres, donc il hérite
exactement du même défaut** :

| | Mots au P1 | AUC couverture | AUC mots |
|---|---|---|---|
| Ordre actuel CH-FR | 13 | 53,83 % | 1 672,3 |
| Optimum équilibré (profil 7,5,5,5,4,3) `anoprsu / deimt / cfhlv / bgqèé / jxyà / kwz` | 18 | **66,74 % (+12,91 pt)** | 1 998,2 (+326) |

**Un défaut spécifique à CH-FR, indépendant du lexique** : la charge des
paliers y est très irrégulière, parce que les chiffres directs ont été empilés
sur les premiers paliers.

| Touches à valider par palier | P1 | P2 | P3 | P4 | P5 | P6 | P7 | total |
|---|---|---|---|---|---|---|---|---|
| FR-FR | 7 | 4 | 5 | 4 | 4 | 6 | 11 | 41 |
| **CH-FR** | **11** | **8** | 7 | 4 | 3 | 5 | 2 | 40 |

Le critère de passage (§4.3) exige 3 occurrences sans erreur ni aide, réparties
sur ≥ 2 blocs, **pour chaque touche du palier**. Un enfant suisse doit donc
valider **11 touches** au palier 1 contre 7 pour un enfant français, avec un
plafond anti-mur identique de 6 blocs. Le premier palier suisse
demande donc 57 % de touches validées en plus, sous le même plafond de 6 blocs.
Ce n'est pas du rendement
lexical, c'est un déséquilibre de charge — et il va dans le mauvais sens
(le plus lourd d'abord).

---

## 6. Y a-t-il assez d'items pour 6 blocs de 8 à 12 ?

Besoin : **48 items** (6 × 8) au minimum, **72** (6 × 12) pour ne jamais répéter
au plafond anti-mur.

### 6.a Ce que le corpus embarqué permet (FR-FR)

| Palier | Items dispo | dont nouveaux | dont mots simples | dont dans le lexique 7-12 | Répétition moyenne à 6×12 |
|---|---|---|---|---|---|
| **1** | **40** | 40 | 33 | **9** | **×1,80** |
| 2 | 86 | 46 | 73 | 44 | ×0,84 |
| 3 | 161 | 75 | 138 | 97 | ×0,45 |
| 4 | 232 | 71 | 200 | 138 | ×0,31 |
| 5 | 276 | 44 | 242 | 177 | ×0,26 |
| 6 | 321 | 45 | 286 | 202 | ×0,22 |
| 7 | 321 | **0** | 286 | 202 | ×0,22 |

Trois faits chiffrés :

1. **Le palier 1 est en déficit.** 40 items pour 48 à 72 requis : au plafond de
   6 blocs de 12, chaque item revient **1,8 fois** en moyenne. C'est exactement
   la « répétition lassante » que le cahier veut éviter, et elle frappe la
   première leçon — celle où l'enfant décide s'il revient.
2. **Le contenu du palier 1 n'est pas du lexique 7-12.** Sur ses 33 mots
   simples, **9 seulement** figurent dans Dubois-Buyse ≤ 27. Le reste est fait
   de formes fléchies ou marginales : *fut, tenu, tentes, jets, tenues, nette,
   nettes, juteuse, justes, sujets*. Ce ne sont pas des pseudo-mots — le cahier
   §4.7 est respecté à la lettre — mais *juteuse* et *nettes* ne sont pas du
   vocabulaire de 7 ans. Sur l'ensemble du corpus : 202/286 mots simples
   (70,6 %) sont dans le lexique gradué.
3. **Le palier 7 n'apporte aucun mot nouveau** (0 sur les 321). Il ouvre les
   chiffres, les majuscules et le point ; côté mots, il est vide. Le corpus n'a
   aucun item exploitant les capitales.

### 6.b Ce qu'un meilleur palier 1 permettrait

Le plafond du §3.b répond directement à la question « faut-il élargir le
palier 1 ? » :

| Palier 1 | Mots distincts du lexique 7-12 | 6 blocs de 8 (48) ? | 6 blocs de 12 (72) ? |
|---|---|---|---|
| `e f j n s t u` (actuel, 7 touches) | 13 | **non** | **non** |
| `e f j o r t u` (7 touches, F/J gardés) | 44 | presque | non |
| `e f j o r s t u` (8 touches, F/J gardés) | 70 | **oui** | presque |
| `a e i m n r t` (7 touches, optimum) | **89** | **oui** | **oui** |

**Un palier 1 de 7 touches suffit pour tenir 6 blocs de 12 items distincts —
mais seulement si les 7 touches sont choisies pour les mots.** Le jeu actuel en
est très loin ; il faut soit changer 2 à 4 touches, soit passer à 8-9 touches en
gardant `f` et `j`.

À noter : ces comptes portent sur le lexique de référence, pas sur le corpus
embarqué. Même avec `a e i m n r t`, il faudrait **écrire les items** : le
corpus actuel ne contient que 13 des 89 mots.

---

## 7. Conclusion

**L'affirmation « ordre optimisé par rendement lexical » est fausse.**
Pas « partiellement vraie » : au sens où un lecteur du cahier la comprend
— l'ordre a été choisi pour maximiser ce qu'on peut écrire tôt — elle ne
correspond à aucune propriété mesurable de l'ordre livré.

Ce qui est vrai, et qui mérite d'être écrit à la place :

1. **L'ordre est optimisé par fréquence des lettres**, avec les deux repères
   tactiles imposés. `e s n u t` sont 5 des 9 lettres les plus fréquentes ;
   `f` et `j` viennent de la règle des repères. C'est cohérent — mais la
   fréquence des lettres ne prédit pas le rendement en mots, parce qu'un mot
   exige *toutes* ses lettres.
2. **Le coût est mesuré et il est réel** : 12,8 points d'AUC de couverture sur
   Dubois-Buyse, 11,9 sur Lexique383, +18 % de mots cumulés pour l'optimum.
   Le déficit est concentré sur les paliers 1 et 2 — précisément là où
   l'engagement de l'enfant se joue.
3. **Le palier 1 est le point dur** : 13 mots du lexique 7-12 contre 89
   atteignables à 7 touches ; 40 items dans le corpus pour 48-72 requis ;
   9 de ses 33 mots seulement relèvent du vocabulaire 7-12.
4. **CH-FR hérite du même ordre de lettres**, donc du même déficit
   (+12,9 pt d'AUC laissés sur la table), plus un déséquilibre de charge qui
   lui est propre : 11 touches à valider au palier 1 contre 7 en FR-FR.
5. **`k` n'est jamais enseigné** dans les paliers 1 à 7, sur aucune des deux
   dispositions.

### Ce que je recommande, par ordre de coût croissant

1. **Corriger le cahier** (coût nul) : remplacer « ordre optimisé par rendement
   lexical » par « ordre fondé sur la fréquence des lettres et les repères
   tactiles ». C'est ce que le code fait, et c'est défendable.
2. **Changer 2 touches au palier 1** : `e f j n s t u` → `e f j o r t u`.
   Garde les repères, garde l'équilibre 4G/3D, 13 → 44 mots, +9,4 pt d'AUC.
   Coût : réécrire le corpus du palier 1 et du palier 2.
3. **Adopter l'ordre du §3.a** (`anoprsu / deimt / cfhlv / bgçèé / jqxyà / kwzù`)
   ou le §3.b (`aeimnrt` en tête) : +12,8 pt d'AUC, palier 1 qui tient 6 blocs
   de 12 sans répétition. Coût : réécrire tout le corpus et renommer les
   paliers, dont les titres promettent des mots précis (« Tu écris chat,
   cheval, chocolat »).
4. **Rééquilibrer CH-FR** en étalant les chiffres directs au-delà du palier 3.
5. **Écrire les items manquants au palier 1** quoi qu'il arrive : 40 items pour
   6 blocs de 12, c'est un déficit indépendant de l'ordre des touches.

### Limites de cette analyse

- Le lexique de référence est un **compromis** : Dubois-Buyse gradue l'âge mais
  ignore les mots grammaticaux (47 des 100 formes les plus fréquentes) ;
  Lexique383 donne la fréquence mais ignore l'âge. Le §4 croise les deux ; le
  verdict y survit, l'ampleur du déficit varie de 11,9 à 12,8 points.
- La recherche d'ordre optimal est **heuristique** (faisceau + recuit). Les
  ordres publiés sont des bornes inférieures : le vrai optimum est au moins
  aussi bon. Cela ne fragilise pas le verdict — il suffit qu'un ordre batte
  l'ordre actuel pour que « optimisé » soit faux.
- Le rendement lexical **n'est pas le seul critère légitime**. Un ordre peut
  être choisi pour la charge motrice, la symétrie des mains, les repères
  tactiles. Cette analyse ne dit pas que l'ordre actuel est mauvais en soi :
  elle dit qu'il n'est **pas** ce que le cahier affirme qu'il est, et chiffre
  ce que cette affirmation coûterait si elle était vraie.
- Le corpus embarqué n'a **pas** été utilisé comme juge (il est circulaire),
  seulement comme objet mesuré au §6.

---

*Données : échelle Dubois-Buyse (o.bacquet.free.fr) ; Lexique 3.83
(lexique.org, CC-BY-SA). Scripts : `scripts/analyse/`. Analyse menée le
29 août 2026 sur le code du dépôt à cette date.*

RAPPORT T3 TERMINÉ
