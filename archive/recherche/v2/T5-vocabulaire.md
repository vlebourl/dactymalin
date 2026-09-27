# T5 — Nommage et architecture de l'information : comment s'appellent les niveaux

Rapport de recherche et d'arbitrage, 2026-08-29. Périmètre : le **vocabulaire de
structure** (les noms des niveaux de progression et leur emboîtement), côté
interface enfant, interface parent, code et documentation. Aucun fichier du dépôt
n'a été modifié ; ce rapport est le seul livrable.

Toute affirmation sur le dépôt porte sa référence `fichier:ligne`. Toute
affirmation sur l'état de l'art porte son URL et sa date de consultation.

---

## 0. Le résultat en une page

**Le diagnostic.** Trois niveaux existent dans le produit — un jeu de touches, une
session de 60-90 s, un mot à taper — et **aucun des trois n'a de nom stable**.
« Leçon » désigne trois choses différentes selon l'écran. « Palier » et « bloc »
sont du vocabulaire d'implémentation et ils sont visibles par l'enfant, l'un dans
un texte de réglages, l'autre dans le bandeau de l'écran de jeu et jusque dans les
phrases d'encouragement. Le même nombre s'affiche « leçon 3 » dans un écran parent
et « palier 3 » dans l'autre.

**La découverte qui commande tout le reste.** La question posée — « combien
d'exercices pour finir une leçon » — **n'a pas de réponse dans ce produit, et c'est
délibéré**. Le passage d'un jeu de touches au suivant n'est pas déclenché par un
compte de sessions mais par un critère de maîtrise par touche, avec un plafond de
secours que le cahier des charges exige de garder **silencieux**
(`progression.ts:9`, `progression.ts:32-41` ; cahier l.228). Le nombre de sessions
nécessaires varie de 2 à 6 selon l'enfant. **Toute phrase de la forme « 3 leçons
pour finir l'étape » serait fausse**, et la seule phrase de relation honnête porte
sur les touches, pas sur un décompte de sessions. C'est l'arbitrage central de ce
rapport, et il contredit sur ce point l'exemple donné par le commanditaire — qui
l'avait annoncé non normatif.

**La recommandation.** Deux niveaux nommés, pas trois :

| | Nom visible par l'enfant | Aujourd'hui dans le code |
|---|---|---|
| Le jeu de touches (1 à 7) | **étape** | `palier` |
| La session de 8-12 items | **leçon** | `bloc` |
| Le mot à taper | *aucun nom* — la rangée de pastilles le dit déjà | `item` |

Phrase de relation affichée : **« Cette étape sera finie quand tu connaîtras bien
ses 7 touches. »** puis, en cours de route, **« Encore 2 touches. »**

Ce système fait trois choses : il retire « palier » et « bloc » de l'interface, il
rend à « leçon » le sens qu'il a dans tous les produits concurrents examinés — la
chose qu'on fait en une fois, assise — et il n'invente aucune métaphore
supplémentaire, l'app en ayant déjà une, vraie et non décorative : le clavier.

---

## 1. Inventaire : ce que le dépôt dit aujourd'hui

### 1.1 Les trois niveaux réellement implémentés

| Niveau | Nom dans le code | Où il est défini | Ce que c'est |
|---|---|---|---|
| 1 | `palier` | `src/core/paliers.ts:15-79` | Un jeu de touches cumulé. 10 entrées, dont 7 jouables (`PALIER_MAX = 7`, `paliers.ts:82`) et 3 verrouillées (`paliers.ts:63,70,77`). |
| 2 | `bloc` | `src/core/generator.ts:149` (`composerBloc`) | 8 à 12 items, soit 60-90 s (cahier l.193, `generator.ts:13-14`). |
| 3 | `item` | `src/core/generator.ts:8-12` | Un mot, un nombre ou une syllabe (`GenreItem`, `generator.ts:6`). |

Volumétrie des occurrences dans `src/` (fichiers `.ts` / `.tsx`, insensible à la
casse) : `palier` 432, `bloc` 345, `item` 222, `liste` 287, `leçon`+`lecon` 108,
`module` 26 (imports CSS uniquement), `unité` 3, et **zéro** occurrence de
`étape`, `niveau`, `exercice`, `chapitre`. Le terrain lexical proposé par le
commanditaire est donc entièrement libre dans le code.

### 1.2 Collision n°1 — « leçon » désigne trois choses

| Sens | Où | Preuve |
|---|---|---|
| **A. Le jeu de touches** (= palier) | Bandeau de l'écran de jeu | `V4Lecon.tsx:256` : `Leçon {app.palier} sur {PALIER_MAX}` |
| A (idem) | Écran de fin | `V5FinDeBloc.tsx:51` : `Leçon {nouvelleLecon} débloquée !` ; l.58 : « Tu passes à la leçon **{n}** sur 7 » ; l.83 : « Commencer la leçon {n} » |
| A (idem) | Réglages, liste des enfants | `V7Reglages.tsx:60` : `` `leçon ${e.palier}` `` |
| A (idem) | Espace parent | `V9Compte.tsx:398` : « ne fait pas avancer la leçon » |
| **B. Une session de jeu** (= bloc) | Lien des réglages | `V7Reglages.tsx:153` : « Refaire une leçon à quatre doigts » — ce lien envoie sur `V4`, c'est-à-dire **une** session, pas un palier |
| **C. L'écran de jeu** | Nom de la vue et du module | `src/views/V4Lecon.tsx` ; `src/core/lecon.ts:2` « Machine d'état de la leçon (V4) » ; cahier l.451 « ### V4 — Leçon » |

Les sens A et B coexistent dans **le même écran** (`V7Reglages.tsx:60` et `:153`).
Un enfant qui lit « leçon 3 » en haut et « refaire une leçon » en bas n'a aucun
moyen de savoir que ce n'est pas la même chose.

### 1.3 Collision n°2 — « bloc » désigne deux choses, dont une qu'il faut garder

| Sens | Où | Preuve |
|---|---|---|
| **A. La session de 8-12 items** | Partout dans l'état et le générateur | `state.tsx:16` `BilanBloc`, `generator.ts:149` `composerBloc`, `progression.ts:8` `BLOCS_DISTINCTS_REQUIS`, `storage.ts:22` |
| **B. Un pan physique du clavier dessiné** | Rendu du clavier et échelle d'aide | Cahier l.235 « le clavier est rendu en trois blocs spatialement disjoints » ; l.251, barreau 2 : « le **bloc** du côté concerné pulse » ; cahier l.~466 « en trois blocs disjoints » |

Le sens B est **correct et doit survivre à tout renommage** : un pan de clavier est
littéralement un bloc. C'est le piège principal d'un renommage mécanique.

Sous-collision, dans le sens A lui-même : `state`/`storage` porte **deux compteurs
de blocs de natures différentes** — `bloc` (`storage.ts:22`), numéro monotone du
prochain bloc, qui sert d'identifiant pour répartir les occurrences de maîtrise, et
`blocsSurPalier` (`storage.ts:20`), remis à zéro à chaque palier franchi
(`state.tsx:154`). Deux choses, un mot.

### 1.4 Collision n°3 — « carte » désigne trois choses

| Sens | Preuve |
|---|---|
| La carte de progression (écran V6) | `V6Carte.tsx:39` « Ma carte du clavier » ; `V1Accueil.tsx:100` et `V5FinDeBloc.tsx:94`, même libellé |
| Une vignette de liste sur l'accueil | `V1Accueil.tsx:71-85`, classes `carteListe` / `carteNom` |
| La table de correspondance du navigateur | `V2Clavier.tsx:22` `source: 'carte' \| 'frappe'`, l.96-97 |

Conséquence directe pour la suite : **« carte » est indisponible comme nom de
niveau**, il est déjà pris trois fois.

### 1.5 Le jargon qui a fui jusqu'à l'enfant

| Terme | Texte visible | Référence |
|---|---|---|
| `bloc` | « **Bloc** {n} de cette leçon » | `V4Lecon.tsx:272`, et l'étiquette d'accessibilité l.276 |
| `bloc` | « {n} **blocs** finis sur {PLAFOND_BLOCS} » | `V4Lecon.tsx:239`, affiché l.266 |
| `bloc` | « **Bloc** terminé, bravo » et « Encore un **bloc**, tranquillement » | `src/core/encouragements.ts:11,19` — deux des dix-huit phrases de félicitation |
| `palier` | « **palier** {n} » | `V9Compte.tsx:197`, espace parent |
| `palier` | « Palier 1 », « Palier 2 »… dans la maquette de V6 | cahier l.~558-566 (le code, lui, n'affiche que le titre : `V6Carte.tsx:70`) |

Les trois occurrences de `encouragements.ts` et de `V4Lecon.tsx` sont vues par
l'enfant à chaque session. Ce sont les fuites les plus coûteuses.

### 1.6 Incohérences constatées, indépendamment de tout renommage

1. **Deux mots pour un même nombre, dans deux écrans parents.** `V7Reglages.tsx:60`
   affiche « leçon 3 » ; `V9Compte.tsx:197` affiche « palier 3 ». Même champ
   (`etat.palier`), deux vocabulaires.
2. **« sur 7 » contre une liste de 10.** Le bandeau annonce « Leçon 3 sur 7 »
   (`V4Lecon.tsx:256`, `PALIER_MAX = 7`) tandis que V6 déroule les **dix** entrées
   de `PALIERS` (`V6Carte.tsx:52`), cadenas compris. L'enfant compte dix lignes et
   lit « sur 7 ».
3. **Le plafond anti-mur est affiché.** `V4Lecon.tsx:239` peut afficher « 4 blocs
   finis sur 6 ». Or `PLAFOND_BLOCS` est décrit comme le mécanisme qui « ouvre le
   palier suivant **en silence** » (`progression.ts:9`) et le cahier écrit
   « l'app ne le lui dit pas » (l.228). Le détail sous la jauge dit exactement ce
   que le cahier interdit de dire. À trancher indépendamment du nommage.
4. **Le titre de V6 diverge du cahier.** Cahier l.~455 : « Ta carte du clavier ».
   Code : « Ma carte du clavier » (`V6Carte.tsx:39`, `V1Accueil.tsx:100`).
   Le code est cohérent avec lui-même ; c'est le cahier qui est en retard.
5. **Le nom du fichier de doc ment.** `docs/BIBLIOTHEQUE-LECONS.md` s'intitule
   « Bibliothèque de leçons perso » (l.1) mais décrit une bibliothèque de **listes
   de mots** — le mot employé dans tout le reste du fichier (l.71, l.122, l.210-213)
   et dans le code (`state.tsx:47-53`). Une liste n'est ni une leçon ni un palier :
   elle « ne fait pas avancer la leçon » (`V9Compte.tsx:398`), elle est hors
   hiérarchie. Le titre du fichier est le dernier vestige d'un vocabulaire abandonné.
6. **`étape` est déjà employé, mais pour autre chose.** `docs/BIBLIOTHEQUE-LECONS.md:218`
   « Livraison — 4 étapes ». C'est du vocabulaire de planning de développement, jamais
   affiché ; il n'entre pas en collision avec un usage produit, mais il faudra le
   savoir avant de chercher `étape` dans le dépôt.

### 1.7 La relation entre niveaux : elle n'est énoncée nulle part, et elle n'est pas un nombre

Le critère de passage est dans `progression.ts:32-41` :

- une touche est **maîtrisée** après 3 occurrences propres réparties sur ≥ 2 blocs
  distincts (`OCCURRENCES_REQUISES = 3` l.7, `BLOCS_DISTINCTS_REQUIS = 2` l.8,
  `estMaitrisee` l.22-25) ;
- le palier est franchi quand **toutes** ses touches à valider sont maîtrisées
  (l.40) ;
- **ou** dès `blocsSurPalier >= PLAFOND_BLOCS` (= 6, l.10), test évalué **avant** la
  maîtrise (l.39).

Il n'existe donc **aucun nombre fixe de blocs par palier**. Le minimum théorique est
2 (contrainte des 2 blocs distincts), le maximum est 6, et la valeur réelle dépend
de ce que le générateur a proposé et de ce que l'enfant a réussi sans aide.

C'est pourquoi l'interface actuelle affiche, au lieu d'un décompte, deux textes
alternatifs selon le chemin le plus avancé (`V4Lecon.tsx:234-239`) : « 3 touches
sur 7 » ou « 4 blocs finis sur 6 ». Le second est la fuite du plafond (§1.6.3) ; le
premier est la seule formulation véridique disponible.

**Conséquence pour la mission.** L'énoncé de relation demandé — « il faut X
exercices pour passer une leçon » — ne peut pas être affiché tel quel sans changer
le modèle de progression. Le §4 traite ce point comme un arbitrage et non comme un
détail de formulation.

---

## 2. État de l'art

### 2.1 Logiciels de dactylographie

| Produit | Niveau englobant | Niveau intermédiaire | Niveau élémentaire | Relation affichée | Source (consultée 2026-08-29) |
|---|---|---|---|---|---|
| **Typing.com** | **Unit** (« Learn the Keys 1 ») | **Lesson** (17 dans cette unité) | **Activity** | « 206 Lessons, 1416 Activities » sur la page d'un niveau scolaire | typing.com/curriculum/grade_6 |
| **Ratatype** (FR) | **Course** (19 leçons en français) | **Lesson** (jusqu'à 20) | **Exercise** (jusqu'à 25) | « consists of 19 engaging lessons » | ratatype.com/courses/french/ ; ratatype.com/faq/curriculum-typing-for-beginners/ |
| **ClaviGo** | **Module** (7) | **Exercice** (~170) | — | aucune phrase de relation trouvée | dysclick.fr/clavigo/ |
| **Tap'Touche** | catégories nommées (Activités préparatoires, Exercices et tests…) | **Exercice** (~100) | — | aucune phrase de relation trouvée | taptouche.com/fr/ |
| **TypingClub** | **Lesson plan** (« Typing Jungle », 650+) | **Lesson** | — | non vérifiable : le site est rendu en JS et le centre d'aide renvoie 403 | typingclub.com (accès partiel) |
| **Keybr** | *aucun* — génération algorithmique | **Level** (1 à 10) | — | — | keybr.com (contenu limité au fetch) |

Deux produits cités dans la commande, **Dactylotest / Dactylo-jeu** et
**AZERTYclic**, n'ont produit aucune source officielle identifiable malgré
plusieurs formulations de recherche. Rien n'est rapporté à leur sujet plutôt que
de combler par une supposition.

**Ce que ce corpus établit.** Le mot **« leçon » est le seul terme universel**, et
il désigne partout **l'unité qu'on fait en une fois** — jamais le jeu de touches
qui l'englobe. Chez Typing.com et Ratatype, l'englobant s'appelle *unit* ou
*course*, et l'élémentaire *activity* ou *exercise*. Aucun produit de dactylo
examiné n'appelle « leçon » un ensemble de touches qui prend plusieurs sessions —
ce que fait exactement `V4Lecon.tsx:256` aujourd'hui.

**Ce que ce corpus n'établit pas.** Presque aucun de ces produits n'affiche une
phrase de relation à l'utilisateur. Les chiffres d'emboîtement viennent des pages
marketing ou de documentation, pas de l'écran. La pratique du marché de la dactylo
n'aide donc pas à formuler la phrase demandée ; il faut la chercher ailleurs.

### 2.2 Applications d'apprentissage pour enfants, hors dactylo

| Produit | Emboîtement | Abstrait ou concret | Relation affichée | Âge | Source (consultée 2026-08-29) |
|---|---|---|---|---|---|
| **Duolingo** | section > unité (~10 niveaux) > niveau > **leçon** | mixte | compteur de leçons restantes dans l'unité — mécanisme confirmé, libellé FR exact **non vérifié** | ados/adultes | duoplanet.com/duolingo-learning-path/ ; blog.duolingo.com/fr |
| **Khan Academy** | cours > unité > leçon | abstrait | non trouvée | primaire → université | tice-education.fr |
| **Khan Academy Kids** | niveau scolaire + personnages-guides | mixte | non trouvée | 3-7 ans | khankids.zendesk.com |
| **Lalilo** | univers > monde > leçon (une case du tableau de bord) ; badges, histoires | mixte | non trouvée — l'article officiel décrit le mécanisme sans citer l'écran | cycles 2-3 (~7-11 ans) | blog.lalilo.com/le-parcours-dapprentissage-de-la-lecture-et-du-francais-de-lalilo/ |
| **Mathéros** (écosystème Sésamath) | **10 ceintures** > 4 étapes nommées : « J'apprends », « Je m'entraîne », « Je pars en mission », « Je valide » | **concret** (ceinture, mission, super-héros) | les 4 étapes sont nommées à l'écran, verbatim confirmé | CP-CM2 (6-11 ans) | outilstice.com/matheros-transformez-vos-eleves-en-super-heros-du-calcul-mental ; tablettesetpirouettes.com/ceintures-de-calcul-mental-avec-matheros |
| **Mathador Solo** | 30 niveaux | abstrait | non trouvée | primaire | reseau-canope.fr |
| **Anton** | matière > classe > leçon > test ; étoiles, pièces, trophées | mixte | non trouvée | maternelle-6e | anton.app/fr |
| **Squla** | classe > matière > quiz > niveau (interne au quiz) | abstrait | non trouvée | maternelle-CM2 | app-enfant.fr |
| **DragonBox Algèbre** | 10 **chapitres**, progression figurée par un dragon qui grandit | concret | non trouvée verbatim | primaire/collège (non confirmé) | apps.apple.com |
| **Prodigy Math** | zones > quêtes > niveaux de personnage | concret (RPG) | non trouvée en FR | 6-14 ans | prodigygame.us |
| **Epic!** | pas de hiérarchie séquencée — bibliothèque + badges | concret | sans objet | jeunesse | apps.apple.com |

**Le signal le plus fort de ce corpus est un abandon, daté.** Duolingo a remplacé
son **arbre de compétences** par un **chemin linéaire** (« Path ») le
**1ᵉʳ novembre 2022**, pour tous les utilisateurs, et n'est pas revenu en arrière
malgré une réception houleuse (duoplanet.com/duolingo-learning-path/). La métaphore
spatiale ramifiée, longtemps la signature du produit, a perdu contre une séquence
ordinaire.

Le second signal traverse tout le tableau : les produits enfants les plus installés
— Mathéros, Lalilo, Anton — **habillent** d'une métaphore concrète (ceinture,
monde, étoile) une structure interne qui reste, elle, strictement séquentielle et
nommée en vocabulaire ordinaire (leçon, exercice, validation). La métaphore est une
peinture, jamais la charpente. Aucun de ces produits ne demande à l'enfant de
raisonner *dans* la métaphore pour savoir où il en est.

**Limite de cette section, à dire franchement.** Presque aucune phrase de relation
n'a pu être relevée verbatim. Ces produits publient leurs chiffres d'emboîtement
dans leur marketing et leur documentation, pas dans leur interface. La question
« comment affichent-ils la relation » a donc surtout reçu une réponse négative :
**la plupart ne l'affichent pas**. C'est en soi une information utile pour le §4.

---

## 3. Lisibilité pour un enfant de 7 ans contre un enfant de 11 ans

### 3.1 Ce que la littérature établit

**Les mots abstraits s'acquièrent nettement plus tard que les mots concrets.** La
part de concepts abstraits dans le vocabulaire estimé passe d'environ 10 % à 4 ans
à environ 40 % vers 12 ans, la vitesse d'acquisition augmentant surtout entre 7 et
8 ans (Ponari et al. 2016, repris par Reggin, Muraki & Pexman 2021,
frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2021.686478/full). En
lecture, les mots abstraits sont lus avec moins de précision que les concrets
(link.springer.com/article/10.1007/BF00420277). L'écart 7 ans / 11 ans est donc
réel et va exactement dans le sens attendu.

**« Palier » est du vocabulaire d'enseignant, et il est périmé.** En France, le mot
désignait les points d'évaluation du socle commun (palier 1 = fin CE1, palier 3 =
fin de collège), employé dans les bulletins officiels et les grilles de
compétences, jamais adressé à l'élève comme mot de navigation ; le dispositif a été
remplacé par les **cycles** à la réforme du collège de 2016
(education.gouv.fr/bo/2011/Hebdo33/MENE1120589A.htm ;
fr.wikipedia.org/wiki/Socle_commun_de_connaissances,_de_compétences_et_de_culture).
Un enfant de 7 ans francophone n'a aucune raison de l'avoir rencontré ; un
enseignant de plus de quarante ans, si. C'est le profil exact d'un terme
d'implémentation qui se déguise en terme métier.

**Les 9-12 ans réagissent mal à un design perçu comme fait pour plus petits.** Le
constat est répété de façon indépendante par plusieurs sources de praticiens :
Nielsen Norman Group segmente explicitement 3-5 / 6-8 / 9-12 parce que « quelques
années changent complètement les capacités » et situe les 9-12 ans au stade
opératoire concret, cognitivement proches des adultes
(nngroup.com/articles/kids-cognition/) ; Smashing Magazine recommande de ne pas
être condescendant et de concevoir par tranches de deux ans
(smashingmagazine.com/2024/02/practical-guide-design-children/, février 2024) ;
le GDS britannique fait du refus du ton condescendant un principe pour les jeunes
publics (design-histories.education.gov.uk/find-a/designing-for-young-people).
C'est un consensus de guideline professionnelle **répété et convergent**, pas un
résultat expérimental chiffré.

### 3.2 Ce que la littérature n'établit pas

- **Aucune donnée directe** sur la compréhension par des enfants francophones des
  mots précis en jeu ici — « palier », « module », « unité », « niveau », « bloc »,
  « séquence » — comparée à « île », « planète », « marche », « étage », « étape ».
  Ni Manulex, ni Lexique3, ni l'échelle Dubois-Buyse n'ont été interrogés item par
  item dans cette recherche ; leur existence et leur méthode ont seulement été
  vérifiées (acquisition.scicog.fr/pdf/b_lete.pdf pour Manulex ;
  o.bacquet.free.fr/db2.htm pour Dubois-Buyse — cette dernière classe d'ailleurs
  ses 4000 mots en 43 « paliers », vocabulaire d'enseignant une fois de plus).
- **Aucune étude** ne relie une métaphore spatiale d'interface (île, carte, chemin)
  à une meilleure **compréhension** d'un système de progression. Ce qui est
  documenté concerne la **motivation** — barres de progression et cartes
  conceptuelles figurent parmi les éléments de gamification jugés efficaces
  (arxiv.org/pdf/2512.08551, 2025) — ou la cognition spatiale réelle
  (ncbi.nlm.nih.gov/pmc/articles/PMC4304237/), ce qui est un autre sujet.
  **Motivation n'est pas compréhension**, et la question posée porte sur la
  compréhension.
- Une citation d'enfant (« ce site est pour les bébés ») remontée par une recherche
  initiale n'a **pas pu être retrouvée** dans le texte source. Elle n'est pas
  reprise ici.

### 3.3 Ce qu'on en tire pour ce produit

La littérature ne tranche pas entre un mot abstrait et un mot concret pour ce cas
précis. Elle tranche deux choses plus étroites, et cela suffit :

1. **« Palier » est disqualifié** — abstrait, absent du vocabulaire d'un CE1,
   marqué « enseignant », et officiellement périmé depuis 2016. Le retirer de
   l'interface ne se discute pas.
2. **Une métaphore fictionnelle est risquée sur la borne haute de la cible.** À
   11-12 ans, « ton île » ou « ta planète » travaille contre le produit, et le
   cahier interdit déjà le ton bébé (l.43, reproche adressé à Dance Mat Typing :
   « le ton bébé pour un 11 ans »).

Il faut ajouter un argument que la littérature ne donne pas mais que le produit
donne : **cette app possède déjà une métaphore concrète, et elle n'est pas
décorative — c'est le clavier lui-même.** L'écran de progression s'appelle « Ma
carte du clavier » (`V6Carte.tsx:39`), les jeux de touches sont nommés par ce
qu'ils ouvrent et non par une rangée (`paliers.ts:5-6`, titres l.18-77 : « Les
accents », « Les animaux et le chocolat »), et l'objet qui se colore au fil de la
progression est le clavier réel de l'enfant. Ajouter une île par-dessus, ce serait
poser une seconde métaphore sur la première : deux systèmes symboliques
concurrents, dont un seul renvoie à quelque chose que l'enfant a sous les doigts.

---

## 4. Trois systèmes de nommage concurrents

Rappel des contraintes qui écartent des options avant même de commencer :
interface en français ; ton ni scolaire ni infantilisant ; pas de score, pas de
compétition ; « carte » indisponible (§1.4) ; « bloc » doit rester libre pour les
pans du clavier (§1.3) ; et **aucune phrase ne peut annoncer un nombre fixe de
sessions par jeu de touches** (§1.7).

---

### Système 1 — « Étape / Leçon » (deux niveaux nommés)

**(a) Noms.** Le jeu de touches est une **étape**. La session de 8-12 items est une
**leçon**. L'item n'est pas nommé.

**(b) Nombre de niveaux : deux.** Le troisième niveau existe dans le code mais n'a
pas besoin d'un nom à l'écran, pour une raison qui n'est pas une économie mais une
interdiction : la rangée de pastilles de l'écran de jeu porte déjà cette
information, et le cahier exige qu'elle la porte **sans chiffre** — « Rangée de
pastilles d'avancement du bloc (8 à 12 pastilles, celles réussies pleines).
**Aucun chiffre, aucun compteur d'erreurs.** » (cahier, section V4). Nommer l'item,
c'est ouvrir la porte à « exercice 4 sur 10 », c'est-à-dire au compteur interdit.

**(c) Phrases exactes affichées à l'enfant.**

- Bandeau de l'écran de jeu : **« Étape 3 — Les mots de tous les jours »**
- Sous la jauge : **« Encore 2 touches à bien connaître. »**
- Énoncé de la relation, sur l'écran de fin d'étape et sur la carte :
  **« Cette étape sera finie quand tu connaîtras bien ses 7 touches. »**
- Écran de fin de session : **« Leçon finie ! »** puis les boutons existants.
- Franchissement : **« Étape 4 ouverte ! Elle t'apporte : g h p c »**

**(d) Termes du code.** `palier` → `etape`, `bloc` (sens session) → `lecon`,
`item` inchangé, `bloc` (sens pan de clavier) **inchangé**. Le nom de la vue
`V4Lecon` et du module `src/core/lecon.ts` deviennent **exacts** au lieu d'être
ambigus : ce sont bien la vue et la machine d'état d'**une** leçon.

**(e) Gains.** Un mot, un sens, sur les trois niveaux. « Leçon » retrouve le sens
qu'il a chez Typing.com, Ratatype, Duolingo, Khan et Anton (§2) : ce qu'on fait en
une fois. « Palier » et « bloc » disparaissent de l'interface. La phrase de
relation est vraie. Aucun mot nouveau à apprendre : « étape » et « leçon » sont des
mots ordinaires, ni scolaires ni enfantins, qu'un enfant de 11 ans emploie sans
gêne. Le vocabulaire de code devient traduisible mot à mot vers l'interface, ce qui
supprime la source même de la fuite de jargon.

**Coûts.** « Leçon » **change de sens** : ce qui s'appelle aujourd'hui « leçon 3 »
s'appellera « étape 3 ». Les enfants déjà en cours de parcours voient le mot bouger
— coût réel mais unique, et le nombre ne bouge pas. Le renommage touche beaucoup de
code (432 + 345 occurrences, §1.1) dont **deux champs persistés** — `palier` et
`bloc` dans `Sauvegarde` (`storage.ts:16-26`) — ce qui impose une migration ou des
alias en lecture, et `fusion.ts:34` fusionne ces champs entre appareils. Le piège
du double sens de `bloc` (§1.3) rend un `sed` global dangereux : le renommage doit
être fait fichier par fichier, en épargnant `Keyboard.tsx`, l'échelle d'aide et les
passages correspondants du cahier.

---

### Système 2 — « Leçon » seule (minimaliste : un seul niveau nommé)

**(a) Noms.** Le jeu de touches est une **leçon** — le mot reste à sa place
actuelle. La session n'est **pas nommée** : elle est désignée par ce qu'on en fait
(« encore », « on continue »). L'item n'est pas nommé.

**(b) Nombre de niveaux : un.** C'est le système le plus économe possible. Il part
d'un constat vérifiable : la session n'a besoin d'un nom que dans deux textes
aujourd'hui (`V7Reglages.tsx:153` et deux encouragements sur dix-huit,
`encouragements.ts:11,19`), et ces trois textes se réécrivent sans nom
(« Retaper avec quatre doigts », « Bien joué », « Encore un peu, tranquillement »).
Le reste de l'interface parle déjà de la session sans la nommer : « Encore »,
« Retour » (`V5FinDeBloc.tsx:83,89`).

**(c) Phrases exactes affichées à l'enfant.**

- Bandeau : **« Leçon 3 — Les mots de tous les jours »**
- Sous la jauge : **« Encore 2 touches à bien connaître. »**
- Énoncé de la relation : **« Cette leçon sera finie quand tu connaîtras bien ses
  7 touches. »**
- Écran de fin de session : **« Bien joué ! »** (aucun nom d'objet)

**(d) Termes du code.** `palier` → `lecon`, `bloc` (session) → `serie` — terme
interne, jamais affiché, choisi parce qu'il est libre dans le dépôt et sans
ambiguïté. `item` et `bloc` (clavier) inchangés. **Divergence assumée entre code et
interface : `serie` n'apparaît nulle part à l'écran.** Elle est explicitement le
prix de ce système.

**(e) Gains.** Le vocabulaire visible se réduit à un seul mot, celui que l'enfant
connaît déjà et qui est déjà à l'écran : rien à réapprendre pour un enfant en
cours de parcours, et zéro risque de fuite pour un niveau qui n'a pas de nom. C'est
aussi le plus petit diff d'interface des trois.

**Coûts, et ils sont sérieux.** **On ne peut pas énoncer une relation entre deux
niveaux quand l'un des deux n'a pas de nom.** La phrase (c) contourne le problème
en énonçant la relation entre la leçon et ses *touches*, ce qui est vrai mais ne
répond qu'à moitié à la demande : l'enfant apprend ce qui finit une leçon, jamais
ce dont une leçon est faite. Ensuite, l'écran de fin de session — V5, un écran
entier du produit — perd son sujet grammatical : il célèbre une chose sans nom, et
chacune de ses phrases doit être tournée pour éviter le mot manquant. Enfin le
parent perd tout moyen de dire ce que son enfant a fait aujourd'hui, et le code
garde une divergence permanente entre `serie` et le silence de l'interface,
c'est-à-dire exactement le terrain sur lequel la fuite de jargon s'est produite la
première fois.

---

### Système 3 — « Étape / Leçon / Exercice » (trois niveaux, celui de l'exemple)

**(a) Noms.** **Étape** (jeu de touches) > **leçon** (session) > **exercice**
(un mot à taper).

**(b) Nombre de niveaux : trois**, comme Typing.com (*unit > lesson > activity*) et
Ratatype (*course > lesson > exercise*), les deux seuls produits du corpus §2.1 à
avoir trois niveaux nommés.

**(c) Phrases exactes.**

- Bandeau : **« Étape 3 — Les mots de tous les jours »**
- Rangée de pastilles : **« Exercice 4 sur 10 »**
- Relation : **« Cette étape sera finie quand tu connaîtras bien ses 7 touches. »**
  et **« Une leçon, c'est dix exercices. »**

**(d) Termes du code.** `palier` → `etape`, `bloc` → `lecon`, `item` → `exercice`.
Correspondance mot à mot, aucune divergence entre code et interface.

**(e) Gains.** Totalement explicite : chaque niveau a son nom, la relation basse
(leçon → exercices) est un vrai nombre qu'on peut afficher sans mentir, puisque la
taille d'un bloc est bornée et connue à l'avance (`generator.ts:13-14`). Aligné sur
les deux produits de dactylo les plus structurés du marché.

**Coûts, et ils sont rédhibitoires.** Trois objections, chacune suffisante.
D'abord, **« Exercice 4 sur 10 » est exactement le compteur que le cahier
interdit** sur cet écran (V4 : « Aucun chiffre, aucun compteur »). Ensuite,
« exercice » est le mot le plus scolaire du champ lexical disponible, en frontal
avec la contrainte « ton non scolaire » et avec le refus du curriculum posé en tête
de cahier (l.29 : « pas d'arborescence de 300 leçons, pas de "devoir" »). Enfin, le
niveau qu'on gagne est celui dont l'enfant n'a **aucun usage** : il ne navigue
jamais vers un exercice, il ne le choisit pas, il ne le reprend pas ; il le voit
passer. Nommer un niveau que personne ne désigne, c'est ajouter du vocabulaire sans
ajouter de pouvoir d'action — et la phrase « une leçon, c'est dix exercices » est
d'ailleurs à moitié fausse, un bloc comptant de 8 à 12 items selon le tirage
(`generator.ts:13-14`).

---

### Ce que les trois ont en commun, et pourquoi ce n'est pas négociable

Les trois systèmes énoncent la relation haute **en touches, jamais en nombre de
sessions**. Ce n'est pas une coïncidence de rédaction : c'est la seule formulation
compatible avec `progression.ts` (§1.7). Afficher « 3 leçons pour finir l'étape »
supposerait de remplacer le critère de maîtrise par un quota, ce que le cahier
refuse explicitement — « Aucun quota de répétitions, aucun volume, aucun temps »
(l.227). Entre changer le modèle pédagogique pour pouvoir afficher un joli nombre,
et afficher la vérité, ce rapport tranche pour la vérité.

---

## 5. Recommandation

### 5.1 Ce qu'il faut faire

**Adopter le système 1 — « Étape / Leçon », deux niveaux nommés, l'item sans nom.**

Cinq raisons, dans l'ordre de force :

1. **Il corrige la faute réelle au moindre déplacement.** Le défaut n'est pas que
   « leçon » soit un mauvais mot, c'est qu'il désigne trois choses (§1.2). Le
   système 1 lui rend **un** sens, et c'est celui que tout le marché lui donne
   (§2.1) : ce qu'on fait en une fois. Rien n'est inventé, un mot est remis à sa
   place.
2. **Il élimine les deux termes d'implémentation de l'interface.** « Palier »
   disparaît : abstrait, marqué enseignant, périmé depuis 2016 (§3.1). « Bloc »
   disparaît de l'interface enfant tout en restant disponible là où il est juste,
   sur les pans du clavier (§1.3).
3. **Deux niveaux suffisent, et le troisième est interdit.** L'item est déjà
   représenté sans mot par les pastilles, et le cahier exige qu'il le reste sans
   chiffre. Le nommer ne servirait qu'à créer le compteur proscrit (§4, système 3).
4. **Il tient les deux bornes d'âge.** « Étape » et « leçon » sont des mots
   ordinaires : ni île ni planète, donc rien d'humiliant à 11 ans (§3.1, consensus
   NN/g – GDS – Smashing) ; rien d'abstrait ni d'administratif non plus, donc
   accessible à 7 ans — d'autant que la métaphore concrète du produit, le clavier
   qui se colore, continue de porter le sens visuel (§3.3).
5. **Il rend le code traduisible mot à mot.** `etape` → « étape », `lecon` →
   « leçon ». C'est structurellement ce qui empêche une prochaine fuite : le jargon
   ne fuit que quand le code et l'écran parlent deux langues.

**Ce que la recommandation coûte, dit franchement.** Le mot « leçon » change de
sens pour les enfants déjà en cours de parcours ; le renommage touche deux champs
persistés et le code de fusion multi-appareil ; et il doit être fait à la main,
pas au `sed`, à cause du double sens de `bloc`. Ces coûts sont réels et ils sont
payés une fois.

**Divergences assumées entre le mot du code et le mot de l'écran** — à énoncer
explicitement comme demandé :

- `item` **n'a délibérément aucun équivalent affiché**. C'est le seul niveau où
  code et interface divergent, et c'est voulu (cahier V4, interdiction du compteur).
- `bloc` **reste dans le code au sens « pan de clavier »** et n'est jamais affiché
  sous ce nom non plus (l'écran dit « main gauche », « main droite », « la
  frontière » — cahier V3).
- Les titres d'étapes (`paliers.ts:18-77`) restent la forme longue affichée sur la
  carte ; le numéro n'est là que pour se repérer.

### 5.2 Table de correspondance

| Terme actuel | UI enfant | UI parent | Code |
|---|---|---|---|
| `palier` (jeu de touches) | **étape** | **étape** | `etape` |
| « Leçon {n} sur 7 » (`V4Lecon.tsx:256`) | **« Étape {n} — {titre} »** | — | — |
| « leçon {n} » (`V7Reglages.tsx:60`) | — | **« étape {n} »** | — |
| « palier {n} » (`V9Compte.tsx:197`) | — | **« étape {n} »** | — |
| `bloc` (session 8-12 items) | **leçon** | **leçon** | `lecon` |
| « Bloc {n} de cette leçon » (`V4Lecon.tsx:272`) | **« Leçon {n} de cette étape »** | — | — |
| « {n} blocs finis sur 6 » (`V4Lecon.tsx:239`) | **supprimé** (fuite du plafond, §1.6.3) | — | — |
| « Bloc terminé, bravo » (`encouragements.ts:11`) | **« Leçon finie, bravo »** | — | — |
| « Encore un bloc, tranquillement » (`encouragements.ts:19`) | **« Encore une leçon, tranquillement »** | — | — |
| « Refaire une leçon à quatre doigts » (`V7Reglages.tsx:153`) | **« Refaire une leçon à quatre doigts »** *(inchangé, et désormais exact)* | — | — |
| `item` (mot, nombre, syllabe) | *jamais nommé* | *jamais nommé* | `item` |
| `bloc` (pan de clavier) | « main gauche / main droite / la frontière » | — | `bloc` *(inchangé)* |
| `liste` (mots du parent) | **liste** *(inchangé — hors hiérarchie)* | **liste** | `liste` |

Renommages de code induits, non exhaustifs mais suffisants pour cadrer l'effort :
`PALIERS` → `ETAPES`, `PALIER_MAX` → `ETAPE_MAX`, `PALIER_MAX_DEBUTANT`,
`PALIER_MAJUSCULES`, `palierFranchi` → `etapeFranchie`, `avancementPalier`,
`palierOuvert`, `blocsSurPalier` → `leconsSurEtape`, `BLOCS_DISTINCTS_REQUIS` →
`LECONS_DISTINCTES_REQUISES`, `PLAFOND_BLOCS` → `PLAFOND_LECONS`, `BilanBloc` →
`BilanLecon`, `composerBloc` → `composerLecon`, `composerBlocDeListe`,
`TAILLE_BLOC_MIN/MAX`, `blocsConsecutifs`, `etoilesDuBloc`, `itemsDuBloc`,
`V5FinDeBloc` → `V5FinDeLecon`, `BLOC_MAX`, plus les champs persistés `palier` et
`bloc` de `Sauvegarde` (`storage.ts:16-26`) et leur fusion (`fusion.ts:34`).
`V4Lecon.tsx` et `src/core/lecon.ts` **gardent leur nom**, qui devient exact.

### 5.3 Trois corrections à faire au passage, indépendantes du nommage

Elles sont sorties de l'inventaire et survivraient à n'importe quel choix
lexical ; les laisser en place annulerait une partie du bénéfice.

1. **Retirer « {n} blocs finis sur 6 »** (`V4Lecon.tsx:234-239,266`). Ce texte
   révèle le plafond anti-mur que `progression.ts:9` et le cahier (l.228)
   demandent de garder silencieux. Il faut ne garder que la formulation en touches,
   et laisser la jauge suivre le chemin le plus avancé sans le nommer.
2. **Résoudre le « sur 7 » contre les dix lignes de la carte** (§1.6.2). Soit le
   bandeau cesse d'annoncer un total — « Étape 3 » suffit —, soit V6 sépare
   visuellement les sept étapes du parcours des trois qui viendront plus tard.
   La première option est la moins coûteuse et la plus honnête.
3. **Renommer `docs/BIBLIOTHEQUE-LECONS.md`** en bibliothèque de **listes** (§1.6.5) :
   son propre contenu emploie « liste » partout, et une liste n'appartient pas à la
   hiérarchie de progression puisqu'elle ne la fait pas avancer
   (`V9Compte.tsx:398`). Aligner aussi le titre de V6 entre le cahier (« Ta carte du
   clavier ») et le code (« Ma carte du clavier ») — le code a raison.

---

## 6. Limites de ce rapport

- **La phrase de relation affichée est très peu documentée dans l'état de l'art.**
  Sur les dix-neuf produits examinés, un seul énoncé verbatim a pu être relevé
  (Mathéros, les quatre étapes nommées). La recommandation du §5 s'appuie donc sur
  la **convergence des noms de niveaux**, solide, et non sur une pratique établie
  de formulation de la relation, qui n'existe pas.
- **Aucune donnée directe sur la compréhension des mots précis** en jeu par des
  enfants francophones de 7 et 11 ans (§3.2). Le choix « étape / leçon » est une
  hypothèse de conception défendable, pas une conclusion validée par la recherche.
  Il est testable en dix minutes avec deux enfants de la cible ; ce test vaut mieux
  que ce rapport sur ce point précis.
- **Deux produits demandés n'ont pas été trouvés** (Dactylotest / Dactylo-jeu,
  AZERTYclic) et deux autres n'ont pas pu être lus (TypingClub, Keybr : rendus en
  JS, centre d'aide en 403). Rien n'a été supposé à leur place.
- **Le chiffrage du renommage n'a pas été fait.** Les volumétries du §1.1 mesurent
  des occurrences textuelles, pas un effort ; la migration des champs persistés est
  identifiée mais non conçue.

RAPPORT T5 TERMINÉ
