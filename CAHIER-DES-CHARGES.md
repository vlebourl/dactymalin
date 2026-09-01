# Cahier des charges — « DactyMalin »
### Application web d'apprentissage du clavier, 8-11 ans, français

**Version 2 — 2026-08-30.** Cette version remplace la v1 du 2026-08-23. Elle
intègre les six recherches `recherche/v2/T1` à `T6`, la session contradictoire
du 2026-08-30, et le calcul de parcours produit par
`scripts/analyse/spec-parcours.py`.

Ce qui n'a pas changé n'a pas été réécrit : la gestion de l'erreur, les deux
dispositions, l'échelle d'aide et les principes P2, P3, P5, P6, P7 sont ceux de
la v1, issus du processus contradictoire documenté dans
`recherche/06-plaidoyers.md` et `recherche/07-verdicts.md`. Ce processus reste
la source d'autorité de ces décisions.

---

## 0. Journal des décisions de la v2

Dix-sept décisions. Chacune indique ce qu'elle remplace et sur quoi elle
s'appuie. **Un rapport de mesure casse un verdict quand il produit un fait que
le verdict supposait faux — jamais quand il ne produit qu'une préférence.**
C'est la règle qui a arbitré cette révision.

| # | Décision | Remplace | Fondement |
|---|---|---|---|
| 1 | **La cible est 8-11 ans**, non 7-12. | v1 §1 | T4 : rendement « very modest » à 7 ans, net à 8-9 ; l'institution française pose le clavier comme secondaire à l'écriture manuelle au CP. |
| 2 | **Deux parcours indépendants** — Découverte et Dactylo — jouables en parallèle, le parent choisit. | v1 §4.3 (deux axes dans un seul parcours) | Le produit servait mal sa borne haute (T4 §6.3) ; deux parcours séparent « apprendre le clavier » et « apprendre à écrire avec ». |
| 3 | **Le demi-clavier est conservé** pour Découverte : l'index balaie sa moitié. | — (confirme le verdict v1) | T6 tue les *colonnes d'index* (5 mots), pas le demi-clavier (241 mots mesurés en v2). La réfutation du plan v2 visait un autre objet. |
| 4 | **Le repli à quatre doigts depuis les réglages est supprimé.** | v1 §4.4, V7 | Seul chemin non borné vers le risque n°1 ; cassé dans le code (`T1 §2.1`) ; sans fonction propre. |
| 5 | **L'addendum du 2026-08-23 est retiré.** Pas de bande basse, pas de pastilles photographiques. | v1 addendum | Coûtait une troisième zone et un aller-retour vertical par lettre, sans montrer la frontière. |
| 6 | **Deux mains dessinées, permanentes, de part et d'autre du clavier**, doigt actif surligné. | v1 P4 (mains interdites comme mobilier) | Placement latéral : n'occupe aucune hauteur, renforce la frontière, monte à dix doigts sans nouvel actif. |
| 7 | **Quota fixe : 7 leçons par étape**, lisible d'avance. | v1 §4.3 (passage par critère de maîtrise) | La progression réellement vécue était déjà un quota de volume (T1 §4.1) ; la v2 dit la vérité de ce qu'elle fait. |
| 8 | **Le critère de maîtrise ne commande plus le passage : il compose le contenu.** Le plafond anti-mur disparaît. | v1 §4.3 | Sans gate, il n'y a plus de mur. La donnée de maîtrise sert à faire revenir les touches faibles. |
| 9 | **Une leçon dure 10-15 minutes et se termine au temps, pas au compte.** | v1 §4.2 (bloc de 8-12 items, 60-90 s) | Un bloc de 90 s donnait un parcours de 2 h contre un horizon sourcé de 25-30 h. |
| 10 | **Rejouer une étape** est possible, à l'initiative de l'enfant, depuis la carte. | nouveau | Choix, jamais verdict : pas d'état d'échec, pas de porte ouverte permanente. |
| 11 | **L'ordre des touches est recalculé.** Étape 1 de Découverte : `e a s i r t u p`, 241 mots contre 13. | v1 §4.3 | `spec-parcours.py` ; T3 avait mesuré que « optimisé par rendement lexical » était faux. |
| 12 | **Le lexique est reconstruit** : Dubois-Buyse échelon ≤ 23 × Lexique 3.83, **formes fléchies incluses**. 2 802 lemmes → 5 877 mots. | v1 §4.7 | Corpus v1 écrit à la main, 70,6 % seulement du lexique gradué, 9 mots sur 33 au palier 1. |
| 13 | **Calendrier de doigts de Dactylo : index + majeurs, puis annulaires, puis auriculaires.** | annule la décision provisoire « ordre lexical » prise en session | Mesuré : à budget égal l'ordre lexical échoue le plancher (41 mots contre 165) — les majeurs portent `e` et `i`. |
| 14 | **Plancher de recette : 60 items distincts par étape**, une leçon entière sans répétition. | v1 §4.3 (« une poignée de vrais mots ») | Conséquence directe de la leçon à 10-15 min. |
| 15 | **Vitesse et précision sont mesurées et conservées**, jamais montrées à l'enfant. Deux séries, une par parcours. | v1 §4.5 (rien n'était compté) | Les deux garde-fous d'observation de la v1 étaient inapplicables faute de compteurs. |
| 16 | **Les phrases n'existent qu'à partir de Maj et du point.** Les groupes nominaux sont admis dès l'espace. | v1 §4.7 (phrases hors MVP) | P3 : *le lion dort* est une phrase écrite faux ; *un chat* est vrai. |
| 17 | **La proposition d'arrêt passe à la fin de la leçon.** | v1 §4.2 (4ᵉ bloc consécutif) | La leçon est désormais la séance entière. |
| 18 | **Le clavier reste d'un seul tenant.** La frontière se lit dans la teinte des touches et dans les deux mains latérales, jamais dans un écart physique ; l'étiquette « la frontière » est retirée. | v2 P4, V3, V4 §5, §7.7 | Le code livré fait ce choix depuis le 2026-08-28 et un test le verrouille (`tests/e2e/corrections-2026-08-28.spec.ts`). Ratifié le 2026-08-30 : l'état livré convient, c'est le cahier qui est amendé. |
| 19 | **L'espace parent est gardé par une question réservée aux adultes** — un produit à deux chiffres × un chiffre. | v2 §5/V7 (deux boutons ouvraient V9 sans garde) | #63 y met la vitesse et la précision, que §1 interdit de montrer à l'enfant, à côté de la suppression du compte déjà présente. Un ralentisseur, pas un coffre-fort : la console du navigateur reste ouverte à qui la connaît. |

**Ce qui reste ouvert et n'est pas tranché ici** : le rendu en portrait sur
téléphone, et le contenu exact de l'étape 10 (paragraphes).

---

## 1. Le projet en une page

**Ce que c'est.** Une application web qui apprend à un enfant de 8 à 11 ans où
poser ses doigts sur *son* clavier. À l'écran : un mot ou un nombre en
français, le dessin fidèle du clavier réellement branché sur la machine avec la
touche à frapper mise en avant, et deux mains dessinées de part et d'autre qui
montrent le doigt. L'enfant tape, l'app valide, elle recommence.

**Pour qui.** Un enfant, un clavier, un parent qui installe et qui choisit le
parcours. Pas une classe, pas une fratrie, pas un orthophoniste.

**Les quatre exigences fondatrices** (non négociables, tout le reste en
découle) :
1. Afficher un mot ou un nombre à taper.
2. Représenter visuellement le clavier **réellement en usage** sur la machine.
3. Indiquer le doigt à utiliser pour la prochaine lettre ou le prochain chiffre.
4. Proposer un **parcours Découverte** où la contrainte est la main, non le
   doigt : index gauche pour toute la moitié gauche, index droit pour la moitié
   droite, pouces pour l'espace.

**Le cadrage.**
- **Claviers couverts** : FR-FR (AZERTY) et CH-FR / suisse romand (QWERTZ).
  Détection automatique, sélecteur manuel prioritaire.
- **Portée** : MVP jouable. Sept vues. La boucle est V1 → V4 → V5 → V4.
- **Gamification** : légère et non compétitive. Feedback immédiat, étoiles,
  encouragements variés. Aucun score, aucun chrono, aucun classement, aucun
  compteur d'erreurs **visible**.
- **Contenu** : français uniquement. Vrais mots du lexique 8-11 ans, groupes
  nominaux, nombres, puis phrases et paragraphes en Dactylo. Interface en
  français.
- **Horizon** : 140 leçons, une par jour, 10-15 minutes — soit **23 à 35 heures**,
  cinq à sept mois de pratique quasi quotidienne. C'est l'ordre de grandeur que
  la littérature associe à l'acquisition (25-30 h d'instruction, T4 §3.5).

**Pourquoi 8-11 ans, et pas 7-12.**

| | 7 ans | 8-11 ans | 12 ans |
|---|---|---|---|
| Rendement d'apprentissage mesuré | « very modest » (UCLA/UES 1997) | net, r = 0,47 (Donica 2019) | net |
| Position de l'institution | le clavier « ne peut remplacer l'écriture manuelle », « sans rien céder au clavier » (Éduscol CP) | « utiliser méthodiquement le clavier » (cycle 3) ; PER cycle 2 | idem |
| Bénéfice mesuré sur l'écrit | aucun | orthographe et écriture narrative, à partir du CM1 | idem |
| Ce que le produit lui offre | prématuré | juste | sous-dimensionné au-delà |

La borne basse n'est pas un interdit : rien n'empêche un enfant de 7 ans de
jouer. Elle dit pour qui le contenu est calibré.

**Ce que ce n'est pas.**

| Ce n'est pas | Pourquoi |
|---|---|
| Un test de vitesse | Le WPM affiché fait optimiser la vitesse au détriment de la technique, et réinstalle le hunt-and-peck. Aucun nombre comparable n'apparaît à l'écran. La vitesse est mesurée en interne (décision 15), jamais montrée. |
| Un curriculum scolaire | Pas d'arborescence de 300 leçons, pas de « devoir ». Une leçon est une séance de 10-15 minutes, une par jour. |
| Un jeu d'arcade | Pas de vies, pas de combos, pas de shoot'em up. La boucle récompense le geste propre, pas la réactivité. |
| Un outil de suivi parental | Pas de tableau de bord, pas de rapport, pas de profils multiples. Le parent choisit le parcours, c'est tout. |
| Un logiciel multi-dispositions générique | Deux dispositions, traitées à fond, contenu filtré par disposition. Pas de BÉPO, pas de belge, pas de canadien, pas de QWERTY US. |
| Un outil qui garantit un geste | **L'app ne peut pas savoir quel doigt a frappé.** Elle lit un code physique. Elle *montre* le doigt, elle ne le *vérifie* jamais. Toute affirmation contraire serait fausse. |

---

## 2. État de l'art

### 2.1 Tableau comparatif

| Outil | Public réel | Guidage doigt | Clavier à l'écran | AZERTY / CH-FR | Gamification | Ce qu'on lui prend | Ce qu'on lui refuse |
|---|---|---|---|---|---|---|---|
| **Dance Mat Typing** (BBC) | 7-11 ans | Mains cartoon + narration audio, zéro lecture | Permanent, zones colorées | QWERTY seul | Chansons, récompenses d'étape, **aucun score** | L'absence totale de score et de chrono ; l'audio qui remplace la lecture | La répétition sans remédiation ; le ton bébé pour un 11 ans |
| **TypingClub** | 5-18 ans, école US | Mains animées sous le clavier — le plus lisible du marché | Permanent, désactivable | QWERTY par défaut, reste incertain | Étoiles 1-5 par leçon, carte de progression | La carte de progression comme moteur ; la précision qui porte le seuil et la vitesse qui porte la gradation | **L'étoile retirée pour 1 % d'imprécision** — punition déguisée en récompense ; l'exigence d'un enseignant qui règle à la main |
| **Typing.com** | 8+ (décrochage sous 8 ans) | Surlignage de touche, guidage discret | Permanent | QWERTY | Badges, XP, jeux séparés, **publicité** | La hiérarchie *unit > lesson > activity*, où une leçon est ce qu'on fait en une fois | La densité textuelle, le ton scolaire, la pub, la coupure leçon/jeu |
| **Nitro Type** | 10+ | **Aucun** | Aucun | — | Course multijoueur, monnaie, classement | Rien | Tout : la compétition sociale renforce le hunt-and-peck |
| **Keybr** | Ados/adultes | Coloration par doigt | Optionnel | Multiples, manuel | Graphiques de perf | **Le déverrouillage progressif des lettres par maîtrise** — meilleur moteur du panel | Les pseudo-mots ; le seuil de 175 cpm par touche, qui bloque un utilisateur 8 heures sur `R` et `T` |
| **Monkeytype** | Adultes experts | Aucun | Optionnel, décoratif | Excellente couverture, touches mortes documentées | WPM seul | La rigueur du modèle de layout et des touches mortes | L'esthétique entière : texte défilant, densité, chiffre roi |
| **typ.ing** | Adultes | — | — | — | Aucune | Le **ton** : propre, calme, sans leaderboard | La cible d'âge et l'absence de pédagogie |
| **Fort-Dactylo** | 6-7 ans+, dys | Peu de posture | Oui | **Détection auto AZERTY/QWERTY/QWERTZ** | Shoot'em up, vitesse adaptative | La détection automatique de disposition ; la gratuité sans pub ni collecte | La boucle « tirer sur les lettres » : entraîne la réactivité, pas la posture |
| **ClaviGo / ClaviHERO** | Enfants FR | Colonnes colorées = doigts | **S'estompe progressivement** | AZERTY France seul | Score, combos, 32 niveaux | L'idée de sevrage progressif de l'aide | Le masquage du clavier (voir P6) ; le score et les combos |
| **edclub / Expédition dactylo** | Scolaire FR | Oui | Oui | 485 leçons AZERTY, 652 anglaises | Aucune notable | **Neuf leçons sur onze se correspondent position par position entre le cours AZERTY et le cours QWERTZ** : une seule progression, deux tables. Et le bloc accents placé juste après les trois rangées de lettres, avant les majuscules et les chiffres | Le volume scolaire |
| **Klavaro** | Tous | Oui | Oui | Layouts entièrement éditables | Aucune | **Le layout comme donnée déclarative, pas comme variante de code** | L'austérité totale |
| **Ratatype** | Ados/adultes | Oui | Oui | Parcours *French AZERTY* dédié | Scoreboards, certificats | Le parcours par disposition | Les classements et certificats : compétition explicite |

### 2.2 Les six choses qu'on prend

1. **Le guidage doigt doit être visuel et sonore, jamais textuel.** Tous les
   outils qui écrivent « utilisez l'annulaire gauche » perdent un enfant de
   8 ans.
2. **Le déverrouillage progressif bat la liste de leçons** (Keybr). Chaque
   nouvelle touche ouverte est un gain célébré, et c'est le remplaçant du score
   interdit.
3. **Le layout est une donnée.** Une table par disposition, une pédagogie
   unique. Le contenu proposé change avec la disposition, pas seulement le
   dessin.
4. **La détection automatique doublée d'un sélecteur manuel** (Fort-Dactylo)
   est le comportement attendu.
5. **Du vrai français lisible dès le premier exercice.** Dance Mat réussit
   parce que « sad » et « lad » veulent dire quelque chose ; Keybr échoue avec
   les enfants parce que ses pseudo-mots n'en ont aucun.
6. **Une leçon est ce qu'on fait en une fois.** Typing.com, Ratatype, Duolingo,
   Khan, Anton : partout, sans exception. Aucun produit n'appelle « leçon » un
   ensemble de touches qui prend plusieurs sessions.

### 2.3 Les quatre erreurs qu'on refuse

1. **La compétition déguisée en motivation.** Classement, WPM, combos,
   scoreboard. Documenté : l'enfant optimise la vitesse immédiate, revient au
   hunt-and-peck, et verrouille la mauvaise habitude.
2. **La punition déguisée en récompense.** L'étoile retirée, le niveau échoué,
   le compteur d'erreurs. Une erreur doit déclencher **une aide**, jamais une
   perte.
3. **La charge de lecture et le bruit visuel.** Un enfant qui apprend encore à
   lire ne doit décoder qu'**une seule chose** à l'écran : le caractère à taper.
   Le reste passe par l'image, la couleur, la position et l'audio.
4. **Le seuil de performance comme condition de passage.** Le seuil de keybr —
   175 cpm par touche, exigé simultanément sur toutes les lettres actives —
   produit des blocages de plusieurs heures. Et il n'existe **aucune norme de
   précision par âge** : les études mesurent le *net WPM*, qui fusionne vitesse
   et erreurs. Les écarts-types mesurés sont de l'ordre de la moyenne — à
   8-9 ans, un enfant à 4 mots/min et un à 12 sont tous deux dans la norme.
   Toute cible chiffrée affichée est statistiquement indéfendable.

---

## 3. Principes de conception

Sept règles. Chacune est un verdict, pas une piste. Format : la règle, la
raison, l'argument adverse le plus fort, pourquoi il ne l'emporte pas.

---

### P1 — La contrainte de Découverte est la MAIN ; celle de Dactylo est le DOIGT

**La règle.** Le produit a deux parcours et deux régimes de contrainte.

- **Découverte.** Chaque touche appartient à une **main**, déterminée par sa
  position physique par rapport à la ligne médiane (`T`/`G`/`B` à gauche,
  `Y`-ou-`Z`/`H`/`N` à droite). L'index gauche atteint toute la moitié gauche,
  l'index droit toute la moitié droite, les pouces l'espace. L'indication
  affichée est de **niveau main** : « Main gauche · ton index ».
- **Dactylo.** Chaque touche est attribuée à son **doigt définitif** dès son
  ouverture, et les doigts s'ouvrent par étages : index + majeurs, puis
  annulaires, puis auriculaires. Aucune touche ne change jamais de doigt.

La palette est **hiérarchique** : deux teintes (main gauche / main droite),
identiques dans les deux parcours ; Dactylo ne fait que subdiviser en
nuances. Aucune touche ne change jamais de couleur de base.

**La raison.** L'objet d'apprentissage n°1 de Découverte est la **frontière
verticale**, pas le nom du doigt. La répartition par main est exactement celle
de la méthode à dix doigts : elle n'est jamais démentie, elle est seulement
subdivisée par Dactylo. Et elle est identique en AZERTY et en QWERTZ romand,
alors que les colonnes d'index diffèrent (`Y` contre `Z`).

**L'argument adverse.** Découverte enseigne un geste que Dactylo devra défaire.
L'interférence proactive est mesurée chez le dactylographe expert et persiste
après dix séances. Autant attribuer le doigt définitif dès la première touche,
ce qui ne coûte **rien** en rendement lexical (T6 : 0,00 point d'AUC — c'est
une identité, la carte touche→doigt est une bijection).

**Pourquoi il ne l'emporte pas.** Trois raisons, dans l'ordre de force.
D'abord, **l'interférence documentée concerne un geste automatisé**, et
l'automatisation kinesthésique ne s'installe qu'à 20-25 mots/min (West 1967).
Un enfant de 8-9 ans est à 4-8 mots/min : il n'a pas de mémoire motrice à
défaire. Ensuite, **l'app ne peut pas observer le doigt** : le remède le mieux
documenté à l'interférence — empêcher mécaniquement le mauvais doigt — est hors
de portée, et le prédicteur de Feit et al. (mapping non ambigu) est
inobservable dans les deux régimes. Ce qui se décide ici n'est donc pas un
geste mais une **consigne**. Enfin, la faisabilité d'un mapping strict à
quatre doigts chez un enfant de cet âge **n'est mesurée nulle part** : les deux
camps argumentent sans données. Découverte ne parie pas ; Dactylo attend que
l'enfant soit plus grand.

**Ce qui reste acquis à l'adversaire, et qui est appliqué** : Découverte
**n'est pas de la dactylographie**, et le cahier ne prétend pas le contraire ;
et le risque croît avec la durée, d'où la suppression du repli (décision 4).
Le seul garde-fou restant est **humain** : le parent choisit le parcours.
L'app ne borne rien.

---

### P2 — Aucune touche modificatrice n'existe avant l'étape qui l'enseigne

**La règle.** Avant l'étape Majuscule : ni Maj, ni AltGr, ni Verr.Maj — **ni
affichée, ni requise, ni acceptée**. Le contenu est strictement ce que les
touches ouvertes produisent **sans modificateur** sur la disposition détectée.
Conséquence directe : en CH-FR les chiffres sont directs, en FR-FR ils exigent
Maj et n'arrivent donc qu'à l'étape des chiffres. La rangée des chiffres reste
**dessinée en permanence**, avec ses deux légendes réelles (`&` et `1`, `é` et
`2`…) et un cadenas : verrouillée et expliquée, jamais absente.

**Changement par rapport à la v1.** Les chiffres sont désormais à la **même
étape pour les deux dispositions** (étape 8). Le déséquilibre de la v1 — l'enfant
suisse devait valider 11 touches au palier 1 contre 7 pour l'enfant français,
avec le même plafond — disparaît. La progression se définit en positions
physiques, le layout n'est qu'une table de correspondance.

**La raison.** Il y a un enfant et un clavier. Les deux machines sont réellement
différentes ; l'app doit dire la vérité de celle qui est posée sur la table.

**L'argument adverse.** Autoriser exceptionnellement l'auriculaire gauche pour
Maj — « la touche magique » — rendrait les chiffres accessibles plus tôt.

**Pourquoi il ne l'emporte pas.** La règle canonique de Maj est
**contralatérale**. Les chiffres `4` et `5` se frappent de l'index gauche et
exigent donc la Majuscule **droite**. L'« exception Maj » n'est donc pas un
doigt supplémentaire avec une règle unique : c'est deux doigts **plus une règle
conditionnelle de latéralité**, ou bien l'enseignement d'un Maj homolatéral
qu'il faudra désapprendre — exactement ce que l'argument adverse jurait éviter.

---

### P3 — Une frappe fausse n'écrit rien. Le texte à l'écran est toujours orthographiquement vrai

**La règle.** Blocage strict de la **progression**, jamais de l'enfant. Une
frappe erronée n'écrit rien, ne déplace pas le curseur, n'affiche aucun
caractère faux. Le feedback d'erreur est immédiat (< 100 ms) mais se produit
**exclusivement sur le clavier virtuel et les mains** : la touche pressée
s'assombrit et retombe, la touche cible et le doigt cible s'intensifient.
Jamais sur le texte, jamais de rouge, jamais de croix, jamais de buzzer.
L'aide monte sur une **échelle bornée à trois barreaux**, purement visuelle et
sonore ; le barreau 3 est **terminal et permanent** pour l'item. La célébration
de réussite est **strictement identique** que l'item ait pris un essai ou neuf.

**Extension v2 — la règle vaut pour l'item entier, pas seulement pour le mot.**
Un groupe nominal (*un chat*, *mon bateau*) est orthographiquement complet sans
majuscule ni point. Une **phrase** qui en est dépourvue est fausse : *le lion
dort* est la même faute que `chàt`, un cran plus haut. **Aucune phrase n'est
proposée avant que Majuscule et le point ne soient ouverts.**

**La raison.** Le contenu est en français, l'enfant décode encore, et il apprend
l'orthographe en même temps. Afficher du faux est de la charge extrinsèque pure
doublée d'un risque d'interférence orthographique.

**L'argument adverse.** Sur touche morte et sur piège Maj AZERTY, le signal
d'entrée n'est pas fiable. Bloquer sur un signal non fiable produit le pire état
possible : l'enfant fait le bon geste et l'écran ne bouge pas.

**Pourquoi il ne l'emporte pas.** L'argument appelle une réponse de
**validation**, pas un changement de paradigme. La touche morte est traitée
comme un **état neutre d'attente** et la validation se fait sur le caractère
composé. Le piège Maj est parfaitement détectable — l'app reçoit `è` au lieu de
`7` — et l'argument se retourne contre son camp, qui est le seul à écrire ce
`è` faux dans le mot. Preuve de catégorie : **tous** les tutoriels de frappe
pour enfants bloquent, et les critiques documentées portent sur les étoiles
retirées et la répétition sans remédiation, jamais sur le blocage.

---

### P4 — Deux mains dessinées encadrent le clavier ; le doigt actif y est surligné

**La règle.** L'écran de leçon comporte le mot, le clavier, et **deux mains
dessinées placées de part et d'autre du clavier** — main gauche à gauche, main
droite à droite. Sur la main concernée, le doigt à utiliser est **surligné par
un remplissage plus sombre de la même teinte** ; l'autre main est au repos,
aucun doigt marqué. Le libellé reste de **niveau main** (« Main gauche · ton
index ») ; c'est le dessin qui porte le doigt, jamais un texte.

Douze états, six visuels : `index`, `majeur`, `annulaire`, `auriculaire`,
`pouce`, `aucun`, × gauche/droite. Découverte en utilise six, Dactylo les
douze. **Les fichiers sont dans `public/doigts/`**, nommés
`<doigt>_<gauche|droite>.png` — PNG à fond transparent, 256 px de large,
168 Ko pour les douze. Ils sont calés au pixel près les uns sur les autres :
une même boîte, une même ligne de base, aucun recadrage à faire.

**Chaque main porte une pastille claire sur l'index, et une seule.** C'est le
repère tactile `F`/`J`, que le clavier physique marque d'un ergot et que le
cahier exige visible dès la première leçon. Elle reste affichée quel que soit le
doigt surligné : un point de référence n'a de sens que s'il ne bouge pas. Les
visuels d'origine en portaient trois — annulaire, majeur, index — ce qui ne
correspondait à aucune notion de la méthode et apprenait à l'enfant une
convention inexistante. Sur le clavier, le porteur d'information reste la **POSITION** pour tout ce qui
concerne l'étape en cours : une touche de la leçon se distingue d'une touche
éteinte par sa **luminance** et par l'épaisseur de son liseré, donc reste
discriminable **en niveaux de gris**. La seule exception est l'appartenance
gauche/droite, portée par la **teinte** (teal / orange) sur un clavier resté
**d'un seul tenant** — décision 18. Elle n'a pas besoin du niveau de gris :
elle est doublée par les deux mains dessinées, une de chaque côté, et par la
position même de la touche. Seule la barre d'espace est détachée. Aucune
légende couleur→doigt sur l'écran de leçon.

**La raison.** Le placement **latéral** est ce qui change tout. Il occupe les
marges horizontales, qui ne servent à rien, et ne prend aucune hauteur au
clavier. Il **renforce la frontière** — chaque main est de son côté — là où une
bande basse alignant des pastilles ne la montre pas. Et il monte à dix doigts
sans aucun nouvel actif : la même main surligne un autre doigt.

**L'argument adverse (verdict n°1 de la v1).** Une troisième zone coûte un
aller-retour vertical par lettre chez un novice déjà partagé entre le mot, le
clavier écran et son clavier physique ; une main d'adulte vue de dessus n'a pas
la géométrie de celle de l'enfant ; et une main animée montre un doigt en
masquant la frontière.

**Pourquoi il ne l'emporte pas.** Les trois objections visaient une bande
**basse**. La première tombe avec le placement latéral (aucune hauteur perdue,
aucun aller-retour vertical). La troisième s'inverse : deux mains latérales
*sont* la frontière. La deuxième subsiste et est traitée par le dessin — une
main schématique, à plat, sans photoréalisme, en teintes de parcours et non en
teintes de peau. **L'addendum du 2026-08-23, qui imposait quatre pastilles
photographiques dans une bande basse, est retiré** : il payait le coût que le
verdict lui reprochait sans acheter la frontière.

---

### P5 — Le générateur est piloté par la contrainte, l'ordre des étapes est piloté par la mesure

**La règle.** Chaque étape déclare un **ensemble explicite** (touches + doigts
autorisés) et rien en dehors n'est jamais affiché à taper — accents et touches
mortes compris, sans exception, pas même pour un mot « presque » typable. Mais
l'**ordre** des ensembles est **calculé** pour maximiser le nombre de vrais mots
français typables au plus tôt. Ordre de préférence du générateur, visible et
fixe : **vrai mot ou groupe nominal > nombre > phrase**. **Jamais de
pseudo-mot, jamais de syllabe de remplissage.**

**Règle de recette, non négociable.** Une étape ne part pas si elle ne rend pas
typables **au moins 60 items distincts** du lexique de l'âge — une leçon
entière sans répétition. Si une étape n'y arrive pas, **c'est l'étape qu'on
refait**, jamais le contenu qu'on comble.

**La raison.** Le gating n'est pas ici un choix pédagogique, c'est une condition
d'existence du produit : sans ensemble déclaré, il n'y a ni indication du doigt,
ni filtrage par disposition (`ç` direct en AZERTY, sous Maj en CH-FR : *garçon*
casserait silencieusement chez le public suisse), ni écran de fin de leçon qui
célèbre des touches débloquées.

**L'argument adverse.** La rangée de repos AZERTY ne contient aucune voyelle,
donc aucun mot français. L'ordre canonique est un import anglophone.

**Pourquoi il ne l'emporte pas.** Parce qu'il argumente contre un **ordre**, pas
contre un **gating**. On lui donne entièrement raison sur l'ordre — la rangée de
repos n'ouvre aucune étape, et la mesure va plus loin que lui : la rangée de
repos AZERTY ne porte que **23,33 %** des frappes d'un corpus français contre
**56,36 %** pour la rangée du haut, qui contient `e a i o u r t`. Une
progression « rangée de repos d'abord » est structurellement moins rentable en
AZERTY qu'en QWERTY, et aucun éditeur n'en tire les conséquences. Les repères
`F` et `J` restent le point d'ancrage tactile et le geste de retour ; **la
rangée de repos n'est pas la première leçon.**

**Sur les pseudo-mots — correction d'un argument faux de la v1.** La v1 les
écartait au motif d'un « mode d'échec documenté chez l'enfant qui apprend
encore à lire ». C'est faux : le guide Éduscol *Pour enseigner la lecture et
l'écriture au CP* les **prescrit** (« listes de syllabes, de pseudo-mots, de
mots »), et ils sont l'instrument standard d'évaluation du décodage. La
décision reste bonne, l'argument change : ceux de Keybr sont générés par
fréquence de bigrammes **anglais** et ne respectent pas les correspondances
graphème-phonème du français ; et surtout, **en frappe un pseudo-mot n'isole
rien** — il ne sert que de remplissage. En lecture il isole le décodage ; ici,
il ne mesure ni n'enseigne quoi que ce soit.

---

### P6 — On n'estompe jamais le dessin du clavier, on estompe la latence de l'indice

**La règle.** L'application ne masque **jamais** le clavier d'elle-même, à
aucune étape, dans tout le MVP. Ce qui s'estompe est l'**immédiateté** de
l'indice : le clavier reste dessiné, touches neutres, et la surbrillance de la
touche cible n'apparaît qu'après une **fenêtre de rappel silencieuse**, propre à
chaque touche, qui s'allonge par paliers avec les frappes correctes
(**0 s → 0,8 s → 1,5 s → 2,5 s maximum**) et retombe **instantanément à 0 s**
pour cette touche dès une erreur ou un dépassement. Aucun décompte, aucune
barre, aucun son pendant la fenêtre. L'état de latence est interne et **jamais
représenté graphiquement**. Seule exception au masquage : un bouton **« Je tape
sans regarder »**, déclenché par l'enfant, qui cache le clavier pour le mot en
cours et se réarme seul au mot suivant. En **Découverte**, la latence est
**plafonnée à 0 s** : ce parcours entraîne le placement des mains, pas le rappel.

**La raison.** La latence augmente le coût de la consultation quel que soit
l'endroit où l'enfant regarde, et crée la fenêtre de rappel recherchée — sans
falaise, sans palier affiché assimilable à un score, et en réutilisant
exactement l'échelle d'aide de P3.

**L'argument adverse.** Une aide disponible en continu améliore la séance et
dégrade la rétention (*guidance effect*). Un enfant prendra toujours le chemin
le moins coûteux : consulter une carte coûte moins cher que se souvenir.

**Pourquoi il ne l'emporte pas.** Le diagnostic est juste ; le remède est faux.
Masquer le clavier **à l'écran** n'augmente pas le coût de la consultation,
parce qu'un substitut gratuit et légendé est posé sous les mains de l'enfant :
**le clavier physique**. Le masquage retire donc l'aide qui enseigne (le doigt,
introuvable ailleurs) et laisse intacte celle qui n'enseigne rien (la position
des lettres, imprimée sur les touches).

---

### P7 — Règles de forme (non discutées, appliquées partout)

- **Axe vertical unique.** Mot → clavier. Les mains sont dans les marges
  latérales, à hauteur du clavier, et n'ajoutent aucune ligne à l'axe de
  lecture. Aucun défilement de texte : un item = un écran.
- **Triple redondance sur la cible.** Agrandissement dans le mot + saturation
  pleine sur la touche + halo pulsé. **Un seul marqueur actif à l'écran**,
  jamais deux touches en avant (sauf le cas Maj de P3, où la main opposée
  montre son auriculaire).
- **Typographie calée sur un enfant de 8 ans, pas sur le parent.** Mot cible
  48-72 px effectifs, étiquettes de touches 18-24 px minimum, interlettrage
  augmenté. Sans-serif à `a` et `g` à un seul étage. `I` / `l` / `1` et `0` /
  `O` impérativement distincts.
- **Casse.** Le mot cible s'affiche **en minuscules** tant que Majuscule n'est
  pas enseignée ; les touches du clavier virtuel portent des **capitales**,
  comme la machine physique. On ne « corrige » pas le clavier.
- **Contraste et fond.** Fond légèrement crème, jamais blanc pur ni noir pur.
  Rapport visé 7:1 sur le texte cible.
- **Daltonisme.** Jamais de couple rouge/vert comme opposition succès/erreur.
  Aucune information portée par la seule couleur, nulle part — y compris le
  doigt surligné, qui doit se distinguer par la luminance.
- **Son.** Son doux et court sur la réussite, **silence sur l'erreur**.
  L'asymétrie est perçue comme neutre ; un son d'erreur est perçu comme un
  reproche. Sons coupables dans les réglages.
- **Motricité.** **Aucune pénalité pour une frappe lente, nulle part et à aucun
  titre** — ni pour valider un item, ni pour composer les leçons suivantes.
  Compatibilité avec les touches rémanentes du système. Pas de clignotement
  > 3 Hz ; la préférence système « réduire les animations » est respectée.

---

### P8 — Arbitrages rendus à la rédaction

Quatre points où les décisions se contredisaient dans leurs conséquences. Ils
sont réglés ici.

1. **Le parcours Dactylo réindexe le calendrier des doigts sur les étapes de
   lettres, pas sur les numéros d'étape.** L'étape 3 de Dactylo enseigne
   Majuscule et n'ouvre aucune lettre ; les annulaires s'ouvrent donc à la
   deuxième étape *de lettres* (étape 2) et les auriculaires à la troisième
   (étape 4).
2. **L'auriculaire arrive d'abord comme porteur de Majuscule, pas comme
   frappeur de lettres.** Maintenir une touche est moteurement moins exigeant
   que frapper une lettre à l'auriculaire. L'étape 3 lui confie la seule touche
   Maj, maintenue, sans qu'aucune lettre ne change de doigt ; l'étape 4 lui
   donne ses lettres.
3. **L'espace se frappe du pouce de la main qui n'a pas frappé la lettre
   précédente.** C'est la seule règle qui rende les états de pouce réellement
   distincts, et elle renforce l'apprentissage de la frontière.
4. **L'espace est ouvert à l'étape 1 des deux parcours.** Il ne coûte rien : il
   n'est jamais une lettre de mot et n'entre dans aucune métrique de rendement.
   Il ouvre les **groupes nominaux**, qui sont le levier de diversité le moins
   cher du corpus — mais pas immédiatement : un groupe exige un déterminant, et
   l'étape 1 de Découverte (`e a s i r t u p`) n'en rend aucun typable. Les
   groupes commencent donc à **l'étape 2 en Découverte** (548 groupes) et dès
   **l'étape 1 en Dactylo** (22, grâce à `n`, `d` et `u`).

---

## 4. Fonctionnement

### 4.1 Le parcours de l'enfant

L'enfant ouvre l'app et arrive sur **V1 Accueil** : un titre, une illustration
de clavier, un gros bouton « On commence ! », le parcours en cours, et une ligne
discrète indiquant le clavier détecté.

Au tout premier lancement, ou s'il touche « Changer », il passe par **V2 Choix
du clavier** : l'app lui demande d'appuyer sur la touche `A` de son vrai
clavier, identifie la disposition en une frappe, et propose deux cartes
illustrées à confirmer d'un clic.

Au premier lancement seulement, **V3 Guide-doigt** s'affiche : illustration
statique doublée d'audio, qui installe la frontière verticale et le rôle des
mains.

Il valide et bascule sur **V4 Leçon**, le cœur du produit. Il tape pendant
10 à 15 minutes. Une frappe fausse n'écrit rien et fait monter l'aide d'un
barreau.

La leçon terminée, **V5 Fin de leçon** le félicite : des étoiles, une phrase
d'encouragement variée, le clavier miniature où les nouvelles touches
s'illuminent avec les mots qu'il peut désormais écrire, et « c'est bien pour
aujourd'hui ». Il choisit « Encore » et repart sur V4, ou « Retour ».

Depuis l'accueil ou la fin de leçon, **V6 Carte de progression** montre son
clavier qui se colore étape après étape, pour le parcours en cours. **V7
Réglages**, sous l'icône d'engrenage, permet de changer de parcours, de
rechanger de clavier, couper les sons, espacer le texte, rejouer le guide-doigt.

**La boucle jouable est V1 → V4 → V5 → V4.** Tout le reste est périphérique.

### 4.2 Les deux parcours

|  | **Découverte** | **Dactylo** |
|---|---|---|
| Âge visé | 8-9 ans | 10-11 ans |
| Contrainte | la **main** : l'index balaie sa moitié | le **doigt définitif**, ouvert par étages |
| Doigts à l'étape 1 | 2 index + 2 pouces | 2 index + 2 majeurs + 2 pouces |
| Calendrier des doigts | aucun | index+majeurs → annulaires → auriculaires |
| Majuscule et point | étape 7 | **étape 3** |
| Contenu | mots, nombres, **groupes nominaux** | + **phrases dès l'étape 4**, paragraphes aux étapes 9-10 |
| Latence de rappel (P6) | plafonnée à 0 s | 0 → 2,5 s |
| États de mains utilisés | 6 (index, pouce, repos × 2) | 12 |

**Ils sont indépendants et parallèles.** Aucun n'est prérequis de l'autre,
aucun ne se termine dans l'autre, il n'y a pas de transition à concevoir. Les
deux progressions sont **persistées séparément** : un enfant peut être à
l'étape 3 de Découverte et à l'étape 1 de Dactylo. **C'est le parent qui
choisit le parcours**, depuis les réglages.

**Ce que cela implique, et qui doit être dit franchement.** L'app ne borne plus
la durée passée à quatre doigts. Le seul garde-fou du risque n°1 (§7.1) est
désormais le parent. Le cahier ne prétend pas le contraire.

### 4.3 Le rythme

- **Une leçon = une journée = 10 à 15 minutes.** C'est la séance entière.
- **La leçon se termine au COMPTE d'exercices, plus au temps** (#107). Le
  cahier disait l'inverse, et son objection tient toujours : à 7,8 mots nets/min
  (8-9 ans) un mot coûte ~10-12 s, à 16 mots/min (10-11 ans) ~6 s, si bien que
  le même compte donne dix minutes à l'un et vingt à l'autre. Elle est payée les
  yeux ouverts, parce qu'une fin au temps ne peut pas se compter d'avance :
  « Exercice 2 sur ? » n'existe pas, et sans dénominateur les points de l'entête
  ne comptaient vers rien.
  Le quota est réglé PAR PARCOURS pour retomber sur la fourchette de durée, à
  douze mots par exercice : **4 à 6 exercices** en Découverte (≈ 50-70 mots),
  **8 à 12** en Dactylo (≈ 100-145 mots), croissant de la première à la
  septième leçon de l'étape. Une durée plafond de vingt minutes reste en
  garde-fou muet pour l'enfant très lent — elle ne s'affiche jamais.
- **Micro-feedback par lettre** correcte (< 100 ms) : la touche s'illumine, son
  doux.
- **Célébration par item terminé** : 0,5 à 1 s, une étoile. **Jamais de
  confettis plein écran.**
- **Les étoiles ne mesurent rien.** Une étoile par item validé, identique que
  l'item ait pris un essai ou neuf. Elles **marquent**, elles ne notent pas.
  Une étoile n'est jamais retirée.
- **Fin de leçon.** V5 affiche « Tu as bien travaillé. C'est bien pour
  aujourd'hui. » et inverse l'emphase des boutons — « Retour » devient primaire.
  L'enfant peut toujours continuer ; l'app ne le bloque jamais et ne le félicite
  pas d'arrêter.
- **Encouragements** : rotation d'au moins 15 formulations distinctes.
- **Horizon** : 7 leçons × 10 étapes × 2 parcours = **140 leçons**, soit 23 à
  35 heures sur cinq à sept mois. Le rituel quotidien compte davantage que
  l'intensité d'une séance : la rétention s'effondre à l'arrêt (§7.4).

### 4.4 La progression

**Trois niveaux, trois noms.**

| Ce que c'est | Nom visible | Nom dans le code |
|---|---|---|
| Un jeu de touches | **étape** | `etape` (v1 : `palier`) |
| Une session d'un jour | **leçon** | `lecon` (v1 : `bloc`) |
| Une rangée de mots servie d'un coup | **exercice** | `serie` (la « vague ») |
| Un mot, un groupe, un nombre | **mot** | `item` |

`bloc` **reste dans le code** au sens « pan physique du clavier », qui est son
sens juste. Le renommage global est interdit. Deux champs persistés et le code
de fusion multi-appareil exigent une migration ou des alias en lecture.

**Le quota est fixe et lisible d'avance : 7 leçons par étape.** L'enfant voit
« Leçon 3 sur 7 ». Il n'y a pas d'autre condition de passage : au bout de la
septième leçon, l'étape suivante s'ouvre.

**Quatre échelons, quatre compteurs, et chacun fait avancer le suivant**
(#107). Les mots remplissent l'exercice (une rangée de points), les exercices
remplissent la leçon (« Exercice 2 sur 5 »), les leçons remplissent l'étape
(« Leçon 3 sur 7 »), les étapes le parcours (« Étape 1 sur 10 »).

Le compteur d'exercices a été interdit sur V4, puis rétabli. L'interdiction
partait d'un vrai risque — un nombre devant les yeux transforme un repère en
score. Mais la rangée seule se remplissait puis se vidait sans que rien d'autre
ne bouge : l'enfant la finissait deux fois de suite en lisant « Leçon 1 sur 7 »
figé. Un repère sans dénominateur ne repère rien. Le compteur revient donc,
avec ce qu'il doit avoir pour ne pas devenir une note : **un total connu
d'avance, atteignable dans la séance, et jamais un score** — ni pourcentage,
ni vitesse, ni fautes.

**Ce que devient la maîtrise.** Elle ne commande plus le passage, elle
**compose le contenu**. On mesure la proportion d'items frappés **justes du
premier coup et sans aide**, par touche ; les touches faibles reviennent plus
souvent dans les leçons suivantes de la même étape. Aucun seuil, aucun
affichage, aucune conséquence sur le calendrier.

**Le plafond anti-mur disparaît.** Il n'existait que pour empêcher un blocage
sur un critère de passage ; sans critère de passage, il n'y a plus de mur.

**Rejouer une étape.** L'enfant peut relancer une étape déjà finie, depuis la
carte, une étape nommée à la fois. Ce n'est jamais proposé par l'app, jamais
présenté comme une reprise, et ce n'est pas un mode dans lequel on entre. Une
étape rejouée ne compte **ni dans le quota de l'étape courante, ni dans le
passage à la suivante** — sans quoi refaire une étape ancienne ferait progresser
sur un contenu déjà acquis. Ce qui a été tapé est enregistré quand même, sous le
numéro de l'étape réellement jouée.

**Terminer un parcours.** Le parcours est fini à la septième leçon de la
dixième étape. Cet état est **dérivé** de `etape` et `leconsSurEtape`, jamais
stocké à part, et `etape` ne passe pas à 11 : onze ne désigne aucun contenu. La
fin est annoncée une fois, en fin de leçon, comme un fait de calendrier —
soixante-dix leçons faites — et jamais comme une performance : ni vitesse, ni
précision, ni « parfait ». Ensuite, plus aucune étape n'est « en cours » : les
dix sont finies et rejouables, l'accueil propose de choisir une étape au lieu
de relancer, et rien ne redémarre tout seul. Il n'y a pas de mode libre, pas de
huitième leçon de l'étape 10, et finir un parcours ne change rien à l'autre.

### 4.5 Les étapes

Jeux de touches produits par `scripts/analyse/spec-parcours.py` sur le lexique
v3. « Mots » = items distincts rendus typables, cumulés. Le plancher de recette
est de **60**.

**Ces tables existent comme données, prêtes à être importées.**

| Fichier | Contenu |
|---|---|
| `src/data/parcours.json` | Les 4 parcours × 10 étapes : caractères ouverts, doigt de chaque touche, doigts ouverts, titre, promesse, et le compte d'items atteint |
| `src/data/lexique-v3.json` | **5 877 mots**, **4 875 groupes nominaux**, **609 phrases**, chacun avec son poids de fréquence |

Le lexique ne connaît pas les étapes : l'application le filtre à l'exécution
par l'ensemble de caractères ouverts, comme le fait `src/core/corpus.ts`
aujourd'hui. Régénération : `scripts/analyse/generer-lecons.py`.

#### Découverte — FR-FR

| Étape | Ouvre | Mots | Couv. | Promesse |
|---|---|---|---|---|
| **1** | `e a s i r t u p` + espace | **241** | 17,6 % | « Tu écris tes premiers mots. » |
| 2 | `o n m d v` | 1 734 | 49,3 % | |
| 3 | `l c é f b` | 4 098 | 78,5 % | |
| 4 | `g h q x è` | 5 412 | 92,6 % | |
| 5 | `j z y à` | 5 743 | 97,7 % | |
| 6 | `ç k w ù` | 5 772 | 97,9 % | « Tu as toutes les lettres. » |
| 7 | **Majuscule et le point** | | | « Tu écris les noms avec une grande lettre. » |
| 8 | **Les chiffres** | | | « Tu écris les nombres. » |
| 9 | **La ponctuation** | | | |
| 10 | *aucune touche* — phrases courtes | | | « Tu écris des phrases. » |

#### Découverte — CH-FR

| Étape | Ouvre | Mots | Couv. |
|---|---|---|---|
| **1** | `e a s i r t u p` + espace | **241** | 17,6 % |
| 2 | `o n m d v` | 1 734 | 49,3 % |
| 3 | `l c é f` | 3 728 | 74,4 % |
| 4 | `b g h q` | 5 141 | 88,3 % |
| 5 | `x j è z` | 5 679 | 96,4 % |
| 6 | `y à k w` | 5 749 | 97,7 % |

Étapes 7 à 10 identiques à FR-FR. **L'étape 1 est le même jeu de touches sur
les deux dispositions** — le squelette est commun, seule la table de
correspondance change.

#### Dactylo — FR-FR

| Étape | Ouvre | Doigts | Mots | Couv. |
|---|---|---|---|---|
| **1** | `e i r t n u d v` + espace | index + majeurs | **165** | 4,7 % |
| 2 | `s o l c b` | + annulaires | 1 020 | 26,7 % |
| **3** | **Majuscule et le point** | + auriculaires *en modificateur* | | |
| 4 | `a p m é f` | auriculaires, lettres | 4 098 | 78,5 % |
| 5 | `g h q x è` | 8 | 5 412 | 92,6 % |
| 6 | `j z y à` | 8 | 5 743 | 97,7 % |
| 7 | `ç k w ù` | 8 | 5 772 | 97,9 % |
| 8 | **Les chiffres** | 8 | | |
| 9 | **La ponctuation** | 8 | | |
| 10 | *aucune touche* — paragraphes | 8 | | |

#### Dactylo — CH-FR

| Étape | Ouvre | Doigts | Mots | Couv. |
|---|---|---|---|---|
| **1** | `e i r t n u d v` + espace | index + majeurs | **165** | 4,7 % |
| 2 | `s o m l c` | + annulaires | 1 139 | 28,3 % |
| **3** | **Majuscule et le point** | + auriculaires *en modificateur* | | |
| 4 | `a p é f` | auriculaires, lettres | 3 728 | 74,4 % |
| 5 | `b g h q` | 8 | 5 141 | 88,3 % |
| 6 | `x j è z` | 8 | 5 679 | 96,4 % |
| 7 | `y à k w` | 8 | 5 749 | 97,7 % |

Étapes 8 à 10 identiques à FR-FR.

#### Pourquoi ce calendrier de doigts, et pas l'autre

T6 §4.d établit que l'ordre de dextérité est le pire ordre possible pour le
français : le meilleur jeu de 7 touches, `a r s o n u p`, n'utilise **aucun
majeur**, et une ouverture `index → annulaires → auriculaires → majeurs`
atteint l'optimum libre. Le recalcul sous les contraintes de la v2 **inverse ce
verdict** :

| Calendrier | Doigts à l'étape 1 | Mots étape 1 | AUC | Plancher 60 |
|---|---|---|---|---|
| index seuls, puis une paire par étape | 2 | 9 | 55,11 % | **échoue** |
| index + **annulaires** → auriculaires → majeurs | 4 | 41 | 65,14 % | **échoue** |
| **index + majeurs** → annulaires → auriculaires | 4 | **165** | **66,35 %** | **passe** |
| index + annulaires + auriculaires → majeurs | 6 | 102 | 71,63 % | passe |

Deux raisons de retenir la troisième ligne. **Une** : c'est la seule qui
franchisse le plancher avec de la marge, et la raison est celle de T6 elle-même,
appliquée un cran plus haut — index et annulaires ne portent que `u o é` comme
voyelles ; **ce sont les majeurs qui apportent `e` et `i`**. Différer les
majeurs répète à l'échelle du parcours l'erreur du sas à deux index. **Deux** :
l'ouverture à six doigts, qui donne le meilleur score, ne laisse qu'un seul
étage de doigts à ouvrir ensuite — ce n'est plus une progression digitale.

Ordre de grandeur du gain global : l'AUC de couverture passe de **54,62 %**
(ordre livré en v1) à **72,26 %** en Découverte et **66,35 %** en Dactylo.

### 4.6 La gestion de l'erreur

*Inchangée par rapport à la v1, sauf mention.*

**Comportement nominal.** Frappe fausse → rien ne s'écrit, le curseur ne bouge
pas. La touche pressée s'assombrit et retombe (150-200 ms). La touche cible
s'intensifie. Son : aucun.

**L'échelle d'aide — trois barreaux, aucun palier textuel.**

| Barreau | Déclencheur | Ce qui apparaît |
|---|---|---|
| **1** | Affichage de l'item (après expiration de la fenêtre de rappel, cf. P6) | Touche cible en saturation pleine + halo pulsé + léger agrandissement, et doigt surligné sur la main correspondante |
| **2** | 1ʳᵉ erreur, ou ~3 s sans frappe | Le **bloc** du côté concerné pulse, et la main de ce côté s'intensifie |
| **3** | 2ᵉ erreur sur le même caractère | **Flèche** de la main vers la touche + pulsation continue + **nom de la lettre prononcé**. S'efface à la réussite. |

Le **barreau 3 est terminal et permanent** pour l'item : plus aucune escalade,
aucun compte d'essais affiché, aucun message. L'aide n'enlève jamais une
information déjà donnée. **Changement v2** : le barreau 3 n'a plus besoin de
faire apparaître une main, puisqu'elles sont permanentes (P4) ; il ajoute la
flèche et le nom prononcé.

**Trois exceptions au blocage**, toutes déclenchées par l'application, jamais
vécues comme un échec de l'enfant :

1. **Touche morte** (`^`, `¨` — hors MVP). Le premier appui affiche la touche en
   état « armé / en attente », sans erreur ni avancement. La validation se fait
   sur le **caractère composé**. Un item dont le caractère composé n'est pas
   observable de façon fiable est **exclu du curriculum**.
2. **Piège Maj.** Quand la touche physique est correcte mais le modificateur
   manque (l'app reçoit `è` au lieu de `7`), c'est un état de **quasi-réussite**,
   distinct de l'erreur : la touche cible reste en surbrillance « correcte » et
   la touche Maj s'allume avec l'auriculaire de la main opposée. Seul cas du
   MVP où deux touches sont mises en avant simultanément.
3. **Incohérence de disposition.** Si 5 frappes consécutives, ou 3 items
   enchaînés saturant au barreau 3, sont cohérentes avec l'autre disposition
   supportée, **l'app interrompt d'elle-même** et affiche V2 avec sa consigne
   audio (« Regarde la touche à côté du A »). C'est la seule chose autorisée à
   sortir l'enfant d'un item bloqué.

**Verr.Maj.** Détecté en continu. S'il est actif, un bandeau enfant apparaît
avec l'illustration de la position de la touche : « Appuie sur la touche avec le
petit cadenas pour l'éteindre. » Motif : sous pilote FR historique, Verr.Maj
transforme la rangée des chiffres et casse tout silencieusement.

**Ce qui n'existe nulle part, à l'écran.** Compteur d'erreurs, système de vies
ou de cœurs, écran de récapitulatif, liste des lettres ratées, mention « réussi
avec aide », badge de perfection, comparaison à la séance précédente, seuil de
vitesse, seuil de précision.

### 4.7 Ce qui est mesuré, et où ça va

**Nouveau en v2.** La v1 ne comptait rien, ce qui rendait deux de ses propres
garde-fous inapplicables.

L'app mesure et conserve, **par parcours** et sans jamais l'afficher à l'enfant :

| Mesure | Pourquoi |
|---|---|
| Proportion d'items justes du premier coup, sans aide, **par touche** | Compose les leçons suivantes (§4.4) |
| Vitesse (mots nets/minute) | Série de progression individuelle |
| Précision | Série de progression individuelle |
| Nombre de leçons consommées par étape | Garde-fou §7.1 |
| Fréquence de déclenchement du barreau 3 | Garde-fou §7.5, seuil d'alarme une lettre sur cinq |

**Deux séries distinctes, jamais fusionnées.** Découverte et Dactylo ne
produisent pas des vitesses comparables : le passage à dix doigts fait
mécaniquement chuter la vitesse, et c'est le seul effet que la littérature
garantisse. Une courbe qui plonge sans raison visible est le pire artefact
possible. Chaque mesure porte l'étiquette de son parcours.

**Le seul objectif chiffré affichable, et il s'adresse au parent** : « quand ton
enfant tape aussi vite qu'il écrit à la main, l'outil a fait son travail »
(Kahn & Freyd 1990 ; Pisha 1993). Il est individuel, non comparatif, et sourcé.
Aucun mots/minute n'est jamais montré — la dispersion mesurée (écart-type ≈
moyenne) le rend indéfendable.

### 4.8 La gestion des deux dispositions

*Inchangée par rapport à la v1.*

**Stratégie de détection, dans cet ordre.**
1. Interroger la **carte du clavier fournie par le navigateur** si elle est
   disponible → verdict fiable, appliqué silencieusement.
2. Sinon, faire de la première frappe un **test déguisé** : « Appuie sur la
   touche A ». On lit le code physique et le caractère produit ; une seule
   frappe suffit.
3. Dans tous les cas, la disposition retenue est **affichée de façon visible et
   permanente** avec un sélecteur à un clic.
4. **Un choix manuel a priorité absolue** sur toute détection ultérieure, et il
   est mémorisé.
5. Surveillance continue pendant le jeu (cf. exception 3 en §4.6).

**Discriminants à interroger.**

| Touche physique interrogée | Résultat | Conclusion |
|---|---|---|
| `KeyQ` | `a` | Famille AZERTY |
| `KeyQ` | `q` **et** `KeyY` → `z` | Famille QWERTZ |
| `Semicolon` | `m` | AZERTY FR |
| `Digit6` | `-` (vs `§`) | FR-FR et non belge |
| `Semicolon` | `é` (vs `ö`) | **CH-FR et non CH-DE** |
| `BracketLeft` | `è` (vs `ü`) | **CH-FR et non CH-DE** |
| `Quote` | `à` (vs `ä`) | **CH-FR et non CH-DE** |

Les trois derniers règlent le cas suisse, qui est autrement indiscernable : le
romand et l'alémanique partagent le même clavier physique et ne diffèrent que
par le pilote.

**Pourquoi le sélecteur manuel est indispensable.** La carte clavier du
navigateur n'existe pas partout (absente de Firefox et Safari, absente sur
mobile). La sérigraphie peut diverger du pilote — un clavier gravé AZERTY
piloté en QWERTZ est un cas réel, et l'enfant regarde la vérité physique. Un
changement de disposition en cours de session n'émet aucun signal. Enfin, un
parent peut vouloir entraîner l'enfant sur la disposition de l'école plutôt que
sur celle de la maison.

**Ce que la disposition change concrètement.**

| | FR-FR (AZERTY) | CH-FR (QWERTZ) |
|---|---|---|
| Chiffres | Exigent Maj | Directs |
| Étape des chiffres | **8** | **8** (aligné en v2) |
| `é è à` | Directs (rangée des chiffres), sur trois doigts | Directs (colonne droite), **tous sur l'auriculaire droit** |
| `ç` | Direct (`Digit9`) | `Maj + 4` → étape des majuscules |
| `ù` | Direct (rangée de repos) | Touche morte → **hors MVP** |
| Point `.` | Exige Maj | Direct |
| `m` | **Auriculaire droit** (`Semicolon`) | **Index droit** (`KeyM`) — seule lettre qui change de doigt |
| Apostrophe `'` | Directe, index gauche | Rangée des chiffres, à droite du `0` |

Deux tables de disposition distinctes, jamais partagées. Changer de disposition
dans le sélecteur change **le contenu proposé**, pas seulement le dessin.

### 4.9 Le contenu tapé

**Le corpus est reconstruit.** Le corpus v1 était écrit à la main, sans
référentiel cité : 70,6 % seulement de ses mots simples appartenaient au
lexique gradué, et le palier 1 tombait à 9 sur 33. *Wapiti*, *xylophone*,
*sandwich*, *physique* étaient là pour couvrir `w`, `x`, `y`.

**Sources, et elles sont libres.**
- **Échelle Dubois-Buyse**, échelons **≤ 23** (jusqu'au CM2, 11 ans) —
  2 802 lemmes.
- Croisée avec **Lexique 3.83** pour la fréquence d'usage.
- **Formes fléchies incluses** : toute forme dont le lemme est dans
  Dubois-Buyse et dont la fréquence propre atteint **5,0 occurrences par
  million**. *rire* devient *rire, ris, rit, rient, riait*. Sous ce seuil
  entrent les passés simples et les subjonctifs imparfaits (*tombâmes*,
  *allassent*, *évitât*), qui ne sont pas du lexique de l'âge.

**Total : 5 877 mots**, soit **×2,1** sur les lemmes seuls. Script :
`scripts/analyse/construire-lexique-v3.py`.

**Ce qui est admis.**

| Admis | À partir de | Note |
|---|---|---|
| Vrais mots français, minuscules | étape 1 | |
| **Groupes nominaux** — *un chat, mon bateau, un grand loup, ma jolie dame* | **Découverte : étape 2** · Dactylo : étape 1 | Orthographiquement complets sans majuscule ni point. Pas avant, faute de déterminant typable : `e a s i r t u p` n'en produit aucun, il leur faut `n`, `l`, `m`, `o` ou `d`. |
| Nombres (un à trois chiffres) | étape 8 | |
| **Phrases** — majuscule initiale et point | Découverte étape 10 · **Dactylo étape 4** | Jamais avant, cf. P3 |
| Paragraphes, texte suivi | Dactylo étape 10 | |

**Ce qui est interdit, définitivement.**

| Interdit | Raison |
|---|---|
| Pseudo-mots type Keybr | En frappe, un pseudo-mot n'isole rien : il ne sert que de remplissage. Ceux de Keybr sont de surcroît générés sur des bigrammes anglais. Si une étape ne produit pas 60 items, **c'est l'étape qu'on refait**. |
| Syllabes de remplissage | Même raison. La v1 les tolérait « en dernier recours » ; la règle des 60 items rend ce recours inutile. |
| **Phrases sans majuscule ni point** | Violation de P3 : *le lion dort* est une phrase écrite faux. Les 35 items multi-mots du corpus v1 sont triés — **18 groupes nominaux conservés, 16 phrases reversées au parcours Dactylo** avec leur ponctuation. |
| Majuscules accentuées (`É À È Ç Œ`) | Non produisibles au clavier AZERTY standard sous Windows ; séquence à trois touches en CH-FR ; comportement dépendant de l'OS. Admises dans les textes d'interface, jamais dans les mots à taper. |
| Tout caractère AltGr | Hors de portée, correspondances totalement différentes sous macOS, et aucun contenu français 8-11 ans n'en a besoin. |
| Apostrophe typographique `’` | Aucune des deux dispositions ne la produit sans AltGr. **Tout le corpus est normalisé sur l'apostrophe droite `'`.** |
| Mots contenant une touche hors ensemble | Aucune exception, pas même pour un mot « presque » typable, pas même dans sa variante sans accent. |

**Cas particuliers.**
- `ù` n'existe en français que dans le mot **où**. En AZERTY il a une touche
  entière : item dédié à l'étape 6. En CH-FR il exige une touche morte :
  **exclu du MVP**.
- `ï` et `ë` (*Noël, maïs*) exigent le tréma : hors MVP.
- `garçon`, `français` : disponibles à l'étape 3 en FR-FR, à l'étape des
  majuscules en CH-FR.
- **`k` est enseigné**, à l'étape 6 de Découverte et 7 de Dactylo. En v1, il ne
  l'était sur aucune des deux dispositions : l'enfant terminait le MVP sans
  avoir tapé une lettre de l'alphabet.

---

## 5. Les vues

Sept vues. Wireframes en ASCII, à l'échelle des proportions réelles.

---

### V1 — Accueil

**Rôle.** Point d'entrée : lancer une leçon en un clic, voir le parcours en
cours et le clavier reconnu.
**Quand.** À l'ouverture, et au retour depuis l'écran de fin de leçon.

**Éléments.**
- Icône engrenage discrète en haut à droite (→ V7).
- Titre : « DactyMalin ».
- Illustration à plat d'un clavier vu de dessus, **sans mains, sans personnage**.
- Bouton primaire très grand : « On commence ! ».
- **Ligne de parcours** : « Parcours : Découverte · Étape 3, leçon 2 sur 7 ».
- Ligne d'état du clavier : « Ton clavier : Français (AZERTY) » + « Changer »
  (→ V2).
- Lien secondaire : « Ma carte du clavier » (→ V6).
- Lien tertiaire avec icône haut-parleur : « Revoir : où mettre mes doigts »
  (→ V3).

```
+------------------------------------------------------+
|                                              [ @ ]   |
|                  DactyMalin                          |
|        +----------------------------------+          |
|        |   illustration clavier a plat    |          |
|        +----------------------------------+          |
|                                                      |
|          +----------------------------+              |
|          |      On commence !         |              |
|          +----------------------------+              |
|                                                      |
|   Parcours : Decouverte - Etape 3, lecon 2 sur 7     |
|   Ton clavier : Francais (AZERTY)    [ Changer ]     |
|                                                      |
|              Ma carte du clavier                     |
|          (o) Revoir : ou mettre mes doigts           |
+------------------------------------------------------+
```

---

### V2 — Choix du clavier

**Rôle.** Identifier ou confirmer la disposition réellement en usage, en une
frappe et un clic.
**Quand.** Au tout premier lancement ; sur clic de « Changer » ; **ou quand
l'app détecte d'elle-même une incohérence de disposition pendant une leçon**
(cf. §4.6, exception 3).

**Éléments.**
- Flèche retour, titre « Regarde ton vrai clavier ».
- Consigne unique avec bouton haut-parleur : « Appuie sur la touche A ».
- Deux grandes cartes côte à côte, celle détectée portant une coche, chacune
  avec un mini-clavier fidèle montrant les deux premières rangées — c'est la
  comparaison visuelle qui tranche, pas le nom.
- Bouton de confirmation dans chaque carte : « C'est celui-là ».
- **Ligne d'explication contextuelle**, obligatoire : « Sur ce clavier, les
  chiffres se tapent avec la touche Majuscule. » / « Sur ce clavier, les
  chiffres se tapent directement. » Sans cette ligne, le parent lira un bug.

```
+------------------------------------------------------+
| <-           Regarde ton vrai clavier                |
|            Appuie sur la touche A   (o)              |
|  +---------------------+  +---------------------+    |
|  | (v) Francais        |  |     Suisse          |    |
|  |     AZERTY          |  |     QWERTZ          |    |
|  |  | A Z E R T Y   |  |  |  | Q W E R T Z   |  |    |
|  |  | Q S D F G H   |  |  |  | A S D F G H   |  |    |
|  |  [ C'est celui-la ] |  |  [ C'est celui-la ] |    |
|  +---------------------+  +---------------------+    |
|                                                      |
|  Sur ce clavier, les chiffres se tapent avec la      |
|  touche Majuscule.                                   |
+------------------------------------------------------+
```

---

### V3 — Guide-doigt

**Rôle.** Installer une fois pour toutes la frontière entre les deux moitiés du
clavier et le rôle des mains.
**Quand.** Une seule fois après le choix du clavier, puis **uniquement à la
demande** depuis V1 ou V7. Jamais automatiquement. Une version par parcours.

**Éléments.**
- Flèche retour, titre « Chaque main garde son côté », bouton haut-parleur.
- Grand clavier **d'un seul tenant**, les deux moitiés distinguées par leur
  teinte et par les mains qui les encadrent. Aucun séparateur, aucune étiquette
  « la frontière » — décision 18 : ce que la vue installe, elle le dit et le
  montre, elle ne l'écrit pas sur le clavier.
- Les deux mains dessinées, à leur place définitive — à gauche et à droite du
  clavier — index surligné en Découverte, main au repos en Dactylo.
- Barre d'espace détachée en bas avec la mention « tes deux pouces ».
- Boutons « Réécouter » et « J'ai compris ».

```
+------------------------------------------------------+
| <-       Chaque main garde son cote          (o)     |
|                                                      |
| (\|/)  +-------------+ || +--------------+   (\|/)   |
| main   | A Z E R T   | || | Y U I O P    |    main   |
| gauche | Q S D F G   | || | H J K L M    |   droite  |
|        | W X C V B   | || | N , ; :      |           |
|        +-------------+ || +--------------+           |
|              la frontiere                            |
|      +------------- espace ---------------+          |
|      |         tes deux pouces            |          |
|      +------------------------------------+          |
|      [ (o) Reecouter ]      [ J'ai compris ]         |
+------------------------------------------------------+
```

---

### V4 — Leçon

**Rôle.** Le cœur du MVP : faire taper un exercice en montrant la touche cible
et le doigt, sur un clavier fidèle.
**Quand.** Depuis « On commence ! », depuis « Encore » en fin de leçon, ou
depuis « Continuer » sur V6.

**Éléments.**
- Flèche retour en haut à gauche.
- **Bandeau permanent** : « Étape 3 · Leçon 2 sur 7 » à gauche, « Les touches
  de cette étape : … » à droite.
- **Zone 1** — l'exercice en très gros. Lettres déjà tapées estompées, lettre
  courante agrandie et soulignée. **Aucune lettre fausse n'est jamais
  affichée.**
- **Zone 2** — le clavier fidèle, **d'un seul tenant** (seule la barre d'espace
  est détachée), encadré par **les deux mains dessinées**. Le doigt à utiliser est surligné sur la main
  correspondante ; l'autre main est au repos.
- Consigne de niveau main à côté de la main active : « Main gauche · ton index ».
- **Touche cible** : saturation pleine, halo pulsé, léger agrandissement.
  **Une seule à la fois.**
- Touches hors ensemble : **dessinées mais éteintes**, jamais supprimées.
  Rangée des chiffres toujours dessinée avec ses **deux légendes réelles** et un
  **cadenas** tant qu'elle n'est pas ouverte.
- Repère tactile visible sur `F` et `J`.
- Bouton à taille d'enfant en bas : « Je tape sans regarder ».
- **Interdit sur cet écran** : toute légende couleur→doigt, tout compteur
  d'erreurs, tout chrono, toute mesure de vitesse.
- **Autorisé, et attendu** (#107) : « Exercice n sur N », « Leçon n sur 7 »,
  « Étape n sur 10 », la rangée de points des mots de l'exercice, et la jauge
  d'avancement de l'étape. Ce sont des REPÈRES DE PLACE — où j'en suis —, et
  aucun n'est une mesure de performance.

```
+------------------------------------------------------+
| <-  Etape 3 - Lecon 2 sur 7      touches : e a s i.. |
|     Mots de cet exercice ... o o o   Exercice 2 sur 5|
|                                                      |
|                   un  chat                           |
|                       _                              |
|                                                      |
| (\|/)  +--------------------+ || +---------------+   |
| Main   | &1 e2 "3 '4 (5 [c] | || | -6 e7 _8 [cad]|   |
| gauche |  A  Z  E  R  T     | || |  Y  U  I  O  P|   |
| ton    |  Q  S  D  F. G     | || |  H  J. K  L  M|   |
| index  |  W  X  C  V  B     | || |  N  ,  ;  :  !|   |
|        +--------------------+ || +---------------+   |
|        +----------- espace -----------+              |
|                                                      |
|            [ Je tape sans regarder ]                 |
+------------------------------------------------------+
```

*État illustré : Découverte, étape 3, FR-FR. La touche `C` est la cible. La
main gauche a l'index surligné, la main droite est au repos.*

---

### V5 — Fin de leçon

**Rôle.** Célébrer ce qui a été réussi, montrer ce que les nouvelles touches
permettent d'écrire, et proposer d'en rester là pour aujourd'hui.
**Quand.** Quand la leçon atteint sa durée.

**Éléments.**
- Titre d'encouragement variable, rotation d'au moins 15 formulations.
- Rangée d'étoiles gagnées — **représentation figurative uniquement, aucun
  chiffre**.
- Phrase de gain lexical : « Tu écris maintenant : maison, soleil, tableau ».
- Clavier miniature où les nouvelles touches débloquées s'illuminent.
- **Ligne de position** : « Leçon 2 sur 7 de l'étape 3 ».
- **La proposition d'arrêt est ici** : « Tu as bien travaillé. C'est bien pour
  aujourd'hui. » — « Retour » devient primaire, « Encore » secondaire. L'enfant
  peut toujours continuer.
- Lien discret : « Ma carte du clavier ».
- **Interdit** : temps écoulé, pourcentage, nombre d'erreurs, vitesse,
  précision, comparaison à une leçon précédente, comparaison entre parcours.

```
+------------------------------------------------------+
|                     Bravo !                          |
|            *  *  *  *  *  *  *  *                    |
|                                                      |
|   Tu ecris maintenant : maison, soleil, tableau      |
|   +----------------------------------------------+   |
|   |  clavier miniature - L C E F B s'illuminent  |   |
|   +----------------------------------------------+   |
|                                                      |
|            Lecon 2 sur 7 de l'etape 3                |
|      Tu as bien travaille. C'est bien pour           |
|      aujourd'hui.                                    |
|                                                      |
|      +----------------+   +----------------+         |
|      |    Retour      |   |    Encore      |         |
|      +----------------+   +----------------+         |
|              Ma carte du clavier                     |
+------------------------------------------------------+
```

---

### V6 — Carte de progression

**Rôle.** Montrer le clavier qui se colore étape après étape, nommer la
prochaine étape **par ce qu'elle débloque**, et permettre de rejouer une étape
finie.
**Quand.** Depuis « Ma carte du clavier » sur V1 ou V5.

**Éléments.**
- Flèche retour, titre « Ta carte du clavier », nom du parcours en cours.
- Grand clavier de référence : touches acquises colorées, touches à venir en
  gris, cadenas sur la rangée des chiffres si encore verrouillée.
- Liste verticale des **dix** étapes, chacune nommée par ce qu'elle ouvre —
  jamais par une rangée de clavier. **Les dix sont réelles ; aucune étape vide.**
- Étapes verrouillées avec cadenas et leur promesse écrite.
- Sur une étape **finie**, un lien discret « La rejouer ».
- **Aucune date, aucun pourcentage, aucune durée, aucun compteur de séances.**
- Bouton primaire : « Continuer » (→ V4).

```
+------------------------------------------------------+
| <-    Ta carte du clavier - Decouverte               |
|  +------------------------+ || +-----------------+   |
|  | &1 e2 "3 '4 (5   [cad] | || | -6 e7 _8 [cad]  |   |
|  |  a  z  E  R  T         | || |  y  U  I  O  P  |   |
|  |  q  S  D  F  G         | || |  H  J  k  L  m  |   |
|  |  w  x  C  V  B         | || |  N  ,  ;  :  !  |   |
|  +------------------------+ || +-----------------+   |
|                                                      |
|  (v) Etape 1  e a s i r t u p    un chat, papa       |
|  (v) Etape 2  + o n m d v        maison, monde       |
|  ( >) Etape 3  + l c e' f b      soleil, tableau     |
|  [X] Etape 4  + g h q x e`       chaque, texte       |
|  [X] Etape 5  + j z y a`         jeudi, zebre        |
|  [X] Etape 6  + c, k w u`        garcon, kilo, ou    |
|  [X] Etape 7  Majuscule et le point                  |
|  [X] Etape 8  les chiffres                           |
|  [X] Etape 9  la ponctuation                         |
|  [X] Etape 10 tu ecris des phrases                   |
|                                                      |
|            [ Continuer ]                             |
+------------------------------------------------------+
```

---

### V7 — Réglages

**Rôle.** Choisir le parcours, régler la disposition, le son, l'espacement du
texte et les animations, rejouer le guide-doigt.
**Quand.** Depuis l'icône engrenage de V1.

**Éléments.**
- Flèche retour, titre « Réglages ».
- **Ligne « Parcours »** : deux boutons radio, « Découverte » / « Dactylo », avec
  une ligne d'explication destinée au parent : « Découverte apprend les deux
  moitiés du clavier avec les index. Dactylo apprend les dix doigts. Les deux
  progressent séparément. »
- Ligne « Clavier » : deux boutons radio illustrés.
- Ligne « Sons » : interrupteur.
- Ligne « **Texte plus espacé** » : interrupteur. **Jamais étiquetée « mode
  dyslexie »** — un enfant n'aime pas cocher une case qui le désigne. C'est
  aussi le levier dont le bénéfice est le mieux établi, davantage que le choix
  d'une fonte spéciale.
- Ligne « Animations douces » : interrupteur.
- Bloc légende des couleurs : « main gauche », « main droite », « espace : tes
  pouces ». **Seul endroit du MVP, hors onboarding, où la légende apparaît.**
- Bouton « Revoir : où mettre mes doigts » (→ V3).
- **Supprimé en v2** : le lien « Refaire une leçon à deux doigts ». Le repli
  n'existe plus.

```
+------------------------------------------------------+
| <-                 Reglages                          |
|  Parcours     (o) Decouverte                         |
|               ( ) Dactylo                            |
|     Decouverte apprend les deux moities du clavier   |
|     avec les index. Dactylo apprend les dix doigts.  |
|                                                      |
|  Clavier      (o) Francais AZERTY                    |
|               ( ) Suisse QWERTZ                      |
|  Sons                       [ ON  ]  Oui             |
|  Texte plus espace          [  OFF]  Non             |
|  Animations douces          [ ON  ]  Oui             |
|                                                      |
|  --- Les couleurs -------------------------------    |
|   [#] main gauche  [#] main droite  [#] espace :     |
|                                        tes pouces    |
|      [ (o) Revoir : ou mettre mes doigts ]           |
+------------------------------------------------------+
```

---

## 6. Ce qui est explicitement hors MVP

| Exclu | Pourquoi |
|---|---|
| **Multi-profils** | Un enfant, une machine. Un sélecteur de profil ajoute un écran et une notion de « compte » pour zéro gain sur la boucle jouable. |
| **Tableau de bord parent, rapports, export** | Transforme l'app en outil d'évaluation. Les mesures de §4.7 sont conservées mais **non exposées** au MVP. |
| **Touches mortes `^` et `¨`** | Séquence à deux frappes, signal navigateur inégal entre Chromium, Firefox et Safari. Conséquence : *forêt, Noël, maïs* sont hors corpus. |
| **Majuscules accentuées `É À È Ç`** | Non produisibles au clavier AZERTY standard sous Windows ; trois touches en CH-FR ; comportement dépendant de l'OS. |
| **Tout caractère AltGr** | Hors de portée, et correspondances totalement différentes sous macOS. |
| **Autres dispositions** (belge, canadienne, QWERTY US, BÉPO, Dvorak) | Chaque disposition supplémentaire est une table **et** un corpus filtré **et** un jeu d'étapes. Deux, traitées à fond, valent mieux que six approximatives. |
| **Pavé numérique** | Inutilisable sur portable, qui est la machine probable. |
| **Rendu en portrait sur téléphone** | Deux mains latérales exigent de la largeur. Le MVP vise le paysage sur portable et tablette. **À trancher aux maquettes.** |
| **Dictée audio, mode aveugle, fonte OpenDyslexic** | Le levier établi pour les lecteurs en difficulté est l'espacement, déjà présent en réglage. La fonte spéciale est contestée par les études contrôlées. |
| **Mini-jeux séparés, avatars, monnaie virtuelle, collections** | Documenté : l'enfant ne veut plus faire que le jeu, et la coupure leçon/jeu tue la leçon. |
| **WPM, précision affichée, courbes, historique de sessions** | Mesurés en interne (§4.7), jamais affichés. |
| **Un quatrième barreau d'aide « montre-moi »** | Palier de repli identifié (§7.3), pas une fonctionnalité MVP. |

---

## 7. Risques et points de vigilance

### 7.1 — L'index qui balaie sa moitié de clavier sans jamais s'ancrer

**Le risque.** Découverte apprend à l'index à parcourir toute sa moitié de
clavier. Si l'enfant y reste longtemps, ce geste s'automatise, et le passage à
Dactylo coûte une vraie chute de vitesse. C'est le risque n°1 du projet.

**Ce qui le contient.** Le seuil d'automatisation kinesthésique est mesuré à
**20-25 mots/min** (West 1967). Un enfant de 8-9 ans est à **4-8 mots/min** : il
n'a pas de mémoire motrice à défaire. Le risque ne devient réel que si l'enfant
poursuit Découverte jusqu'à 10-11 ans, âge où il peut approcher 16 mots/min.

**Ce qui ne le contient pas, et il faut le dire.** L'app ne borne rien : les
deux parcours sont parallèles et permanents, et **le seul garde-fou est le
parent**. Le repli automatique de la v1 a été supprimé parce qu'il était cassé
et non borné ; il n'a pas été remplacé.

**Ce qu'il faut observer.** Le nombre de leçons consommées par étape et la
vitesse en Découverte (§4.7). **Si un enfant dépasse 15 mots/min en Découverte,
il est temps de passer à Dactylo**, et c'est le seul moment où l'app devrait le
signaler — au parent, dans les réglages, jamais à l'enfant.

### 7.2 — Le corpus d'une étape tourne en rond

**Le risque.** Une leçon consomme 50 à 150 exercices. Si une étape ne rend
typables que quelques dizaines de mots, l'enfant voit revenir les mêmes toutes
les deux minutes. C'est le défaut mesuré de la v1 : `f` n'avait que **2
occurrences** dans tout le corpus du palier 1, et *fut* et *neuf* sortaient dans
**30 blocs sur 30**.

**Les garde-fous construits.** Le plancher de 60 items distincts par étape
(P5), franchi avec un facteur 4 de marge à l'étape 1 de Découverte (241 mots).
Les formes fléchies (×2,1). Les groupes nominaux, qui multiplient les items
sans ouvrir de touche. Et la règle « pas deux fois le même exercice dans une
leçon, au moins trois leçons d'écart entre deux occurrences ».

**Ce qu'il faut observer.** Le taux de réapparition réel par étape, dès la
première semaine.

### 7.3 — Le mur émotionnel : un enfant saturé au barreau 3, seul devant l'écran

**Le risque.** Un enfant qui sature au barreau 3 sans trouver la touche n'a plus
d'issue interne : ni sortie volontaire, ni parent notifié. Le garde-fou
disposition ne couvre que l'incohérence systématique, pas le blocage isolé sur
une seule touche par fatigue ou distraction.

**Les garde-fous construits.** Le barreau 3 donne l'information **totale** :
flèche, doigt surligné, nom de la lettre prononcé. Aucun compte d'essais n'est
affiché. La célébration finale est identique. Et le quota fixe garantit que
l'étape se termine de toute façon.

**Palier de repli si l'usage réel le montre.** Ajouter un **4ᵉ barreau
« montre-moi »** qui joue l'appui en démonstration animée, l'enfant devant
toujours produire l'appui lui-même. **Et non un saut d'item**, qui
reconvertirait le blocage strict en frappe non bloquante.

### 7.4 — La reprise après une pause

**Le risque.** Dans un programme pilote de 32 séances en CM1, les gains étaient
mesurables en fin de session et **la plupart avaient disparu six semaines plus
tard**. Un enfant qui reprend après un mois retrouve un niveau plus bas que
celui qu'il a quitté. Si l'app le remet à son étape courante sans rien réviser,
elle le met en échec à la première leçon.

**Le garde-fou à construire.** Quand la dernière leçon remonte à plus de N
jours, la première leçon rejoue les touches des étapes précédentes avant de
reprendre l'étape courante. **Sans jamais dire à l'enfant qu'il a régressé, et
sans jamais retirer une étape acquise.**

**Ce qu'il faut observer.** La distribution des intervalles entre leçons. `N`
est un paramètre à régler sur un enfant réel, pas une valeur démontrée.

### 7.5 — Le doigt surligné devient illisible à dix doigts

**Le risque.** En Dactylo, la main dessinée doit distinguer huit doigts plus
deux pouces. Si la distinction n'est pas immédiate, le barreau 3 se déclenche si
souvent qu'il devient de fait permanent — sans en avoir la qualité, puisqu'il
serait intermittent.

**Le garde-fou.** L'information est portée par **la position anatomique du doigt
surligné**, pas par un code couleur à huit valeurs : une main avec l'annulaire
levé se reconnaît sans légende. **Instrumenter la fréquence de déclenchement du
barreau 3** (§4.7). Seuil d'alarme : **une lettre sur cinq** en régime
stabilisé. Au-delà, la représentation du doigt est rouverte.

### 7.6 — La fenêtre de rappel devient une salle d'attente

**Le risque.** L'enfant apprend à patienter 1,5 s au lieu de chercher en
mémoire, et la dépendance à l'aide revient sous une autre forme.

**Les garde-fous construits.** Plafond bas (2,5 s). Micro-feedback qualitatif
distinct sur la frappe autonome — étincelle, touche qui s'illumine plus
franchement — jamais un chiffre, jamais un cumul.

**Ce qu'il faut observer.** Ce sont des paramètres à régler sur un enfant réel,
**pas des valeurs démontrées**. Le signal d'alarme est un enfant qui, la main
immobile, regarde l'écran jusqu'à l'apparition de l'indice.
**Ce que l'app ne pourra jamais couvrir** : rien n'empêche le regard de
descendre sur le clavier physique. Si la frappe à l'aveugle devient un objectif,
le levier est de **couvrir le clavier physique**, pas d'ajouter un mécanisme
logiciel.

### 7.7 — La frontière portée par la teinte seule

**Le risque.** Depuis la décision 18, le clavier est d'un seul tenant : rien ne
sépare physiquement les deux moitiés. Un enfant qui ne perçoit pas l'écart de
teinte — daltonisme, écran mal réglé, impression en niveaux de gris — n'a plus
le contour du bloc pour lui dire où s'arrête sa main gauche.

**Le garde-fou.** Les deux mains dessinées, une de chaque côté du clavier,
portent la même information sans dépendre de la couleur : c'est la main qui
désigne, pas la teinte. V3 installe le partage une fois pour toutes, doublé
d'audio. La barre d'espace détachée sous le clavier rappelle que les deux
moitiés forment un seul objet.
**Ce qu'il faut observer.** Un enfant qui frappe régulièrement une lettre de la
mauvaise main sans que l'aide soit en cause. Si ça se produit, le levier est de
renforcer le contraste de teinte ou de marquer la colonne de jonction, jamais de
rouvrir un écart physique : le clavier d'un seul tenant est ratifié.

### 7.8 — L'étoile reste une récompense d'achèvement

**Le risque.** La méta-analyse de Deci, Koestner & Ryan (128 études) mesure
`d ≈ −0,36` pour les récompenses contingentes à l'achèvement, et note qu'elles
sont **plus délétères chez les enfants que chez les étudiants**. L'étoile du
cahier est exactement de cette catégorie.

**Les garde-fous construits, qui sont les bons.** L'étoile **ne note pas**
(identique à 1 ou 9 essais), elle **n'est jamais retirée**, et il n'y a **aucune
comparaison**. Le seul modérateur exploitable pour un enfant seul à la maison
est la **fiction de jeu** (Sailer & Homner 2020) : c'est un argument sourcé pour
traiter la carte V6 comme un objet narratif et non comme un tableau de bord.

**Ce qu'on ne peut pas dire.** Que ces atténuations annulent l'effet. On a choisi
la variante la moins mauvaise, pas une variante neutre. Et l'effet de nouveauté
prédit une érosion à quelques semaines.

---

## 8. Ce qui reste incertain

Par honnêteté, et parce que c'est là que la contradiction doit porter.

1. **L'app ne peut pas observer quel doigt frappe.** Elle lit un code physique.
   Le prédicteur de performance de Feit et al. — un mapping doigt→touche non
   ambigu — est donc **inobservable et invérifiable**. Tout ce que le cahier dit
   des doigts porte sur ce qui est *affiché*, jamais sur ce qui est *fait*.
2. **Aucune donnée n'existe sur la transition 4 doigts → 10 doigts**, ni chez
   l'enfant ni chez l'adulte.
3. **Aucune norme de précision par âge n'existe.** Les études mesurent le
   *net WPM*, qui fusionne vitesse et erreurs.
4. **Aucune étude sur les causes d'abandon** en apprentissage de la frappe chez
   l'enfant. Tout ce qui remonte est de la littérature commerciale.
5. **Aucune étude ne compare les contenus tapés** — mots réels, pseudo-mots,
   texte suivi.
6. **Aucune mesure anthropométrique** ne relie l'empan de la main de l'enfant au
   pas des touches de 19,05 mm. Les deux camps argumentent sans données.
   L'argument « la main de 7 ans est trop petite » est traçable jusqu'à une
   **croyance** professionnelle de 1992, jamais jusqu'à une mesure.
7. **Toute la littérature chiffrée est scolaire, collective et encadrée.** Les
   vitesses citées sont donc probablement **optimistes** pour un enfant seul à
   la maison, d'un facteur non quantifiable.
8. **Le choix des mots « étape / leçon / exercice » est une hypothèse de
   conception**, pas une conclusion de recherche. Le test coûte dix minutes avec
   deux enfants de la cible, et il vaut mieux que tout ce document sur ce point.
9. **Le quota de 7 leçons par étape est un choix de calibration**, dérivé de
   l'horizon de 25-30 h. Il n'est validé par aucune observation.

---

## 9. Découpage de livraison

Six lots, ordonnés par dépendance et par risque décroissant. Chacun est
livrable seul et laisse l'app jouable. Conformément à la règle du dépôt, chaque
correction de défaut part avec **le test de régression qui aurait dû
l'attraper**.

### Lot 0 — Le calcul (fait)

`scripts/analyse/construire-lexique-v3.py` et `scripts/analyse/spec-parcours.py`.
Produit le lexique v3 et les quatre calendriers de touches de §4.5. Ne touche
aucun code produit. **Fait le 2026-08-30.**

### Lot 1 — Le vocabulaire et les compteurs interdits

`palier` → `etape`, `bloc` → `lecon`, l'item devient `exercice` dans l'interface
hors écran de leçon. Retrait de « {n} blocs finis sur 6 », du « sur 7 »
contradictoire, et des encouragements qui disent « bloc ».

**Pourquoi en premier.** Aucun changement pédagogique, donc aucun risque ; et
tout ce qui suit s'écrira dans le vocabulaire final. Attention : `bloc` doit
**rester** au sens « pan de clavier », le renommage global est interdit. Deux
champs persistés et le code de fusion multi-appareil exigent une migration ou
des alias en lecture.

### Lot 2 — Le modèle de progression et l'instrumentation

Quota fixe de 7 leçons, leçon pilotée par le temps, suppression du plafond
anti-mur, suppression de la pénalité de lenteur (`estPropre` / `aide.ts`),
composition adaptative par la proportion premier-coup, et les cinq mesures de
§4.7 avec leurs deux séries.

**Pourquoi en deuxième.** C'est le défaut le plus grave de la v1 — pour un
débutant réel, aucune frappe ne comptait jamais et tous les paliers se
franchissaient par le plafond — et il est indépendant du choix des touches.

### Lot 3 — Les mains, et la suppression du repli

Les douze états de mains latérales (P4), la table doigt→touche qui **n'existe
pas encore** (`doigts.ts` ne déclare que quatre états), et le retrait du lien de
repli dans V7.

### Lot 4 — Le nouvel ordre et son corpus

Inséparables : un ordre sans corpus donne des étapes vides, un corpus sans ordre
n'a pas de cible. Applique §4.5, construit le corpus v2 sur le lexique v3 avec
la règle des 60 items, et trie les 35 items multi-mots existants.

**Le lot le plus lourd.**

### Lot 5 — Les deux parcours et les étapes 7 à 10

Le sélecteur de parcours, les deux progressions persistées en parallèle, la
scission de l'ancien palier 7 en Majuscule / chiffres / ponctuation, et
l'étape 10 où le contenu s'allonge au lieu que les touches s'ouvrent.

### Lot 6 — La reprise après une pause

§7.4. Indépendant de tout le reste.

---

*Fin du cahier des charges v2. Tout ce qui précède est tranché ; ce qui reste
ouvert est nommé en §7 avec son critère d'observation et son levier de
correction, et en §8 avec ce qu'on ne sait pas.*

---

## Annexe — Note sur les maquettes

Les maquettes de la v1 ont été générées avec Google Stitch et rendent mal deux
choses. **La rangée des chiffres du clavier virtuel** y apparaît remplie de
symboles décoratifs inventés au lieu des vraies légendes AZERTY ; la
spécification correcte est : chaque touche porte deux légendes, le chiffre en
haut et le caractère en bas — `1 &`, `2 é`, `3 "`, `4 '`, `5 (`, `6 -`, `7 è`,
`8 _`, `9 ç`, `0 à`. C'est cette spécification qui fait foi, pas le dessin. Et
**le nom du produit dérive** sur certains écrans ; le nom retenu est
**« DactyMalin »**, et lui seul.

**Les maquettes de V4 de la v1 sont périmées** : elles montrent une bande basse
de pastilles, retirée par la décision 5. Toute maquette d'écran de leçon doit
désormais montrer deux mains dessinées **de part et d'autre du clavier**.
