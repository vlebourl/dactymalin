# Cahier des charges — « DactyMalin »
### Application web d'apprentissage du clavier, 7-12 ans, français

---

## 1. Le projet en une page

**Ce que c'est.** Une application web qui apprend à un enfant de 7 à 12 ans où poser ses doigts sur *son* clavier. À l'écran : un mot ou un nombre en français, et en dessous le dessin fidèle du clavier réellement branché sur la machine, avec la touche à frapper mise en avant et le doigt à utiliser. L'enfant tape, l'app valide, elle recommence.

**Pour qui.** Un enfant, un clavier, un parent qui installe. Pas une classe, pas une fratrie, pas un orthophoniste.

**Les quatre exigences fondatrices** (non négociables, tout le reste en découle) :
1. Afficher un mot ou un nombre à taper.
2. Représenter visuellement le clavier **réellement en usage** sur la machine.
3. Indiquer le doigt à utiliser pour la prochaine lettre ou le prochain chiffre.
4. Proposer un mode débutant restreint à quatre doigts : pouce gauche, pouce droit, index gauche, index droit.

**Le cadrage.**
- **Claviers couverts** : FR-FR (AZERTY) et CH-FR / suisse romand (QWERTZ). Détection automatique, sélecteur manuel prioritaire.
- **Portée** : MVP jouable. Sept vues. La boucle est V1 → V4 → V5 → V4.
- **Gamification** : légère et non compétitive. Feedback immédiat, étoiles, encouragements variés. Aucun score, aucun chrono, aucun classement, aucun compteur d'erreurs.
- **Contenu** : français uniquement. Lettres, vrais mots du lexique 7-12 ans, chiffres. Interface en français.

**Ce que ce n'est pas.**

| Ce n'est pas | Pourquoi |
|---|---|
| Un test de vitesse | Le WPM affiché fait optimiser la vitesse au détriment de la technique, et réinstalle le hunt-and-peck. Aucun nombre comparable n'apparaît à l'écran. |
| Un curriculum scolaire | Pas d'arborescence de 300 leçons, pas de « devoir ». Une session est une poignée de blocs de 60-90 secondes. |
| Un jeu d'arcade | Pas de vies, pas de combos, pas de shoot'em up. La boucle récompense le geste propre, pas la réactivité. |
| Un outil de suivi parental | Pas de tableau de bord, pas de rapport, pas de profils multiples. |
| Un logiciel multi-dispositions générique | Deux dispositions, traitées à fond, contenu filtré par disposition. Pas de BÉPO, pas de belge, pas de canadien, pas de QWERTY US. |
| Un outil qui parle de dactylographie | Le mode débutant n'est pas de la frappe à dix doigts et le cahier ne prétend pas le contraire. C'est un sas de posture, borné. |

---

## 2. État de l'art

### 2.1 Tableau comparatif

| Outil | Public réel | Guidage doigt | Clavier à l'écran | AZERTY / CH-FR | Gamification | Ce qu'on lui prend | Ce qu'on lui refuse |
|---|---|---|---|---|---|---|---|
| **Dance Mat Typing** (BBC) | 7-11 ans | Mains cartoon + narration audio, zéro lecture | Permanent, zones colorées | QWERTY seul | Chansons, récompenses d'étape, **aucun score** | L'absence totale de score et de chrono ; l'audio qui remplace la lecture | La répétition sans remédiation ; le ton bébé pour un 11 ans |
| **TypingClub** | 5-18 ans, école US | Mains animées sous le clavier — le plus lisible du marché | Permanent, désactivable | QWERTY par défaut, reste incertain | Étoiles 1-5 par leçon, carte de progression | La carte de progression comme moteur ; l'étoile comme feedback fini | **L'étoile retirée pour 1 % d'imprécision** — punition déguisée en récompense |
| **Typing.com** | 8+ (décrochage sous 8 ans) | Surlignage de touche, guidage discret | Permanent | QWERTY | Badges, XP, jeux séparés, **publicité** | Rien | La densité textuelle, le ton scolaire, la pub, la coupure leçon/jeu |
| **Nitro Type** | 10+ | **Aucun** | Aucun | — | Course multijoueur, monnaie, classement | Rien | Tout : la compétition sociale renforce le hunt-and-peck |
| **Keybr** | Ados/adultes | Coloration par doigt | Optionnel | Multiples, manuel | Graphiques de perf | **Le déverrouillage progressif des lettres par maîtrise** — meilleur moteur du panel | Les pseudo-mots (non-sens pour un lecteur de 7 ans) ; les courbes anxiogènes |
| **Monkeytype** | Adultes experts | Aucun | Optionnel, décoratif | Excellente couverture, touches mortes documentées | WPM seul | La rigueur du modèle de layout et des touches mortes | L'esthétique entière : texte défilant, densité, chiffre roi |
| **typ.ing** | Adultes | — | — | — | Aucune | Le **ton** : propre, calme, sans leaderboard | La cible d'âge et l'absence de pédagogie |
| **Fort-Dactylo** | 6-7 ans+, dys | Peu de posture | Oui | **Détection auto AZERTY/QWERTY/QWERTZ** | Shoot'em up, vitesse adaptative | La détection automatique de disposition ; la gratuité sans pub ni collecte | La boucle « tirer sur les lettres » : entraîne la réactivité, pas la posture |
| **ClaviGo / ClaviHERO** | Enfants FR | Colonnes colorées = doigts | **S'estompe progressivement** | AZERTY France seul | Score, combos, 32 niveaux | L'idée de sevrage progressif de l'aide | Le masquage du clavier (voir P6) ; le score et les combos |
| **Dactylocours** | Scolaire FR | Oui | Oui | **FR, BE, CA, SUISSE** — le seul à traiter le romand en premier rang | Aucune | Le fait de traiter le suisse comme une disposition de plein droit, pas une variante | L'UI scolaire, l'absence d'affect |
| **Klavaro** | Tous | Oui | Oui | Layouts entièrement éditables | Aucune | **Le layout comme donnée déclarative, pas comme variante de code** | L'austérité totale |
| **Ratatype** | Ados/adultes | Oui | Oui | Parcours *French AZERTY* dédié | Scoreboards, certificats | Le parcours par disposition | Les classements et certificats : compétition explicite |

### 2.2 Les cinq choses qu'on prend

1. **Le guidage doigt doit être visuel et sonore, jamais textuel.** Tous les outils qui écrivent « utilisez l'annulaire gauche » perdent un enfant de 7 ans.
2. **Le déverrouillage progressif bat la liste de leçons** (Keybr). Chaque nouvelle touche ouverte est un gain célébré, et c'est le remplaçant du score interdit.
3. **Le layout est une donnée.** Une table par disposition, une pédagogie unique. Le contenu proposé change avec la disposition, pas seulement le dessin.
4. **La détection automatique doublée d'un sélecteur manuel** (Fort-Dactylo) est le comportement attendu.
5. **Du vrai français lisible dès le premier exercice.** Dance Mat réussit parce que « sad » et « lad » veulent dire quelque chose ; Keybr échoue avec les enfants parce que ses pseudo-mots n'en ont aucun.

### 2.3 Les trois erreurs qu'on refuse

1. **La compétition déguisée en motivation.** Classement, WPM, combos, scoreboard. Documenté : l'enfant optimise la vitesse immédiate, revient au hunt-and-peck, et verrouille la mauvaise habitude.
2. **La punition déguisée en récompense.** L'étoile retirée, le niveau échoué, le compteur d'erreurs. Une erreur doit déclencher **une aide**, jamais une perte.
3. **La charge de lecture et le bruit visuel.** Un enfant de 7 ans qui apprend encore à lire ne doit décoder qu'**une seule chose** à l'écran : le caractère à taper. Le reste passe par l'image, la couleur, la position et l'audio.

---

## 3. Principes de conception

Sept règles. Chacune est un verdict, pas une piste. Format : la règle, la raison, l'argument adverse le plus fort, pourquoi il ne l'emporte pas.

---

### P1 — Le mode débutant découpe le clavier en deux MOITIÉS, pas en deux colonnes d'index

**La règle.** En mode débutant, chaque touche appartient à une **main**, déterminée par sa position physique par rapport à la ligne médiane du clavier (`T`/`G`/`B` à gauche, `Y`-ou-`Z`/`H`/`N` à droite). L'index gauche atteint toute la moitié gauche, l'index droit toute la moitié droite, les pouces l'espace. L'indication affichée est de **niveau main** : « Main gauche · ton index », jamais « le doigt de cette lettre est l'index ». La palette est **hiérarchique** : deux teintes (main gauche / main droite) en mode débutant, et le mode complet ne fait que subdiviser ces teintes en nuances — aucune touche ne change jamais de couleur de base.

**La raison.** L'objet d'apprentissage n°1 du mode débutant est la **frontière verticale**, pas le nom du doigt. La répartition par main est exactement celle de la méthode à dix doigts : elle n'est jamais démentie par la suite, elle est seulement subdivisée. Et cette répartition est identique en AZERTY et en QWERTZ romand, alors que les colonnes d'index diffèrent (`Y` contre `Z`).

**L'argument adverse.** L'exigence imposée est « indiquer le doigt à utiliser ». En demi-clavier, l'app indiquera « index gauche » pour un `a` dont le doigt cible est l'auriculaire. Une aide qui se dédit perd sa crédibilité auprès de l'enfant, et la carte colorée devra être repeinte.

**Pourquoi il ne l'emporte pas.** C'est un défaut de formulation et de palette, réparable par conception (indication de niveau main, palette qui subdivise au lieu de repeindre). Le défaut de l'option adverse est arithmétique et irréparable : les colonnes d'index donnent onze touches — `b f g h j n r t u v y` — soit **une seule voyelle**, `u`. Le français ne s'écrit pas sans `a`, `e`, `i`, `o` ; le vocabulaire complet tient en une dizaine de mots (*tu, un, nu, vu, bu, but, brut, futur, jury*). Cela contredit frontalement l'exigence « vrais mots français adaptés 7-12 ans » et condamne le mode aux pseudo-syllabes, c'est-à-dire au mode d'échec déjà documenté chez l'enfant. Deux concessions restent acquises à l'adversaire : le mode 4 doigts **n'est pas de la dactylographie**, et il doit être **court et borné par un critère de sortie explicite**.

---

### P2 — Aucune touche modificatrice n'existe en mode débutant, sur aucune disposition

**La règle.** En mode débutant : ni Maj, ni AltGr, ni Verr.Maj — **ni affichée, ni requise, ni acceptée**. Le contenu est strictement ce que les quatre doigts produisent **sans modificateur** sur la disposition détectée. Conséquence directe : en CH-FR, les chiffres sont directs → exercices de nombres dès la première séance. En FR-FR, les chiffres exigent Maj → **aucun chiffre dans le sas débutant**. La rangée des chiffres reste **dessinée en permanence**, avec ses deux légendes réelles (`&` et `1`, `é` et `2`…) et un cadenas : verrouillée et expliquée, jamais absente. Les chiffres sont la récompense datée du palier suivant.

**La raison.** Il y a un enfant et un clavier. Les deux machines sont réellement différentes ; l'app doit dire la vérité de celle qui est posée sur la table.

**L'argument adverse.** Autoriser exceptionnellement l'auriculaire gauche pour Maj — « la touche magique » — rendrait les chiffres accessibles aux deux publics et sauverait le corpus AZERTY.

**Pourquoi il ne l'emporte pas.** La règle canonique de Maj est **contralatérale**. Les chiffres `4` et `5` se frappent de l'index gauche et exigent donc la Majuscule **droite**. L'« exception Maj » n'est donc pas un cinquième doigt avec une règle unique : c'est deux doigts supplémentaires **plus une règle conditionnelle de latéralité**, ou bien l'enseignement d'un Maj homolatéral qu'il faudra désapprendre — exactement ce que l'argument adverse jurait éviter. Il reste deux vrais défauts à corriger, et ils sont corrigés : la rangée numérique ne doit **jamais** être un vide gris non expliqué, et le sas doit rester court.

---

### P3 — Une frappe fausse n'écrit rien. Le mot à l'écran est toujours orthographiquement vrai

**La règle.** Blocage strict de la **progression**, jamais de l'enfant. Une frappe erronée n'écrit rien, ne déplace pas le curseur, n'affiche aucun caractère faux. Le feedback d'erreur est immédiat (< 100 ms) mais se produit **exclusivement sur le clavier virtuel** : la touche pressée s'assombrit et retombe, la touche cible s'intensifie. Jamais sur le texte, jamais de rouge, jamais de croix, jamais de buzzer. L'aide monte sur une **échelle bornée à trois barreaux**, purement visuelle et sonore ; le barreau 3 est **terminal et permanent** pour l'item. La célébration de réussite est **strictement identique** que l'item ait pris un essai ou neuf.

**La raison.** Le contenu est en français, l'enfant décode encore syllabiquement, et il apprend l'orthographe en même temps. Afficher « chàt » ou « nè » est de la charge extrinsèque pure doublée d'un risque d'interférence orthographique.

**L'argument adverse.** Sur touche morte et sur piège Maj AZERTY, le signal d'entrée n'est pas fiable. Bloquer sur un signal non fiable produit le pire état possible : l'enfant fait le bon geste et l'écran ne bouge pas.

**Pourquoi il ne l'emporte pas.** L'argument appelle une réponse de **validation**, pas un changement de paradigme. La touche morte est traitée comme un **état neutre d'attente** et la validation se fait sur le caractère composé. Le piège Maj est en réalité parfaitement détectable — l'app reçoit `è` au lieu de `7` — et l'argument se retourne contre son camp, qui est le seul à écrire ce `è` faux dans le mot. Preuve de catégorie : **tous** les tutoriels de frappe pour enfants bloquent, et les critiques documentées portent sur les étoiles retirées et la répétition sans remédiation, jamais sur le blocage ; le non-bloquant vient de Monkeytype et typ.ing, outils de mesure de vitesse pour adultes qui savent déjà où sont les touches — or ce MVP interdit le score et le chrono, donc importer la mécanique sans sa justification.

---

### P4 — Le clavier à l'écran est le seul support permanent du guidage. Les mains ne sont pas du mobilier

**La règle.** L'écran de jeu comporte **deux zones, pas trois** : le mot/nombre, puis le clavier. Les mains dessinées n'existent qu'à deux endroits — dans la vue guide-doigt de l'onboarding (illustration **statique**, doublée d'audio) et comme **barreau 3 transitoire** de l'échelle d'aide, ancré contre le bord du clavier, qui s'efface dès la réussite. Sur le clavier, le porteur d'information est la **POSITION**, pas la couleur : le clavier est physiquement scindé en trois blocs visuellement séparés. La couleur est une redondance décorative. Chaque état de touche doit rester discriminable **en niveaux de gris**. Aucune légende couleur→doigt sur l'écran de jeu.

**La raison.** Le quart d'écran libéré revient au clavier, qui devient assez grand pour être lisible en vision périphérique — c'est exactement l'usage réel (l'enfant regarde le mot et perçoit le clavier du coin de l'œil). Et la scission spatiale enseigne la frontière, qu'une main animée masque.

**L'argument adverse.** Une main dessinée n'exige aucun décodage, aucune convention apprise, aucune lecture. C'est le dispositif de Dance Mat et TypingClub, les deux seules références calibrées sur cette tranche d'âge.

**Pourquoi il ne l'emporte pas.** Il confond « enseigner le geste une fois » et « afficher le geste en permanence » : une vue guide-doigt dédiée installe « ton doigt qui pointe » définitivement, à coût nul sur l'écran de jeu. Ensuite, son arithmétique est fausse : il prétend que la colorisation n'apporte rien puisque l'enfant sait distinguer sa main gauche de sa main droite — mais l'enfant ignore justement que le `y` appartient à la droite. La leçon n'est pas le nom du doigt, c'est la **frontière**. Enfin, le précédent Dance Mat/TypingClub vient d'un régime différent : ces outils enseignent d'emblée un mapping à dix doigts, où nommer le doigt est un problème à dix issues, alors que le mode d'entrée imposé ici est un problème **à deux issues**. L'objection accessibilité (la couleur seule est disqualifiée, ~8 % des garçons) est valide contre une version paille : en faisant porter le mapping par la scission spatiale, la règle est redondante par construction.

---

### P5 — Le générateur est piloté par la contrainte, l'ordre des paliers est piloté par le sens

**La règle.** Chaque leçon déclare un **ensemble explicite** (touches + doigts autorisés) et rien en dehors n'est jamais affiché à taper — accents et touches mortes compris, sans exception, pas même pour un mot « presque » typable. Mais l'**ordre** des ensembles est choisi pour maximiser le nombre de **vrais mots français typables au plus tôt** (fréquence FR réelle, pas la rangée de repos ASDF-JKL importée). Ordre de préférence du générateur, visible et fixe : **vrai mot > nombre > syllabe**. Jamais de pseudo-mot. Une syllabe est étiquetée comme exercice de lecture (« on lit et on tape : *fa, ju* »), jamais présentée comme un mot. **Aucun palier ne part en production s'il ne produit pas au moins une poignée de vrais mots du lexique 7-12 ans.**

**La raison.** Le gating n'est pas ici un choix pédagogique, c'est une condition d'existence du produit imposé : sans ensemble déclaré, il n'y a ni indication du doigt, ni filtrage par disposition (`ç` direct en AZERTY, sous Maj en CH-FR : *garçon* casserait silencieusement chez le public suisse), ni écran de fin de leçon qui célèbre des touches débloquées.

**L'argument adverse.** La rangée de repos AZERTY (`qsdfghjklm`) ne contient aucune voyelle, donc aucun mot français. L'ordre canonique est un import anglophone, et l'échec documenté de Keybr auprès des enfants montre que le coût du non-sens est réel, pas théorique.

**Pourquoi il ne l'emporte pas.** Parce qu'il argumente contre un **ordre**, pas contre un **gating**. On lui donne entièrement raison sur l'ordre — la rangée de repos n'ouvre aucun palier — et on lui refuse seulement la suppression de l'ensemble déclaré. Symétriquement, le camp du canon a tort sur un point qu'il abandonne lui-même dès son palier 2 (il y ajoute `r t y u`, hors rangée de repos) : la contrainte n'oblige à aucun ordre particulier. Rien ne justifie de payer des semaines de syllabes quand un ordre optimisé par rendement lexical donne *un, tu, une, jus, juste, jeune, sujet* dès la première séance.

---

### P6 — On n'estompe jamais le dessin du clavier, on estompe la latence de l'indice

**La règle.** L'application ne masque **jamais** le clavier d'elle-même, à aucun palier, dans tout le MVP. Ce qui s'estompe est l'**immédiateté** de l'indice : le clavier reste dessiné, touches neutres, et la surbrillance de la touche cible n'apparaît qu'après une **fenêtre de rappel silencieuse**, propre à chaque touche, qui s'allonge par paliers avec les frappes correctes (**0 s → 0,8 s → 1,5 s → 2,5 s maximum**) et retombe **instantanément à 0 s** pour cette touche dès une erreur ou un dépassement. Aucun décompte, aucune barre, aucun son pendant la fenêtre : rien ne signale à l'enfant qu'il est chronométré. L'état de latence est interne et **jamais représenté graphiquement**. Seule exception au masquage : un bouton **« Je tape sans regarder »**, déclenché par l'enfant, qui cache le clavier pour le mot en cours et se réarme seul au mot suivant. En mode débutant, la latence est **plafonnée à 0 s**.

**La raison.** La latence augmente le coût de la consultation quel que soit l'endroit où l'enfant regarde, et crée la fenêtre de rappel recherchée — sans falaise, sans palier affiché assimilable à un score, et en réutilisant exactement l'échelle d'aide déjà validée en P3.

**L'argument adverse.** Une aide disponible en continu améliore la séance et dégrade la rétention (*guidance effect*). Un enfant de 7 ans prendra toujours le chemin le moins coûteux : consulter une carte coûte moins cher que se souvenir. Il faut donc masquer le clavier par paliers.

**Pourquoi il ne l'emporte pas.** Le diagnostic est juste ; le remède est faux. Masquer le clavier **à l'écran** n'augmente pas le coût de la consultation, parce qu'un substitut gratuit et légendé est posé sous les mains de l'enfant : **le clavier physique**. Le masquage retire donc l'aide qui enseigne (le doigt, introuvable ailleurs) et laisse intacte celle qui n'enseigne rien (la position des lettres, imprimée sur les touches) ; il fabrique un aller-retour écran↔clavier au lieu d'un rappel en mémoire. Coût de portée, accessoirement : un compteur par touche, contre trois états × deux modes × deux dispositions.

---

### P7 — Règles de forme (non discutées, appliquées partout)

- **Axe vertical unique.** Mot → clavier. Rien sur les côtés. Ordre de lecture descendant, fixe. Aucun défilement de texte : un item = un écran.
- **Triple redondance sur la cible.** Agrandissement dans le mot + saturation pleine sur la touche + halo pulsé. **Un seul marqueur actif à l'écran**, jamais deux touches en avant (sauf le cas Maj de P3).
- **Typographie calée sur un enfant de 7 ans, pas sur le parent.** Mot cible 48-72 px effectifs, étiquettes de touches 18-24 px minimum, interlettrage augmenté. Sans-serif à `a` et `g` à un seul étage. `I` / `l` / `1` et `0` / `O` impérativement distincts.
- **Casse.** Le mot cible s'affiche **en minuscules** (c'est ce que l'enfant produit) ; les touches du clavier virtuel portent des **capitales**, comme la machine physique. On ne « corrige » pas le clavier.
- **Contraste et fond.** Fond légèrement crème, jamais blanc pur ni noir pur. Rapport visé 7:1 sur le texte cible.
- **Daltonisme.** Jamais de couple rouge/vert comme opposition succès/erreur. Aucune information portée par la seule couleur, nulle part.
- **Son.** Son doux et court sur la réussite, **silence sur l'erreur**. L'asymétrie est perçue comme neutre ; un son d'erreur est perçu comme un reproche. Sons coupables dans les réglages.
- **Motricité.** Aucune pénalité pour une frappe lente. Compatibilité avec les touches rémanentes du système. Pas de clignotement > 3 Hz ; la préférence système « réduire les animations » est respectée.

---

### P8 — Arbitrages rendus à la rédaction

Trois points où les décisions tranchées se contredisaient dans leurs exemples. Ils sont réglés ici, définitivement.

1. **Le périmètre demi-clavier (P1) prime sur les exemples de corpus rédigés en « colonnes d'index ».** Les listes *tu, un, nu, vu, but, brut, jury, futur* et « chiffres 4 5 6 7 seulement » supposaient le périmètre par colonnes, qui a été rejeté. En demi-clavier, **toutes les lettres** sont atteignables par les deux index, et **toute la rangée des chiffres** l'est en CH-FR. Le corpus débutant est donc du vrai français complet (*maison, chat, papa, école*), et l'asymétrie FR/CH sur les chiffres porte sur les dix chiffres, pas sur quatre.
2. **L'auriculaire arrive d'abord comme porteur de Majuscule, pas comme frappeur de lettres.** La décision « chiffres » veut l'auriculaire au palier immédiatement suivant le sas ; la décision « demi-clavier » veut l'ordre majeurs → annulaires → auriculaires. Les deux sont satisfaites en scindant : le palier 7 confie à l'auriculaire **la seule touche Maj, maintenue**, sans qu'aucune lettre ne change de doigt. Maintenir une touche est moteurement moins exigeant que frapper une lettre à l'auriculaire ; les lettres de l'auriculaire attendent le palier 10.
3. **L'espace se frappe du pouce de la main qui n'a pas frappé la lettre précédente.** C'est la seule règle qui rende les quatre états du guide-doigt (pouce G, pouce D, index G, index D) réellement distincts, et elle renforce l'apprentissage de la frontière. Le pouce unique était plus simple mais rendait l'état « pouce gauche » inatteignable.

---

## 4. Fonctionnement

### 4.1 Le parcours de l'enfant

L'enfant ouvre l'app et arrive sur **V1 Accueil** : un titre, une illustration de clavier, un gros bouton « On commence ! », une ligne discrète indiquant le clavier détecté.

Au tout premier lancement, ou s'il touche « Changer », il passe par **V2 Choix du clavier** : l'app lui demande d'appuyer sur la touche `A` de son vrai clavier, identifie la disposition en une frappe, et propose deux cartes illustrées à confirmer d'un clic. Une ligne explique ce que la disposition change dans le mode débutant.

Au premier lancement seulement, **V3 Guide-doigt** s'affiche : illustration statique doublée d'audio, qui installe la frontière verticale et la règle « chaque main garde son côté, l'index est ton outil, les pouces font l'espace ».

Il valide et bascule sur **V4 Leçon**, le cœur du produit. Il tape 8 à 12 items. Une frappe fausse n'écrit rien et fait monter l'aide d'un barreau.

Le bloc terminé, **V5 Fin de bloc** le félicite : des étoiles, une phrase d'encouragement variée, et le clavier miniature où les nouvelles touches s'illuminent avec les mots qu'il peut désormais écrire. Il choisit « Encore » et repart sur V4, ou « Retour » et revient à l'accueil.

Depuis l'accueil ou la fin de bloc, **V6 Carte de progression** montre son clavier qui se colore palier après palier. **V7 Réglages**, sous l'icône d'engrenage, permet de rechanger de clavier, couper les sons, espacer le texte, rejouer le guide-doigt.

**La boucle jouable est V1 → V4 → V5 → V4.** Tout le reste est périphérique.

### 4.2 Rythme de session

- **Un bloc = 8 à 12 items**, soit 60 à 90 secondes.
- **Micro-feedback par lettre** correcte (< 100 ms) : la touche s'illumine, son doux.
- **Célébration par item terminé** : 0,5 à 1 s, une étoile. Assez marquée pour satisfaire, assez courte pour ne pas casser le rythme. **Jamais de confettis plein écran.**
- **Écran de fin par bloc.**
- **Fin de séance proposée par l'app** : à partir du 4ᵉ bloc consécutif, V5 inverse l'emphase des deux boutons — « Retour » devient primaire — et affiche « Tu as bien travaillé. On peut s'arrêter là. » L'enfant peut toujours continuer ; l'app ne le bloque jamais et ne le félicite pas d'arrêter. Cible implicite : 5-10 minutes à 7-8 ans, 10-15 à 11-12.
- **Les étoiles ne mesurent rien.** Une étoile par item validé, identique que l'item ait pris un essai ou neuf. Elles **marquent**, elles ne notent pas. Une étoile n'est jamais retirée.
- **Encouragements** : rotation d'au moins 15 formulations distinctes. La répétition d'une seule phrase est perçue comme creuse par un enfant de 10 ans en deux séances.

### 4.3 La progression des leçons

Deux axes indépendants : quelles **touches** sont ouvertes (paliers 1 à 7), et quels **doigts** les frappent (paliers 7 à 10).

**Paliers 1 à 6 — le sas débutant, quatre doigts.** Le jeu de touches grandit ; le mapping reste « la main de ton côté, ton index ». Ordre optimisé par rendement lexical, pas par rangée.

| Palier | Nouvelles touches — **FR-FR** | Nouvelles touches — **CH-FR** | Mots réellement produits |
|---|---|---|---|
| **1** | `e f j n s t u` + espace | idem + `4 5 6 7` | un, tu, nu, une, jus, fut, net, tenu, sujet, juste, jeune |
| **2** | `+ a i r v` | idem + `2 3 8 9` | vrai, faire, avis, train, suivant, univers, fruit, juin |
| **3** | `+ o l d b m` | idem + `1 0` | maison, bateau, lundi, soleil, tableau, bandit, monde, dinosaure |
| **4** | `+ g h p c` | idem | chat, papa, cheval, chien, grand, poisson, chocolat, gomme |
| **5** | `+ é è à ç` | `+ é è à` (`ç` exige Maj ⇒ reporté au palier 7) | école, élève, très, après, bébé, à, éléphant, garçon* |
| **6** | `+ q w x y z ù` | idem | quatre, wagon, taxi, zèbre, yeux, où, quinze |

\* *garçon* et *français* sont disponibles au palier 5 en FR-FR, au palier 7 en CH-FR. C'est l'illustration canonique du filtrage par disposition.

**Palier 7 — « Ton petit doigt tient la touche Majuscule ».** L'auriculaire entre, uniquement comme porteur du modificateur, avec la règle **contralatérale** (Maj droite pour une lettre de gauche, et inversement). Aucune lettre ne change de doigt.
- **FR-FR** : ouvre les **chiffres 0-9**, les **majuscules**, et le **point** (`Maj + ;`).
- **CH-FR** : ouvre les **majuscules**, le **`ç`**, et la ponctuation shiftée.

**Fin du MVP.** Les paliers 8, 9 et 10 sont **dessinés et nommés dans V6, verrouillés**, et livrés après le MVP :
- **8 — « Les majeurs viennent aider tes index »** : la colonne du majeur quitte l'index (`e d c` / `i k ,`).
- **9 — « Les annulaires »** : `z s x` / `o l .`.
- **10 — « Les auriculaires prennent leurs lettres »** : `a q w` / `p m ù !`, plus les touches mortes `^` et `¨`.

**Critère de passage d'un palier.** Chaque touche du palier doit avoir été validée **sans erreur et sans aide** sur 3 occurrences réparties dans au moins 2 blocs différents. Aucun quota de répétitions, aucun volume, aucun temps.
**Plafond anti-mur.** Si le critère n'est pas atteint après 6 blocs sur le même palier, le palier suivant s'ouvre quand même. L'enfant ne peut jamais être enfermé, et l'app ne le lui dit pas.

**Composition d'un bloc.** 8 à 12 items : majoritairement des touches du palier courant, plus les items ayant atteint le barreau 2 ou 3 dans les blocs précédents, réinjectés **espacés et sous forme de contenu ordinaire**. Aucun écran de récapitulatif d'erreurs, aucun « à refaire ».

### 4.4 Le mode 4 doigts

- **Quatre états de guide-doigt, et quatre seulement** : pouce gauche, pouce droit, index gauche, index droit. Aucune indication composée, aucune flèche vers deux touches simultanées.
- **Le clavier est rendu en trois blocs spatialement disjoints** : moitié gauche, moitié droite, barre d'espace détachée en bas. La frontière est un **élément graphique explicite**, pas une simple limite de couleur.
- **Aucun modificateur** (P2). Corollaire heureux : **Retour arrière n'a aucun rôle**. Puisqu'aucun caractère faux ne s'écrit jamais (P3), il n'y a rien à effacer. La touche est dessinée, éteinte, jamais indiquée.
- **Repères tactiles `F` et `J` visibles dès la première leçon**, avec retour visuel de l'index à son repère après chaque frappe. C'est le seul élément de posture que ce mode peut installer honnêtement.
- **Latence de rappel plafonnée à 0 s** : l'aide est toujours immédiate. Ce mode entraîne le placement des mains, pas le rappel en mémoire.
- **L'espace** est indiqué au pouce de la main **opposée** à la lettre précédente.
- **Le sas est borné.** Une fois le palier 6 franchi, le mode débutant n'est plus une entrée libre : il reste accessible comme **repli** depuis les réglages (l'enfant peut y revenir une séance), mais la leçon par défaut est celle du palier courant. Aucun écran ne dit jamais que la façon précédente était incorrecte.

### 4.5 La gestion de l'erreur

**Comportement nominal.** Frappe fausse → rien ne s'écrit, le curseur ne bouge pas. La touche pressée s'assombrit et retombe (150-200 ms). La touche cible s'intensifie. Son : aucun.

**L'échelle d'aide — trois barreaux, aucun palier textuel.**

| Barreau | Déclencheur | Ce qui apparaît |
|---|---|---|
| **1** | Affichage de l'item (après expiration de la fenêtre de rappel, cf. P6) | Touche cible en saturation pleine + halo pulsé + léger agrandissement |
| **2** | 1ʳᵉ erreur, ou ~3 s sans frappe | Le **bloc** du côté concerné pulse |
| **3** | 2ᵉ erreur sur le même caractère | **Overlay transitoire** d'une main schématique ancrée contre le bord du clavier, index tendu vers la touche, + flèche doigt→touche + **nom de la lettre prononcé**. S'efface à la réussite. |

Le **barreau 3 est terminal et permanent** pour l'item : plus aucune escalade, aucun compte d'essais affiché, aucun message. L'aide n'enlève jamais une information déjà donnée.

**Trois exceptions au blocage**, toutes déclenchées par l'application, jamais vécues comme un échec de l'enfant :

1. **Touche morte** (`^`, `¨` — hors MVP, palier 10). Le premier appui affiche la touche en état « armé / en attente » sur le clavier, sans erreur ni avancement. La validation se fait sur le **caractère composé**. Un item dont le caractère composé n'est pas observable de façon fiable est **exclu du curriculum**.
2. **Piège Maj.** Quand la touche physique est correcte mais le modificateur manque (l'app reçoit `è` au lieu de `7`), c'est un état de **quasi-réussite**, distinct de l'erreur : la touche cible reste en surbrillance « correcte » et la touche Maj s'allume avec son doigt. C'est le seul cas du MVP où deux touches sont mises en avant simultanément.
3. **Incohérence de disposition.** Si 5 frappes consécutives, ou 3 items enchaînés saturant au barreau 3, sont cohérentes avec l'autre disposition supportée, **l'app interrompt d'elle-même** et affiche V2 avec sa consigne audio (« Regarde la touche à côté du A »). C'est la seule chose autorisée à sortir l'enfant d'un item bloqué.

**Verr.Maj.** Détecté en continu. S'il est actif, un bandeau enfant apparaît avec l'illustration de la position de la touche : « Appuie sur la touche avec le petit cadenas pour l'éteindre. » Motif : sous pilote FR historique, Verr.Maj transforme la rangée des chiffres et casse tout silencieusement.

**Ce qui n'existe nulle part.** Compteur d'erreurs, système de vies ou de cœurs, écran de récapitulatif, liste des lettres ratées, mention « réussi avec aide », badge de perfection, comparaison à la séance précédente.

### 4.6 La gestion des deux dispositions

**Stratégie de détection, dans cet ordre.**
1. Interroger la **carte du clavier fournie par le navigateur** si elle est disponible → verdict fiable, appliqué silencieusement.
2. Sinon, faire de la première frappe un **test déguisé** : « Appuie sur la touche A ». On lit le code physique et le caractère produit ; une seule frappe suffit.
3. Dans tous les cas, la disposition retenue est **affichée de façon visible et permanente** (V1, V4 en cas de doute) avec un sélecteur à un clic.
4. **Un choix manuel a priorité absolue** sur toute détection ultérieure, et il est mémorisé.
5. Surveillance continue pendant le jeu (cf. exception 3 en 4.5).

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

Les trois derniers règlent le cas suisse, qui est autrement indiscernable : le romand et l'alémanique partagent le même clavier physique et ne diffèrent que par le pilote.

**Pourquoi le sélecteur manuel est indispensable et non négociable.** La carte clavier du navigateur n'existe pas partout (absente de Firefox et Safari, absente sur mobile). La sérigraphie peut diverger du pilote — un clavier gravé AZERTY piloté en QWERTZ est un cas réel, et l'enfant regarde la vérité physique. Un changement de disposition en cours de session n'émet aucun signal. Enfin, un parent peut vouloir entraîner l'enfant sur la disposition de l'école plutôt que sur celle de la maison.

**Ce que la disposition change concrètement.**

| | FR-FR (AZERTY) | CH-FR (QWERTZ) |
|---|---|---|
| Chiffres | Exigent Maj → **palier 7** | Directs → **palier 1** |
| `é è à` | Directs (rangée des chiffres) | Directs (colonne droite) |
| `ç` | Direct (`Digit9`) → palier 5 | `Maj + 4` → **palier 7** |
| `ù` | Direct (rangée de repos) → palier 6 | Touche morte → **hors MVP** |
| Point `.` | Exige Maj → palier 7 | Direct |
| Apostrophe `'` | Directe, index gauche | Rangée des chiffres, à droite du `0` |
| Tiret `-` | Rangée des chiffres, moitié droite | Rangée basse, à droite du `.` |
| `m` | Rangée de repos, extrémité droite | Rangée basse, près de la frontière |

Deux tables de disposition distinctes, jamais partagées. Changer de disposition dans le sélecteur change **le contenu proposé**, pas seulement le dessin du clavier.

### 4.7 Le contenu tapé

**Ce qui est admis.**
- Vrais mots français du lexique 7-12 ans, en **minuscules**.
- Nombres (un à trois chiffres), là où les chiffres sont ouverts.
- Syllabes, uniquement en dernier recours et **étiquetées comme exercice de lecture**.

**Ce qui est interdit, définitivement.**

| Interdit | Raison |
|---|---|
| Pseudo-mots type Keybr | Mode d'échec documenté chez l'enfant qui apprend encore à lire. Si un palier ne produit ni mot ni nombre suffisants, **c'est le palier qui est refait**, pas le contenu qui est comblé par du bruit. |
| Majuscules accentuées (`É À È Ç Œ`) | Non produisibles au clavier AZERTY standard sous Windows ; séquence à trois touches en CH-FR ; comportement dépendant de l'OS. Elles peuvent apparaître dans les **textes d'interface**, jamais dans les mots à taper. |
| Tout caractère AltGr (`@ # € [ ] { } \ | ~`) | Hors de portée en mode débutant, correspondances totalement différentes sous macOS, et aucun contenu français 7-12 ans n'en a besoin. |
| Apostrophe typographique `’` | Aucune des deux dispositions ne la produit sans AltGr. **Tout le corpus est normalisé sur l'apostrophe droite `'`.** |
| Phrases complètes | Hors MVP (§6). |
| Mots contenant une touche hors ensemble | Aucune exception, pas même pour un mot « presque » typable. |

**Cas particuliers à traiter dans le corpus.**
- `ù` n'existe en français que dans le mot **où**. En AZERTY il a une touche entière en rangée de repos : il fait un item dédié amusant au palier 6. En CH-FR il exige une touche morte : **exclu du MVP**.
- `ï` et `ë` (*Noël, maïs*) exigent le tréma : palier 10, hors MVP.
- `garçon`, `français` : disponibles au palier 5 en FR-FR, au palier 7 en CH-FR.

---

## 5. Les vues

Sept vues. Wireframes en ASCII, à l'échelle des proportions réelles.

---

### V1 — Accueil

**Rôle.** Point d'entrée : lancer une leçon en un clic et voir quel clavier l'app a reconnu.
**Quand.** À l'ouverture, et au retour depuis l'écran de fin de bloc.

**Éléments.**
- Icône engrenage discrète en haut à droite (→ V7).
- Titre : « DactyMalin ».
- Illustration à plat d'un clavier vu de dessus, **sans mains, sans personnage**.
- Bouton primaire très grand : « On commence ! ».
- Ligne d'état du clavier : « Ton clavier : Français (AZERTY) » + petit bouton « Changer » (→ V2).
- Lien secondaire : « Ma carte du clavier » (→ V6).
- Lien tertiaire avec icône haut-parleur : « Revoir : où mettre mes doigts » (→ V3).

```
+------------------------------------------------------+
|                                              [ @ ]   |
|                                                      |
|                  DactyMalin                       |
|                                                      |
|        +----------------------------------+          |
|        |   illustration clavier a plat    |          |
|        +----------------------------------+          |
|                                                      |
|          +----------------------------+              |
|          |      On commence !         |              |
|          +----------------------------+              |
|                                                      |
|    Ton clavier : Francais (AZERTY)   [ Changer ]     |
|                                                      |
|              Ma carte du clavier                     |
|          (o) Revoir : ou mettre mes doigts           |
+------------------------------------------------------+
```

---

### V2 — Choix du clavier

**Rôle.** Identifier ou confirmer la disposition réellement en usage, en une frappe et un clic.
**Quand.** Au tout premier lancement ; sur clic de « Changer » ; **ou quand l'app détecte d'elle-même une incohérence de disposition pendant une leçon** (cf. 4.5, exception 3).

**Éléments.**
- Flèche retour en haut à gauche.
- Titre : « Regarde ton vrai clavier ».
- Consigne unique avec bouton haut-parleur : « Appuie sur la touche A ».
- Deux grandes cartes côte à côte, celle détectée portant une coche.
- Dans chaque carte, un mini-clavier fidèle montrant les deux premières rangées — c'est la comparaison visuelle qui tranche, pas le nom.
- Bouton de confirmation dans chaque carte : « C'est celui-là ».
- **Ligne d'explication contextuelle**, obligatoire, qui varie selon la carte survolée ou sélectionnée :
  - FR-FR : « Sur ce clavier, les chiffres arrivent au palier de la touche Majuscule. »
  - CH-FR : « Sur ce clavier, tu tapes des nombres dès la première leçon. »
  Sans cette ligne, le parent lira un bug.

```
+------------------------------------------------------+
| <-           Regarde ton vrai clavier                |
|                                                      |
|            Appuie sur la touche A   (o)              |
|                                                      |
|  +---------------------+  +---------------------+    |
|  | (v) Francais        |  |     Suisse          |    |
|  |     AZERTY          |  |     QWERTZ          |    |
|  |  +---------------+  |  |  +---------------+  |    |
|  |  | A Z E R T Y   |  |  |  | Q W E R T Z   |  |    |
|  |  | Q S D F G H   |  |  |  | A S D F G H   |  |    |
|  |  +---------------+  |  |  +---------------+  |    |
|  |  [ C'est celui-la ] |  |  [ C'est celui-la ] |    |
|  +---------------------+  +---------------------+    |
|                                                      |
|  Sur ce clavier, les chiffres arrivent au palier     |
|  de la touche Majuscule.                             |
+------------------------------------------------------+
```

---

### V3 — Guide-doigt

**Rôle.** Installer une fois pour toutes la frontière entre les deux moitiés du clavier et le rôle de l'index et des pouces.
**Quand.** Une seule fois après le choix du clavier, puis **uniquement à la demande** depuis V1 ou V7. Jamais automatiquement.

**Éléments.**
- Flèche retour, titre « Chaque main garde son côté », bouton haut-parleur qui lit la consigne.
- Grand clavier scindé en deux blocs par un séparateur vertical épais **étiqueté « la frontière »**.
- Étiquettes sous les blocs : « main gauche », « main droite ».
- **Deux mains schématiques STATIQUES**, vues de dessus, index levé et coloré, une sous chaque bloc. **Seul écran du MVP où des mains sont affichées en permanence.** Silhouette vectorielle neutre, sans genre ni couleur de peau marquée, pas de photoréalisme, pas d'animation continue.
- Barre d'espace détachée en bas avec la mention « tes deux pouces ».
- Boutons « Réécouter » et « J'ai compris ».

```
+------------------------------------------------------+
| <-       Chaque main garde son cote          (o)     |
|                                                      |
|  +-------------------+ || +--------------------+     |
|  | A Z E R T         | || | Y U I O P          |     |
|  | Q S D F G         | || | H J K L M          |     |
|  | W X C V B         | || | N , ; :            |     |
|  +-------------------+ || +--------------------+     |
|      main gauche   la frontiere   main droite        |
|                                                      |
|      (\|/) index leve      index leve (\|/)          |
|       main gauche           main droite              |
|                                                      |
|      +------------- espace ---------------+          |
|      |         tes deux pouces            |          |
|      +------------------------------------+          |
|                                                      |
|      [ (o) Reecouter ]      [ J'ai compris ]         |
+------------------------------------------------------+
```

---

### V4 — Leçon

**Rôle.** Le cœur du MVP : faire taper un mot ou un nombre en montrant la touche cible et le côté de la main sur un clavier fidèle.
**Quand.** Depuis « On commence ! », depuis « Encore » en fin de bloc, ou depuis « Continuer la leçon » sur V6.

**Éléments.**
- Flèche retour en haut à gauche.
- **Bandeau permanent** : « Les touches de cette leçon : e f j n s t u espace ».
- Rangée de pastilles d'avancement du bloc (8 à 12 pastilles, celles réussies pleines). **Aucun chiffre, aucun compteur d'erreurs.**
- **Zone 1** — le mot ou le nombre en très gros. Lettres déjà tapées estompées, lettre courante agrandie et soulignée. **Aucune lettre fausse n'est jamais affichée** ; le mot reste toujours orthographiquement vrai.
- **Zone 2** — le clavier fidèle à la disposition choisie, **en trois blocs disjoints** (moitié gauche, moitié droite, barre d'espace détachée). La frontière est un élément graphique explicite.
- **Touche cible** : saturation pleine, halo pulsé, léger agrandissement. **Une seule à la fois.**
- Touches hors ensemble de la leçon : **dessinées mais éteintes**, jamais supprimées. Rangée des chiffres toujours dessinée avec ses **deux légendes réelles** (`&`/`1`, `é`/`2`…) et un **cadenas** en mode débutant FR-FR.
- Repère tactile visible sur `F` et `J` (marqués `.` ci-dessous).
- Bouton à taille d'enfant en bas : « Je tape sans regarder ».
- **Interdit sur cet écran** : tout panneau de mains fixe, toute légende couleur→doigt, tout compteur, tout chrono, toute barre de progression latérale.

```
+------------------------------------------------------+
| <-  Les touches de cette lecon : e f j n s t u esp.  |
|            (*)(*)(*)( )( )( )( )( )( )               |
|                                                      |
|                      j u s t e                       |
|                          _                           |
|                                                      |
|  +------------------------+ || +--------------------+|
|  | &1 e2 "3 '4 (5   [cad] | || | -6 e7 _8 c9 a0 [cad]||
|  |  A  Z  E  R  T         | || |  Y  U  I  O  P     ||
|  |  Q  S  D  F. G         | || |  H  J. K  L  M     ||
|  |  W  X  C  V  B         | || |  N  ,  ;  :  !     ||
|  +------------------------+ || +--------------------+|
|                                                      |
|        +------------- espace -------------+          |
|        +----------------------------------+          |
|                                                      |
|            [ Je tape sans regarder ]                 |
+------------------------------------------------------+
```

*État illustré : palier 1, FR-FR, mode débutant. La touche `S` est la cible (halo). La rangée des chiffres porte ses deux légendes et un cadenas. `F` et `J` portent leur repère.*

---

### V5 — Fin de bloc

**Rôle.** Célébrer ce qui a été réussi et montrer ce que les nouvelles touches permettent d'écrire, sans jamais afficher de performance.
**Quand.** Dès que les 8 à 12 items du bloc sont validés.

**Éléments.**
- Titre d'encouragement variable, rotation d'au moins 15 formulations.
- Rangée d'étoiles gagnées dans ce bloc — **représentation figurative uniquement, aucun chiffre**.
- Phrase de gain lexical : « Tu écris maintenant : juste, jeune, sujet ».
- Clavier miniature où les nouvelles touches débloquées s'illuminent.
- **Deux boutons seulement** : « Encore » (primaire, par défaut) et « Retour ». À partir du 4ᵉ bloc consécutif, l'emphase s'inverse et la ligne « Tu as bien travaillé. On peut s'arrêter là. » apparaît.
- Lien discret : « Ma carte du clavier ».
- **Interdit** : temps écoulé, pourcentage, nombre d'erreurs, comparaison à une session précédente, mention d'un contenu indisponible, comparaison entre dispositions.

```
+------------------------------------------------------+
|                                                      |
|                     Bravo !                          |
|                                                      |
|            *  *  *  *  *  *  *  *                    |
|                                                      |
|     Tu ecris maintenant : juste, jeune, sujet        |
|                                                      |
|   +----------------------------------------------+   |
|   |  clavier miniature - S T U s'illuminent      |   |
|   +----------------------------------------------+   |
|                                                      |
|      +----------------+   +----------------+         |
|      |    Encore      |   |    Retour      |         |
|      +----------------+   +----------------+         |
|                                                      |
|              Ma carte du clavier                     |
+------------------------------------------------------+
```

---

### V6 — Carte de progression

**Rôle.** Montrer le clavier qui se colore palier après palier et nommer le prochain palier **par ce qu'il débloque**.
**Quand.** Depuis « Ma carte du clavier » sur V1 ou V5.

**Éléments.**
- Flèche retour, titre « Ta carte du clavier ».
- Grand clavier de référence : touches acquises colorées, touches à venir en gris, cadenas sur la rangée des chiffres si encore verrouillée.
- Liste verticale des paliers, chacun nommé par ce qu'il ouvre — jamais par une rangée de clavier.
- Paliers verrouillés avec cadenas et leur promesse écrite.
- **Aucune date, aucun pourcentage, aucune durée, aucun compteur de séances.**
- Bouton primaire : « Continuer la leçon » (→ V4).

```
+------------------------------------------------------+
| <-            Ta carte du clavier                    |
|                                                      |
|  +------------------------+ || +-----------------+   |
|  | &1 e2 "3 '4 (5   [cad] | || | -6 e7 _8 c9 [c] |   |
|  |  a  z  E  R  T         | || |  y  U  I  o  p  |   |
|  |  q  S  D  F  G         | || |  H  J  k  L  m  |   |
|  |  w  x  c  V  B         | || |  N  ,  ;  :  !  |   |
|  +------------------------+ || +-----------------+   |
|                                                      |
|  (v) Palier 1  e f j n s t u      un, tu, juste      |
|  (v) Palier 2  + a i r v          vrai, train        |
|  ( >) Palier 3  + o l d b m       maison, soleil     |
|  [X] Palier 4  + g h p c          chat, cheval       |
|  [X] Palier 5  + e' e` a` c,      ecole, eleve       |
|  [X] Palier 6  + q w x y z u`     quatre, zebre      |
|  [X] Palier 7  ton petit doigt tient la touche       |
|                Majuscule -> les chiffres             |
|  [X] Palier 8  les majeurs viennent aider tes index  |
|                                                      |
|            [ Continuer la lecon ]                    |
+------------------------------------------------------+
```

---

### V7 — Réglages

**Rôle.** Régler la disposition, le son, l'espacement du texte et les animations, et rejouer le guide-doigt.
**Quand.** Depuis l'icône engrenage de V1.

**Éléments.**
- Flèche retour, titre « Réglages ».
- Ligne « Clavier » : deux boutons radio illustrés, « Français AZERTY » / « Suisse QWERTZ ».
- Ligne « Sons » : interrupteur.
- Ligne « **Texte plus espacé** » : interrupteur. **Jamais étiquetée « mode dyslexie »** — un enfant n'aime pas cocher une case qui le désigne. C'est aussi le levier dont le bénéfice est le mieux établi, davantage que le choix d'une fonte spéciale.
- Ligne « Animations douces » : interrupteur.
- Bloc légende des couleurs : « main gauche », « main droite », « espace : tes pouces ». **Seul endroit du MVP, hors onboarding, où la légende apparaît.**
- Bouton « Revoir : où mettre mes doigts » avec icône haut-parleur (→ V3).
- Lien discret « Refaire une leçon à deux doigts » : le repli vers le mode débutant, accessible mais non mis en avant.

```
+------------------------------------------------------+
| <-                 Reglages                          |
|                                                      |
|  Clavier      (o) Francais AZERTY                    |
|               ( ) Suisse QWERTZ                      |
|                                                      |
|  Sons                       [ ON  ]  Oui             |
|                                                      |
|  Texte plus espace          [  OFF]  Non             |
|                                                      |
|  Animations douces          [ ON  ]  Oui             |
|                                                      |
|  --- Les couleurs -------------------------------    |
|   [#] main gauche  [#] main droite  [#] espace :     |
|                                        tes pouces    |
|                                                      |
|      [ (o) Revoir : ou mettre mes doigts ]           |
|                                                      |
|        Refaire une lecon a deux doigts               |
+------------------------------------------------------+
```

---

## 6. Ce qui est explicitement hors MVP

| Exclu | Pourquoi |
|---|---|
| **Multi-profils** | Un enfant, une machine. Un sélecteur de profil ajoute un écran et une notion de « compte » pour zéro gain sur la boucle jouable. |
| **Tableau de bord parent, rapports, export** | Transforme l'app en outil d'évaluation. Contredit frontalement « pas de score, pas de comparaison ». Le parent regarde par-dessus l'épaule. |
| **Mode hors-ligne** | Coût de conception non trivial, bénéfice nul pour un usage à la maison. |
| **Paliers 8 à 10 (mode 8-10 doigts complet)** | Le MVP livre le sas à 4 doigts (paliers 1-6) et le palier Majuscule (7). Les paliers 8-10 sont **dessinés, nommés et verrouillés dans V6** — la promesse est visible, la mécanique attend. Raison de fond : le risque documenté en §7.1 doit être mesuré sur un enfant réel avant qu'on construise la subdivision des doigts. |
| **Touches mortes `^` et `¨`** | Séquence à deux frappes, signal navigateur inégal entre Chromium, Firefox et Safari. Elles arrivent au palier 10 avec les auriculaires. Conséquence : *forêt, Noël, maïs* sont hors corpus MVP. |
| **Majuscules accentuées `É À È Ç`** | Non produisibles au clavier AZERTY standard sous Windows ; trois touches en CH-FR ; comportement dépendant de l'OS. Bannies du contenu tapé, admises dans les textes d'interface. |
| **Tout caractère AltGr** | Hors de portée du mode débutant, et correspondances totalement différentes sous macOS. Aucun mot français 7-12 ans n'en a besoin. |
| **Phrases complètes et ponctuation étendue** | En AZERTY le point exige Maj : une phrase est un exercice à deux mains et à modificateur, hors de portée avant le palier 7. Le MVP s'arrête aux mots et aux nombres. |
| **Autres dispositions** (belge, canadienne, QWERTY US, BÉPO, Dvorak) | Chaque disposition supplémentaire est une table **et** un corpus filtré **et** un jeu de paliers. Deux, traitées à fond, valent mieux que six approximatives. |
| **Pavé numérique** | Inutilisable sur portable, qui est la machine probable. |
| **Dictée audio, mode aveugle, fonte OpenDyslexic** | Le levier établi pour les lecteurs en difficulté est l'espacement, déjà présent en réglage. La fonte spéciale est contestée par les études contrôlées. |
| **Mini-jeux séparés, avatars, monnaie virtuelle, collections** | Documenté : l'enfant ne veut plus faire que le jeu, et la coupure leçon/jeu tue la leçon. |
| **WPM, précision affichée, courbes, historique de sessions** | Interdits par le cadrage, et par la théorie de la charge cognitive : ce sont de la charge extrinsèque pure chez un novice dont la charge intrinsèque est déjà maximale. |
| **Un quatrième barreau d'aide « montre-moi »** | Palier de repli identifié (§7.3), pas une fonctionnalité MVP. Il ne sera construit que si l'usage réel montre des blocages terminaux. |

---

## 7. Risques et points de vigilance

### 7.1 — L'index qui balaie sa moitié de clavier sans jamais s'ancrer

**Le risque.** Le mode débutant apprend à l'index à parcourir toute sa moitié de clavier. Si le sas s'étire — enfant qui y reste par confort, critère de sortie trop lâche — ce geste s'automatise, et la transition vers huit doigts coûte une vraie chute de vitesse. C'est le risque n°1 du projet : c'est celui qui, s'il se réalise, transforme l'option retenue en hunt-and-peck à deux doigts sophistiqué.

**Les garde-fous construits.** Critère de sortie explicite et fractionné (chaque touche validée sans erreur et sans aide, 3 fois, sur 2 blocs). Repères `F` et `J` visibles dès la première leçon avec retour visuel de l'index à son repère après chaque frappe. Sas non contournable : une fois franchi, le mode débutant devient un repli discret dans les réglages, pas une entrée de menu.

**Ce qu'il faut observer.** Le nombre de blocs réellement consommés pour franchir les paliers 1 à 6. **Si le sas dépasse une dizaine de séances, le critère est trop lâche et doit être resserré**, pas contourné par un raccourci offert à l'enfant.

### 7.2 — Le corpus AZERTY du sas devient répétitif avant les chiffres

**Le risque.** En FR-FR, aucun chiffre n'est disponible avant le palier 7. Si le sas s'étire, l'enfant tape des mots pendant des semaines en voyant un cadenas sur la rangée des chiffres, et décroche avant la récompense promise.

**Les garde-fous construits.** La promesse est **datée et visible dès la première séance** (V2 le dit, V6 le nomme, V4 dessine le cadenas). Le seuil de déverrouillage du palier 7 est fondé sur la maîtrise, pas sur un volume. L'ordre des paliers est optimisé pour le rendement lexical, ce qui donne des mots satisfaisants dès la première leçon (*juste, jeune, sujet*).

**Ce qu'il faut observer.** C'est le paramètre le plus susceptible de faire échouer la décision, et il n'est vérifiable qu'en test réel avec l'enfant. **Observable dès la deuxième séance.** Si l'ennui apparaît, le levier est de raccourcir les paliers 1 à 6 en les fusionnant, jamais d'introduire une exception Maj en mode débutant.

### 7.3 — Le mur émotionnel : un enfant saturé au barreau 3, seul devant l'écran

**Le risque.** Un enfant qui sature au barreau 3 sans trouver la touche n'a plus d'issue interne : ni sortie volontaire, ni parent notifié (pas de tableau de bord au MVP). Le garde-fou disposition ne couvre que l'incohérence systématique, pas le blocage isolé sur une seule touche par fatigue, distraction ou main qui ne suit pas. Un item devient un mur dans une session que personne n'observe, et l'onglet se ferme.

**Les garde-fous construits.** Le barreau 3 donne l'information **totale** : flèche, main, nom de la lettre prononcé. L'enfant n'a plus qu'à poser le doigt. Aucun compte d'essais n'est affiché, aucune escalade ne poursuit. La célébration finale est identique.

**Palier de repli si l'usage réel le montre.** Ajouter un **4ᵉ barreau « montre-moi »** qui joue l'appui en démonstration animée, l'enfant devant toujours produire l'appui lui-même. **Et non un saut d'item** : sauter reconvertirait le blocage strict en frappe non bloquante et annulerait la décision.

### 7.4 — La fenêtre de rappel devient une salle d'attente

**Le risque.** L'enfant apprend à patienter 1,5 s au lieu de chercher en mémoire, et la dépendance à l'aide revient sous une autre forme.

**Les garde-fous construits.** Plafond bas (2,5 s). Micro-feedback qualitatif distinct sur la frappe autonome — étincelle, touche qui s'illumine plus franchement — jamais un chiffre, jamais un cumul.

**Ce qu'il faut observer.** Ce sont des paramètres à régler sur un enfant réel, **pas des valeurs démontrées**. Le signal d'alarme est un enfant qui, la main immobile, regarde l'écran jusqu'à l'apparition de l'indice.
**Ce que l'app ne pourra jamais couvrir** : rien n'empêche le regard de descendre sur le clavier physique. Si la frappe à l'aveugle devient un objectif, le levier est de **couvrir le clavier physique**, pas d'ajouter un mécanisme logiciel.

### 7.5 — La scission spatiale lue comme « deux claviers »

**Le risque.** Chez un enfant très jeune ou en tout début d'apprentissage, les trois blocs disjoints peuvent être lus comme deux claviers séparés plutôt que comme une frontière entre deux mains.

**Le garde-fou.** V3 nomme explicitement l'objet — « la frontière » — et le double d'audio. La barre d'espace, détachée sous les deux blocs, les rattache visuellement.
**Ce qu'il faut observer.** Une confusion à la première séance. Si elle persiste, le levier est de rapprocher les blocs en gardant le séparateur épais, jamais de fusionner le clavier.

### 7.6 — Le barreau 3 devient de fait permanent au passage à huit doigts

**Le risque.** En mode 8-10 doigts, la relation couleur→doigt redevient un code arbitraire à huit valeurs qu'un enfant de 7 ans ne peut pas décoder sans lire une légende. Le barreau 3 pourrait alors se déclencher si souvent que les mains redeviennent de fait permanentes — sans en avoir la qualité, puisqu'elles seraient intermittentes et clignotantes. Le pire des deux mondes.

**Le garde-fou.** **Instrumenter la fréquence de déclenchement du barreau 3** pendant les tests. Seuil d'alerte : **une lettre sur cinq en régime stabilisé**. Au-delà, la décision « pas de mains permanentes » est rouverte **pour le mode 8 doigts uniquement — jamais pour le mode 4 doigts, où le verdict tient quoi qu'il arrive**. C'est la raison directe pour laquelle les paliers 8 à 10 sont hors MVP : on mesure avant de construire.

### 7.7 — L'ordre par rendement lexical fait remonter trop tôt des touches d'auriculaire

**Le risque.** Optimiser l'ordre pour le rendement lexical fait entrer tôt `a`, `é`, `p`, `m` — précisément les touches dont le doigt cible (auriculaire) a l'individuation la moins mûre à 7 ans. En mode débutant ce n'est pas un problème (l'index les prend), mais au palier 10 ces touches quittent l'index pour le doigt le plus faible, et elles sont parmi les plus fréquentes du français.

**Le garde-fou.** Le fractionnement du déblocage : le palier 10 ne transfère que quelques touches à la fois, et il est présenté comme un gain (« l'auriculaire prend le `a` que ton index portait »), **jamais comme une correction**. Aucun écran ne dit que la façon précédente était incorrecte.
**Arbitrage figé** : rendement d'abord, doigt ensuite. Jamais l'inverse.

---

*Fin du cahier des charges. Tout ce qui précède est tranché ; ce qui reste ouvert est nommé en §7 avec son critère d'observation et son levier de correction.*
---

## Addendum — arbitrage du commanditaire (2026-08-23)

**Le verdict n°1 du jury est annulé sur un point.**

Le jury avait tranché : « Les mains dessinées sont interdites comme mobilier permanent » sur l'écran de leçon, le clavier colorisé étant le seul support permanent de l'indication du doigt.

Le commanditaire annule cette partie du verdict. Motif : le brief initial listait l'indication du doigt parmi les quatre éléments centraux non négociables, et le jury l'a réinterprétée au lieu de la traiter comme une contrainte.

**Règle en vigueur, qui prime :**

L'écran de leçon comporte **TROIS zones**, pas deux. La troisième est une bande basse permanente, pleine largeur, séparée du clavier par un liseré, qui montre en continu quel doigt utiliser pour la touche suivante.

En mode débutant elle contient exactement **quatre pastilles** alignées, chacune avec une main schématique plate vue de dessus et un seul doigt levé :

| Pastille | Doigt | Teinte |
|---|---|---|
| 1 | index gauche | teal |
| 2 | pouce gauche | teal |
| 3 | pouce droit | orange |
| 4 | index droit | orange |

Une seule pastille est active à la fois : nettement agrandie, saturée, cerclée d'un anneau épais avec halo. Les trois autres sont petites, pâles et plates. L'état actif reste lisible en niveaux de gris par la taille et l'anneau, pas seulement par la couleur. À gauche de la bande, la consigne de niveau main, par exemple « Main gauche · ton index ».

Ce qui reste du verdict n°1 : le libellé est de niveau **main** d'abord (« Main gauche · ton index »), la couleur reste redondante, et une seule touche cible est mise en avant sur le clavier.

**Maquette de référence : `maquettes/V4-debutant-A.png`.**

**Les pastilles utilisent des photographies, pas des pictogrammes.** Les quatre visuels
sont fournis, détourés sur fond transparent : `doigts/web/index_gauche.png`,
`pouce_gauche.png`, `pouce_droit.png`, `index_droit.png`, chacun en 512 px de haut avec
sa variante `@2x`. Montre et alliance ont été retirées — l'interdiction des bijoux du
design system tient, elle est simplement satisfaite par retouche plutôt que par
abstraction. La règle « silhouettes neutres, sans teinte de peau » du design system est
levée pour ces quatre visuels, et pour eux seuls : une main réelle se reconnaît plus vite
qu'un pictogramme chez un enfant de 7 ans. Partout ailleurs — vue guide-doigt V3,
overlay d'aide — le dessin schématique reste la règle.

Le cadrage des quatre photos n'est pas homogène : `pouce_gauche` est coupé au ras du haut
des doigts. Prévoir un recadrage commun si les pastilles doivent partager la même échelle
apparente.

---

## Note sur les maquettes — artefact de rendu Google Stitch

**Non bloquant. À ignorer à la lecture des maquettes.**

Les maquettes de ce document ont été générées avec Google Stitch. L'outil rend mal deux choses :

1. **La rangée des chiffres du clavier virtuel** apparaît remplie de symboles décoratifs inventés au lieu des vraies légendes AZERTY. La spécification correcte est : chaque touche porte deux légendes, le chiffre en haut et le caractère en bas — `1 &`, `2 é`, `3 "`, `4 '`, `5 (`, `6 -`, `7 è`, `8 _`, `9 ç`, `0 à`. C'est cette spécification qui fait foi, pas le dessin.
2. **Le nom du produit dérive** sur certains écrans (« ClavierCopains », « DactyloApprenti »). Le nom retenu est **« DactyMalin »**, et lui seul.

Ces deux points sont des limites du générateur d'images, pas des décisions de conception. Ils n'affectent aucune règle de ce cahier des charges, et n'empêchent pas de démarrer l'implémentation. Le texte de ce document prime sur les maquettes en cas de divergence.
