# Prompts Google Stitch — une section par vue


---

Projet Stitch : `projects/866540852572627722`


---

## V1 — Accueil

**Rôle** : Point d'entree : lancer une lecon en un clic et voir quel clavier l'app a reconnu.

**Wireframe**
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

**Prompt Stitch**
```
Design a desktop web home screen, 1440x900, for a French typing-practice app made for a 7-to-12-year-old child. Tone: calm, warm, uncluttered, closer to a quiet reading app than to a game. Background is a soft cream (not pure white), text is deep charcoal, one single accent colour. Rounded soft shapes, generous whitespace, flat vector style, no gradients, no mascot, no confetti, no badges. Layout is a single centred vertical column, max 720px wide, everything stacked in reading order. Top right corner: one small round outlined settings gear icon button, nothing else in the top bar. Centre column from top to bottom: a very large friendly title in French, exactly the text: DactyMalin. Under it, a simple flat line-art illustration of a computer keyboard seen from above, muted colours, no hands and no faces. Under the illustration, one very large primary rounded button, at least 340 by 88 pixels, label text 32px, exact French label: On commence !. Under the button, one quiet line of secondary text followed by a small outlined pill button: Ton clavier : Francais (AZERTY) then the button Changer. Below, a plain text link: Ma carte du clavier. At the very bottom, a small tertiary text link with a speaker icon: Revoir : ou mettre mes doigts. Typography: open humanist sans-serif with a single-storey a and g, body text never smaller than 20px, contrast at least 7:1. No score, no number, no timer, no progress bar, no leaderboard anywhere. Every element must stay distinguishable in greyscale.
```

---

## V2 — Choix du clavier

**Rôle** : Identifier ou confirmer la disposition reellement en usage sur la machine, en une frappe et un clic.

**Wireframe**
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
|  suivant.                                            |
+------------------------------------------------------+
```

**Prompt Stitch**
```
Design a desktop web screen, 1440x900, for choosing the keyboard layout in a French typing app for a 7-to-12-year-old child. Same calm system as the rest of the app: soft cream background, deep charcoal text, one accent colour, rounded flat shapes, no gradients, no mascot. Top left: a large round back arrow button. Centred page title in French, exactly: Regarde ton vrai clavier. Below it, one single big instruction line, 40px, with a round speaker icon button beside it, exact text: Appuie sur la touche A. Below that, two large equal cards side by side, each 460px wide, generous inner padding, thick rounded borders. Left card header: Francais and under it AZERTY, with a filled check badge in its corner marking it as the detected one and a visibly thicker border. Right card header: Suisse and under it QWERTZ, unselected, thinner border. Inside each card, a faithful miniature keyboard drawing showing only two rows of keys, key labels in uppercase and at least 18px: left card rows A Z E R T Y then Q S D F G H; right card rows Q W E R T Z then A S D F G H. At the bottom of each card, a wide rounded confirm button with the exact label: C'est celui-la. Under both cards, one centred quiet explanatory sentence in French: Sur ce clavier, les chiffres arrivent au palier suivant. Selection must be readable without colour: use border weight, a check mark and card elevation, not hue alone. No scores, no timers, no technical jargon.
```

---

## V3 — Guide-doigt

**Rôle** : Installer une fois pour toutes la frontiere entre les deux moities du clavier et le role de l'index et des pouces.

**Wireframe**
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

**Prompt Stitch**
```
Design a desktop web onboarding screen, 1440x900, that teaches a 7-to-12-year-old child the vertical split of the keyboard. Same calm system: cream background, charcoal text, flat vector, rounded, no gradients. Top left large round back arrow. Centred title in French, exactly: Chaque main garde son cote, with a round speaker icon button to its right. Main graphic, centred and wide: one keyboard drawn as TWO clearly separated blocks with a visible gap and a thick vertical divider line between them. Left block keys, uppercase, at least 20px: A Z E R T / Q S D F G / W X C V B. Right block keys: Y U I O P / H J K L M / N , ; :. The divider carries a small caption in French: la frontiere. Under the left block the caption main gauche, under the right block main droite. Below the keyboard, two simple flat schematic hands seen from above, neutral silhouettes, no skin tone, no jewellery, drawn STATIC with no motion lines, one under each block, each with only the index finger raised and filled in the block colour. Under them a wide detached spacebar shape with the exact caption inside: tes deux pouces. At the bottom, two buttons side by side: an outlined one with a speaker icon labelled Reecouter, and a large primary one labelled J'ai compris. The left and right blocks use two distinct hues but must also differ in position and label so the screen still reads in greyscale. No scores, no timer, no percentage.
```

---

## V4 — Lecon

**Rôle** : Le coeur du MVP : faire taper un mot ou un nombre en montrant la touche cible et le cote de la main sur un clavier fidele.

**Wireframe**
```
+------------------------------------------------------+
| <-  Les touches de cette lecon : f g h j t y u esp.  |
|            (*)(*)(*)( )( )( )( )( )( )               |
|                                                      |
|                    j u   t u                         |
|                    -                                 |
|                                                      |
|  +---------------------+ || +---------------------+  |
|  | 2 & e " ' (   [X]   | || | - e _ c a )   [X]   |  |
|  | a z e r [T]         | || | y u i o p           |  |
|  | q s d f. g          | || | h j. k l m u        |  |
|  | w x c v b           | || | n , ; : !           |  |
|  +---------------------+ || +---------------------+  |
|        +------------- espace -------------+          |
|        +----------------------------------+          |
|                                                      |
|            [ Je tape sans regarder ]                 |
+------------------------------------------------------+
```

**Prompt Stitch**
```
Design the main exercise screen of a French typing app for a 7-to-12-year-old child, desktop 1440x900. CRITICAL RULE: exactly TWO stacked zones and NO permanent hands panel anywhere on this screen. Cream background, charcoal text, flat rounded vector, no gradients. Top bar: round back arrow at left, then a quiet permanent banner in French, exact text: Les touches de cette lecon : f g h j t y u espace. Under it a centred row of nine small circular pips showing progress in the block, the first three filled, the rest hollow; no digits, no percentage, no timer, no error counter anywhere on screen. ZONE 1, upper third: the word to type, lowercase, huge, around 110px, wide letter spacing, exact content: ju tu. Already typed letters are softly dimmed, the current letter is enlarged and underlined with a thick accent bar. No red, no wrong letter is ever shown. ZONE 2, lower two thirds: a large faithful AZERTY keyboard drawn as THREE spatially separated blocks with visible gaps, left half, right half, and a detached wide spacebar underneath, plus a thick vertical divider between the halves. Key labels uppercase, at least 20px. One single target key, T in the left block, is drawn at full saturation with a soft pulsing halo and slightly enlarged. Keys outside the lesson set are drawn but dimmed and flat. The number row is always drawn, showing both legends per key and a small padlock icon. Small raised dashes mark F and J. Bottom centre: a child-sized outlined button labelled Je tape sans regarder. Every state must remain distinguishable in greyscale.
```

---

## V5 — Fin de bloc

**Rôle** : Celebrer ce qui a ete reussi et montrer ce que les nouvelles touches permettent d'ecrire, sans jamais afficher de performance.

**Wireframe**
```
+------------------------------------------------------+
|                                                      |
|                     Bravo !                          |
|                                                      |
|            *  *  *  *  *  *  *  *                    |
|                                                      |
|       Tu ecris maintenant : tu, jus, fut             |
|                                                      |
|   +----------------------------------------------+   |
|   |  clavier miniature - T Y U s'illuminent      |   |
|   +----------------------------------------------+   |
|                                                      |
|      +----------------+   +----------------+         |
|      |    Encore      |   |    Retour      |         |
|      +----------------+   +----------------+         |
|                                                      |
|              Ma carte du clavier                     |
+------------------------------------------------------+
```

**Prompt Stitch**
```
Design an end-of-block celebration screen for a French typing app for a 7-to-12-year-old child, desktop 1440x900. Warm but restrained: cream background, charcoal text, one accent colour, flat rounded vector, NO confetti, NO fireworks, NO mascot, NO full-screen animation. Single centred column, max 760px. From top: a large friendly headline in French, exact text: Bravo !. Below it, one horizontal row of eight filled star shapes, evenly spaced, drawn figuratively with no number next to them and no fraction such as 8/10. Below the stars, one sentence in French, 28px, exact text: Tu ecris maintenant : tu, jus, fut. Below that, a rounded card containing a small faithful keyboard drawing where three keys, T, Y and U, are highlighted at full saturation with a soft glow while every other key stays dimmed, communicating newly unlocked keys. Under the card, exactly two buttons side by side: a large primary rounded button labelled Encore, visually dominant and clearly the default action, and a smaller outlined button labelled Retour. At the bottom, one small quiet text link: Ma carte du clavier. Absolutely forbidden on this screen: any time, any speed, any words per minute, any percentage, any error count, any comparison with a previous session, any ranking. The highlighted keys must remain identifiable in greyscale through glow and contrast, not hue alone. Typography is an open sans-serif with single-storey a and g, nothing below 20px.
```

---

## V6 — Carte de progression

**Rôle** : Montrer le clavier qui se colore palier apres palier et nommer le prochain palier par ce qu'il debloque.

**Wireframe**
```
+------------------------------------------------------+
| <-            Ta carte du clavier                    |
|                                                      |
|  +------------------------+ || +-----------------+   |
|  | 2 & e " ' (      [X]   | || | - e _ c a ) [X] |   |
|  | a z e R T              | || | Y U i o p       |   |
|  | q S D F G              | || | H J K L m u     |   |
|  | w x c v b              | || | n , ; : !       |   |
|  +------------------------+ || +-----------------+   |
|                                                      |
|  (v) Palier 1  tes index      f g h j t y u          |
|  (v) Palier 2  + r d s k l    sur, dur, jus          |
|  ( >) Palier 3  + v b n c e i o   chat, ecole        |
|  [X] Palier 4  tes majeurs aident tes index          |
|  [X] Palier 5  ton petit doigt ouvre les chiffres    |
|                                                      |
|            [ Continuer la lecon ]                    |
+------------------------------------------------------+
```

**Prompt Stitch**
```
Design a progression map screen for a French typing app for a 7-to-12-year-old child, desktop 1440x900. Same calm system: cream background, charcoal text, flat rounded vector, one accent hue plus neutrals, no gradients, no mascot. Top left round back arrow, centred title in French, exact text: Ta carte du clavier. Upper half: one large faithful keyboard drawn as two separated halves with a vertical divider and a detached spacebar. Keys already mastered are filled and saturated, keys not yet unlocked are pale grey and flat, and the whole number row carries a small padlock icon. This coloured keyboard IS the progress indicator, so there is no bar, no percentage and no number anywhere. Lower half: a vertical list of five wide rounded rows, each row naming a stage by what it opens, never by a score. Exact French row texts, top to bottom, each preceded by a state icon, a check for done, a small arrow for current, a padlock for locked: Palier 1 - tes index : f g h j t y u; Palier 2 - + r d s k l : sur, dur, jus; Palier 3 - + v b n c e i o : chat, ecole; Palier 4 - tes majeurs viennent aider tes index; Palier 5 - ton petit doigt ouvre les chiffres. The current row is visually raised and outlined. At the bottom, one large primary rounded button labelled Continuer la lecon. No dates, no durations, no speed, no stars count, no comparison. States must read in greyscale through icons and fill, not hue.
```

---

## V7 — Reglages

**Rôle** : Regler la disposition, le son, l'espacement du texte et les animations, et rejouer le guide-doigt.

**Wireframe**
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
+------------------------------------------------------+
```

**Prompt Stitch**
```
Design a settings screen for a French typing app used by a 7-to-12-year-old child on a desktop, 1440x900. Same calm system: cream background, deep charcoal text, flat rounded vector, one accent colour, no gradients, no icons other than the few described. Top left round back arrow, centred title in French, exact text: Reglages. Single centred column, max 760px, rows separated by generous vertical spacing and thin hairline dividers, every label at least 22px. Row one, label Clavier, with two large illustrated radio options stacked or side by side, each showing a tiny two-row keyboard thumbnail: Francais AZERTY, selected, and Suisse QWERTZ, unselected. Row two, label Sons, with a big rounded toggle switch and the state word beside it: Oui. Row three, label Texte plus espace, toggle off, state word Non. Row four, label Animations douces, toggle on, state word Oui. Then a section divider carrying the small heading Les couleurs, under which sit three legend chips in a row, each a coloured rounded square followed by its French caption: main gauche, main droite, espace : tes pouces. At the bottom, one wide outlined button with a speaker icon and the exact label: Revoir : ou mettre mes doigts. Toggles must show their state through position and the written word Oui or Non, never through colour alone, so the screen stays usable in greyscale. Nothing on this page mentions accounts, profiles, statistics, scores or parental dashboards.
```