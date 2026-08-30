# T1 — Audit du POC : la progression pédagogique réellement implémentée

Audit en lecture seule, 2026-08-29. Périmètre : la progression (paliers, critère
de passage, composition d'un bloc, corpus), confrontée à `CAHIER-DES-CHARGES.md`
(§4.2, 4.3, 4.4, 4.5, 4.7, V4, V5, V6) et à `recherche/07-verdicts.md`.
Toute affirmation porte sa référence `fichier:ligne`. Les chiffres de corpus sont
dérivés en exécutant les fonctions du code (`motsDisponibles`, `composerBloc`,
`couvertureCible`) sur 30 blocs par palier et par disposition.

---

## 1. La progression réellement codée

### 1.1 Les paliers

Déclarés une fois, en dur, dans `src/core/paliers.ts:15-79`. Dix entrées, deux
constantes de bornage : `PALIER_MAX = 7` (`paliers.ts:82`) et
`PALIER_MAX_DEBUTANT = 6` (`paliers.ts:84`).

| Palier | Titre (`paliers.ts`) | Nouvelles touches FR-FR | Nouvelles touches CH-FR |
|---|---|---|---|
| 1 | « Tes deux index et tes deux pouces » (l.18) | `e f j n s t u` + espace (l.20) | idem + `4 5 6 7` (l.20) |
| 2 | « Les voyelles qui manquaient » (l.24) | `a i r v` (l.26) | idem + `2 3 8 9` (l.26) |
| 3 | « Les mots de tous les jours » (l.30) | `o l d b m` (l.32) | idem + `1 0` (l.32) |
| 4 | « Les animaux et le chocolat » (l.36) | `g h p c` (l.38) | idem (l.38) |
| 5 | « Les accents » (l.42) | `é è à ç` (l.44) | `é è à` (l.44) |
| 6 | « Les lettres rares » (l.48) | `q w x y z ù` (l.50) | `q w x y z` (l.50) |
| 7 | « Ton petit doigt tient la touche Majuscule » (l.54) | `. 0 1 2 3 4 5 6 7 8 9` (l.56) | `. ç` (l.56) |
| 8 | « Les majeurs viennent aider tes index » (l.60) | `[]` (l.62), `verrouille: true` (l.63) | `[]` |
| 9 | « Les annulaires » (l.67) | `[]` (l.69), verrouillé (l.70) | `[]` |
| 10 | « Les auriculaires prennent leurs lettres » (l.74) | `[]` (l.76), verrouillé (l.77) | `[]` |

L'ensemble jouable est **cumulé** : `ensembleTouches` empile toutes les touches
des paliers ≤ n (`paliers.ts:101-114`). Au palier ≥ 7, les capitales ASCII des
lettres déjà acquises sont ajoutées automatiquement (`paliers.ts:110-112`) — les
capitales accentuées sont exclues par construction (test `paliers.test.ts:18`).

L'ordre et le découpage des touches sont **conformes au cahier §4.3 (l.207-214)**,
disposition par disposition, y compris le report du `ç` suisse au palier 7
(cahier l.213 / `paliers.ts:44,56`) et l'absence de `ù` en CH-FR (cahier l.298 /
`paliers.ts:50`, test `corpus.test.ts:107`).

### 1.2 Critère de passage et plafond

`src/core/progression.ts` :

- `OCCURRENCES_REQUISES = 3` (l.7), `BLOCS_DISTINCTS_REQUIS = 2` (l.8) — une
  touche est maîtrisée si elle a été tapée proprement 3 fois réparties sur ≥ 2
  blocs (`estMaitrisee`, l.22-25).
- « Proprement » = `estPropre` : `erreurs === 0 && atteint <= 1`
  (`src/core/aide.ts:73-75`). Or le barreau 2 se déclenche **aussi** sur 3 s
  d'inactivité (`aide.ts:13,40`). Une frappe hésitante de plus de 3 secondes ne
  compte donc jamais pour la maîtrise.
- L'espace n'est jamais un critère (`progression.ts:18`, `paliers.ts:133-135`).
- `palierFranchi` (l.32-41) : plafond anti-mur à `PLAFOND_BLOCS = 6` (l.10)
  évalué **avant** la maîtrise (l.39) ; au palier 7 la fonction renvoie toujours
  `false` (l.38) — le parcours s'arrête là.
- L'évaluation se fait à la fin de chaque bloc, dans `state.tsx:140-166` :
  occurrences notées (l.142), `blocsSurPalier` incrémenté (l.147), palier
  incrémenté si franchi (l.155), compteur de blocs remis à 0 (l.154).

Conforme au cahier §4.3 (l.227-228). La maîtrise n'est **jamais** remise en
cause : `noterOccurrence` n'ajoute que des occurrences (`progression.ts:17-20`),
aucune décroissance, aucun re-test.

### 1.3 Composition d'un bloc

`src/core/generator.ts:149-296`.

1. Taille : `TAILLE_BLOC_MIN = 8`, `TAILLE_BLOC_MAX = 12` (l.13-14), tirée au
   hasard dans l'intervalle (l.151-153). Mesuré : **9,8 items/bloc en moyenne**
   sur 30 graines, toutes dispositions et paliers confondus.
2. Réinjection des items aidés, au plus `floor(taille/3)` soit 3 items (l.176),
   filtrés sur l'ensemble du palier (l.177).
3. Couverture gloutonne des touches du palier : chaque touche à valider doit
   apparaître `COUVERTURE_MIN = 2` fois (l.28), ou moins si le corpus ne le
   permet pas (`couvertureCible`, l.96-107). Le score d'un candidat privilégie
   les touches jamais servies dans le bloc (`premieres * 100 + suite`, l.196-206).
4. Remplissage par préférence stricte (l.228-237) : mots du palier courant →
   phrases capitalisées → mots des paliers précédents → nombres → syllabes.
5. Mélange (l.240), puis planchers imposés : `QUOTA_NOMBRES = 2` aux positions
   fixes 3 et 7 (l.16-18, 260) et `QUOTA_PHRASES = 2` aux positions 2 et 6
   (l.20-21, 263) au palier de la Maj.
6. Retaille par la fin en protégeant les porteurs de couverture (l.268-294).

Le générateur ne peut jamais produire un caractère hors ensemble : tous les
viviers sont filtrés en amont par `ensembleTouches` (`corpus.ts:107-110,119-127`),
et le test `generator.test.ts:18` le vérifie. Conforme à P5.

**Exception assumée** : un bloc de liste perso (`composerBlocDeListe`, l.133-147)
ignore totalement le palier ; le seul critère est « la disposition sait écrire ce
caractère » (l.129-131, commentaire l.139-142).

### 1.4 Taille réelle du corpus, par palier

`src/core/corpus.ts:10-68` : 322 entrées brutes, **321 items après
dédoublonnage** (`CORPUS`, l.100), dont **35 items multi-mots** (« un jus »,
« le lion dort », « je mange une pomme »). 18 syllabes (`SYLLABES`, l.92-95).
Table d'accentuation de 50 entrées (`ACCENTUES`, l.75-89).

Mots typables (cumulés) et occurrences réelles des touches du palier :

| Palier | FR-FR : mots dispo. / nouveaux | CH-FR : mots dispo. / nouveaux | Touche la plus pauvre du palier (occurrences dans tout le corpus dispo.) |
|---|---|---|---|
| 1 | 40 / 40 | 40 / 40 | `f` : **2 occurrences**, dans *fut* et *neuf* |
| 2 | 86 / 46 | 86 / 46 | `v` : 24 occ. / 23 mots |
| 3 | 161 / 75 | 161 / 75 | `d` : 25 occ. |
| 4 | 232 / 71 | 232 / 71 | `h` : 22 occ. |
| 5 | 276 / 44 | 272 / 40 | `à` : **2 occurrences** (*déjà*, *voilà*) ; `ç` : 4 |
| 6 | 321 / 45 | 316 / 44 | `ù` : **1 occurrence** (*où*) ; `w` : 3 ; `x` : 4 |
| 7 | 321 / 0 | 320 / 4 | FR-FR : `.` et les 10 chiffres → **0 occurrence dans le corpus de mots** |

Conséquence directe, mesurée sur 30 blocs par palier :

| Bloc type | mots | nombres | syllabes | items servis dans 30/30 blocs |
|---|---|---|---|---|
| FR-FR P1 | 9,8 | 0 | 0 | *neuf*, *fut*, *un sujet* |
| FR-FR P5 | 9,8 | 0 | 0 | *élève*, *voilà*, *déjà* |
| FR-FR P6 | 9,8 | 0 | 0 | *où* |
| FR-FR P7 | **3,0** | **6,8** | 0 | — (aucun mot en minuscules) |
| CH-FR P1 | 6,8 | 3,0 | 0 | *un sujet*, *fut*, *neuf* |
| CH-FR P7 | 7,8 | 2,0 | 0 | *façon*, *garçon*, *français* (≥ 21/30) |

Les **syllabes ne sont jamais servies** : 0,0 par bloc sur tous les paliers et
les deux dispositions. Le corpus de mots est partout assez fourni pour les
évincer (préférence l.228-237).

Les nombres sont toutes les combinaisons de 1 à 3 chiffres ouverts
(`nombresDisponibles`, l.51-63) : sur 10 chiffres ouverts, 1000 valeurs dont
**900 à trois chiffres**. Ce sont donc, à 90 %, des nombres à 3 chiffres tirés
au hasard (blocs témoins : `654`, `757`, `491`, `908`).

---

## 2. Écarts spec ↔ code

### 2.1 Ce que le cahier promet et qui n'existe pas

1. **Le « mode 4 doigts » n'existe pas comme mode.** Il n'y a qu'un booléen
   dérivé du palier : `const debutant = app.palier <= PALIER_MAX_DEBUTANT`
   (`V4Lecon.tsx:41`). Aucun réglage, aucun état persisté (`storage.ts:9-13,15-26`).
2. **Le repli du sas depuis les réglages (cahier l.240) est un leurre.** Le lien
   « Refaire une leçon à quatre doigts » (`V7Reglages.tsx:152-154`) envoie
   `{type:'vue', vue:'V4'}` ; l'action `vue` ne touche ni `palier` ni
   `listeJouee` (`state.tsx:73-79`). Au palier 7, ce bouton lance donc une leçon
   de palier 7 — avec Maj et chiffres — et, si une liste perso était en cours,
   il rejoue cette liste.
3. **La réinjection « espacée » (cahier l.230) n'est pas espacée.** `aReinjecter`
   est écrasé à chaque bloc par le seul bilan du bloc qui vient de finir
   (`state.tsx:160`), et vidé après un bloc de liste (`state.tsx:135`). Un item
   raté au bloc N est proposé au bloc N+1 puis oublié définitivement. Aucun
   mécanisme de répétition à intervalle croissant n'existe dans le dépôt.
4. **Le palier 7 ne dit jamais « ton petit doigt ».** Son titre l'annonce
   (`paliers.ts:54`) mais la consigne affichée reste de niveau main : « Tiens la
   touche Maj avec ta **main gauche/droite** » (`V4Lecon.tsx:374-375`), et le
   guide-doigt n'a que quatre états index/pouce (`doigts.ts:9-16`), calculés sans
   jamais sortir de `index_gauche | index_droit | pouce_*` (`V4Lecon.tsx:89-96`).
   L'auriculaire, objet du palier, n'est nommé nulle part dans l'écran de jeu.
5. **La bande basse à quatre pastilles photographiques de l'addendum du
   commanditaire (cahier l.702-717) a été supprimée.** Le commentaire de
   `doigts.ts:4-8` l'acte : « Vivaient dans `ui/FingerBar` avec la bande de
   photographies. Celle-ci a été retirée ». L'écran a deux mains schématiques qui
   encadrent le clavier (`V4Lecon.tsx:392-421`) plus un mot « GAUCHE »/« DROITE »
   (l.383-387). L'addendum annulait explicitement le verdict inverse du jury.
6. **Le bandeau des touches ne ressemble pas au wireframe V4 (cahier l.458,
   l.470).** Le cahier montre « e f j n s t u espace » ;
   `libellesEnsemble` rend l'ensemble **cumulé**, en capitales, espace exclu
   (`paliers.ts:122-130`, affiché `V4Lecon.tsx:269`) : 27 signes au palier 6,
   ~38 au palier 7.
7. **Paliers 8, 9, 10 : dessinés et nommés (`V6Carte.tsx:52-76`), mais leurs
   touches promises par le cahier (l.223-225 : `e d c`/`i k ,`, `z s x`/`o l .`,
   `a q w`/`p m ù !`) sont absentes** — `nouvelles: {'fr-FR': [], 'fr-CH': []}`
   (`paliers.ts:62,69,76`). V6 n'affiche donc qu'un titre et une promesse, jamais
   « ce qu'il ouvre » en touches, contrairement au wireframe (cahier l.563).

### 2.2 Ce qui existe et n'est pas spécifié

1. **Des compteurs, en toutes lettres, sur l'écran de jeu**, alors que le cahier
   V4 (l.459, l.466) interdit « aucun chiffre, aucun compteur » et « toute barre
   de progression latérale », et que V6 (l.541) interdit « aucun pourcentage » :
   - « Leçon {palier} sur 7 » (`V4Lecon.tsx:255-257`) ;
   - une jauge de progression du palier (`V4Lecon.tsx:258-265`, alimentée par
     `avancementPalier`, `progression.ts:63-84`) ;
   - le détail chiffré « {n} touches sur {m} » ou « {n} blocs finis sur 6 »
     (`V4Lecon.tsx:234-239, 266`) ;
   - « Bloc {n} de cette leçon » (`V4Lecon.tsx:272`).
   Le commentaire l.250-253 assume la déviation ; elle n'est tracée nulle part
   dans le cahier ni dans `recherche/`.
2. **Des phrases dans le corpus.** Le cahier interdit les « phrases complètes »
   (l.321, §6 l.622) et n'admet que mots, nombres et syllabes (l.309-311). Le
   corpus contient 35 items multi-mots dont des phrases sujet + verbe : *le lion
   dort*, *papa chante*, *je mange une pomme*, *la glace au chocolat*
   (`corpus.ts:35-36,48-49,58,67`). Le test `corpus.test.ts:75-90` les autorise
   explicitement (« depuis la demande du 2026-08-28, PETITES PHRASES »), sans
   trace de cette demande dans `CAHIER-DES-CHARGES.md` ni dans `docs/`.
3. **Des phrases fabriquées par le générateur au palier 7** : `phrasesDisponibles`
   capitalise un mot du corpus et lui colle un point — « Ravi. », « Lune. »,
   « Pyjama. » (`generator.ts:70-77`), avec un plancher de 2 par bloc
   (`generator.ts:20-21,263`). Ce contenu n'est ni un mot du corpus, ni un
   nombre, ni une syllabe : c'est une quatrième catégorie non prévue par §4.7.
4. **Multi-profils et comptes** (`V0Profils.tsx`, `V9Compte.tsx`,
   `src/core/profils.ts`), explicitement hors MVP (cahier l.615). Décidés hors
   cahier dans `docs/COMPTES-ET-DEPLOIEMENT.md:3` et
   `docs/BIBLIOTHEQUE-LECONS.md:1-9`.
5. **Bibliothèque de listes perso** (`src/core/listes.ts`, `generator.ts:133-147`).
   Un bloc de liste sert des caractères hors ensemble du palier, ce que P5
   (cahier l.128, l.322) interdit sans exception ; le clavier allume alors les
   touches non enseignées (`V4Lecon.tsx:58-62`). Tracé dans
   `docs/BIBLIOTHEQUE-LECONS.md`, jamais dans le cahier.
6. **Un titre « Leçon N débloquée ! » et un bouton « Commencer la leçon N » en
   V5** (`V5FinDeBloc.tsx:51,58-60,83`), là où le cahier ne prévoit que
   « Encore » et « Retour » (l.504).

### 2.3 Conforme, vérifié

Ordre et contenu des paliers 1-7 par disposition ; blocage strict et échelle
d'aide à 3 barreaux terminale (`aide.ts:36-48`) ; latence 0/0,8/1,5/2,5 s
(`aide.ts:10`) plafonnée à 0 en débutant (`aide.ts:66`) ; piège Maj
contralatéral (`lecon.ts:79-86`, `V4Lecon.tsx:166-168`) ; bascule V2 après 5
frappes incohérentes ou 3 items saturés (`V4Lecon.tsx:194-200`) ; bandeau
Verr.Maj (`V4Lecon.tsx:293-307`) ; « Je tape sans regarder » réarmé au mot
suivant (`lecon.ts:242-244`) ; 18 encouragements en rotation sans répétition
immédiate (`encouragements.ts:6-31`) ; proposition de pause au 4ᵉ bloc
consécutif (`V5FinDeBloc.tsx:33`) ; une étoile par item, jamais retirée
(`lecon.ts:209-217`).

---

## 3. Les trous béants

1. **Paliers 8, 9, 10 : coquilles vides.** Aucune touche (`paliers.ts:62,69,76`),
   et `palierFranchi` renvoie `false` dès le palier 7 (`progression.ts:38`) : ils
   sont structurellement inatteignables. Assumé par le cahier §6 (l.618).
2. **Aucune subdivision des doigts nulle part.** `Doigt` n'a que 4 valeurs
   (`doigts.ts:9`). Le « mode complet » de P1 (cahier l.80 : « le mode complet ne
   fait que subdiviser ces teintes ») n'a aucun embryon dans le dépôt.
3. **Le mode 4 doigts n'a pas de sortie ni de porte de retour** (cf. §2.1-1 et
   §2.1-2). Le cahier §4.4 (l.240) en fait pourtant le garde-fou n°1 du risque
   §7.1.
4. **Réinjection espacée : inexistante** (§2.1-3).
5. **Fin de parcours : rien.** Au palier 7, `avancementPalier` renvoie
   `part: 1, chemin: 'dernier'` en permanence (`progression.ts:71-75`), affiché
   « dernière leçon » (`V4Lecon.tsx:236`). L'enfant reste à vie sur un palier
   dont les blocs sont à 70 % des nombres à trois chiffres tirés au hasard
   (mesure §1.4). Aucun écran, aucun contenu, aucun message ne traite ce point.
6. **Aucune instrumentation.** Le cahier §7.1 (l.640) demande d'observer « le
   nombre de blocs réellement consommés pour franchir les paliers 1 à 6 » et
   §7.6 (l.678) « la fréquence de déclenchement du barreau 3 » avec un seuil
   d'alerte à 1 lettre sur 5. Rien n'est compté, rien n'est remonté : `Sauvegarde`
   ne contient ni historique de blocs ni compteur de barreau 3
   (`storage.ts:15-26`). Les deux garde-fous d'observation du cahier sont
   inapplicables en l'état.

---

## 4. Fragilités pédagogiques du découpage actuel

Chaque point est mesuré ou tiré du code, pas d'une intuition.

### 4.1 Le critère de maîtrise est inopérant pour le public visé — ou trivial

Deux régimes, rien entre les deux.

- **Enfant qui tape juste et vite.** La couverture impose 2 occurrences de chaque
  touche du palier par bloc (`generator.ts:28,215-226`). Le critère demande 3
  occurrences sur 2 blocs (`progression.ts:7-8`). **Deux blocs suffisent donc à
  franchir un palier**, soit ~3 minutes. Les paliers 1 à 6 se franchissent en 12
  blocs, ~15 à 20 minutes de jeu au total, et l'enfant atteint le palier terminal
  dans sa première ou sa deuxième séance. Le cahier §7.1 (l.640) se prépare au
  risque exactement inverse — « si le sas dépasse une dizaine de séances, le
  critère est trop lâche » — et n'envisage à aucun moment un sas d'un quart
  d'heure.
- **Enfant débutant réel, 7 ans.** Le barreau 2 se déclenche à 3 s sans frappe
  (`aide.ts:13,40`) et `estPropre` exige `atteint <= 1` (`aide.ts:73-75`). Un
  enfant qui cherche ses touches — c'est la définition du public — dépasse 3 s
  sur la plupart des caractères : aucune occurrence n'est jamais comptée, aucune
  touche n'est jamais maîtrisée, et **tous les paliers s'ouvrent par le plafond
  anti-mur à 6 blocs** (`progression.ts:39`). La progression réellement vécue est
  alors « 6 blocs par palier », indépendamment de tout apprentissage, soit
  exactement ce que le cahier voulait éviter (l.227 : « aucun quota de
  répétitions, aucun volume »).

S'ajoute une contradiction interne : P7 (cahier l.159) pose « aucune pénalité
pour une frappe lente », mais le critère de passage, tel qu'implémenté, pénalise
la lenteur seule — 3 s d'hésitation coûtent la même chose qu'une erreur.

### 4.2 La couverture fabrique mécaniquement la répétition que le cahier redoute

Le cahier §7.2 (l.642-648) identifie la répétitivité du corpus comme « le
paramètre le plus susceptible de faire échouer la décision ». Le générateur la
produit par construction : la boucle gloutonne (`generator.ts:215-226`) doit
servir 2 occurrences de chaque touche, et pour les touches pauvres, un seul item
peut le faire.

Mesures sur 30 blocs :
- Palier 1 FR-FR : *neuf*, *fut* et *un sujet* apparaissent dans **30 blocs sur
  30** — parce que `f` n'a que 2 occurrences dans tout le corpus disponible
  (`corpus.ts:12-16`).
- Palier 5 : *élève*, *voilà*, *déjà* dans **30/30** (`à` : 2 occurrences).
- Palier 6 : *où* dans **30/30** (`ù` : 1 occurrence ; `couvertureCible` abaisse
  d'ailleurs son objectif à 1, `generator.ts:104`).

Un enfant qui joue six blocs sur le palier 1 tape *fut* et *neuf* six fois de
suite, dans six blocs présentés comme différents. C'est la « rote repetition »
que `recherche/02-pedagogie.md:38` reproche à Dance Mat.

### 4.3 Le palier 7 est un cul-de-sac de nombres aléatoires

- Il introduit **11 nouvelles touches d'un coup en FR-FR** (`paliers.ts:56`)
  contre 4 à 7 pour tous les autres paliers, et **2 en CH-FR** : la dernière
  marche est deux à cinq fois plus haute que les précédentes, au moment précis où
  l'on ajoute un modificateur maintenu et une règle de latéralité.
- Aucune des 11 touches FR-FR n'apparaît dans un mot du corpus (mesure §1.4) :
  la couverture ne peut être servie que par des nombres. Résultat mesuré :
  **6,8 nombres et 3,0 items capitalisés par bloc de 9,8, et zéro mot en
  minuscules**.
- Ces nombres sont à 90 % des nombres à trois chiffres tirés au hasard
  (`generator.ts:51-63`) : `491`, `507`, `946`. Ils ne veulent rien dire, ils ne
  progressent pas de 1 à 2 à 3 chiffres, et le cahier §4.7 (l.310) autorisait
  « nombres (un à trois chiffres) » sans jamais dire qu'ils rempliraient un bloc.
- Et c'est un état **définitif** : `palierFranchi` renvoie `false` au palier 7
  (`progression.ts:38`). La récompense promise depuis la première séance (cahier
  l.646 : « la promesse est datée et visible ») s'avère être un bloc de calcul
  mental sans mots, pour toujours.

### 4.4 La progression ne teste jamais la rétention

`maitrise` est monotone croissante (`progression.ts:17-20`), jamais relue pour
re-tester, jamais décroissante. Une touche validée 3 fois au bloc 2 est acquise
définitivement, y compris si elle n'est plus jamais tapée. Combiné à l'absence de
réinjection espacée (§2.1-3), le dispositif mesure une **acquisition immédiate**
et jamais un apprentissage. C'est précisément le mécanisme dont
`recherche/07-verdicts.md:96` reconnaît le diagnostic (« une aide disponible en
continu améliore la séance et dégrade la rétention »).

### 4.5 La charge par item varie d'un facteur 9, et l'étoile ne le dit pas

Une étoile est attribuée à la fin de l'item, quel qu'il soit (`lecon.ts:209-217`).
Le corpus mélange *un* (2 caractères) et *la glace au chocolat* (20 caractères,
`corpus.ts:49`) dans le même bloc de 8 à 12 items. Le cahier §4.2 (l.193) chiffre
un bloc à « 60 à 90 secondes » ; un bloc de palier 4 composé de phrases dépasse
largement cette cible, et la fin de bloc — donc la seule respiration prévue —
arrive à un moment imprévisible pour l'enfant. Les pastilles d'avancement
(`V4Lecon.tsx:278-286`) affichent un nombre d'items constant qui ne renseigne
plus sur le temps restant.

### 4.6 Le bandeau des touches devient illisible au moment où il devrait aider

`libellesEnsemble` liste tout le cumul en capitales (`paliers.ts:122-130`) :
7 signes au palier 1, **27 au palier 6**, ~38 au palier 7, sur une seule ligne
(`V4Lecon.tsx:268-270`). Le cahier voulait un bandeau qui nomme la leçon en cours
(l.458). Passé le palier 3, il ne signale plus rien : ni la nouveauté, ni une
liste mémorisable par un enfant de 7 ans.

### 4.7 Un changement de clavier efface la maîtrise mais garde le palier

`state.tsx:96-109` : sur changement de disposition, `maitrise: {}` et
`blocsSurPalier: 0`, mais `palier` est conservé. L'enfant garde donc toutes ses
touches ouvertes, doit tout revalider à zéro, et — vu §4.1 — passera le palier
suivant par le plafond des 6 blocs. Le cas est réel : le cahier (l.289) prévoit
qu'un parent entraîne l'enfant sur la disposition de l'école.

### 4.8 Le contenu perso contredit la leçon en cours, sans transition

Un bloc de liste sert n'importe quel caractère écrivable (`generator.ts:129-147`)
et allume les touches correspondantes (`V4Lecon.tsx:58-62`), au palier 1 comme au
palier 7. L'enfant peut donc rencontrer, sans préparation ni consigne de doigt
adaptée, des touches que le parcours lui présentera comme une récompense trois
paliers plus tard. Le cahier P5 (l.128) refusait cela « sans exception, pas même
pour un mot presque typable ».

---

## 5. Décisions de progression arbitraires

Aucune justification trouvable ni dans `CAHIER-DES-CHARGES.md`, ni dans
`recherche/*.md`, ni dans `docs/`. Les commentaires de code, quand ils existent,
justifient par une régression constatée, pas par un raisonnement pédagogique.

1. **`COUVERTURE_MIN = 2`** (`generator.ts:28`). Le commentaire (l.22-27)
   l'explique par un symptôme : sans cette contrainte, le critère de maîtrise
   était inatteignable. Le chiffre 2 lui-même n'est nulle part motivé, et il
   détermine mécaniquement la durée d'un palier (§4.1).
2. **`QUOTA_NOMBRES = 2` aux positions fixes 3 et 7** (`generator.ts:16-18,260`).
   Quota et positions inventés ; le cahier ne mentionne aucun plancher de
   nombres.
3. **`QUOTA_PHRASES = 2` aux positions 2 et 6** (`generator.ts:20-21,263`), pour
   un type de contenu que le cahier n'admet pas (§2.2-3).
4. **Réinjection bornée à `floor(taille/3)`**, soit 2 à 4 items
   (`generator.ts:176`). Aucune trace du tiers.
5. **Nombres = toutes les combinaisons de 1 à 3 chiffres** (`generator.ts:51-63`),
   ce qui donne 90 % de nombres à 3 chiffres dès la première leçon en CH-FR.
   Aucun choix de gradation, aucun ancrage (ni dates, ni quantités).
6. **Longueur des mots convertis en phrases : 3 à 8 lettres**
   (`generator.ts:74`).
7. **Taille de bloc tirée au hasard entre 8 et 12** (`generator.ts:151-153`). Le
   cahier donne la fourchette (l.193), pas le tirage aléatoire ; la conséquence
   est qu'un enfant ne peut jamais anticiper la longueur d'un bloc.
8. **Le corpus lui-même** (`corpus.ts:10-68`) : 321 items écrits à la main,
   aucun référentiel lexical cité (ni Manulex, ni échelle Dubois-Buyse, ni liste
   de fréquence), alors que le cahier exige « le lexique 7-12 ans » (l.309) et
   que P5 (l.128) fait de la richesse lexicale la condition d'existence d'un
   palier. Des items comme *wapiti*, *xylophone*, *sandwich* ou *physique*
   (`corpus.ts:61-65`) sont là pour couvrir `w`, `x`, `y`, pas parce qu'ils
   appartiennent au lexique de l'âge.
9. **La liste des 18 syllabes** (`corpus.ts:92-95`) : aucun critère de choix, et
   du code mort en pratique (0 syllabe servie sur 300 blocs mesurés).
10. **Grouper le point avec les 10 chiffres dans un seul critère de maîtrise au
    palier 7** (`paliers.ts:56`). Le cahier (l.219) énumère « les chiffres 0-9,
    les majuscules, et le point » sans dire qu'ils forment un unique palier de
    11 touches à valider ensemble.
11. **`debutant := palier <= 6`** (`V4Lecon.tsx:41`, `paliers.ts:84`). Le mode
    débutant du cahier est un mode ; en faire une propriété du numéro de palier
    est un choix d'implémentation qui supprime le repli (§2.1-2).
12. **`DUREE_CELEBRATION = 700 ms`** (`lecon.ts:19`) et **`DUREE_FAUSSE = 180 ms`**
    (`lecon.ts:18`) : valeurs prises au milieu des fourchettes du cahier
    (l.195, l.244), sans autre motif.
13. **Les 18 encouragements** (`encouragements.ts:6-25`) : le cahier en demande
    au moins 15 (l.199) ; le choix de 18 et leur contenu sont arbitraires — point
    mineur, listé pour complétude.

---

RAPPORT T1 TERMINÉ
