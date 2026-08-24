# État de l'art — applications d'apprentissage de la frappe pour enfants

## Note de fiabilité
Les fiches ci-dessous croisent la documentation officielle, les revues Common Sense Media/Education et des comparatifs indépendants. Trois points n'ont **pas** pu être vérifiés en source primaire (403 ou pages JS) et sont marqués `[non vérifié]` : la gestion des layouts non-QWERTY par TypingClub, l'affichage clavier de typ.ing, la couverture réelle du suisse romand par Tap'Touche.

---

## 1. Anglophones grand public

### TypingClub
- **Public** : 5–18 ans, très implanté en école primaire US.
- **Doigt indiqué** : clavier virtuel permanent + **mains animées** sous le clavier, la main/doigt concerné bouge et la touche s'allume. C'est le dispositif le plus lisible du marché pour un enfant non-lecteur autonome.
- **Clavier à l'écran** : oui, toujours visible, désactivable plus tard.
- **Layouts** : QWERTY par défaut ; support AZERTY/QWERTZ `[non vérifié]`, et l'interface/le contenu restent anglophones dans la version gratuite.
- **Gamification** : étoiles (1 à 5) par leçon, carte de progression, vidéos, mini-jeux. Pas de classement social imposé.
- **Marche** : les étoiles par leçon = feedback fini, non comparatif. Les mains animées suppriment le besoin de lire une consigne.
- **Échoue** : arborescence de centaines de leçons → effet « devoir » ; l'étoile perdue pour 1 % de précision est vécue comme une punition par les 7–9 ans.

### Typing.com
- **Public** : 8+ affiché, mais les revues convergent : **sous 8 ans les enfants décrochent** — c'est un curriculum, pas un jeu.
- **Doigt indiqué** : clavier virtuel + surlignage de la touche ; guidage doigt plus discret que TypingClub.
- **Gamification** : badges, étoiles, XP, jeux séparés. Publicité présente en version gratuite (bruit visuel majeur pour un enfant).
- **Échoue** : densité textuelle, ton scolaire, coupure nette entre « leçon » et « jeu » — l'enfant ne veut faire que le jeu.

### Nitro Type
- **Public** : 10+ de fait. Course multijoueur temps réel, chat, monnaie virtuelle, voitures à collectionner.
- **Doigt indiqué** : **aucun**. Pas de clavier à l'écran, pas de pédagogie. C'est de la fluidité, pas de l'apprentissage.
- **Gamification** : purement compétitive et sociale.
- **Marche** : motivation extrême chez les 10–12 ans déjà fluides.
- **Échoue** : renforce le hunt-and-peck (l'enfant optimise la vitesse, pas la technique) ; comportements compétitifs malsains signalés ; hors cadre pour un projet non compétitif.

### Dance Mat Typing (BBC)
- **Public** : 7–11 ans — la référence historique de la tranche visée.
- **Doigt indiqué** : professeurs animaux animés + **mains cartoon à l'écran**, narration audio qui dit quel doigt utiliser. Zéro lecture requise.
- **Clavier** : oui, permanent, avec zones de doigts colorées.
- **Progression** : 12 étapes, rangée de repos → rangée du haut → rangée du bas. Séquence validée par des ergothérapeutes.
- **Gamification** : chansons, personnages, récompense à chaque étape. Aucun score, aucun chrono. **Le modèle le plus proche du cadrage demandé.**
- **Échoue** : mort avec Flash (les versions actuelles sont des clones tiers) ; QWERTY uniquement ; graphismes datés ; « rote repetition » sans remédiation pour l'enfant qui bloque ; ton parfois trop bébé pour un 11–12 ans.

---

## 2. Outils adultes / « minimalistes » (références visuelles du projet)

### Keybr
- **Public** : ados/adultes autonomes.
- **Cœur** : algorithme d'introduction progressive des lettres — on ne débloque une nouvelle lettre qu'après avoir atteint un seuil de vitesse/précision sur les précédentes ; génération de pseudo-mots prononçables pour casser l'anticipation lexicale.
- **Clavier à l'écran** : optionnel, avec surlignage doigt par couleur.
- **Layouts** : multiples, sélection manuelle.
- **Marche pour un enfant** : le principe « une lettre à la fois, débloquée par la maîtrise » est **le meilleur moteur de progression du panel** et se transpose directement.
- **Échoue** : pseudo-mots = non-sens pour un enfant de 7 ans qui apprend encore à lire ; graphiques de performance anxiogènes ; aucune récompense affective.

### Monkeytype
- **Public** : adultes/enthousiastes.
- **Doigt indiqué** : aucun guidage doigt. Keymap optionnel purement visuel.
- **Layouts** : très bonne couverture (AZERTY, `azerty_AFNOR`, gestion des touches mortes et des couches Alt documentée), avec mode « émulation de layout ». **Référence technique sur la question layouts/accents.**
- **Gamification** : aucune, sauf WPM. Contre-modèle direct pour un enfant.

### typ.ing
- **Public** : adultes, positionné « propre, simple, qui se soucie de ce que tu ressens » — pas de chrono agressif, pas de leaderboard. C'est le ton, plus que la pédagogie, qui sert de référence.
- Détail clavier/doigts `[non vérifié]`.

---

## 3. Outils installés / classiques

### Tap'Touche (Druide, Québec)
- Contenu intégralement bilingue FR/EN, édition scolaire avec gestion de classes. Clavier à l'écran, doigts colorés, exercices + jeux.
- Support suisse romand `[non vérifié]` — le produit est calibré Canada/France d'abord.
- **Échoue** : payant, lourd, orienté scolaire/adulte ; vocabulaire québécois par endroits.

### Ratatype
- Affiche le layout du clavier, apprend les bons doigts, **cours dédiés par layout** (dont un parcours *French AZERTY* de 19 leçons). Tests + tableaux de scores pour enseignants.
- **Échoue** : scoreboards et certificats = compétition explicite ; UI adulte.

### Klavaro (open source)
- Leçons structurées, **layouts entièrement personnalisables** (AZERTY, QWERTZ, Dvorak, Colemak, Neo), multilingue, zéro pub/tracking.
- **Marche** : la modélisation « layout = donnée éditable » est la bonne abstraction.
- **Échoue** : UI austère, aucune gamification, aucun appui affectif.

### Typesy
- Adaptatif, suivi individuel, contenus au-delà de la vitesse pure. Payant, orienté famille/école US, QWERTY.

### RapidTyping
- Windows uniquement, mais couverture layouts la plus large citée (QWERTY, Dvorak, BÉPO, QWERTZ, AZERTY, Colemak) et clavier virtuel avec doigts colorés.

---

## 4. Francophones — le segment le plus proche du besoin

### Fort-Dactylo (fort-dactylo.com)
- **Le concurrent le plus pertinent.** Créé par un père pour son fils dys, gratuit, sans pub, sans collecte de données.
- 30+ niveaux, de 4 touches de la rangée de repos jusqu'aux phrases ; **vitesse adaptative temps réel** ; **détection automatique du clavier AZERTY/QWERTY/QWERTZ** ; police OpenDyslexic, dictée audio, mode aveugle ; profils multiples ; rapports PDF pour orthophonistes.
- Format shoot'em up. Dès 6–7 ans.
- **Limite** : la boucle « tirer sur les lettres » privilégie la réactivité à la posture des doigts ; la version web n'est plus maintenue (l'officielle est une extension Chrome).

### ClaviGo / ClaviHERO (dysclick.fr)
- ClaviGo = cours progressifs AZERTY + test de frappe + stats. **Le clavier virtuel s'estompe progressivement** au fil de la progression pour sevrer le regard — mécanique de fading explicite, rare et excellente.
- ClaviHERO = jeu de rythme (les lettres tombent dans des colonnes colorées), combos, score, 32 niveaux, 7 univers. **Les couleurs des colonnes encodent le doigt.**
- **Limite** : score et combos = compétition contre soi, à neutraliser dans notre cadre ; AZERTY France uniquement.

### Dactylocours
- 27 leçons guidées, **quatre claviers : français, belge, canadien, suisse**. Le seul du panel à traiter le suisse romand comme un layout de premier rang. UI très scolaire.

### Autres
- **Dactylo Zoo** (Microsoft Store) : AZERTY / QWERTY-CA / QWERTZ-CH / BÉPO, univers animalier enfant.
- **Typing Study** : version fr-swiss_french dédiée, clavier à l'écran, gratuit, mais interface générique traduite.
- **Tapotons** : progression AZERTY sobre, stats de frappe, pas de gamification.

---

## 5. Cinq enseignements actionnables

1. **Le guidage doigt qui fonctionne à 7 ans est visuel + sonore, jamais textuel.** Dance Mat et TypingClub gagnent par des mains animées qui *montrent* le doigt ; tous les outils qui écrivent « utilisez l'annulaire gauche » perdent l'enfant. Notre indication du doigt doit être une main schématique animée + un code couleur cohérent entre le doigt, la touche et le caractère affiché — le même code partout, appris une fois.

2. **Le clavier à l'écran doit s'estomper, pas disparaître d'un coup.** ClaviGo est le seul à en faire un curseur de progression. Prévoir dès le MVP un état « aide forte → aide partielle → aide à la demande », piloté par la réussite et non par un réglage caché.

3. **Le layout est une donnée, pas une variante de code.** Klavaro, RapidTyping, Fort-Dactylo et Monkeytype traitent tous le layout comme une table déclarative — c'est ce qui leur permet de couvrir AZERTY et QWERTZ sans dupliquer la pédagogie. La détection automatique (Fort-Dactylo) doublée d'un sélecteur manuel est le comportement attendu par les utilisateurs. Corollaire : les **touches mortes** (accents circonflexe/tréma) doivent être modélisées explicitement dès le départ — Monkeytype documente ce cas, presque aucun outil enfant ne le traite, et c'est incontournable en français.

4. **La progression par déverrouillage de lettres bat la liste de leçons.** Le mécanisme de Keybr — une nouvelle lettre s'ouvre quand les précédentes sont maîtrisées — donne un sentiment de gain continu sans score. Transposé à notre contrainte 4 doigts : le mode débutant est exactement une restriction de l'ensemble de lettres actives aux zones pouces + index, et le passage aux autres doigts devient un déverrouillage célébré, pas un changement de menu.

5. **Le contenu doit être du vrai français lisible dès le premier exercice.** Keybr échoue avec les enfants à cause des pseudo-mots ; Dance Mat réussit parce qu'on tape « sad », « lad » et que ça veut dire quelque chose. Syllabes puis vrais mots courts adaptés 7–12 ans, en s'appuyant sur la fréquence des lettres en français (e, s, a, i, n, t, r) plutôt que sur la rangée de repos QWERTY importée telle quelle.

---

## 6. Trois erreurs de conception à ne PAS reproduire

1. **La compétition déguisée en motivation** (Nitro Type, scoreboards Ratatype, combos ClaviHERO). Le classement et le WPM affiché font optimiser la vitesse au détriment de la technique : l'enfant revient au hunt-and-peck parce que c'est plus rapide *tout de suite*. La conséquence documentée est double — mauvaise habitude verrouillée, et stress compétitif. Aucun nombre comparable ne doit apparaître à l'écran.

2. **La punition déguisée en récompense.** L'étoile retirée pour une erreur (TypingClub) et l'échec de niveau transforment le feedback en sanction. Corollaire : ne jamais bloquer sur une erreur sans remédiation — le reproche récurrent fait à Dance Mat est qu'« en dehors de la répétition mécanique, il n'y a rien pour l'élève en difficulté ». Une erreur doit déclencher une aide (remontrer le doigt, ralentir, répéter la même lettre), pas une perte.

3. **La charge de lecture et le bruit visuel.** Les revues Common Sense reviennent systématiquement sur trois défauts : texte trop petit ou trop dense, graphismes datés, publicités (Typing.com gratuit). Un enfant de 7 ans qui apprend encore à lire ne doit avoir à décoder qu'**une seule chose à l'écran : le caractère à taper**. Tout le reste — consigne, encouragement, correction — passe par l'image, la couleur et l'audio.

---

**Sources principales :**
[Common Sense Media — Dance Mat Typing](https://www.commonsensemedia.org/website-reviews/dance-mat-typing) · [Fort-Dactylo](https://fort-dactylo.com/) · [ClaviHERO / ClaviGo — dysclick](https://dysclick.fr/clavihero/) · [Dactylocours](https://www.dactylocours.com/) · [Ratatype — cours French AZERTY](https://www.ratatype.com/courses/french/) · [Klavaro](https://klavaro.org/) · [Monkeytype — Keyboard Layouts (DeepWiki)](https://deepwiki.com/monkeytypegame/monkeytype/4.3-keyboard-layouts) · [Keybr — Educational App Store](https://www.educationalappstore.com/website/keybr) · [Typing.com — Learning Standard review](https://thelearningstandard.org/apps/typing-com) · [Nitro Type — Modulo review](https://www.modulo.app/all-resources/nitro-type-review) · [Tap'Touche](https://www.taptouche.com/fr/) · [Typing Study fr-suisse romand](https://www.typingstudy.com/fr-swiss_french-2/) · [RapidTyping](https://rapidtyping.com/) · [Outils Tice — 9 outils gratuits pour la classe](https://outilstice.com/meilleurs-outils-pour-apprendre-a-taper-au-clavier/) · [Learning.com — When should children start keyboarding](https://www.learning.com/blog/when-should-children-start-learning-keyboarding/) · [Improvement in children's fine motor skills following a computerized typing intervention (PubMed)](https://pubmed.ncbi.nlm.nih.gov/29096181/)