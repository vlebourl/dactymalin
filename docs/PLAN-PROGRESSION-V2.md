# Plan de progression v2 — proposition

> **ARCHIVE — 2026-08-30.** Ce document est une *proposition*, contredite en
> session le 2026-08-30 puis remplacée par `CAHIER-DES-CHARGES.md` v2. Il est
> conservé pour la trace du raisonnement, au même titre que
> `recherche/06-plaidoyers.md`. **Il ne fait plus autorité.**
>
> Ses trois erreurs principales, pour mémoire : il condamne le sas demi-clavier
> avec une mesure qui ne visait que les colonnes d'index (§2.3) ; il attribue au
> budget de doigts un gain qui vient de la correction de l'ordre (§2.4, raison
> 3) ; et il supprime l'addendum du commanditaire sans le mentionner une seule
> fois.

Statut : **proposition, non arbitrée.** Écrite le 2026-08-29 au terme de six
recherches parallèles (`recherche/v2/T1` à `T6`). Elle ne remplace pas
`CAHIER-DES-CHARGES.md` tant qu'elle n'a pas été contredite puis validée.

Ce document dit trois choses : ce que la mesure a invalidé dans le parcours
actuel, ce qu'on met à la place, et ce qui reste incertain.

---

## 1. Ce que la recherche a invalidé

Six points. Les quatre premiers forcent un changement ; les deux derniers
changent une justification, pas une décision.

### 1.1 Le critère de passage ne mesure rien (T1 §4.1)

Il existe deux régimes, et rien entre les deux.

- Le générateur garantit déjà **2 occurrences de chaque touche du palier par
  bloc** (`generator.ts:28`). Le critère en demande 3 réparties sur 2 blocs.
  **Deux blocs suffisent donc**, soit ~3 minutes. Un enfant fluide traverse les
  six paliers du sas en un quart d'heure.
- Un débutant réel de 7 ans dépasse les 3 secondes d'hésitation qui font monter
  l'aide au barreau 2 (`aide.ts:13,40`), et `estPropre` exige `atteint <= 1`
  (`aide.ts:73-75`). Aucune de ses frappes ne compte jamais. Il franchit donc
  **tous** ses paliers par le plafond anti-mur, à 6 blocs pile.

La progression réellement vécue est « 6 blocs par palier », c'est-à-dire le
quota de volume que le cahier interdit explicitement (l.227). Et le critère
pénalise la lenteur seule, ce que P7 interdit (l.159).

### 1.2 Le palier 7 est un cul-de-sac (T1 §4.3)

Il ajoute **11 touches d'un coup** en FR-FR contre 4 à 7 partout ailleurs, au
moment précis où l'on introduit un modificateur maintenu et une règle de
latéralité. Aucune de ces 11 touches n'apparaît dans un mot du corpus : mesuré
sur 30 blocs, un bloc de palier 7 contient **6,8 nombres, 3,0 items capitalisés
et zéro mot en minuscules**, les nombres étant à 90 % des valeurs à trois
chiffres tirées au hasard (`491`, `946`). Et `palierFranchi` renvoie `false` au
palier 7 : l'enfant y reste **définitivement**.

La récompense promise depuis la première séance est un bloc de calcul mental
sans mots, pour toujours.

### 1.3 « Optimisé par rendement lexical » est faux (T3)

Mesuré sur l'échelle Dubois-Buyse (3 362 mots gradués 6-12 ans) pondérée par
Lexique 3.83 :

| Palier 1 | Mots typables | Couverture fréquentielle |
|---|---|---|
| `e f j n s t u` (actuel) | **13** | 0,64 % |
| `a e i m n r t` (optimum à 7 touches) | **89** | 3,72 % |

Sur le parcours complet, l'écart est de **12,8 points d'AUC** de couverture, et
il tient sur un second lexique indépendant (Lexique383 top-5000 : 11,9 points).
L'ordre actuel est optimisé sur la fréquence des **lettres** — `e s n u t` sont
5 des 9 plus fréquentes — plus les deux repères tactiles `f` et `j`. C'est
cohérent, mais la fréquence des lettres ne prédit pas le rendement en mots :
un mot exige *toutes* ses lettres.

Corollaire mesuré : le palier 1 dispose de **40 items** pour les 48 à 72
qu'exigent 6 blocs sans répétition, et **9 seulement de ses 33 mots** relèvent
du lexique 7-12 ans (*fut, tenu, juteuse, nettes*…).

### 1.4 La répétition que le cahier redoute est fabriquée par le code (T1 §4.2)

`f` n'a que **2 occurrences** dans tout le corpus du palier 1. La couverture
gloutonne devant servir chaque touche deux fois, *fut* et *neuf* sortent dans
**30 blocs sur 30**. Idem *où* au palier 6 (`ù` : 1 occurrence), *déjà* et
*voilà* au palier 5 (`à` : 2 occurrences).

C'est exactement la « rote repetition » que la recherche reproche à Dance Mat
Typing, et elle frappe la première leçon — celle où l'enfant décide s'il
revient.

### 1.5 « La main de 7 ans est trop petite » est indéfendable (T4 §1.2)

L'argument est traçable jusqu'à une **croyance** professionnelle de la National
Business Education Association, **1992**, jamais jusqu'à une mesure
anthropométrique. Aucune étude ne relie l'empan de la main de l'enfant au pas
des touches de 19,05 mm. L'étude qui cite cette croyance (Donica, Giroux & Kim
2019, n≈1 700) conclut en recommandant de **commencer tôt**.

Ce qui est documenté est autre chose : le rendement d'apprentissage est faible
à 7 ans (UCLA/UES 1997 : amélioration « very modest ») et net à 8-9 ans. La
décision de viser 7 ans reste tenable ; sa **justification** doit changer.

### 1.6 La justification anti-pseudo-mots est fausse (T4 §6.2)

Le §4.7 écarte les pseudo-mots au motif d'un « mode d'échec documenté chez
l'enfant qui apprend encore à lire ». Le guide Éduscol *Pour enseigner la
lecture et l'écriture au CP* les **prescrit** : entraînement quotidien « sur des
listes de syllabes, de **pseudo-mots**, de mots », et ils sont l'instrument
standard d'évaluation du décodage.

La décision d'exclure les pseudo-mots reste bonne. L'argument à retenir est
autre : ceux de Keybr sont générés par fréquence de bigrammes **anglais** et ne
respectent pas les correspondances graphème-phonème du français ; et surtout,
en frappe un pseudo-mot n'isole rien — il ne sert que de remplissage. Si une
étape ne produit pas assez de vrais mots, **c'est l'étape qu'on refait**.

---

## 2. L'arbitrage central : à quel moment le doigt devient-il correct ?

C'est la décision qui commande tout le reste. Le parcours actuel a **deux axes
séparés** : les paliers 1 à 6 ouvrent des touches à mapping provisoire (« la
main de ton côté, ton index »), puis les paliers 7 à 10 ré-attribuent ces mêmes
touches à leurs doigts définitifs. L'enfant apprend donc un geste, puis le
défait.

### 2.1 Le pari actuel n'est ni validé ni invalidé — il est non étudié

**Aucune étude ne mesure la transition d'un mapping à 4 doigts vers un mapping
à dix doigts**, chez l'enfant comme chez l'adulte (T4 §2.3). Ce qu'on sait est
indirect, et il tire dans les deux sens :

- **À charge.** L'interférence proactive est mesurée chez le dactylographe
  expert à qui l'on change une règle : elle **persiste après dix séances**
  (*Acta Psychologica*, 2020). Le hunt and peck plafonne à ~35 mots/min et
  « limite le développement de la frappe à dix doigts » (Pisha 1993).
  L'interférence est maximale quand l'ancien et le nouveau contexte se
  ressemblent mais exigent une réponse différente — même clavier, mêmes
  lettres, doigt différent : le cas exact.
- **À décharge.** Ce qui prédit la performance n'est pas le nombre de doigts
  mais **un mapping doigt→touche non ambigu** (Feit, Weir & Oulasvirta, CHI
  2016) : à 5 doigts on égale un dactylographe formé. Et le passage du visuel au
  kinesthésique ne s'installe qu'à **20-25 mots/min** (West 1967) : un enfant
  qui quitte le sas à 5-10 mots/min n'a pas encore de mémoire motrice à défaire.

Le pari est donc défendable. Mais il n'a jamais été comparé à son alternative.

### 2.2 L'alternative est gratuite

T6 chiffre la variante que T4 §1.4 formulait : *chaque touche attribuée dès le
départ à son doigt définitif*.

**Elle ne coûte rien. 0,00 point d'AUC.** Ce n'est pas une mesure mais une
identité : la carte touche→doigt est une bijection, elle ne retire aucune touche
du pool. Si les huit doigts sont autorisés, l'espace de recherche est exactement
celui de T3.

Il n'y a donc **aucun arbitrage à faire sur le mapping lui-même**. Le doigt
définitif dès la première touche est un gain sec : il supprime le seul risque
majeur documenté du produit, et il ne coûte pas un mot.

### 2.3 Ce qui coûte, c'est le budget de doigts — et le sas actuel est arithmétiquement mort

Ce qui coûte est une décision **séparable** : combien de doigts on ouvre au
début. T6 la chiffre exactement (optimum exact, pas heuristique) :

| Doigts à l'étape 1 | Mots à 7 touches | AUC couv. FR-FR | Δ vs optimum libre | Tient 48 items ? | Tient 72 ? |
|---|---|---|---|---|---|
| **2 (les index seuls)** | **5** | 53,63 % | −14,23 pt | **non, jamais** | **non, jamais** |
| **4 (+ les majeurs)** | **70** | 63,29 % | −4,56 pt | oui, dès 6 touches | à 8 touches |
| 6 (+ les annulaires) | 80 | 66,94 % | −0,91 pt | oui | à 7 touches |
| 8 (tous) | 89 | 67,86 % | ±0,00 pt | oui | à 7 touches |

**Le sas à deux index est à écarter, et pour une raison qui n'est pas
pédagogique mais arithmétique.** Les deux index ne portent **qu'une seule
voyelle**, `u` (`b f g r t v` à gauche, `h j n u y è` à droite). Le plafond
absolu, avec les **douze** touches réunies, est de **5 mots français** — *nu,
but, brun, brut, futur* — contre 48 à 72 requis. Aucun choix de touches, aucune
taille d'étape, aucun corpus n'y change quoi que ce soit. C'est un facteur 10.

Ce résultat rejoint T4 §1.4 : la restriction aux index **n'existe dans aucun
curriculum**, et le seul curriculum mesuré à grande échelle (Keyboarding Without
Tears) progresse par « moins de touches, moins de mains, **mais les bons
doigts** ».

Nuance à ne pas escamoter : le mode actuel de l'app n'est **pas** « les touches
des index ». L'index y couvre toute sa moitié de clavier, donc 31 caractères
sont ouvrables — c'est ainsi que le palier 1 actuel arrive à 13 mots plutôt qu'à
5. Ce qui est mort, ce n'est pas le jeu de touches : c'est le **geste** qu'on
entraîne, et qu'il faudra défaire.

### 2.4 La décision

**Le doigt définitif dès la première touche, et quatre doigts à l'étape 1 : les
deux index et les deux majeurs.**

Quatre raisons, dans l'ordre de force :

1. **Le mapping définitif est gratuit** (§2.2) et supprime le risque
   d'interférence, qui est le risque majeur non maîtrisé du produit.
2. **Quatre doigts est le seuil**, pas un compromis. Le passage de 2 à 4 doigts
   vaut **+9,66 points d'AUC** ; les deux étages suivants n'en valent que +3,65
   puis +0,92. Le rendement décroît d'un facteur 10 après le deuxième étage.
   Les majeurs apportent `e` et `i` — les deux voyelles les plus fréquentes —
   d'un seul coup.
3. **Même en payant le sas, on gagne.** Le meilleur palier 1 à 4 doigts donne
   70 mots contre 13 aujourd'hui : **×5,4**. Le prix du sas (19 mots sur 89,
   −21 %) est largement absorbé.
4. **Le verdict est identique sur les deux dispositions** : −14,23 / −13,45
   points à 2 doigts, −4,56 / −4,41 à 4 doigts. La contrainte ne pénalise pas
   le public suisse.

**Ce que cette décision supprime.** Le mode 4 doigts comme *sas transitoire*
disparaît, et avec lui les paliers 8-9-10 « les majeurs / les annulaires / les
auriculaires » : il n'y a plus rien à ré-attribuer. Les doigts s'ouvrent **avec**
les touches, sur un seul axe. Trois places se libèrent dans le parcours, et
elles servent à réparer le cul-de-sac du palier 7 (§4).

**Ce qu'elle coûte, dit franchement.** Un enfant de 7 ans doit d'emblée faire
travailler quatre doigts avec un mapping strict, là où le sas actuel lui
demandait deux index libres de toute contrainte de colonne. **Aucune donnée
n'existe sur la faisabilité de cela à 7 ans** : T4 §1.3 constate qu'aucune mesure
anthropométrique ne relie l'empan de la main de l'enfant au pas des touches, et
que « les deux camps argumentent sans données ». C'est le point le plus fragile
de ce plan, et il doit être testé sur l'enfant avant d'être livré.

### 2.5 Un résultat contre-intuitif qu'on choisit de ne pas suivre

T6 §4.d établit que **l'ordre de dextérité est le pire ordre possible pour le
français**. Le meilleur palier 1 mesuré, `a r s o n u p`, mobilise les index,
les annulaires et les auriculaires — et **aucun majeur**. Une ouverture
`index → annulaires → auriculaires → majeurs` atteint exactement l'optimum
libre (67,86 %), soit **+4,56 points** contre l'ordre de dextérité.

On ne le suit pas, pour deux raisons :

- L'ordre index → majeur → annulaire → auriculaire est le consensus réel du
  marché (T2 §2.2 : TypingClub, Typing Study, Dance Mat), justifié par la
  **dextérité différentielle des doigts**.
- Demander l'auriculaire gauche à l'étape 1 chez un enfant de 7 ans est
  exactement l'inconnue de §2.4, en pire. « Un enfant qui n'arrive pas à frapper
  `a` de l'auriculaire gauche ne tapera **aucun** des 18 mots de `a r s o n u p` »
  (T6 §8).

On paie donc 4,56 points d'AUC pour rester sur l'ordre de dextérité — en le
sachant, et en gagnant tout de même **+8,67 points** contre l'ordre livré
aujourd'hui. Si le test sur l'enfant montre que les auriculaires passent, ces
4,56 points sont à reprendre.

---

## 3. Le vocabulaire et la hiérarchie

### 3.1 Le diagnostic

« Leçon » désigne aujourd'hui **trois** choses selon l'écran : le jeu de touches
(`V4Lecon.tsx:256`, « Leçon 3 sur 7 »), une session de jeu
(`V7Reglages.tsx:153`, « Refaire une leçon à quatre doigts ») et l'écran lui-même
(`src/core/lecon.ts`). Deux écrans parents affichent le même nombre sous deux
mots différents : « leçon 3 » (`V7Reglages.tsx:60`) et « palier 3 »
(`V9Compte.tsx:197`).

« Palier » et « bloc » sont du vocabulaire d'implémentation, et ils sont
**visibles par l'enfant** : « Bloc {n} de cette leçon » (`V4Lecon.tsx:272`),
« {n} blocs finis sur 6 » (`V4Lecon.tsx:239`), et jusque dans deux des dix-huit
phrases d'encouragement (`encouragements.ts:11,19`).

Au passage, « palier » est du vocabulaire d'enseignant français **périmé depuis
2016** (les paliers du socle commun, remplacés par les cycles), et c'est un mot
abstrait — or la part de concepts abstraits dans le vocabulaire d'un enfant
n'atteint 40 % que vers 12 ans.

### 3.2 La décision

**Deux niveaux nommés, pas trois.**

| Ce que c'est | Nom visible | Nom dans le code |
|---|---|---|
| Un jeu de touches | **étape** | `etape` (aujourd'hui `palier`) |
| Une session de 8-12 items | **leçon** | `lecon` (aujourd'hui `bloc`) |
| Un mot à taper | *aucun nom* | `item` (inchangé) |

`bloc` **reste dans le code** au sens « pan physique du clavier », qui est son
sens juste (« le clavier est rendu en trois blocs spatialement disjoints »).
C'est le piège d'un renommage mécanique : le `sed` global est interdit.

Trois raisons de trancher ainsi :

1. **La faute réelle est la polysémie, pas le choix des mots.** Ce système rend
   à « leçon » **un** sens, et c'est celui que lui donne tout le marché examiné
   — Typing.com (*unit > lesson > activity*), Ratatype (*course > lesson >
   exercise*), Duolingo, Khan, Anton : partout, une leçon est **ce qu'on fait en
   une fois**. Aucun produit n'appelle « leçon » un ensemble de touches qui
   prend plusieurs sessions. C'est pourtant ce que fait `V4Lecon.tsx:256`.
2. **Le troisième niveau est non seulement inutile, il est interdit.** Nommer
   l'item, c'est ouvrir la porte à « exercice 4 sur 10 » — le compteur que le
   cahier proscrit sur l'écran de jeu. Et l'enfant ne navigue jamais vers un
   item : il ne le choisit pas, il ne le reprend pas, il le voit passer. Nommer
   un niveau que personne ne désigne ajoute du vocabulaire sans ajouter de
   pouvoir d'action.
3. **Le code devient traduisible mot à mot vers l'écran.** C'est structurellement
   ce qui empêche la prochaine fuite de jargon : le jargon ne fuit que quand le
   code et l'interface parlent deux langues.

### 3.3 La phrase de relation — et pourquoi elle ne peut pas être un nombre

La demande initiale était d'énoncer « il faut X exercices pour finir une leçon,
Y leçons pour finir une étape ». **Ce nombre n'existe pas, et c'est délibéré.**

Le passage d'une étape à la suivante n'est pas déclenché par un compte de
sessions mais par un critère de maîtrise par touche, avec un plafond de secours
que le cahier exige de garder **silencieux** (l.228 : « l'app ne le lui dit
pas »). Le nombre de sessions varie de 2 à 6 selon l'enfant. Toute phrase de la
forme « 3 leçons pour finir l'étape » serait **fausse**.

Entre changer le modèle pédagogique pour pouvoir afficher un joli nombre, et
afficher la vérité, on choisit la vérité. La relation s'énonce donc en
**touches** :

- Bandeau de l'écran de jeu : « **Étape 3 — Les mots de tous les jours** »
- Sous la jauge : « **Encore 2 touches à bien connaître.** »
- Sur la carte et en fin d'étape : « **Cette étape sera finie quand tu
  connaîtras bien ses 7 touches.** »
- Fin de session : « **Leçon finie !** »
- Franchissement : « **Étape 4 ouverte ! Elle t'apporte : g h p c** »

### 3.4 Trois corrections à faire au passage

Elles survivraient à n'importe quel choix lexical, et les laisser annulerait une
partie du bénéfice.

1. **Retirer « {n} blocs finis sur 6 »** (`V4Lecon.tsx:234-239,266`) : ce texte
   révèle le plafond anti-mur que le code lui-même documente comme devant rester
   silencieux (`progression.ts:9`).
2. **Résoudre le « sur 7 » contre les dix lignes de la carte** : le bandeau
   annonce « sur 7 » quand V6 déroule les dix entrées, cadenas compris. Le moins
   coûteux et le plus honnête est de ne plus annoncer de total — « Étape 3 »
   suffit.
3. **Renommer `docs/BIBLIOTHEQUE-LECONS.md`** : son contenu dit « liste »
   partout, et une liste n'appartient pas à la hiérarchie de progression
   puisqu'elle ne la fait pas avancer.

---

## 4. Le nouveau parcours

### 4.1 Un seul axe, dix étapes, toutes jouables

Le parcours actuel a deux axes (touches 1-6, doigts 7-10) dont le second est
vide : les étapes 8, 9 et 10 déclarent `nouvelles: []` et `palierFranchi`
renvoie `false` dès le palier 7 — elles sont **structurellement
inatteignables**. §2.4 supprime le second axe. Il reste un axe unique où chaque
étape ouvre des touches, et où les doigts s'ouvrent avec elles.

| Étape | Ce qu'elle ouvre | Doigts | Ce qu'elle promet à l'enfant |
|---|---|---|---|
| **1** | 8 lettres, budget 4 doigts | index + majeurs | « Tu écris tes premiers mots. » |
| **2** | + 5 lettres | + annulaires | |
| **3** | + 5 lettres | + auriculaires | |
| **4** | + 5 lettres et accents | 8 | |
| **5** | + 5 lettres rares et accents | 8 | |
| **6** | + le reste des lettres | 8 | « Tu as toutes les lettres. » |
| **7** | **Majuscule** (auriculaire modificateur, règle contralatérale) | + auriculaires en modificateur | « Tu écris les noms avec une grande lettre. » |
| **8** | **Les chiffres** | 8 | « Tu écris les nombres. » |
| **9** | **La ponctuation** | 8 | |
| **10** | *plus aucune touche* — le contenu s'allonge | 8 | « Tu écris des phrases. » |

Trois changements de structure, chacun réparant un défaut mesuré :

1. **Le palier 7 actuel est scindé en trois.** Il ajoutait **11 touches d'un
   coup** — majuscules, dix chiffres et le point — au moment même où l'on
   introduit un modificateur maintenu et une règle de latéralité (§1.2). Les
   étapes 7, 8 et 9 les séparent. La marche redevient de la taille des autres.
2. **Le parcours ne se termine plus sur un cul-de-sac.** Aujourd'hui l'enfant
   reste à vie sur une étape dont les blocs sont à 70 % des nombres à trois
   chiffres tirés au hasard. L'étape 10 n'ouvre **aucune touche** : elle
   allonge le contenu, des mots vers les phrases puis les paragraphes. C'est ce
   qui répare la borne haute (§6.2) : les deux référentiels attendent des
   phrases à 8-9 ans et des paragraphes à 10-12.
3. **Plus aucune étape verrouillée et vide.** Les dix sont jouables. La carte
   cesse de promettre trois cases qu'aucun enfant ne peut atteindre.

### 4.2 Le choix des touches reste à calculer

Le meilleur parcours en 6 étapes sous budget de doigts que T6 publie (variante
V2, ordre de dextérité) est :

```
e r i n t v b  /  s o u c l  /  a p m d f  /  é h g q è  /  j x ç à y  /  z w k ù
```
AUC couverture **63,29 %**, contre 54,62 % pour l'ordre actuel : **+8,67 points**.

**Mais il ne satisfait pas la règle de recette de §6.1.** Son étape 1 de
7 touches donne **52 mots**, sous le seuil de 72 qu'exigent 6 leçons de 12 items
distincts. T6 §6 établit qu'à 4 doigts il faut **8 touches** pour franchir ce
seuil : `d e i n r t u v` → **91 mots** en FR-FR, `e i m n r t u v` → 92 en
CH-FR.

Le profil de tailles doit donc être **8-5-5-5-4-4** et non 7-5-5-5-5-4, et le
parcours complet doit être **ré-optimisé sous cette contrainte**. Les scripts
existent (`scripts/analyse/doigts.py`, `t6.py`) ; le calcul n'a pas été fait.
**Je ne publie pas ici un ordre que je n'ai pas mesuré.**

Contrainte supplémentaire à porter dans ce calcul : `k` n'est **jamais**
enseigné par le parcours actuel, sur aucune des deux dispositions (T3 §2).
L'enfant termine le MVP sans avoir tapé une lettre de l'alphabet. Le coût
lexical est nul (3 mots), le coût symbolique ne l'est pas.

### 4.3 Deux dispositions, une seule progression

C'est le résultat le plus directement exploitable de T2 §5.4 : chez les deux
seuls éditeurs sérieux du panel, **neuf leçons sur onze se correspondent
position par position** entre le cours AZERTY et le cours QWERTZ suisse. Les
485 leçons françaises d'edclub et les 652 anglaises suivent le même squelette ;
le layout n'a changé que les étiquettes.

**La progression se définit donc en positions physiques (rangée × doigt ×
main), et le layout n'est qu'une table de correspondance position → caractère**,
plus une liste de caractères propres à la disposition. Cela évite d'écrire et de
maintenir deux progressions.

Deux conséquences concrètes :

- Le déséquilibre de charge actuel de CH-FR disparaît. Aujourd'hui, les
  chiffres directs du QWERTZ sont empilés sur les premiers paliers : l'enfant
  suisse doit valider **11 touches** au palier 1 contre 7 pour l'enfant
  français, avec le même plafond de 6 blocs. Son premier palier est ~57 % plus
  long à franchir — et c'est le plus lourd qui vient en premier. Les chiffres
  rejoignent l'étape 8, pour les deux dispositions.
- Les accents restent un **module dédié**, placé tôt. C'est la seule
  spécificité structurelle du français, et la référence du marché la traite
  ainsi : dans *Expédition dactylo* (485 leçons AZERTY), les accentuées et les
  touches mortes forment un bloc **juste après les trois rangées de lettres,
  avant les majuscules et avant les chiffres**. Les étapes 4-5 puis 7-8 du
  tableau §4.1 suivent cet ordre.

### 4.4 Le pari AZERTY que personne n'exploite

Un chiffre de T2 §5.3, mesuré sur corpus français : la **rangée de repos AZERTY
ne porte que 23,33 % des frappes**, contre **56,36 % pour la rangée du haut**.
Sur QWERTY, la rangée de repos en porte ~30 %.

La rangée du haut AZERTY (`a z e r t y u i o p`) contient `e a i o u r t`,
c'est-à-dire l'essentiel des lettres fréquentes du français. Une progression
« rangée de repos d'abord » est donc **structurellement moins rentable en AZERTY
qu'en QWERTY** — et aucune source, ni éditeur, ni institution, ni académique,
n'en tire les conséquences.

Le parcours proposé ici s'en écarte déjà de fait, puisqu'il ordonne par
rendement lexical et non par rangée. Il faut le dire explicitement plutôt que
de le subir : les repères `F` et `J` restent le point d'ancrage tactile et le
geste de retour, mais **la rangée de repos n'est pas la première leçon**.

C'est une hypothèse chiffrée, pas un résultat. À vérifier en usage avant d'en
faire un principe.

---

## 5. Le critère de passage

### 5.1 Ce que fait le marché

Deux faits, tirés de l'examen de onze produits (T2 §4.1) :

1. **Le nombre d'occurrences n'est jamais un critère.** Aucun produit ne dit
   « tape cette lettre 40 fois ». Le critère est toujours une **performance**,
   jamais un **volume**. Le volume est la conséquence, pas la règle. Le critère
   actuel — 3 occurrences sur 2 blocs — n'a d'équivalent nulle part.
2. **La précision porte le seuil, la vitesse porte la gradation.** Chez
   TypingClub, la précision minimale décide du passage, la vitesse décide du
   nombre d'étoiles. C'est le découpage le plus propre du panel, et il est
   transposable en retirant l'affichage des étoiles.

### 5.2 L'anti-pattern à ne pas reproduire

Le seuil de keybr est lu dans son code source : **175 cpm (35 mots/min) par
touche**, exigé simultanément sur **toutes** les lettres actives. Un utilisateur
documente **8 heures bloqué sur `R` et `T`**, confiance oscillant entre 0,92 et
0,98 sans jamais atteindre 1.

Or la norme mesurée d'un enfant (Donica et al. 2019, n≈1 700, mots **nets** par
minute après une année d'instruction structurée) est :

| Niveau | CP | CE1 | CE2 | CM1 | CM2 |
|---|---|---|---|---|---|
| Mots nets/min | 1,9 | 4,0 | 7,8 | 12,2 | 16,1 |

**Un seuil de vitesse est donc exclu.** 35 mots/min est hors d'atteinte ; même
21 mots/min (premier palier de TypingClub) est déjà du niveau CM1. Et les
écarts-types sont de l'ordre de la moyenne — à 8-9 ans, un enfant à 4 mots/min
et un à 12 sont tous deux dans la norme. **Toute cible chiffrée affichée à
l'enfant est statistiquement indéfendable**, ce qui confirme la décision
existante (« les étoiles ne mesurent rien »).

### 5.3 Ce qu'on met à la place

Trois pièces, dont la troisième est un trou de marché documenté.

1. **Le seuil est la précision, jamais la vitesse ni le volume.** Une touche est
   connue quand elle a été frappée juste du premier coup, sans aide, sur
   plusieurs leçons distinctes.
2. **Le délai de réflexion ne compte plus comme un échec.** La règle actuelle —
   3 secondes d'hésitation invalident l'occurrence — est ce qui rend le critère
   binaire (§1.1) et contredit P7. L'aide peut monter d'un barreau ; l'occurrence
   reste valide si la frappe est juste.
3. **Détection automatique du blocage, remédiation graduée, déverrouillage
   forcé.** Aucun produit enfant francophone n'a les trois : TypingClub exige un
   enseignant qui remarque et règle à la main, keybr n'a rien, Dance Mat n'a
   rien, Fort-Dactylo adapte la vitesse mais pas la progression. Le plafond
   anti-mur actuel est la bonne intuition — et il est théoriquement soutenu : un
   enfant qui plafonne n'a pas « manqué d'effort », il a **saturé sa méthode**
   (Gray, *Cognitive Science*, 2017). On ne fait pas répéter, on change de
   méthode. Ce qu'il faut ajouter, c'est que le déverrouillage ne soit plus le
   **seul** chemin réellement emprunté.

---

## 6. Le contenu

### 6.1 Le corpus doit être reconstruit

321 items écrits à la main, sans aucun référentiel lexical cité. **70,6 %
seulement** des mots simples appartiennent au lexique gradué 7-12 ans, et le
palier 1 tombe à **9 sur 33**. *Wapiti*, *xylophone*, *sandwich*, *physique*
sont là pour couvrir `w`, `x`, `y` — pas parce qu'un enfant de 8 ans les
connaît.

Le corpus v2 se construit à partir de l'**échelle Dubois-Buyse** (3 726 mots
gradués par échelon scolaire, échelons ≤ 27 = 6-12 ans) croisée avec **Lexique
3.83** pour la fréquence d'usage. Les deux sont libres et déjà téléchargées par
les scripts de `scripts/analyse/`.

Règle de recette, non négociable : **aucune étape ne part si elle ne fournit pas
72 items distincts** du lexique gradué (6 leçons × 12 items sans répétition).
C'est la traduction chiffrée de la règle du cahier « aucun palier ne part s'il
ne produit pas au moins une poignée de vrais mots ».

### 6.2 Le produit sert mal sa borne haute

Deux référentiels indépendants convergent sur ce qu'un enfant devrait taper :

| Âge | Unité |
|---|---|
| 7-8 ans | mots isolés, mots fréquents, chiffres ; phrase courte en fin de période |
| 8-9 ans | phrases |
| 10-12 ans | paragraphes, texte suivi |

Sources : *KWT Educator's Guide* (K → CM2) et le PER suisse (cycle 1 : « tape
son nom, des mots, une phrase courte » ; cycle 2 : « saisit et met en forme un
texte personnel de manière autonome »).

Le MVP s'en tient aux mots isolés et aux nombres. **C'est correct pour 7 ans et
insuffisant pour 11 ans** — d'autant que le seul bénéfice mesuré de la
dactylographie sur l'écrit lui-même (van Weerdenburg et al. 2019 : progrès en
orthographe et en écriture narrative) l'a été sur du texte, à partir du CM1.

Le corpus contient d'ailleurs **déjà** 35 items multi-mots (*le lion dort*,
*je mange une pomme*) que le cahier interdit et qu'un test autorise
explicitement depuis le 2026-08-28, sans trace de la décision. Il faut trancher
ce point plutôt que de le laisser en contrebande.

---

## 7. Le rythme

### 7.1 La dose

Littérature et éditeurs convergent sans exception : **10 à 15 minutes par jour,
tous les jours**, bat toute séance longue hebdomadaire. edclub : 15 min/jour.
Keyboarding Without Tears : 5-10 min/jour sur 36 semaines. Consensus des
curricula : 15-25 min quotidiennes sur 6-8 semaines. « Cinq minutes tous les
jours battent trente minutes une fois par semaine. »

Le seul protocole empirique directement comparable au produit — McGlashan et al.
2017, enfants de 8-10 ans, **5 × 10 min par semaine, à domicile, sur des jeux de
frappe en ligne** — mesure un gain de motricité fine au MABC-2. C'est la seule
validation directe du format choisi (§4.2 du cahier), sur un échantillon très
petit (n=9).

**Horizon réaliste** : 25 à 30 heures d'instruction au total, soit **5 à 6 mois
de pratique quasi quotidienne** à 10 min/jour.

### 7.2 Le trou : la reprise après une pause

Rien dans le cahier ne traite le retour d'un enfant qui a arrêté un mois. Or
dans un programme pilote de 32 séances en CM1, les gains étaient mesurables en
fin de session et **la plupart avaient disparu six semaines plus tard**.

Un enfant qui reprend retrouve un niveau plus bas que celui qu'il a quitté.
Si l'app le remet à son étape courante sans rien réviser, elle le met en échec
au premier bloc — et c'est un déclencheur d'abandon plausible.

Il faut une **reprise** : quand la dernière séance remonte à plus de N jours, la
première leçon rejoue les touches des étapes précédentes avant de reprendre
l'étape courante. Sans jamais dire à l'enfant qu'il a régressé, et sans jamais
retirer une étape acquise.

---

## 8. Ce qui reste incertain

Par honnêteté, et parce que c'est là que la contradiction doit porter.

1. **Aucune donnée n'existe sur la transition 4 doigts → 10 doigts.** Ni chez
   l'enfant, ni chez l'adulte. Le pari central du produit actuel n'est ni validé
   ni invalidé : il est **non étudié**.
2. **Aucune norme de précision par âge n'existe.** Les études mesurent le *net
   WPM*, qui fusionne vitesse et erreurs.
3. **Aucune étude sur les causes d'abandon** en apprentissage de la frappe chez
   l'enfant. Tout ce qui remonte est de la littérature commerciale.
4. **Aucune étude ne compare les contenus tapés** — mots réels, pseudo-mots,
   texte suivi.
5. **Aucune mesure anthropométrique** ne relie l'empan de la main de l'enfant au
   pas des touches. Les deux camps argumentent sans données.
6. **Toute la littérature chiffrée est scolaire, collective et encadrée.** Les
   vitesses citées sont donc probablement **optimistes** pour un enfant seul à
   la maison, d'un facteur non quantifiable.
7. **Le choix « étape / leçon » est une hypothèse de conception**, pas une
   conclusion de recherche : aucune donnée n'existe sur la compréhension de ces
   mots précis par des enfants francophones de 7 et 11 ans. Le test coûte dix
   minutes avec deux enfants de la cible, et il vaut mieux que tout ce document
   sur ce point.

---

## 9. Découpage de livraison

Six lots, ordonnés par dépendance et par risque décroissant. Chacun est
livrable seul et laisse l'app jouable. Conformément à la règle du dépôt, chaque
correction de défaut identifié en §1 part avec le test de régression qui aurait
dû l'attraper — les défauts de §1.1, §1.2 et §1.4 sont tous observables par un
test sur `progression.ts` et `generator.ts`.

### Lot 1 — Le vocabulaire et les compteurs interdits

`palier` → `etape`, `bloc` → `lecon`, l'item reste sans nom (§3.2). Retrait de
« {n} blocs finis sur 6 », du « sur 7 » contradictoire, et des deux
encouragements qui disent « bloc » (§3.4).

**Pourquoi en premier.** Aucun changement pédagogique, donc aucun risque ; et
tout ce qui suit s'écrira dans le vocabulaire final plutôt que d'être renommé
deux fois. Attention : `bloc` doit **rester** au sens « pan de clavier », le
`sed` global est interdit. Deux champs persistés (`palier`, `bloc` dans
`Sauvegarde`) et le code de fusion multi-appareil exigent une migration ou des
alias en lecture.

### Lot 2 — Le critère de passage

Seuil sur la précision, suppression de la pénalité de lenteur, détection du
blocage et remédiation graduée (§5.3).

**Pourquoi en deuxième.** C'est le défaut le plus grave (§1.1) et il est
indépendant du choix des touches : il se corrige sur le parcours actuel, et il
bénéficie immédiatement à l'enfant. Il faut aussi l'**instrumenter** — le cahier
demande d'observer le nombre de leçons réellement consommées par étape et la
fréquence du barreau 3, et rien n'est compté aujourd'hui : les deux garde-fous
d'observation du cahier sont inapplicables en l'état.

### Lot 3 — Le nouvel ordre et son corpus

Inséparables : un ordre sans corpus donne des étapes vides, un corpus sans ordre
n'a pas de cible. Comprend le calcul manquant de §4.2 (ré-optimisation sous
profil 8-5-5-5-4-4), la table doigt→touche qui **n'existe pas encore**
(`doigts.ts` ne déclare que quatre états), et la construction du corpus v2 sur
Dubois-Buyse × Lexique 3.83 avec la règle des 72 items par étape (§6.1).

**Le lot le plus lourd, et celui qui porte le pari de §2.4.** À ne pas lancer
avant le test sur l'enfant (§10).

### Lot 4 — Les étapes 7 à 10

Scission du palier 7 en Majuscule / chiffres / ponctuation, et étape 10 où le
contenu s'allonge au lieu que les touches s'ouvrent (§4.1). Supprime le
cul-de-sac et répare la borne haute.

### Lot 5 — La reprise après une pause

§7.2. Indépendant de tout le reste.

### Lot 6 — Ce qui reste à trancher, pas à coder

Les 35 items multi-mots déjà présents en contrebande dans le corpus (§6.2) : le
cahier les interdit, un test les autorise depuis le 2026-08-28, aucune trace de
la décision. À arbitrer, pas à laisser dériver.

---

## 10. La seule chose qui vaut mieux que ce document

Le pari de §2.4 — quatre doigts à mapping strict dès la première étape, à 7 ans
— n'est **soutenu par aucune donnée**, dans un sens comme dans l'autre. De même
le choix « étape / leçon » (§8.7).

Les deux se testent en dix minutes avec l'enfant, sur du papier et un clavier :
lui demander de poser index et majeurs sur `e r i n t v b` et de taper cinq
mots, et lui demander ce que veut dire « il te reste deux touches dans cette
étape ». Ce test vaut mieux que tout ce qui précède sur ces deux points précis,
et il doit précéder le lot 3.
