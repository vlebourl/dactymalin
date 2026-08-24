# Évaluation — Itération 001

Testé en direct sur http://localhost:3000 (Chromium/Playwright, frappes émises en couples `(code, key)` AZERTY et QWERTZ-CH réalistes sur `window`). 6 blocs joués en FR-FR, 1 bloc en CH-FR, ~60 items tapés, 5 tailles de fenêtre, `prefers-reduced-motion` émulée, localStorage corrompu.

## Scores

| Critère | Note | Poids | Pondéré |
|---|---|---|---|
| Design | 6 / 10 | 0.3 | 1.8 |
| Originality | 6 / 10 | 0.2 | 1.2 |
| Craft | 6 / 10 | 0.3 | 1.8 |
| Functionality | 7 / 10 | 0.2 | 1.4 |

Score pondéré : 6.2 / 10

## Verdict : FAIL (seuil 7.0)

Aucun échec disqualifiant. Vérifié explicitement : aucun WPM ni chiffre de performance, aucun classement, aucun chronomètre ni décompte, aucun rouge/croix/buzzer sur erreur (l'erreur est un gris désaturé + réduction d'échelle, le mot reste intact après 40 frappes fausses consécutives), aucun item hors palier sur ~60 items générés dans les deux dispositions, aucune chaîne anglaise, `<title>` et V1 = « Tape avec moi », `lang="fr"`, zéro erreur ni warning console sur les 7 vues.

---

## Problèmes critiques (à corriger)

1. **`legendes()` inverse la rangée des chiffres en CH-FR — la leçon demande « 4 » et la touche affiche « ç ».**
   `src/core/layouts.ts:211-212` : `if (/^[0-9]$/.test(base)) return { haut: base, bas: maj }`. La légende `bas` est la dominante visuelle. En AZERTY, `base='&'` et `maj='1'` → gros `&`, petit `1` : correct. En CH-FR, `base='4'` et `maj='ç'` → gros **`ç`**, petit `4` : faux. Constaté en jeu (`gan-harness/screenshots/22-v4-qwertz.png`) : le bandeau annonce « E F J N S T U **4 5 6 7** ESPACE » et les quatre touches déverrouillées portent `ç`, `%`, `&`, `/` en gros.
   → Ne pas déduire la hiérarchie du type de caractère. Faire porter par la table de disposition un champ explicite `legendePrincipale` (= `base`) et `legendeSecondaire` (= `maj`), et rendre toujours `base` en dominant. AZERTY donne alors `&` gros / `1` petit, CH donne `4` gros / `ç` petit — les deux corrects sans branche conditionnelle.

2. **`e.preventDefault()` sur `Tab` tue la navigation clavier de toute l'application.**
   `src/hooks/useKeyInput.ts:47` : `if (e.code === 'Space' || e.code === 'Tab') e.preventDefault();`. Le hook est monté sur `window` dès V2. Mesuré : 4 × `Tab` depuis V2 laissent `document.activeElement === BODY` ; les boutons « C'est celui-là » sont inatteignables au clavier. Aucun anneau de focus non plus (`outline-style: none` sur l'élément focalisé).
   → Retirer `Tab` de la garde (ne jamais l'intercepter). Ne `preventDefault()` `Space` que lorsque la vue leçon est active ET que `document.activeElement` n'est pas un contrôle focalisable. Ajouter un `:focus-visible` visible (anneau 3 px teal) sur tous les boutons.

3. **Contraste du mot cible sous le seuil de 7:1 sur les lettres non courantes.**
   Mesuré sur fond `rgb(247,243,233)` : lettre courante `rgb(31,42,45)` = **13.28:1** ✅ ; toutes les autres lettres du mot `rgb(91,104,107)` = **5.21:1** ❌. Ce sont précisément les lettres que l'enfant doit lire ensuite. Le cahier impose 7:1 sur le texte cible, pas seulement sur le caractère courant.
   → Remonter les lettres non tapées à `rgb(63,76,79)` ou plus sombre (≥ 7:1) et n'utiliser le gris clair que pour les lettres **déjà tapées**. Aujourd'hui les deux partagent la même couleur : l'état « tapé » et l'état « à venir » sont indiscernables (contraire à F1 « lettres tapées estompées »).

## Problèmes majeurs (à corriger)

4. **CH-FR ne propose jamais de nombre alors que V2 le promet.** Bloc CH palier 1 joué en entier : `["ne","je","net","juste","sujet","une tente","tes","jeunes"]` — contenu strictement identique à FR-FR, alors que le bandeau déverrouille `4 5 6 7` et que V2 affiche « Sur ce clavier, tu tapes des nombres dès la première leçon. » L'ordre de préférence « vrai mot > nombre » fait que le nombre n'apparaît jamais.
   → Dans `core/generator.ts`, imposer un quota plancher : au moins 2 items numériques par bloc quand la disposition ouvre des chiffres au palier courant, insérés à position fixe (par ex. items 3 et 7), sans casser la préférence pour le reste.

5. **La ligne de gain lexical de V5 est figée.** « Tu écris maintenant : **un, une, tu** » à l'identique sur les 6 blocs consécutifs joués, et à l'identique après bascule en CH-FR (`10-v5-fin-bloc.png`, `11-v5-4e-bloc.png`, `25-greyscale-v5.png`). Les touches illuminées du clavier miniature sont elles aussi invariantes. C'est la phrase la plus chargée émotionnellement de l'app et elle sonne préenregistrée dès le deuxième bloc.
   → Alimenter la ligne avec les items réellement validés dans le bloc qui vient de se terminer (3 tirés au hasard parmi eux), et n'allumer sur le clavier miniature que les touches **nouvellement** maîtrisées depuis le bloc précédent (`maitrise` porte déjà les numéros de bloc).

6. **Le mot précédent reste affiché à gauche du mot courant et décentre l'item.** `src/views/V4Lecon.tsx:305` (`e.precedent` / `v.motPrecedent`). Visible dès l'item 2 : `14-v4-barreau2-inactivite.png` montre « jeunes » en gris à x≈495 et « une tente » poussé à droite, centre optique à x≈800 au lieu de 720. Rien dans le cahier ne demande cette traîne, et elle contredit P7 (« axe vertical unique, un item = un écran ») : l'enfant a deux mots à l'écran et le mot à taper n'est plus au centre.
   → Supprimer `motPrecedent`, ou le sortir du flux (`position:absolute`) pour que le mot courant reste centré, et le faire disparaître en < 400 ms.

7. **La touche cible est l'élément le plus sombre du clavier, alors que le vocabulaire visuel de l'erreur est « s'assombrit ».** Mesuré : cible `rgb(126,58,13)` (L*≈33) + `scale(1.14)` ; touche fausse pressée `rgb(165,168,162)` (L*≈67) + `scale(0.965)`. La touche fausse est donc **plus claire** que la cible. Le cahier décrit l'erreur comme un assombrissement — ici c'est une désaturation à peine perceptible sur fond crème (Δ de luminance ≈ 0.12 contre le repos).
   → Soit rendre la cible franchement plus **saturée et claire** (orange/teal pleins, pas brun-noir), soit renommer le geste d'erreur en enfoncement franc : garder la teinte de base, appliquer `translateY(2px)` + ombre interne + `scale(0.94)`, et pousser la désaturation plus loin pour qu'elle soit lisible.

8. **Légendes illisibles sur tous les claviers miniatures (V3, V5, V6).** Mesurées à ~7 px pour la rangée des chiffres et ~11-13 px pour les lettres, contre 26.4 px sur la leçon. La rangée des chiffres de V5/V6 est une bouillie grise. Le `generator-state.md` annonce ce point comme corrigé — il ne l'est pas.
   → Fixer un plancher `font-size: max(14px, calc(var(--taille) * 0.42))` sur les légendes, et si la taille de touche ne le permet pas, **supprimer la seconde légende** plutôt que la rendre en 7 px. Le clavier miniature de V5 peut aussi simplement être 40 % plus grand : il occupe 450 px de large dans une fenêtre de 1440.

9. **Rupture de mise en page à 375 px.** `scrollWidth = 476` pour `innerWidth = 375` ; le bloc gauche du clavier commence à `x = -101` : les touches `A Z Q W` sont hors écran à gauche, `P ^ M Ù` hors écran à droite, et la 4ᵉ pastille « index droit » est coupée (`res-375-v4.png`). 768×1024, 1024×768, 1280×800 et 1440×900 passent sans défilement.
   → Sur `max-width: 700px`, réduire `--taille` de touche via `clamp()` piloté par `vw`, et laisser la bande des pastilles passer en `flex-wrap` ou réduire le diamètre des pastilles. Même si l'app vise un clavier physique, un écran clippé qui ne prévient de rien est un bug, pas un arbitrage.

10. **La bande de pastilles est désalignée et les photos inactives sont illisibles.** À 1440 px le groupe des 4 pastilles est centré sur x≈838 (centre de la bande : 720) ; à 1024 px sur x≈600 (centre : 512). Le décalage vient du `justify-content: center` appliqué à l'espace restant après la consigne, pas à la bande. Par ailleurs les 3 pastilles inactives sont des taches pâles de ~50 px dans lesquelles on ne reconnaît ni une main ni un doigt.
   → Passer la bande en `grid-template-columns: 1fr auto 1fr` avec la consigne en colonne 1 et les pastilles en colonne 2 (vrai centrage). Remonter l'opacité des pastilles inactives à ~0.55 et leur diamètre à ~64 px : « pâles et plates » ne doit pas vouloir dire « méconnaissables ».

## Problèmes mineurs

11. **Overlay du barreau 3 mal ancré.** `08-v4-erreur2-barreau3.png` : la main flotte au-delà du coin bas-droit du bloc clavier, sans contact avec lui ; la flèche pointillée traverse la touche `J` (qui est un repère tactile) ; la bulle de la lettre `U` fait ~10 px. Le cahier demande une main « ancrée au bord du clavier ».
   → Ancrer la main sur le bord bas du bloc concerné, faire partir la flèche du bout de l'index, et porter la bulle de lettre à 20 px minimum.

12. **Touches hors leçon à 2.01:1 de contraste** (`rgb(162,167,159)` sur `rgb(239,232,217)`). « Éteintes » ne doit pas signifier « effacées » : à 26 px un enfant ne déchiffre plus les lettres qu'il devra apprendre. Viser 3.5-4:1.

13. **« VERR. MAJ » comme titre du bandeau** — abréviation technique pour un enfant de 7 ans, alors que le corps du message est parfaitement calibré. Remplacer par une illustration de la touche seule, ou par « Ton clavier écrit en grandes lettres ».

14. **Glyphes bruts au lieu des SVG annoncés** : `⚙` sur V1 (rendu comme du texte, pas comme une icône) et `🔒` emoji sur V6 (10 occurrences). `generator-state.md` annonce « cadenas emoji remplacés par des SVG dessinés » — c'est vrai sur la rangée des chiffres, faux sur V6 et V1.

15. **V7 nomme les dispositions « AZERTY » / « QWERTZ » nus**, là où V1 et V2 disent « Français (AZERTY) » / « Suisse romand (QWERTZ) ». Le cahier demande des radios **illustrés** — il n'y a ni mini-clavier ni drapeau, juste deux boutons texte. Réutiliser le composant de carte de V2.

16. **`tu es` et `un sujet` comme items.** Corrects en français et dans l'ensemble du palier, donc non disqualifiants, mais `tu es` est un sujet + verbe conjugué, à la limite de l'interdit « phrases complètes ». Si les items multi-mots sont voulus pour entraîner l'espace, les restreindre à des groupes nominaux (`un jus`, `une tente`, `un sujet`) et exclure les couples sujet-verbe.

17. **Aucune région `aria-live`** : le changement de mot, l'apparition du bandeau Verr.Maj et la fin de bloc ne sont annoncés à aucun lecteur d'écran.

18. **V3 sous-dimensionné** : dans une fenêtre de 1440×900 le clavier du guide-doigt fait 515 px de large et les deux tiers de la hauteur sont vides ; le séparateur « la frontière » est un trait de 8 px avec une étiquette pivotée en 11 px, très en deçà du « séparateur épais étiqueté » demandé.

## Ce qui fonctionne — vérifié, pas supposé

- **Détection** : `(KeyQ→a)` coche Français ; `(KeyQ→q)` + `(KeyY→z)` bascule sur Suisse romand ; la ligne contextuelle change correctement dans les deux sens ; le choix manuel est écrit dans `dispositionChoisieALaMain: true`.
- **Frappe fausse muette** : après 2 puis 40 frappes fausses, le mot affiché reste `"une tente"` inchangé, curseur immobile, aucun caractère parasite, aucun son.
- **Escalade d'aide** : barreau 1 immédiat en débutant, barreau 2 déclenché à ~3 s d'inactivité (`blocPulse` sur la bonne moitié), barreau 3 à la 2ᵉ erreur sur le même caractère, overlay effacé à la réussite, aucune escalade au-delà.
- **Règle P8 du pouce** : item `une tente`, lettre précédente `e` (gauche) → « Main **droite** · ton pouce » ; après l'espace, lettre `t` (gauche) → « Main gauche · ton index ». Les deux cas contralatéraux sont justes.
- **Bascule de disposition** : change les légendes ET l'ensemble de touches (`E F J N S T U ESPACE` → `E F J N S T U 4 5 6 7 ESPACE`), `Z`↔`Y`, `A`↔`Q`, `M` déplacé, `ù` absent, point direct, chiffres sans cadenas.
- **Persistance** : `tapeavecmoi.v1` + `.backup`, disposition et palier intacts après `reload()` ; les deux clés corrompues → retour aux défauts sans crash ni erreur console.
- **Progression** : palier passé de 1 à 2 avec `maitrise: {"f":[3,4,6], …}` — 3 occurrences propres réparties sur ≥ 2 blocs, exactement le critère.
- **4ᵉ bloc** : « Tu as bien travaillé. On peut s'arrêter là. » + emphase inversée (`Retour` en plein, `Encore` en contour), « Encore » toujours cliquable.
- **Encouragements** : 5 titres consécutifs distincts (« C'est tout bon », « Tu prends le coup de main », « Tu t'y mets vraiment », « Voilà du beau travail », « Tes doigts se souviennent »).
- **Verr.Maj** : une majuscule sans Shift affiche le bandeau, une minuscule le fait disparaître.
- **« Je tape sans regarder »** : masque le clavier avec « Le clavier revient au mot suivant. » et se réarme.
- **`prefers-reduced-motion`** : les 2 animations restantes tombent à `1e-06s`.
- **V6** : paliers nommés par ce qu'ils ouvrent, 8-10 verrouillés avec leur promesse, aucune date, aucun pourcentage, aucun compteur.
- **Console** : zéro erreur, zéro warning sur les 7 vues, 6 blocs, la bascule de disposition, le rechargement et la corruption de storage.

## Suggestions pour l'itération suivante — dans cet ordre

1. Corriger `legendes()` (point 1) et retirer `Tab` de `preventDefault` (point 2) : deux diffs de moins de 10 lignes chacun, qui débloquent respectivement la jouabilité CH-FR et l'accessibilité clavier. Chacun avec son test de régression (`layouts.test.ts` : la légende dominante d'une touche chiffre CH est `4`, pas `ç` ; test jsdom sur `useKeyInput` : un `keydown` Tab n'est pas `defaultPrevented`).
2. Remonter le contraste des lettres non tapées à ≥ 7:1 et **différencier** visuellement lettres tapées / lettres à venir (point 3).
3. Rendre vivante la fin de bloc : gain lexical tiré du bloc réel + touches nouvellement acquises seulement (point 5).
4. Supprimer la traîne `motPrecedent` (point 6) et recentrer la bande de pastilles (point 10) : deux corrections purement CSS qui rendent l'écran de leçon nettement plus propre.
5. Repenser le couple cible/erreur (point 7) — c'est le geste que l'enfant vit des centaines de fois par séance, et aujourd'hui l'erreur est presque invisible tandis que la cible est la tache la plus noire de l'écran.
6. Quota de nombres par bloc en CH-FR (point 4), sinon la ligne contextuelle de V2 ment.
7. Plancher de taille sur les légendes des claviers miniatures (point 8).
8. Versionner enfin `tests/e2e/` : la boucle, la frappe muette, la détection en une frappe et le bandeau Verr.Maj sont tous vérifiables au harnais CDP déjà écrit ; laisser ça en script jetable est ce qui a permis aux points 1, 2 et 6 de passer.

## Captures

Toutes dans `gan-harness/screenshots/` :
`01`/`02`/`03` V2 et détection dans les deux sens · `04` V3 · `05`/`19` V1 · `06` V4 premier item · `07`/`08` erreur et barreau 3 · `09` après frappe correcte · `10` V5 · `11` V5 au 4ᵉ bloc · `12` règle du pouce · `13`/`14` avant/après inactivité · `15` « Je tape sans regarder » · `16` après 40 frappes fausses · `17`/`18` bandeau Verr.Maj apparition/disparition · `20` V6 · `21` V7 · `22` V4 en QWERTZ (montre le bug des légendes de chiffres) · `23` après rechargement · `24` reduced-motion · `25` V5 en niveaux de gris · `26` focus clavier · `res-375-v4` / `res-768-v4` / `res-1024x768-v4` / `res-1280x800-v4` / `res-1440-v4`.
