# Generator State — Iteration 004

## Ce qui a été corrigé (feedback-003, dans l'ordre imposé)

### CRITIQUE — point 1 : critère de palier inatteignable
Deux causes, deux correctifs, trois tests.

1. **Comptage.** `V4Lecon` dédoublonnait les occurrences propres par bloc
   (`!e.propres.includes(...)`), ce qui transformait « 3 occurrences réparties
   sur ≥ 2 blocs » en « 3 blocs distincts ». Chaque occurrence propre est
   désormais notée. `BilanBloc.propres` est une liste d'occurrences, pas un
   ensemble ; `state.tsx` dédoublonne seulement pour l'illumination de V5.
2. **Couverture du générateur.** `composerBloc` fait maintenant une passe de
   COUVERTURE gloutonne avant le remplissage : chaque touche à valider du
   palier apparaît `COUVERTURE_MIN = 2` fois par bloc, en gardant la préférence
   P5 (mot > phrase > nombre > syllabe). La retaille finale du bloc ne supprime
   jamais un item qui porte seul la couverture d'une touche.
   `couvertureCible()` ramène l'objectif à ce que le corpus permet réellement :
   `ù` ne vit que dans « où » en français, exiger deux occurrences par bloc
   aurait obligé à inventer des pseudo-mots (interdit du cahier).
   Corpus complété là où l'offre manquait : `neuf` (f), `sandwich` (w).
3. **Tests.** `generator.test.ts` : couverture sur 2 dispositions × 7 paliers ×
   8 graines ; et « 3 blocs ⇒ 3 occurrences de chaque touche » sur les mêmes
   combinaisons. `tests/e2e/palier.spec.ts` : **3 blocs parfaits ouvrent le
   palier 2 avec `blocsSurPalier < 6`** — le passage se fait au mérite, pas par
   le plafond. Vérifié : il bascule au 2ᵉ bloc.

### MAJEUR — point 2 : « Je tape sans regarder » ne se réarmait pas
`masque: false` dans `itemSuivant()` du reducer de leçon. E2E : la chaîne
d'ancêtres de `KeyF` retombe à hauteur 0 au clic, et remonte seule après
l'item ; le bouton se réarme sur « Je tape sans regarder ».

### MAJEUR — point 3 : bandeau des touches
Le bandeau annonce l'**ensemble cumulé** (`libellesEnsemble()`), pas les
nouveautés du palier. Lettres d'abord, puis chiffres, puis ponctuation — le
point ne se lit plus comme une coquille en tête de ligne. Espace après le
deux-points dans le flux de texte, pas seulement en CSS.

### MAJEUR — point 4 : capitales accentuées « É È À Ç »
Cause racine trouvée : ce n'était pas le JS mais `text-transform: uppercase`
sur `.bandeauTouches strong`. Règle supprimée ; la mise en capitale est faite
en amont et seulement sur `/^[a-z]$/`. Palier 5 affiche maintenant
« A à B C ç D E é è … ».

### MAJEUR — point 5 : palier 7 sans majuscules ni point
- `toucheMaj()` sait que Maj + lettre = capitale (au lieu de 26 entrées de
  table par disposition) ; `exigeMaj`, `mainDe`, `verdictMaj` et le piège Maj
  contralatéral fonctionnent donc sur les capitales sans autre changement.
- `ensembleTouches()` ouvre les capitales ASCII au palier 7 ; les accentuées
  restent hors ensemble.
- Le générateur produit des items « Chocolat. » (capitale initiale + point),
  avec un plancher de 2 par bloc, comme pour les nombres. `.` ajouté au palier 7
  CH-FR (il y est direct, mais il n'était ouvert nulle part).
- Tests : invariant de corpus (capitale + point dans chaque bloc, aucune
  capitale accentuée) et e2e « la capitale sans Maj est une quasi-réussite,
  avec Maj elle s'écrit ».

### PARTIELS
- **Bulle du barreau 3** : posée au-dessus du clavier ENTIER (`top: -46`), elle
  ne peut plus recouvrir une touche de la leçon. Sa pointe reste alignée sur la
  colonne de la touche visée.
- **Main du barreau 3** : alignée sur le BOUT DE L'INDEX (et non le centre de la
  paume) puis **pivotée** sur le poignet (±38° max) pour viser la touche quand
  le garde-fou de la barre d'espace l'écarte de la colonne.
- **Orange unique** : `.illuminee` (V5/V6) passe du brun plein `#7e3a0d` au même
  remplissage que la cible en jeu (`--teinte-cible`), encre `--encre` — 7,2:1
  conservé. Le brun ne sert plus que de liseré/accent, comme le teal.
- **Légendes secondaires** : nouveau jeton `--legende-min-secondaire: 16px`,
  appliqué à `.legendeHaut` et au libellé « MAJ ». Le plancher principal tient
  18 px jusqu'à 900 px de large (1024 et 1280 compris) ; sous 900 px la légende
  secondaire disparaît plutôt que de rétrécir. Mesuré au palier 7 :
  16 px / 16 px à 1024, 1280 et 1440 ; aucun débordement aux 5 tailles.

## Sprint 2/3
Voix du barreau 3 : déjà livrée et vérifiée — détection d'une voix `fr*`,
`try/catch`, et dégradation purement visuelle si aucune voix n'est disponible.

## Problèmes connus
- 375 px au palier 7 reste dégradé (étiquette « LA FRONTIÈRE » dans le flux,
  légendes à 10-12 px). Aucun débordement, mais l'écran n'est pas confortable.
  Non traité : hors des deux tailles exigées par le rubric.
- Pastilles de doigts : le bout de l'index tendu est encore rogné par le cercle
  (recadrage calculé sur la largeur de main).
- Au barreau 3, la main reste bornée par la barre d'espace : quand la touche
  visée est proche de la frontière (J), elle désigne par l'inclinaison plutôt
  que par la position.

## Gates
- `npm run test` : 158 tests, 10 fichiers — verts.
- `npx tsc --noEmit` : propre.
- `npx playwright test --project=chromium` : 22 tests — verts.

## Dev Server
- URL: http://localhost:3000
- Status: running (curl 200)
- Command: npm run dev
