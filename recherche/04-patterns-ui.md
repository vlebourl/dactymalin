# Dispositions clavier FR-FR (AZERTY) et CH-FR (QWERTZ) — analyse technique et ergonomique

---

## A. Carte des différences

### A.1 Vue d'ensemble

| Critère | FR-FR (AZERTY) | CH-FR (QWERTZ suisse romand) |
|---|---|---|
| Famille | AZERTY | QWERTZ |
| Chiffres 0-9 | **Nécessitent Shift** | **Directs, sans Shift** |
| Rangée haute | a z e r t y u i o p | q w e r t z u i o p |
| Rangée de repos | q s d f g h j k l m ù | a s d f g h j k l é à |
| é è ç à | è ç à directs ; é direct | é è à directs ; ç = Shift+4 |
| Majuscules accentuées | quasi inaccessibles | via touches mortes |
| Touches mortes | 1 seule touche physique (^ / ¨) | 2 touches physiques → 4 diacritiques (^ ` ~ ¨) + ´ en AltGr |
| Ponctuation courante | . ; : / ? tous sur la rangée basse, `.` et `?` **exigent Shift** | `.` et `,` directs, `;` et `:` exigent Shift |
| Apostrophe `'` | **directe** (touche 4) | Shift-free mais sur rangée des chiffres (touche à droite du 0) |
| Tiret `-` | direct (touche 6) | direct (touche à droite du `.`, rangée basse) |

### A.2 Rangée des chiffres — le point de divergence majeur

**AZERTY FR-FR** (`Digit1` … `Equal`) :

| Code physique | Sans Shift | Shift | AltGr |
|---|---|---|---|
| Backquote | ² | ³ | — |
| Digit1 | & | **1** | — |
| Digit2 | é | **2** | ~ (morte) |
| Digit3 | " | **3** | # |
| Digit4 | ' | **4** | { |
| Digit5 | ( | **5** | [ |
| Digit6 | - | **6** | \| |
| Digit7 | è | **7** | ` (morte) |
| Digit8 | _ | **8** | \ |
| Digit9 | ç | **9** | ^ |
| Digit0 | à | **0** | @ |
| Minus | ) | ° | ] |
| Equal | = | + | } |

**CH-FR QWERTZ** :

| Code physique | Sans Shift | Shift | AltGr |
|---|---|---|---|
| Backquote | § | ° | — |
| Digit1 | **1** | + | ¦ |
| Digit2 | **2** | " | @ |
| Digit3 | **3** | * | # |
| Digit4 | **4** | ç | ° |
| Digit5 | **5** | % | § |
| Digit6 | **6** | & | ¬ |
| Digit7 | **7** | / | \| |
| Digit8 | **8** | ( | ¢ |
| Digit9 | **9** | ) | — |
| Digit0 | **0** | = | — |
| Minus | ' | ? | ´ (morte, accent aigu) |
| Equal | ^ (morte) | ` (morte) | ~ (morte) |

Conséquence pédagogique : **un exercice de chiffres est un exercice à deux mains en AZERTY (Shift obligatoire) et à une main en suisse romand.** C'est la différence la plus lourde de tout le projet.

### A.3 Rangée haute (QWERTY-row)

| Code | FR-FR | CH-FR |
|---|---|---|
| KeyQ | **a** | **q** |
| KeyW | **z** | **w** |
| KeyE | e (AltGr → €) | e (AltGr → €) |
| KeyR … KeyO | r t y u i o | r t **z** u i o |
| KeyY | **y** | **z** |
| KeyP | p | p |
| BracketLeft | ^ / ¨ (**mortes**) | **è** / ü (AltGr → `[`) |
| BracketRight | $ / £ (AltGr → ¤) | ¨ (**morte**) / ! (AltGr → `]`) |

### A.4 Rangée de repos

| Code | FR-FR | CH-FR |
|---|---|---|
| KeyA | **q** | **a** |
| KeyS … KeyL | s d f g h j k l | s d f g h j k l |
| Semicolon | **m** | **é** / ö |
| Quote | **ù** / % | **à** / ä (AltGr → `{`) |
| Backslash | * / µ | $ / £ (AltGr → `}`) |

### A.5 Rangée basse

| Code | FR-FR | CH-FR |
|---|---|---|
| IntlBackslash | < / > | < / > (AltGr → `\`) |
| KeyZ | **w** | **y** |
| KeyX…KeyN | x c v b n | x c v b n |
| KeyM | **,** / ? | **m** |
| Comma | **;** / . | **,** / ; |
| Period | **:** / / | **.** / : |
| Slash | **!** / § | **-** / _ |

### A.6 Accents et touches mortes — synthèse

| Caractère | FR-FR | CH-FR |
|---|---|---|
| é | touche directe (Digit2) | touche directe (Semicolon) |
| è | touche directe (Digit7) | touche directe (BracketLeft) |
| à | touche directe (Digit0) | touche directe (Quote) |
| ù | touche directe (Quote) | **morte ` (Shift+Equal) puis u** |
| ç | touche directe (Digit9) | **Shift+4** |
| ê î ô û â | **morte ^ (BracketLeft) puis voyelle** | **morte ^ (Equal) puis voyelle** |
| ë ï ü ö ä | **Shift+^ (¨) puis voyelle** | **morte ¨ (BracketRight) puis voyelle** |
| É | **inaccessible en pratique sous Windows** ; CapsLock+é sous macOS | **AltGr+' (´) puis Shift+E** |
| È À | idem É | morte ` puis Shift+lettre |
| Ç | Alt+0199 / ⌥ç sous macOS | Shift+4 ne donne que ç minuscule ; Ç non standard |
| œ / Œ | AltGr+o sur variantes récentes, absent du FR-FR legacy | absent |
| « » | AltGr+w / AltGr+x sur variantes ; non garanti | absent |

**Touches mortes : comportement à retenir.** Une touche morte n'émet rien au premier appui. Elle arme un état de composition. Si la seconde touche n'est pas combinable (ex. `^` puis `s`), la plupart des systèmes émettent `^s` — deux caractères. C'est une source d'erreurs silencieuses pour un enfant : il a « appuyé sur la bonne touche » et rien ne s'est affiché.

**AltGr.** Sous Windows/Linux, `AltGr` = `Ctrl+Alt` (droite). Sous macOS, il n'y a pas d'AltGr : l'équivalent est `⌥ Option`, **avec des correspondances totalement différentes** (le `@` est en ⌥+à sur Mac FR, `€` en ⌥+$, etc.). Toute indication visuelle d'AltGr doit donc être conditionnée à l'OS, sinon elle est fausse une fois sur trois.

---

## B. Attribution canonique doigt-par-touche — frappe à 10 doigts

Convention : AurG/AnnG/MajG/IndG = auriculaire, annulaire, majeur, index gauche ; idem à droite. Les colonnes sont identiques dans les deux dispositions (la méthode est physique, pas logique) — **seules les lettres changent de doigt**.

### B.1 FR-FR (AZERTY)

| Doigt | Rangée chiffres | Rangée haute | Repos | Rangée basse | Modificateurs |
|---|---|---|---|---|---|
| **AurG** | ² & | **a** | **q** | < **w** | Tab, Verr.Maj, Shift G, Ctrl G |
| **AnnG** | é | **z** | **s** | **x** | — |
| **MajG** | " | **e** | **d** | **c** | — |
| **IndG** | ' ( | **r t** | **f g** | **v b** | — |
| **Pouce G** | — | — | — | **Espace** | Alt |
| **IndD** | - è | **y u** | **h j** | **n ,** | — |
| **MajD** | _ | **i** | **k** | **;** | — |
| **AnnD** | ç | **o** | **l** | **:** | — |
| **AurD** | à ) = | **p ^ $** | **m ù \*** | **!** | Entrée, Retour arr., Shift D, Ctrl D |
| **Pouce D** | — | — | — | **Espace** | **AltGr** |

Points saillants AZERTY :
- L'auriculaire droit hérite d'une charge anormale : `p ^ $ m ù * !` plus Entrée et Shift. `m`, lettre fréquente en français, est sur une touche d'auriculaire — c'est la faiblesse ergonomique connue de l'AZERTY.
- `a` et `q` sont tous deux sur l'auriculaire gauche ; `a` est la 3ᵉ lettre la plus fréquente du français.
- La virgule `,` est sur l'index droit (position du `m` QWERTY), le point `.` exige Shift.

### B.2 CH-FR (QWERTZ)

| Doigt | Rangée chiffres | Rangée haute | Repos | Rangée basse | Modificateurs |
|---|---|---|---|---|---|
| **AurG** | § 1 | **q** | **a** | < **y** | Tab, Verr.Maj, Shift G, Ctrl G |
| **AnnG** | 2 | **w** | **s** | **x** | — |
| **MajG** | 3 | **e** | **d** | **c** | — |
| **IndG** | 4 5 | **r t** | **f g** | **v b** | — |
| **Pouce G** | — | — | — | **Espace** | Alt |
| **IndD** | 6 7 | **z u** | **h j** | **n m** | — |
| **MajD** | 8 | **i** | **k** | **,** | — |
| **AnnD** | 9 | **o** | **l** | **.** | — |
| **AurD** | 0 ' ^ | **p è ¨** | **é à $** | **-** | Entrée, Retour arr., Shift D, Ctrl D |
| **Pouce D** | — | — | — | **Espace** | **AltGr** |

Points saillants CH-FR :
- `m` revient à l'index droit (position QWERTY canonique) — nettement plus confortable qu'en AZERTY.
- L'auriculaire droit porte `é à è ¨ ^ '` : les accents français sont tous concentrés sur le doigt le plus faible. C'est le défaut symétrique de l'AZERTY.
- `y` et `z` sont permutés par rapport à QWERTY : `z` (rare en français) passe à l'index droit, `y` (rare aussi) à l'auriculaire gauche. Impact faible en français.
- La règle « Shift opposé » (Shift gauche pour une lettre tapée à droite et inversement) est indispensable ici, car `ç` = Shift+4 est une combinaison main gauche seule si on utilise le mauvais Shift.

### B.3 Règle de l'espace

Convention classique : **espace au pouce de la main qui n'a pas frappé la dernière lettre**. En pratique, pour un enfant, imposer un seul pouce (le droit, dominant) est plus simple et suffisant au MVP. La règle alternée peut être une progression ultérieure.

---

## C. Mode débutant 4 doigts (pouce G, pouce D, index G, index D)

### C.1 Découpage retenu

Le seul découpage cohérent est **vertical, par moitié de clavier**, calqué sur la ligne médiane physique :

- **Index gauche** : tout ce qui se trouve à gauche de la frontière `t / g / b` incluse.
- **Index droit** : tout ce qui se trouve à droite, à partir de `y / h / n` (AZERTY) ou `z / h / n` (CH-FR).
- **Pouces** : barre d'espace uniquement.

### C.2 FR-FR — mode 4 doigts

| Doigt | Touches |
|---|---|
| **Index G** | ² & é " ' ( — a z e r t — q s d f g — w x c v b |
| **Index D** | - è _ ç à ) = — y u i o p ^ $ — h j k l m ù * — n , ; : ! |
| **Pouce G** | Espace |
| **Pouce D** | Espace |

### C.3 CH-FR — mode 4 doigts

| Doigt | Touches |
|---|---|
| **Index G** | § 1 2 3 4 5 — q w e r t — a s d f g — y x c v b |
| **Index D** | 6 7 8 9 0 ' ^ — z u i o p è ¨ — h j k l é à $ — n m , . - |
| **Pouce G** | Espace |
| **Pouce D** | Espace |

### C.4 Touches problématiques en mode 4 doigts

Classées par gravité :

1. **Shift — bloquant.** Aucun des quatre doigts autorisés ne peut tenir Shift tout en frappant. Conséquence directe :
   - **AZERTY : les chiffres 0-9 sont inaccessibles en mode 4 doigts.** C'est structurel, pas contournable. Trois issues possibles : (a) exclure les chiffres du mode débutant en AZERTY, (b) autoriser exceptionnellement l'auriculaire gauche pour Shift et l'annoncer comme « la touche magique », (c) rediriger vers le pavé numérique — inutilisable sur portable. L'option (a) ou (b) doit être tranchée explicitement.
   - **CH-FR : les chiffres passent sans problème.** Asymétrie forte entre les deux publics.
   - Majuscules : hors de portée dans les deux dispositions. Le contenu du mode 4 doigts doit être **entièrement en minuscules**.
2. **AltGr — hors de portée.** Le pouce droit tient l'espace ; lui donner AltGr crée un conflit. Exclure tout caractère AltGr du mode débutant (`@ # € [ ] { } \ | ~`). Aucun contenu français adapté 7-12 ans n'en a besoin.
3. **Touches mortes — praticables mais coûteuses.** `^` et `¨` sont physiquement atteignables par l'index droit dans les deux dispositions, mais la séquence à deux appuis avec un seul doigt oblige à un aller-retour long (`^` est en haut à droite, la voyelle au centre). Recommandation : accents circonflexes et trémas **exclus du mode 4 doigts**, réservés au mode 10 doigts.
4. **Auriculaires détournés.** `a` (AZERTY) et `q` (CH-FR) sont à l'extrême gauche, `ù é à $ * !` à l'extrême droite : l'index doit parcourir toute la moitié du clavier. Ergonomiquement acceptable en session courte, mais c'est l'argument pour limiter les mots du mode débutant aux lettres centrales au début.
5. **Entrée / Retour arrière.** Retour arrière est indispensable (correction) et se trouve à l'extrême haut droite : à attribuer à l'index droit, avec un repère visuel dédié.

### C.5 Progression suggérée pour le mode 4 doigts

| Palier | AZERTY | CH-FR |
|---|---|---|
| 1 | f g h j + espace | f g h j + espace |
| 2 | + r t y u, d s, k l | + r t z u, d s, k l |
| 3 | + v b n, c, e, i, o | + v b n m, c, e, i, o |
| 4 | + a q w, p m | + a q w y, p |
| 5 | + é è à ç (touches directes, rangée haute) | + é è à (touches directes, colonne droite) |
| 6 | chiffres — **nécessite l'exception Shift** | chiffres — accessibles directement |

---

## D. Pièges spécifiques au français

1. **Chiffres sous Shift en AZERTY.** Déjà traité, c'est le piège n°1. Un enfant qui tape « 7 » sans Shift obtient « è ». L'erreur produit un caractère plausible, pas une absence — donc silencieuse et déroutante. L'app doit détecter ce cas précis et le signaler comme « oublie du Shift », pas comme « mauvaise touche ».
2. **Majuscules accentuées.** É À È Ç Œ sont typographiquement obligatoires en français (« École », « À bientôt », « Ça »). Elles sont :
   - En AZERTY Windows : **non produisibles au clavier standard**. Verr.Maj + é donne `2` (Verr.Maj verrouille aussi la rangée des chiffres sur le pilote FR historique).
   - En AZERTY macOS : Verr.Maj + é donne bien `É`. Comportement OS-dépendant → toute consigne affichée doit tenir compte de l'OS détecté.
   - En CH-FR : uniquement via touche morte (`´` en AltGr+`'`, puis Shift+E). Séquence à trois touches.
   → **Recommandation : bannir les majuscules accentuées du contenu tapé du MVP.** Elles peuvent apparaître dans les textes d'interface, jamais dans les mots à taper.
3. **Cédille.** `ç` direct en AZERTY (touche 9), `Shift+4` en CH-FR. Un même mot (« garçon », « français ») a donc un coût de frappe très différent selon la disposition. En mode 4 doigts, « garçon » est faisable en AZERTY et **impossible en CH-FR** (Shift requis). Le corpus de mots doit être filtré par disposition **et** par mode.
4. **Apostrophe.** Omniprésente en français (« l'école », « j'ai », « c'est »). En AZERTY elle est directe (touche 4, index gauche) — excellent. En CH-FR elle est sur la touche à droite du `0`, rangée des chiffres, auriculaire droit — position ingrate et éloignée. Attention aussi à l'apostrophe typographique `’` : ne jamais l'exiger, aucune des deux dispositions ne la produit sans AltGr/variante. **Normaliser sur l'apostrophe droite `'` dans tout le corpus.**
5. **Tiret.** Fréquent en français (« est-ce », « aujourd'hui » non, mais « peut-être », « rendez-vous »). Direct dans les deux dispositions, mais à des endroits opposés : AZERTY = rangée des chiffres, touche 6, index droit ; CH-FR = rangée basse, à droite du `.`, auriculaire droit. Ne pas confondre avec le tiret bas `_` (Shift en CH-FR, direct sur la touche 8 en AZERTY).
6. **Point et virgule inversés en AZERTY.** La virgule est directe, le **point exige Shift** (Shift+`;`). C'est contre-intuitif et une source d'erreur permanente. En CH-FR, point et virgule sont tous deux directs. Impact : les phrases complètes sont un exercice à deux mains en AZERTY.
7. **Le `ù` fantôme.** En français, `ù` n'existe que dans le mot « où ». L'AZERTY lui consacre une touche entière en rangée de repos ; le CH-FR l'oblige à passer par une touche morte. Cas marginal mais amusant à traiter comme exercice spécifique.
8. **`ï` et `ë`.** « Noël », « maïs », « Noëlle » : nécessitent le tréma. En AZERTY c'est `Shift+^` puis la voyelle (donc Shift + touche morte + voyelle = 3 gestes). Contenu à réserver au niveau avancé.
9. **Séquence morte cassée.** `^` suivi d'une consonne produit deux caractères. Un enfant tapant `^` puis `s` par erreur voit apparaître `^s` : deux erreurs pour une faute. La logique de comparaison caractère-par-caractère doit gérer ce cas, sinon le retour visuel devient incompréhensible.
10. **Verr.Maj sur AZERTY.** Sous Windows FR, Verr.Maj actif transforme la rangée des chiffres en chiffres (comportement shift-lock). Un enfant qui active Verr.Maj sans le savoir voit tout changer. `getModifierState('CapsLock')` permet de le détecter et d'afficher un avertissement — à faire.

---

## E. Détection automatique dans un navigateur : ce qui marche, ce qui ne marche pas

### E.1 Fiable

**`navigator.keyboard.getLayoutMap()` — Keyboard Map API.** Retourne une table `code physique → caractère produit sans modificateur`. C'est le seul signal direct et véridique.

Discriminants à interroger :

| Test | Résultat | Conclusion |
|---|---|---|
| `KeyQ` | `a` | famille AZERTY |
| `KeyQ` | `q` + `KeyY` = `z` | famille QWERTZ |
| `KeyQ` | `q` + `KeyY` = `y` | famille QWERTY |
| `Semicolon` | `m` | AZERTY FR ou BE |
| `Digit6` | `-` vs `§` | FR-FR vs Belge |
| `Digit8` | `_` vs `!` | FR-FR vs Belge |
| `Semicolon` | `é` vs `ö` | **CH-FR vs CH-DE** |
| `BracketLeft` | `è` vs `ü` | **CH-FR vs CH-DE** |
| `Quote` | `à` vs `ä` | **CH-FR vs CH-DE** |

Ces trois derniers tests règlent proprement le cas suisse, qui est autrement indiscernable : **le suisse romand et le suisse allemand partagent le même clavier physique et ne diffèrent que par le pilote logiciel.**

Limites : **Chromium uniquement** (Chrome, Edge, Brave, Opera desktop). **Absent de Firefox et de Safari.** Nécessite un contexte sécurisé (HTTPS). Absent sur mobile/tablette. Aucune permission n'est requise (contrairement au Keyboard Lock).

**Inférence passive par `KeyboardEvent.code` + `KeyboardEvent.key`.** Fonctionne partout, sur tout navigateur. `code` est l'identifiant physique de la touche (nommé selon QWERTY US), `key` est le caractère effectivement produit. Dès la première frappe, `code === 'KeyQ' && key === 'a'` prouve l'AZERTY. C'est le repli universel, et il est plus fiable que toute heuristique — mais il est **rétrospectif** : il faut que l'enfant ait tapé au moins une touche discriminante. Il peut être transformé en atout : un écran d'accueil « tape la lettre A » identifie la disposition en une frappe, sans aucune API exotique.

**`getModifierState('CapsLock')` et `('Shift')`.** Fiables partout, indispensables pour les pièges AZERTY.

**Détection de l'OS** via `navigator.userAgentData.platform` (Chromium) ou `navigator.platform` (déprécié mais universel). Nécessaire pour savoir s'il faut parler d'`AltGr` ou d'`⌥ Option`, et pour la question Verr.Maj + é.

**Événements de composition** (`compositionstart` / `compositionupdate` / `beforeinput` avec `inputType = insertCompositionText`) et `key === 'Dead'` : signalent une touche morte armée. Comportement inégal entre navigateurs — Safari et Firefox ne produisent pas la même séquence que Chromium. À traiter comme un signal indicatif, jamais comme une source de vérité.

### E.2 Non fiable — à ne jamais utiliser seul

| Signal | Pourquoi il échoue |
|---|---|
| `navigator.language` / `languages` | Indique la langue **d'interface**, pas la disposition. Un Genevois avec un macOS en anglais renvoie `en-US` sur un clavier CH-FR. Un Français avec `fr-FR` peut très bien être en BÉPO ou en QWERTY US. |
| Fuseau horaire (`Intl.DateTimeFormat`) | `Europe/Zurich` vs `Europe/Paris` : heuristique douce, fausse en cas de VPN, de voyage, d'expatriation, de machine mal configurée. Zurich ne dit rien de romand vs alémanique. |
| Géolocalisation IP | Même faiblesse, plus lente, et demande une requête réseau. |
| `navigator.hardwareConcurrency`, empreinte matérielle | Aucun rapport avec la disposition. |
| Sérigraphie des touches | **Aucune API ne l'expose.** Une machine peut avoir un clavier physique AZERTY avec un pilote QWERTY actif — cas fréquent chez les développeurs et les machines d'occasion. |
| Forme physique ISO vs ANSI | Non exposée. On ne peut déduire l'existence de la touche `IntlBackslash` que si l'utilisateur l'a effectivement pressée. |
| Changement de disposition en cours de session | L'OS permet de basculer (Alt+Shift, ⌃⌥Espace) **sans qu'aucun événement DOM ne soit émis**. `navigator.keyboard` expose un événement `layoutchange` expérimental, non implémenté partout. En pratique : une session peut changer de disposition en silence. |

### E.3 Pourquoi le sélecteur manuel reste indispensable

Cinq raisons cumulatives, chacune suffisante :

1. **Couverture navigateur.** La seule API fiable est absente de Firefox et Safari. Sur un Mac familial sous Safari, aucune détection directe n'est possible avant la première frappe.
2. **Le cas suisse est le plus exposé.** CH-FR et CH-DE partagent le clavier physique. Sans `getLayoutMap`, seule une frappe sur `Semicolon` ou `BracketLeft` les distingue — et un enfant débutant ne tapera pas ces touches spontanément.
3. **Divergence sérigraphie / pilote.** Un clavier gravé AZERTY piloté en QWERTY (ou l'inverse) est un cas réel. La détection dira la vérité logicielle ; l'enfant regarde la vérité physique. Le sélecteur est le seul arbitre.
4. **Changement silencieux en session.** Rien ne notifie l'application. Il faut un moyen pour l'utilisateur de corriger sans redémarrer.
5. **Cas pédagogique volontaire.** Un parent peut vouloir entraîner l'enfant sur la disposition de l'école (souvent différente de celle de la maison). La détection est alors un obstacle, pas une aide.

### E.4 Stratégie recommandée

1. Tenter `navigator.keyboard.getLayoutMap()` si disponible → verdict fiable, appliqué silencieusement.
2. Sinon, faire de la première frappe un test déguisé (« tape la lettre A ») et lire `code` + `key`.
3. Dans tous les cas, **afficher la disposition retenue de façon visible et permanente**, avec un sélecteur à un clic (FR-FR / CH-FR) et un aperçu du clavier — l'enfant ou le parent valide en un coup d'œil en comparant avec le clavier réel.
4. Mémoriser le choix manuel et lui donner **priorité absolue** sur toute détection ultérieure.
5. Surveiller en continu les incohérences pendant le jeu : si la touche pressée (`code`) ne correspond pas à la disposition supposée alors que `key` est correct, proposer discrètement de rebasculer.