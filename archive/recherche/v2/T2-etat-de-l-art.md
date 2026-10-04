# T2 — État de l'art : comment les autres découpent réellement une progression de dactylo

**Date de la recherche :** 29 août 2026.
**Périmètre :** dépasser `recherche/01-concurrents.md` et `recherche/02-pedagogie.md` (état de l'art d'août 2026) sur cinq axes : découpage réel des progressions, débat rangée-de-repos vs fréquence, littérature académique, critères de maîtrise, spécificités AZERTY et QWERTZ suisse romand.

**Convention de fiabilité.** Chaque affirmation porte sa source. `[source primaire]` = extrait directement du produit ou de son code. `[secondaire]` = presse, revue, documentation tierce. `[non vérifié]` = trouvé mais non confirmé en source primaire.

**Méthode.** Recherche web FR + EN, lecture de sources primaires quand elles existaient : code source de keybr.com sur GitHub, extraction des tables des matières complètes de trois cours TypingClub/edclub par pilotage de navigateur, pages de cours publiques de Typing Study, wiki bépo. Les PDF de syllabus TypingClub (`static.typingclub.com`) sont des scans images, inexploitables ; l'application web les remplace avantageusement.

---

## 0. Ce que cette recherche confirme, infirme, et ajoute

### Confirmé

| Affirmation de l'état de l'art existant | Statut | Preuve nouvelle |
|---|---|---|
| Keybr = « une lettre débloquée quand les précédentes sont maîtrisées », meilleur moteur de progression du panel | **Confirmé, et quantifié** | Code source lu : seuil = confiance ≥ 1 sur **toutes** les lettres actives, confiance = 175 cpm / temps réel par touche (§2.3) |
| Dance Mat Typing = 12 étapes, repos → haut → bas | **Confirmé** | Séquence exacte des 12 étapes récupérée (§1.3) |
| TypingClub = arborescence de centaines de leçons, effet « devoir » | **Confirmé, et chiffré** | 652+ leçons en anglais, 485 en AZERTY, 250 en maternelle (§1.1) |
| ClaviGo estompe le clavier virtuel | **Confirmé** | ~170 exercices en 7 modules `[secondaire]` (§1.4) |
| Le layout doit être une donnée déclarative | **Confirmé et renforcé** | Typing Study et edclub prouvent qu'on peut réutiliser **la même progression physique** en changeant seulement l'étiquette des touches (§5) |

### Infirmé ou fortement nuancé

1. **« Ratatype : parcours French AZERTY de 19 leçons »** — le chiffre 19 est bien affiché publiquement, mais le contenu des leçons est **inaccessible sans compte**. Impossible de vérifier la séquence de touches. `[non vérifié]` — à ne plus citer comme une référence pédagogique documentée.
2. **« Tap'Touche : support suisse romand `[non vérifié]` »** — reste non vérifié après cette passe. Aucune documentation publique de Druide n'expose l'ordre des leçons ni la couverture QWERTZ. **Tap'Touche est une boîte noire pédagogique** : à traiter comme un concurrent commercial, pas comme une source.
3. **« Le contenu doit être du vrai français lisible dès le premier exercice »** — vrai, mais la référence du marché fait exactement l'inverse à 5-6 ans : TypingClub *Jungle Junior* (4 M d'apprenants) enseigne **l'alphabet A→Z dans l'ordre alphabétique**, pas la rangée de repos, et ne passe aux familles de mots (`_AD`, `_AT`, `_ED`…) qu'à la leçon 173/250 (§1.2). L'argument « vrai mot dès le début » ne tient pas pour les plus jeunes ; il tient à partir de ~8 ans.
4. **« Fort-Dactylo : la version web n'est plus maintenue »** — le site `fort-dactylo.com` répond et documente l'offre en août 2026. La progression annoncée est : 4 touches de la rangée de repos → rangées haut et bas → bigrammes → mots de plus en plus longs → phrases, avec **des mots dès le niveau 4** et une **vitesse adaptative temps réel** `[source primaire, page produit]`. Aucun critère de passage de niveau n'est publié.

### Nouveau (absent de l'état de l'art précédent)

1. **La séquence AZERTY complète du leader du marché existe et est publique.** edclub/TypingClub publie *Expédition dactylo*, 485 leçons, 1 M+ d'apprenants, clavier AZERTY. Sa table des matières complète est extraite en §5.1. C'est le document de référence qui manquait.
2. **Le chiffre qui change tout sur AZERTY : la rangée de repos AZERTY ne porte que 23,33 % des frappes d'un texte français, contre 56,36 % pour la rangée du haut** (§5.3). Sur QWERTY la rangée de repos porte ~30 %. **Une progression « rangée de repos d'abord » est structurellement moins rentable en AZERTY qu'en QWERTY** — et personne dans le panel n'en tire les conséquences.
3. **Les accents ont un module dédié, inséré tôt, avant les majuscules et avant les chiffres**, dans le seul cours AZERTY sérieux du panel (§5.1). Aucune app enfant francophone ne documente ce choix.
4. **La preuve empirique que la progression est physique, pas alphabétique** : Typing Study propose le même cours en AZERTY et en QWERTZ suisse ; les leçons se correspondent position par position, seules les étiquettes changent (§5.4).
5. **Le seuil exact de keybr, lu dans le code** : 175 cpm par touche, soit ≤ 343 ms entre frappes, minimum 6 lettres actives (§2.3).
6. **Les objectifs de vitesse par palier de TypingClub, affichés dans l'app** : 21 → 30 → 30 → 45 → 50 → 55 → 60 → 63 → 66 → 69 → 72 mots/min (§4.1).

---

## 1. Axe 1 — Comment les références découpent réellement leur progression

### 1.1 TypingClub / edclub — *Typing Jungle* (QWERTY, anglais)

`[source primaire]` Table des matières complète extraite de `https://www.typingclub.com/sportal/program-3.game` le 29/08/2026.

**Volume :** 79 sections, 652+ leçons numérotées (le cours continue au-delà de la leçon 652).

**Ordre exact d'introduction des touches (leçons 1 à 87) :**

| Leçons | Section | Touches introduites, dans l'ordre |
|---|---|---|
| 1–22 | Home Row | `f` `j` → barre espace → `d` `k` → `s` `l` → `a` `;` → (« First 8 Keys ») → `g` `h` |
| 23–51 | Top Row | `r` `u` → `e` `i` → `w` `o` → `q` `y` → `p` `t` |
| 52–87 | Bottom Row | `v` `m` → `c` `,` → `x` `.` → `z` `/` → `b` `n` → Tab |
| 138–196 | Shift Key | mêmes paires, en majuscules, dans le même ordre |
| 245–273 | Numbers | `4` `7` → `3` `8` → `2` `9` → `1` `0` → `5` `6` |
| 317–346 | Symbols | `$` `&` → `#` `*` → `@` `(` → `!` `)` → `%` `^` |
| 389–418 | More Symbols | `~` `` ` `` → `'` `"` → `-` `=` → `_` `+` → `[` `]` → `{` `}` → `\` `|` → `<` `>` |

**Cinq principes de découpage lisibles dans cette séquence :**

1. **Paire symétrique bilatérale.** Chaque leçon introduit **deux touches, une par main, sur le même doigt** (`f`/`j` = les deux index, `d`/`k` = les deux majeurs…). Jamais une touche seule. Le concept enseigné est « le majeur », pas « la touche D ».
2. **Motif ternaire fixe : Touches → Révision → Exercice**, puis un « Jeu » tous les 4 à 6 items. Le rythme est parfaitement régulier sur 650 leçons.
3. **De l'intérieur vers l'extérieur.** Index d'abord, puis majeur, annulaire, auriculaire. Vrai sur les trois rangées.
4. **`g` et `h` arrivent en dernier sur la rangée de repos** (leçons 18–20), après les 8 touches « pures », parce qu'ils demandent un déplacement latéral de l'index.
5. **Les chiffres partent du milieu vers les bords** : `4`/`7` d'abord (index), `5`/`6` en dernier (les plus éloignés).

**Leçons « Travel » :** entre les blocs de touches, des leçons dédiées au *déplacement* d'un doigt donné (« Travel R Index », « Travel L Middle », « Travel R Pinky »). Le geste de retour à la rangée de repos est enseigné comme une compétence à part entière — pattern qu'aucune app enfant francophone du panel ne reprend.

**Contenu inséré entre les blocs techniques :** posture (« Sit Straight, Be Healthy! »), pauses (« Take a Break Get Active »), écran (« Adjust Your Screen »), motivation (« Trust Yourself », « Never Stop »). Environ 1 leçon non-technique pour 5 leçons de frappe.

### 1.2 TypingClub / edclub — *Jungle Junior* (pre-K → CP, 5-7 ans)

`[source primaire]` `https://www.edclub.com/library/jungle-junior` et `program-16.game`, 29/08/2026.

**250 leçons, 4 M+ d'apprenants.** Public annoncé : maternelle et CP. Objectif déclaré : « reconnaissance des lettres, dextérité des doigts, association doigt↔lettre » — **pas** la frappe à dix doigts.

**Séquence réelle : ordre alphabétique strict, une lettre à la fois, par blocs de trois.**

```
A → B → C → barre espace → révision A B C
D → E → F → révision D E F → révision cumulative A–F
G → H → I → J → K → L → révision cumulative A–L
M → N → O → P → Q → R → révision cumulative A–R
S → T → U → révision cumulative A–U
V → W → X → Y → Z → révision cumulative A–Z  (leçon 161)
Familles de mots : _AD _AT _ED _ET _IP  (leçon 173) puis _IT _OP _OT _UG _UN
Mots outils (sight words) → phrases
```

Chaque lettre suit le motif **`<Lettre>` → `Finger Gym` → `Type <Lettre>`** : une vidéo qui nomme la lettre, une vidéo d'échauffement des doigts, puis la frappe.

**C'est le fait le plus important de cette section.** Le leader mondial, avec le plus gros volume d'utilisateurs de la tranche 5-7 ans, **n'enseigne pas la rangée de repos aux petits**. Il enseigne l'alphabet et l'association doigt↔touche, et bascule sur la progression `f j / d k / s l` seulement dans le cours suivant (*Typing Jungle*, à partir du CE1/CE2). Pour une app ciblant 7-12 ans, cela signifie que **la borne basse et la borne haute de la tranche ne relèvent pas de la même pédagogie**.

### 1.3 Dance Mat Typing (BBC) — 7-11 ans

`[secondaire, dancemattypingguide.com, consulté 29/08/2026]` — le site BBC original est mort avec Flash ; ce guide tiers est la source la mieux documentée.

**4 niveaux × 3 étapes = 12 étapes.**

| Niveau | Étape | Touches |
|---|---|---|
| 1 | 1 | rangée de repos complète `asdfghjkl;` |
| 1 | 2 | `e` `i` |
| 1 | 3 | `r` `u` |
| 2 | 4 | `t` `y` |
| 2 | 5 | `w` `o` |
| 2 | 6 | `q` `p` |
| 3 | 7 | `v` `m` |
| 3 | 8 | `b` `n` |
| 3 | 9 | `c` et la virgule |
| 4 | 10 | `x` `z` |
| 4 | 11 | `/` et `.` |
| 4 | 12 | tout ensemble |

**Deux différences notables avec TypingClub :**
- La rangée de repos est donnée **d'un bloc** (10 touches d'un coup), pas par paires successives. C'est plus brutal, et c'est le reproche récurrent fait au produit.
- L'ordre du haut est `e i` → `r u` (contre `r u` → `e i` chez TypingClub) et `t y` arrive en 4ᵉ position (contre `p t` en dernier chez TypingClub). **Il n'y a donc pas de séquence canonique**, même à l'intérieur du paradigme « rangée de repos d'abord ».
- Aucun critère de passage publié, aucun score, aucun chrono. `[source primaire absente]`

### 1.4 Les autres, en une ligne chacun

| Produit | Volume | Découpage | Critère de passage | Source |
|---|---|---|---|---|
| **Typing.com** | Unités Beginner/Intermediate/Advanced, alignées Common Core et ISTE | « touches du majeur d'abord », puis les lettres restantes, puis ponctuation, puis chiffres/symboles | non publié | `[secondaire]` scope & sequence PDF illisible (scan) |
| **Keybr** | pas de leçons : flux continu | 6 lettres minimum, ajout par fréquence de la langue | confiance ≥ 1 sur **toutes** les lettres actives (§2.3) | `[source primaire]` code GitHub |
| **Klavaro** | 4 modules : *Basic course* → *Adaptability* → *Velocity* → *Fluidness* | cours de base par positions ; layout = fichier texte `.kbd` de 2×4 lignes de 14 touches | 3 critères : précision, vitesse, fluidité — seuils non extractibles du manuel PDF | `[secondaire]` manuel + wiki |
| **Ratatype** | 19 leçons « French AZERTY » | **inaccessible sans compte** | inconnu | `[non vérifié]` |
| **Typesy** | 377 leçons, 50+ vidéos | vidéo → exercice → jeu | suivi de précision, vitesse, main G/D, « niveaux de maîtrise » | `[secondaire]` revues homeschool |
| **TICKEN** (FR, scolaire) | **30 leçons × 30 min = 15 h** | non publié | **diplôme : ≥ 100 CPM et ≤ 1 % de fautes**, examen de 7 min, 3 tentatives, meilleur résultat retenu | `[source primaire]` ticken.fr |
| **ClaviGo** (dysclick) | **~170 exercices en 7 modules** | progression AZERTY classique | non publié | `[secondaire]` |
| **Fort-Dactylo** | **30+ niveaux** | 4 touches repos → rangées → bigrammes → mots (dès niv. 4) → phrases | non publié ; **vitesse adaptative temps réel** | `[source primaire]` page produit |
| **Typing Study** | 22 leçons (AZERTY) / 21 (QWERTZ CH) | voir §5.4 | non publié | `[source primaire]` |
| **Sense-Lang** | 16 leçons | « commence à 2 caractères, finit au clavier entier » | non publié | `[secondaire]` |
| **Dactylocours** | 27 leçons, 4 claviers (FR/BE/CA/CH) | non extrait cette passe | non publié | `[non vérifié]` |

### 1.5 Durée d'une leçon

Aucun éditeur ne publie une durée par leçon. Tous publient une **dose quotidienne** :

- edclub, sur les quatre cours consultés (*Typing Jungle*, *Jungle Junior*, *Mission dactylo*, *Expédition dactylo*) : **« Practice about 15 minutes a day for a few weeks »** `[source primaire]`.
- TICKEN : **30 min × 30 séances** `[source primaire]`.
- Keyboarding Without Tears (curriculum scolaire US) : **5-10 min/jour ou 30 min/semaine, sur 36 semaines** `[secondaire, via Donica 2018]`.
- Consensus des curricula scolaires : **séries de leçons courtes de 15-25 min quotidiennes sur 6-8 semaines** `[secondaire]`.

**Ordre de grandeur convergent : 15 min/jour.** Rien dans le panel ne descend en dessous de 5 min ni ne monte au-dessus de 30.

---

## 2. Axe 2 — Rangée de repos d'abord, ou ordre par fréquence ?

### 2.1 L'état du débat : ce n'est pas un débat symétrique

**Le camp « rangée de repos » domine massivement**, mais par tradition et par contrainte pédagogique, pas par preuve. Aucune étude contrôlée comparant les deux ordres d'introduction n'a été trouvée. Ce vide est en soi le résultat le plus solide de cette section : **il n'existe pas de données expérimentales départageant les deux approches.** Toute affirmation contraire relève de l'argument de produit.

Les arguments réellement avancés de chaque côté :

**Pour la rangée de repos d'abord**
- L'ancrage physique existe : les ergots sur `F` et `J` sont un repère tactile réel, indépendant du layout `[secondaire]`.
- Toute méthode de frappe à l'aveugle définit la position de repos comme point de retour ; commencer ailleurs oblige à enseigner deux choses à la fois (la position de repos ET les touches distantes).
- Découpage par rangée = découpage explicable à un enfant. « La ligne du milieu, puis celle du haut, puis celle du bas » est une consigne qu'un enfant de 7 ans se répète tout seul.

**Pour l'ordre par fréquence**
- Keybr : commencer par les lettres les plus fréquentes permet de générer des mots réels dès la 6ᵉ lettre. Sur la rangée de repos QWERTY (`asdfghjkl`), la matière lexicale disponible est pauvre ; sur la rangée de repos AZERTY (`qsdfghjklm`), elle est encore plus pauvre.
- Argument de rendement : `e s a i n t r` représentent la majorité de la matière française (§2.5). Les maîtriser tôt maximise la proportion de texte réel accessible par heure d'apprentissage.

### 2.2 Ce que fait réellement le marché : un troisième ordre

Ni l'un ni l'autre en pratique. **La séquence dominante est « par doigt, du plus fort au plus faible, à l'intérieur d'une rangée »** :

```
index → majeur → annulaire → auriculaire, répété sur chaque rangée
```

C'est l'ordre de TypingClub (`f j`, `d k`, `s l`, `a ;`), de Typing Study, de Dance Mat après l'étape 1. Il est justifié par la **dextérité différentielle des doigts**, pas par la fréquence des lettres ni par la géométrie des rangées. La rangée est le conteneur ; le doigt est l'unité pédagogique.

**Corollaire important pour le projet :** un mode « 4 doigts » (index + pouces) n'est pas une amputation de la méthode standard — c'en est **le premier étage naturel**. Toutes les progressions du panel commencent par les index.

### 2.3 Le mécanisme de keybr, lu dans le code source

`[source primaire]` `github.com/aradzie/keybr.com`, fichiers `packages/keybr-lesson/lib/{guided,target,settings,key}.ts`, consultés le 29/08/2026.

Faits exacts, non paraphrasés :

- **Ordre des lettres** : `Letter.frequencyOrder(letters)` — ordre de fréquence de la langue choisie. Une option `keyboardOrder` bascule sur `weightedFrequencyOrder`, pondérée par le poids des touches du clavier ; **elle est désactivée par défaut** (`booleanProp("lesson.guided.keyboardOrder", false)`).
- **Taille minimale de l'alphabet actif : 6 lettres** (`const minSize = 6`).
- **Taille maximale** : `minSize + round((letters.length - minSize) × alphabetSize)`, avec `alphabetSize` par défaut à **0** — donc `maxSize = 6` par défaut, et **l'élargissement ne se fait que par la maîtrise**, jamais par un réglage.
- **Vitesse cible par défaut : 175** (`targetSpeed`, en caractères/minute), réglable de 75 à 750. Soit **35 mots/min**.
- **Confiance d'une touche** = `speedToTime(175) / temps réel pour taper cette touche`. Confiance ≥ 1 signifie « au moins aussi rapide que la cible ». La communauté traduit ce seuil en **≤ 343 ms entre deux frappes** `[secondaire, groupe Google keybr]`.
- **Règle de déblocage** : une nouvelle lettre n'entre que si **toutes** les lettres actives ont `bestConfidence ≥ 1` (meilleure performance jamais atteinte). L'option `recoverKeys` (désactivée par défaut) durcit la règle en exigeant `confidence ≥ 1` — la performance *actuelle*, pas le record.
- **Focalisation** : à chaque cycle, la lettre de confiance la plus basse parmi les actives est marquée `focused` et sur-représentée dans le texte généré.
- **Objectif quotidien par défaut : 30 minutes** (`dailyGoal`).

**Ce qui est transposable :** la règle « toutes les lettres actives au-dessus du seuil, sinon on rejoue en insistant sur la plus faible ». **Ce qui ne l'est pas :** le seuil basé sur la vitesse. 35 mots/min est le niveau attendu d'un adulte ; c'est le double de la norme d'un enfant de CM1 (§3.7). Un enfant de 7 ans ne franchira jamais ce mur.

### 2.4 Le point de blocage documenté de keybr

`[secondaire, mais témoignage direct + réponse technique, groupe Google keybr]` Un utilisateur rapporte **8 heures bloqué sur `R` et `T`**, avec une confiance oscillant entre 0,92 et 0,98 sans jamais atteindre 1. La réponse de la communauté : viser la précision seule, réduire la longueur des échantillons, sauter les échantillons ratés, ne jamais élargir l'alphabet manuellement.

**C'est l'anti-pattern le plus important de cette recherche.** Un seuil de maîtrise fondé sur la vitesse et exigé simultanément sur **toutes** les lettres actives produit des plateaux durs, sans issue et sans remédiation. Sur un enfant, ce mécanisme est une machine à abandon. Il faut soit un seuil sur la précision, soit un plafond de tentatives avec déblocage forcé, soit les deux.

### 2.5 Fréquence des lettres en français

`[secondaire, corpus de 100 000 lettres, apprendre-en-ligne.net / Wikipédia]`

| Lettre | e | s | a | i | n | t | r |
|---|---|---|---|---|---|---|---|
| Fréquence | 14,66 % | 8,08 % | 7,84 % | 7,26 % | 7,13 % | 7,07 % | 6,55 % |

Ces sept lettres cumulent ≈ 58,6 % des occurrences. Note méthodologique de la source : la fréquence dépend du corpus — un dictionnaire sous-estime `s` et `x` (peu de pluriels). Pour un corpus enfantin, il faudra recalculer sur le lexique cible, pas réutiliser ces chiffres.

---

## 3. Axe 3 — Ce que dit la recherche

### 3.1 À quel âge enseigner la frappe à dix doigts

**Consensus des curricula : CE2 (3rd grade, ~8-9 ans) pour l'enseignement formel de la technique.**

- « Les élèves devraient apprendre la forme correcte (avec exercices) en CE2 ; on attend qu'ils sachent l'utiliser en CM1 et CM2 » `[secondaire, synthèse de curricula US]`.
- « La plupart des cadres de référence recommandent de commencer l'enseignement formel de la frappe à l'aveugle vers le CE2, quand la motricité et le développement orthographique sont assez solides pour soutenir la technique » `[secondaire, Wisconsin DPI relayé]`.
- Argument développemental invoqué : avant, l'enfant développe encore la motricité globale ; la motricité fine (écrire, découper, taper) vient après `[secondaire]`.
- Contre-argument documenté : « il y a un bénéfice à introduire la frappe à l'aveugle tôt dans le primaire, car ces élèves ont le potentiel de développer un style de frappe de niveau supérieur » `[secondaire]` — mais la même source note que les plus jeunes demandent plus de temps et plus de supervision, ce qui rend l'enseignement moins praticable en classe.

**Position du marché, qui tranche autrement :** edclub sépare explicitement 5-7 ans (*Jungle Junior* : alphabet et association doigt↔lettre) de 8 ans et plus (*Typing Jungle* : rangée de repos et dix doigts). Fort-Dactylo se dit utilisable **« dès 6-7 ans »** `[source primaire]`, mais sa boucle est un jeu de tir, pas un enseignement de posture.

**Conclusion pour un enfant de 7 ans :** l'enseignement formel de la frappe à dix doigts est prématuré selon la littérature comme selon le marché. Ce qui est adapté à 7 ans : reconnaissance des touches, association doigt↔touche, dextérité. La progression complète devient pertinente vers 8-9 ans.

### 3.2 Durée et fréquence des séances

- **Keyboarding Without Tears** : curriculum sur 36 semaines, conçu pour **5-10 min/jour ou 30 min/semaine**, de la maternelle au CM2 `[secondaire, décrit dans Donica et al. 2018]`.
- **Consensus curricula** : « une série de leçons courtes (15-25 min) quotidiennes sur 6-8 semaines est la manière la plus efficace d'introduire et de pratiquer » `[secondaire]`.
- **Wisconsin DPI** : 15 à 30 min/jour pendant 5 à 6 semaines `[secondaire relayé ; site injoignable au moment de la recherche — DNS]` `[non vérifié]`.
- **Formule de régularité** : « cinq minutes tous les jours battent 30 minutes une fois par semaine » `[secondaire]`.
- **edclub** : 15 min/jour `[source primaire]`.

**Synthèse actionnable :** 10-15 min/jour, tous les jours, bat toute session longue hebdomadaire. C'est la seule recommandation sur laquelle littérature et éditeurs convergent sans exception.

### 3.3 Répétition espacée et apprentissage moteur

Le résultat honnête est : **l'effet d'espacement est réel mais moins net sur les habiletés motrices complexes que sur la mémoire déclarative.**

- **Pour** : bénéfice moyen mesuré de **+15 % de rétention** pour la pratique distribuée vs massée, chez l'enfant comme chez l'adulte ; l'espacement sur plusieurs **jours** améliore à la fois les séances restantes et les tests de rétention différée `[secondaire, synthèses]`.
- **Contre / nul** : une étude d'apprentissage du piano ne trouve **aucun effet d'espacement** (PLOS ONE, 2017) `[secondaire]`. Une étude sur 30 enfants (moyenne 9,4 ans) apprenant une séquence de 4 touches sur pavé numérique trouve la pratique **massée** plus régulière que la distribuée au test de rétention `[secondaire]`. Une publication de 2026 conclut que « la pratique massée améliore l'apprentissage des habiletés motrices sérielles » `[secondaire]`.

**Ce que cela impose de ne pas faire :** vendre la répétition espacée comme un principe établi pour la frappe. **Ce qui reste défendable :** l'espacement **entre les jours** (une séance quotidienne courte plutôt qu'une longue hebdomadaire) est soutenu ; l'espacement **à l'intérieur d'une séance** (intercaler les lettres anciennes) ne l'est pas par des preuves fortes dans ce domaine précis. Autrement dit : le rythme quotidien est fondé, l'algorithme de reprise fine ne l'est pas — le concevoir sur des critères produits, pas en invoquant la littérature.

### 3.4 Précision d'abord ou vitesse d'abord

**La littérature de laboratoire ne tranche pas ; la pratique professionnelle tranche pour la précision.**

- Une étude comparant consigne « sois rapide » vs « sois précis » sur une tâche d'apprentissage séquentiel probabiliste (Cerebral Cortex Communications, 2020) trouve des performances immédiates très différentes mais **des représentations statistiques apprises similaires** : testés plus tard dans les mêmes conditions, les deux groupes se valent `[secondaire]`. La consigne change la performance, pas le savoir acquis.
- Une seconde publication (2022) nuance : les consignes de vitesse et de précision affectent **différemment deux aspects** de l'apprentissage `[secondaire]`.
- La pratique éditeur est unanime dans l'autre sens : « d'abord la précision, ensuite seulement la vitesse, parce que la correction ultérieure des erreurs coûte beaucoup de temps en conditions réelles » `[secondaire]`.

**Position défendable :** la précision d'abord ne repose pas sur une supériorité démontrée en apprentissage moteur ; elle repose sur (a) l'économie de la tâche réelle et (b) le risque de figer un mauvais geste. Le deuxième point est l'argument sérieux et il rejoint §3.5.

### 3.5 Faut-il bloquer l'erreur ?

C'est la question la mieux documentée de cette section, et la réponse penche nettement — avec un contre-exemple à connaître.

**Pour bloquer (apprentissage sans erreur, *errorless learning*) :**
- Base théorique : l'erreur déclenche un test d'hypothèses explicite ; le contraindre à ne pas se produire maintient l'apprentissage **implicite** `[secondaire, littérature errorless]`.
- Chez l'enfant, spécifiquement : les enfants entraînés en condition sans erreur progressent davantage que ceux entraînés en condition riche en erreurs ; ceux qui apprennent le lancer avec peu d'erreurs **conservent leur performance en double tâche** (compter à rebours), là où les autres se dégradent (Capio et al., PMC3275454) `[secondaire, mais étude primaire identifiée]`.
- L'acquisition sans erreur produit une performance motrice « plus fluide et plus précise » aux tests de rétention et de transfert `[secondaire]`.
- Réserve explicite de la littérature : « l'essentiel des preuves provient d'études sur adultes ; il y a peu de preuves issues d'études sur enfants, dont les capacités de traitement sont encore en maturation » `[secondaire]`.

**Contre bloquer :**
- Une étude d'apprentissage d'une tâche de suivi de courbe avec retour haptique **amplifiant l'erreur** : le groupe le plus mauvais pendant l'acquisition obtient une précision **significativement meilleure** aux tests de rétention différée et de transfert (PMC5183591) `[secondaire]`. C'est le résultat classique « les conditions difficiles nuisent à la performance et servent l'apprentissage ».

**Arbitrage pour un enfant de 7-12 ans :** la robustesse en double tâche mesurée par Capio et al. est l'argument décisif. Taper est *toujours* une double tâche (on tape en pensant à ce qu'on écrit). Le blocage de l'erreur est justifié. Il faut en revanche l'assortir d'une remédiation — le contre-exemple de l'amplification d'erreur montre que ce qui compte n'est pas l'absence d'erreur en soi mais **l'information que l'apprenant en tire**. Un blocage muet est le pire des deux mondes.

### 3.6 Ce que mesurent les études d'efficacité

Deux études du même groupe, à citer par leurs chiffres :

**Donica, Giroux & Faust (2018)**, *Journal of Occupational Therapy, Schools & Early Intervention*, [doi:10.1080/19411243.2018.1512067](https://www.tandfonline.com/doi/full/10.1080/19411243.2018.1512067) — quasi-expérimental pré/post, maternelle→CM2, éducation générale et spécialisée. Compare *Keyboarding Without Tears* (curriculum développemental) à des activités web gratuites. Résultat : les élèves du curriculum développemental améliorent vitesse et précision, **surtout dans les grandes classes du primaire**. `[secondaire, résumé ERIC + éditeur ; texte intégral en 403]`

**Donica, Giroux, Kim & Branson (2021)**, *The Open Journal of Occupational Therapy*, vol. 9 n° 3, [scholarworks.wmich.edu/ojot/vol9/iss3/13](https://scholarworks.wmich.edu/ojot/vol9/iss3/13/) — 2 années consécutives, N = 592 (KWT les deux ans) vs N = 714 (web gratuit puis KWT). Résultats : gain moyen de **1,57 à 2,74 mots/min nets** (IC 95 %) du CE2 au CM2 ; potentiel estimé par régression linéaire de **+6 mots/min nets** avec l'application complète. `[secondaire, résumé ; texte intégral en 403]`

**Lecture critique.** Ces gains sont faibles en valeur absolue (2 mots/min sur une année scolaire) et l'étude compare un produit commercial à « des activités web gratuites » mal spécifiées — le protocole favorise structurellement le produit. À citer pour l'ordre de grandeur des progrès attendus chez un enfant, pas comme preuve de supériorité d'une méthode.

### 3.7 Normes de vitesse par niveau

`[secondaire, convergent sur plusieurs sources]`

- **Règle empirique dominante : 5 mots/min × niveau scolaire.** CE2 = 15, CM1 = 20, CM2 = 25. Formalisée telle quelle par le Utah State Office of Education et reprise par le Wisconsin DPI.
- Mesures observées : CE1 ≈ 5 mots/min ; CP–CE2 ≈ 9 mots/min en moyenne.
- Précision attendue : ≈ 95 % en CM1 ; 85 %+ considéré comme « solide » en CM2 avec 25-30 mots/min.
- Common Core **ne fixe aucun chiffre de mots/min** — les nombres circulant proviennent tous de cadres d'États ou d'éditeurs.

**Conséquence directe :** pour un enfant de 7-9 ans, la cible réaliste est **10 à 20 mots/min**. Le seuil par défaut de keybr (35 mots/min) est hors d'atteinte. L'objectif du premier palier de TypingClub (21 mots/min) est déjà au niveau CM1.

---

## 4. Axe 4 — Critères de maîtrise et gestion du blocage

### 4.1 Les seuils réellement employés

| Produit | Unité de maîtrise | Seuil | Source |
|---|---|---|---|
| **TypingClub** *Typing Jungle* | étoiles 1→5 par leçon, combinant vitesse et précision | **1 étoile pour passer** (défaut, modifiable) ; **5 étoiles = maîtrise** | `[secondaire]` doc edclub |
| TypingClub — objectifs de vitesse par palier | mots/min, affichés dans le titre de section | Basic 1 : **21** · Basic 2 : **30** · Basic 3 : **30** · Advanced 1 : **45** · 2 : **50** · 3 : **55** · 4 : **60** · 5 : **63** · 6 : **66** · 7 : **69** · 8 : **72** | `[source primaire]` app, 29/08/2026 |
| TypingClub — précision | seuil de précision minimale pour 1 étoile, réglable par l'enseignant ; « l'objectif de précision implicite est toujours 100 % » | ex. 95 % configuré ⇒ faible écart entre 1 et 5 étoiles | `[secondaire]` doc edclub |
| **Expédition dactylo** (AZERTY) | mêmes étoiles | **les objectifs de vitesse ne sont pas affichés dans les titres de section**, contrairement à la version anglaise | `[source primaire]` |
| **Mission dactylo** (QWERTY-CA) | étoiles | objectif final annoncé : **55 mots/min** | `[source primaire]` |
| **Keybr** | confiance par touche | **175 cpm (35 mots/min) par touche**, soit ≤ 343 ms entre frappes, sur **toutes** les lettres actives | `[source primaire]` code |
| **TICKEN** | examen final | **≥ 100 CPM et ≤ 1 % de fautes**, épreuve de 7 min, 3 tentatives | `[source primaire]` |
| **Klavaro** | précision, vitesse, fluidité | seuils non publiés | `[secondaire]` |
| **Dance Mat Typing** | aucun | aucun score, aucun chrono | `[secondaire]` |

**Deux observations.**

1. **Le nombre d'occurrences n'est jamais un critère.** Aucun produit du panel ne dit « tape cette lettre 40 fois ». Le critère est toujours une **performance** (vitesse et/ou précision), jamais un **volume**. Le volume est la conséquence, pas la règle.
2. **La précision porte le seuil, la vitesse porte la gradation.** Chez TypingClub, la précision minimale décide du passage (« en dessous de cette valeur, ils ne passent pas la leçon ») et la vitesse décide du nombre d'étoiles. C'est le découpage le plus propre du panel, et il est directement transposable en retirant l'affichage des étoiles.

### 4.2 Ce que font les produits quand l'enfant bloque

**TypingClub — un réglage manuel, pas une adaptation.** `[secondaire, doc edclub]`
- Ajustement de la difficulté **par élève ou par classe**, par pas de **±5 mots/min** appliqué à **toutes** les leçons du cours (« si une leçon exige 15 mots/min, +5 la porte à 20 »).
- Réglage de la précision minimale pour obtenir 1 étoile.
- Réglage du nombre d'étoiles minimal pour passer (défaut : 1).
- **Il n'y a pas de détection automatique du blocage.** C'est l'enseignant qui doit remarquer et régler. Pour une app familiale sans enseignant, ce modèle ne fonctionne pas.

**Keybr — rien.** Le blocage est un état stable du système (§2.4). La seule sortie documentée est de baisser manuellement `targetSpeed` ou de repartir de zéro en navigation privée.

**Fort-Dactylo — le seul du panel avec une adaptation automatique.** « Vitesse adaptative : s'ajuste en temps réel au niveau de l'enfant ; plus il tape vite, plus la difficulté monte ; plus il ralentit, plus elle baisse » `[source primaire, page produit]`. Le critère de passage de niveau n'est en revanche pas publié.

**Dance Mat Typing — rien**, et c'est son reproche le plus constant : de la répétition mécanique sans remédiation pour l'élève en difficulté.

**Conclusion pour le projet.** Il y a un **trou de marché documenté** : aucun produit enfant francophone ne combine (a) un critère de passage explicite, (b) une détection automatique du blocage et (c) une remédiation graduée. C'est l'endroit où l'apport peut être réel.

---

## 5. Axe 5 — AZERTY et QWERTZ suisse romand

### 5.1 La séquence AZERTY de référence : *Expédition dactylo* (edclub)

`[source primaire]` `https://www.edclub.com/sportal/program-17.game`, table des matières complète extraite le 29/08/2026. **485 leçons, 1 M+ d'apprenants, français, AZERTY.** C'est la source la plus autorisée disponible publiquement sur l'ordre AZERTY.

**Ligne repère (leçons 1-22)**
```
f & j  →  barre espace  →  d & k  →  s & l  →  q & m  →  [Les 8 premières touches]  →  g & h
```
Note : sur AZERTY la position de repos est `q s d f` / `j k l m`. La 4ᵉ paire est donc `q & m` (auriculaires) là où QWERTY a `a & ;`.

**Ligne du haut (leçons 23-48)**
```
r & u  →  e & i  →  z & o  →  a & y  →  p & t
```
Comparé au QWERTY (`r u`, `e i`, `w o`, `q y`, `p t`), **les positions physiques sont identiques** : `z` occupe la position du `w` QWERTY, `a` celle du `q`. Même doigt, même rangée, même ordre.

**Ligne du bas (leçons 49-82)**
```
v & ,  →  c & ;  →  x & :  →  w & !  →  b & n  →  Tabulation
```
Comparé au QWERTY (`v m`, `c ,`, `x .`, `z /`, `b n`) : **positions physiques identiques**. Sur AZERTY le côté droit de la rangée du bas porte `, ; : !` là où QWERTY porte `m , . /`, et le `w` AZERTY occupe la position du `z` QWERTY.

**Puis, et c'est la vraie spécificité — « Touches spéciales 1 » (leçons 83-107), AVANT les majuscules, AVANT les chiffres :**
```
é & è  →  â & à  →  c & ç  →  ê & e  →  i & î  →  ù & û  →  o & ô
```
Les caractères accentués de la rangée des chiffres (`é è ç à ù`) **et** les touches mortes (accent circonflexe, produisant `â ê î ô û`) sont enseignés comme un bloc à part entière, juste après les trois rangées de lettres. Un cours QWERTY n'a strictement rien à cet endroit.

**Suite du plan**
```
Niveau basique 1 (leçons 108-143)  — dix doigts, posture, mots
Touche majuscule (144-196)         — F&J, D&K, S&L, Q&M, G&H, T&Y, R&U, E&I, Z&O, A&P,
                                     V&?, C&., W&N, X&B
Séquences courantes 1 (197-207)    — ent, les, ion, que, des, tion, ment, ique, ement, par
Chiffres (208-236)                 — 4&7, 3&8, 2&9, 1&0, 5&6  (identique au QWERTY)
Mots piège 1 (237-246)             — Veille/Vieille, Son/Sont, Censé/Sensé, Or/Hors,
                                     Tache/Tâche, Prêt/Près, Peu/Peut/Peux…
Symboles (247-274)                 — ' è, " _, é ç, & ), ( -
Niveau basique 2 (275-305)         — textes francophones
Symboles 2 (306-324)               — < >, / §, % *, $ £, = +
Mots piège 2, Séquences courantes 2 (325-344) — aire, est, elle, que, ans, plu, pour, entre, ique, eur
Touches spéciales 2 (345-364)      — € @, # \, { }, [ ], | ^, ë ï
Niveau basique 3 → Niveau avancé 1, 2, 3…
```

**Trois enseignements exploitables directement :**

1. **La progression AZERTY d'edclub est la progression QWERTY, à l'identique, en positions physiques.** Les 485 leçons françaises et les 652 anglaises suivent le même squelette. Le layout n'a changé que les étiquettes et le contenu textuel.
2. **Les accents forment un module dédié, placé tôt** — juste après les trois rangées, avant majuscules et chiffres. C'est le seul écart structurel avec le QWERTY, et il est majeur.
3. **Les séquences fréquentes du français sont enseignées explicitement** : `ent les ion que des tion ment ique ement par` puis `aire est elle que ans plu pour entre ique eur`. C'est un niveau de granularité (le n-gramme comme unité d'exercice) que ni Dance Mat ni Keybr n'offrent, et qui est directement transposable à un contenu enfantin.

### 5.2 L'autre séquence AZERTY documentée : Typing Study

`[source primaire]` `typingstudy.com/fr-french-3/`, 22 leçons, consulté le 29/08/2026.

```
1  Rangée de base          12  w, x et '
2  e et i                  13  é, è et ù
3  r et u                  14  ç, à, - et ^
4  a et p                  15  ê et î
5  z et o                  16  â, û et ô
6  Lettres majuscules      17  ä, ÿ et ï
7  , . ; et ?              18  ë et ü
8  v et n                  19  &, ", (, ) et _
9  g et h                  20  Chiffres
10 t et y                  21  =, +, ¨, $, £, *, µ, %, <, >, :, /, ! et §
11 c et b                  22  Toutes les touches
```

**Divergences avec edclub, à noter :**
- Les **majuscules arrivent en leçon 6**, très tôt, avant la moitié des lettres. edclub les place en leçon 144.
- Les **accents en leçons 13-18**, soit après les lettres et la ponctuation, mais avant les chiffres — même intuition qu'edclub (les accents ne sont pas un sujet « avancé »), calendrier différent.
- `g` et `h` arrivent tard (leçon 9) chez les deux : convergence sur le déplacement latéral de l'index comme difficulté à part.

**Il n'existe donc pas une séquence AZERTY canonique.** Il existe un squelette stable (rangée de repos → haut → bas, index → auriculaire, accents comme bloc dédié) et des variantes de calendrier.

### 5.3 Le fait AZERTY que personne n'exploite

`[source primaire]` [bepo.fr/wiki/Statistiques](https://bepo.fr/wiki/Statistiques), corpus Nicolas Chartier, consulté le 29/08/2026.

Répartition des frappes par rangée, pour un texte français :

| Disposition | Rangée de repos | Rangée du haut | Rangée du bas |
|---|---|---|---|
| **AZERTY** | **23,33 %** | **56,36 %** | 15,67 % |
| bépo | 69,03 % | 22,17 % | 7,35 % |

Pour comparaison, la rangée de repos QWERTY porte ≈ 30 % des frappes en anglais `[secondaire]`.

**Conséquence directe et non traitée par le marché.** En français sur AZERTY, la rangée de repos (`q s d f g h j k l m`) ne donne accès qu'à **moins d'un quart** de la matière, tandis que la rangée du haut (`a z e r t y u i o p`) en porte **plus de la moitié** — elle contient `e a i o u r t`, c'est-à-dire l'essentiel des lettres fréquentes du français.

Cela ne dit pas qu'il faut abandonner la rangée de repos comme point d'ancrage : les ergots `F`/`J` sont physiques, et la position de retour doit être enseignée. Cela dit que **la phase « rangée de repos seule » est proportionnellement plus longue et plus pauvre en AZERTY qu'en QWERTY**, et que la remonter vers la rangée du haut plus vite est justifié par la structure de la langue. edclub le fait déjà de fait : `r u` et `e i` arrivent aux leçons 23-27, soit très tôt dans un cours de 485 leçons.

**Aucune source trouvée n'explicite ce raisonnement.** C'est un angle d'attaque libre, et il est chiffré.

### 5.4 QWERTZ suisse romand

`[source primaire]` `typingstudy.com/fr-swiss_french-2/`, 21 leçons, consulté le 29/08/2026.

```
1  Rangée de base          12  w, x et '
2  e et i                  13  è, ù et ^
3  r et u                  14  ç et à
4  q et p                  15  ê, î et -
5  o et m                  16  â, û et ô
6  y, , et .               17  ä, ÿ et ï
7  Lettres majuscules      18  ë, ü et ö
8  v et n                  19  Chiffres
9  g et h                  20  §, ?, !, $, £, <, >, ;, : et _
10 t et z                  21  Toutes les touches
11 c et b
```

**Mise en correspondance avec le cours AZERTY du même éditeur :**

| Leçon | AZERTY | QWERTZ CH | Position physique |
|---|---|---|---|
| 1 | Rangée de base | Rangée de base | identique |
| 2 | e et i | e et i | identique |
| 3 | r et u | r et u | identique |
| 4 | **a** et p | **q** et p | **identique** (auriculaires, rangée du haut) |
| 5 | **z** et o | o et m | divergent |
| 8 | v et n | v et n | identique |
| 9 | g et h | g et h | identique |
| 10 | t et **y** | t et **z** | **identique** (QWERTZ échange Y et Z) |
| 11 | c et b | c et b | identique |
| 12 | w, x et ' | w, x et ' | identique |

**Neuf leçons sur onze se correspondent position par position.** Les divergences (leçons 5 et 6) s'expliquent par la composition différente de la rangée de repos : `q s d f / j k l m` en AZERTY contre `a s d f / j k l ö` en QWERTZ suisse — le `m` doit être introduit séparément côté suisse, le `q` côté AZERTY.

**Différences de couverture des accents :** le QWERTZ suisse ajoute `ö` et `ü` (leçon 18) que l'AZERTY n'a pas ; l'AZERTY a un accès direct à `é è ç à ù` sur la rangée des chiffres que le suisse romand traite autrement. Les touches mortes (`^` `¨`) existent des deux côtés.

**Conclusion architecturale — le résultat le plus directement exploitable de tout ce rapport.** La progression pédagogique doit être définie **en positions physiques** (rangée × doigt × main), et le layout n'est qu'une table de correspondance position → caractère, plus une liste de caractères supplémentaires à insérer dans un module « caractères de la langue ». C'est exactement ce que font les deux éditeurs sérieux du panel (edclub et Typing Study), et cela évite d'écrire deux progressions.

**Y a-t-il une séquence recommandée *spécifique* à AZERTY ou au QWERTZ suisse ?** Non, et c'est un résultat négatif solide : aucune source, ni institutionnelle, ni académique, ni éditeur, ne propose un ordre d'introduction repensé pour AZERTY. Tout ce qui existe est une transposition positionnelle de la séquence QWERTY, augmentée d'un module d'accents. Le seul argument documenté pour s'en écarter est le chiffre de §5.3.

---

## 6. Synthèse : les huit décisions que cette recherche permet de trancher

1. **Découper par doigt, pas par rangée ni par fréquence.** Paire symétrique bilatérale (même doigt, deux mains), index → majeur → annulaire → auriculaire, répété sur chaque rangée. C'est le consensus réel du marché, et il rend le mode « 4 doigts » naturel plutôt qu'exceptionnel.
2. **Motif de leçon ternaire : introduction → révision → exercice, jeu tous les 4 à 6 items.** Régulier sur toute la progression. C'est le rythme de TypingClub sur 650 leçons.
3. **`g`/`h` en fin de rangée de repos**, comme geste de déplacement latéral et non comme touche de repos. Convergence edclub + Typing Study.
4. **Module « accents » dédié, placé juste après les trois rangées de lettres**, avant les majuscules et avant les chiffres : `é è`, `â à`, `ç`, `ê`, `î`, `ù û`, `ô`. C'est la seule spécificité structurelle du français, et la référence du marché la traite ainsi.
5. **Critère de passage = précision ; gradation = fluidité.** Seuil de précision élevé pour valider, jamais de seuil de vitesse pour valider. Le seuil de vitesse de keybr (35 mots/min) est hors de portée d'un enfant dont la norme est 10-20 mots/min, et produit des blocages de plusieurs heures documentés.
6. **Blocage de l'erreur, mais jamais muet.** L'argument décisif est la robustesse en double tâche mesurée chez l'enfant (Capio et al.) ; le contre-exemple de l'amplification d'erreur montre que ce qui compte est l'information tirée de l'erreur, pas son absence.
7. **Détection automatique du blocage + remédiation graduée + déblocage forcé après N tentatives.** C'est le trou de marché : aucun produit enfant francophone ne l'a. TypingClub exige un enseignant, keybr n'a rien, Fort-Dactylo adapte la vitesse mais pas la progression.
8. **Progression définie en positions physiques, layout en table de correspondance.** Neuf leçons sur onze se correspondent entre AZERTY et QWERTZ suisse. Une seule progression, deux tables, plus un module de caractères propres à chaque disposition.

**Le pari spécifique que cette recherche autorise :** la rangée de repos AZERTY ne porte que 23,33 % des frappes du français contre 56,36 % pour la rangée du haut. Écourter la phase « rangée de repos seule » et remonter vite vers `e a i o u r t` est défendable par les chiffres, et personne ne l'argumente publiquement. À vérifier en usage avant de l'ériger en principe — c'est une hypothèse chiffrée, pas un résultat.

---

## Sources

**Sources primaires (produit ou code, consultées le 29/08/2026)**
- TypingClub *Typing Jungle* — table des matières complète : https://www.typingclub.com/sportal/program-3.game
- edclub *Expédition dactylo* (AZERTY, 485 leçons) — table des matières complète : https://www.edclub.com/sportal/program-17.game · fiche : https://www.edclub.com/library/expedition-dactylo
- edclub *Jungle Junior* (250 leçons, pre-K–CP) : https://www.edclub.com/sportal/program-16.game · fiche : https://www.edclub.com/library/jungle-junior
- edclub *Mission dactylo* (QWERTY-CA, 457 leçons, objectif 55 mots/min) : https://www.edclub.com/library/mission-dactylo
- keybr.com, code source : https://github.com/aradzie/keybr.com — `packages/keybr-lesson/lib/guided.ts`, `target.ts`, `key.ts`, `settings.ts`
- Typing Study, cours français AZERTY (22 leçons) : https://www.typingstudy.com/fr-french-3/
- Typing Study, cours suisse romand QWERTZ (21 leçons) : https://www.typingstudy.com/fr-swiss_french-2/
- bépo — Statistiques de répartition par rangée : https://bepo.fr/wiki/Statistiques
- TICKEN — 30 leçons × 30 min, diplôme ≥ 100 CPM / ≤ 1 % fautes : https://www.ticken.fr/dactylographie/ecoles.html
- Fort-Dactylo — 30+ niveaux, vitesse adaptative, dès 6-7 ans : https://fort-dactylo.com/
- Ratatype, cours French AZERTY (19 leçons annoncées, contenu inaccessible) : https://www.ratatype.com/courses/french/

**Sources secondaires**
- Dance Mat Typing, liste des 12 étapes : https://www.dancemattypingguide.com/list-of-dance-mat-typing-stages/
- Donica, Giroux & Faust (2018), *J. Occupational Therapy, Schools & Early Intervention* : https://www.tandfonline.com/doi/full/10.1080/19411243.2018.1512067 · notice ERIC : https://eric.ed.gov/?id=EJ1202875
- Donica, Giroux, Kim & Branson (2021), *Open Journal of Occupational Therapy* 9(3) : https://scholarworks.wmich.edu/ojot/vol9/iss3/13/
- Capio et al., « The possible benefits of reduced errors in the motor skills acquisition of children » : https://pmc.ncbi.nlm.nih.gov/articles/PMC3275454/
- « It Pays to Go Off-Track: Practicing with Error-Augmenting Haptic Feedback » : https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5183591/
- « Speed or Accuracy Instructions During Skill Learning do not Affect the Acquired Knowledge », *Cerebral Cortex Communications* (2020) : https://academic.oup.com/cercorcomms/article/1/1/tgaa041/5889933
- « Lack of spacing effects during piano learning », *PLOS ONE* (2017) : https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0182986
- « Massed practice improves learning of serial motor skills » (2026) : https://journals.sagepub.com/doi/10.1177/17470218251369711
- « Implicit motor learning in primary school children: A systematic review » (2021) : https://www.tandfonline.com/doi/full/10.1080/02640414.2021.1947010
- Wisconsin DPI — Keyboarding at the Elementary Level : https://dpi.wi.gov/bit/standards/elementary-keyboarding *(injoignable au moment de la recherche — DNS)*
- Fréquence des lettres en français : https://www.apprendre-en-ligne.net/crypto/stat/francais.html · https://fr.wikipedia.org/wiki/Fréquence_d'apparition_des_lettres
- keybr, discussion sur le blocage (seuil 343 ms) : https://groups.google.com/g/keybr/c/b4D1xFvS-48
- ClaviGo (~170 exercices, 7 modules) : https://dysclick.fr/clavigo/
- Klavaro, manuel utilisateur : https://klavaro.sourceforge.io/en/manual-en.pdf

**Points restés `[non vérifié]` après cette passe**
- Séquence de touches réelle de Ratatype (compte requis).
- Ordre des leçons et couverture suisse romande de Tap'Touche (aucune documentation publique).
- Seuils numériques exacts des étoiles TypingClub (documentation derrière Cloudflare ; seule la logique 1 étoile = passage, 5 = maîtrise est confirmée).
- Formule exacte des seuils de Klavaro.
- Scope & sequence détaillé de Typing.com (PDF scanné, non exploitable).
- Chiffre « 15 à 30 min/jour pendant 5-6 semaines » attribué au Wisconsin DPI (site injoignable).
- Séquence de Dactylocours (27 leçons, 4 claviers) — non extraite.

RAPPORT T2 TERMINÉ
