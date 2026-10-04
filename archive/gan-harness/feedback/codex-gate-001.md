# Gate de sortie — revue adversariale Codex du code (2026-08-24)

**VERDICT : REJET.** Tout point ci-dessous est bloquant pour la livraison ; chaque fix exige son test de régression (qui échoue avant, passe après).

## Bloquants
1. `src/state.tsx:119` — `bloc` repart à `1` au chargement alors que `maitrise` persiste les numéros de blocs : un bloc par session → `[1,1,1…]`, `new Set(blocs).size >= 2` (progression.ts:24) jamais satisfait, montée uniquement par le plafond anti-mur. En outre, changer de disposition conserve `blocsSurPalier` (state.tsx:65-73) → ouverture prématurée possible. Fix : identifiant de bloc monotone persisté (ou reconstruit depuis la maîtrise) + remise à zéro de `blocsSurPalier` au changement de disposition.
2. `src/views/V4Lecon.tsx:215` — `itemsSatures` incrémenté seulement après réussite/passage à l'item suivant : au 3ᵉ item saturé le compteur reste à 2, `doitProposerV2()` ne sort jamais l'enfant de l'item bloqué ; sur le dernier item, `itemSuivant()` passe à `fini` avant toute incrémentation (:203-205). Fix : incrémenter/déclencher V2 au moment où `satureCourant` devient vrai pour le 3ᵉ item consécutif.

## Majeurs
3. `src/core/layouts.ts:126` — tables physiquement incomplètes : CH-FR s'arrête à `Digit0` (manquent `'`/`?` et `^` morte) ; FR-FR : manquent `²`, `)/°`, `=/+` ; Retour arrière absent partout alors que la spec le veut dessiné et inactif. Déclarer toutes les touches physiques (mortes et non fonctionnelles incluses), distinguer « dessinable » de « proposable ». Réf. dispositions Microsoft kbdsf_2 / kbdfr.
4. `src/views/V4Lecon.tsx:289` — `repeat` transmis par useKeyInput mais jamais consulté : une touche maintenue valide les deux `l` de `belle` sans deux gestes, et une mauvaise touche maintenue déclenche barreaux 2-3 quasi instantanément. Ignorer `f.repeat` (une validation par cycle keydown/keyup).
5. `src/hooks/useKeyInput.ts:59` — ShiftLeft/ShiftRight éliminés, seul un booléen `avecMaj` transmis : la Maj contralatérale est affichée mais jamais vérifiée (une Maj homolatérale valide). Suivre l'état de chaque touche Maj et exiger le code contralatéral.
6. `src/views/V4Lecon.tsx:123` — barreau 2 atteint par inactivité (~3 s) ne positionne jamais `itemAide` : l'item aidé pour inactivité n'est pas réinjecté. Déduire la réinjection de `aide.atteint >= 2`, pas d'un drapeau parallèle.
7. `src/core/storage.ts:78` — `estIntact()` trop laxiste : `{version:1, disposition:"fr-FR", palier:42}` jugé sain puis `valider()` écrase vers les défauts sans consulter le backup valide ; et un `QuotaExceededError` sur l'écriture du backup empêche l'écriture de la clé principale (try unique :103-109). Validation complète avant choix du principal ; écritures backup/principale isolées.
8. `src/hooks/useKeyInput.ts:53` — le focus sur un contrôle n'empêche pas la frappe pédagogique (Espace sur un bouton = saisie + activation) ; aucune suspension de `debutCaractere` sur blur/visibilitychange (retour d'onglet → aide d'inactivité immédiate). Ignorer les frappes depuis un contrôle ; suspendre/rebaser le temps sur perte de visibilité.

## Mineur
9. `src/state.tsx:107` — fallback de `touchesNouvelles` : quand rien n'est nouvellement maîtrisé, toutes les frappes propres du bloc s'illuminent en V5, contredisant « seules les touches NOUVELLEMENT maîtrisées s'allument ». Supprimer le fallback (ensemble vide).

## Lacunes de couverture à combler
- Tests du reducer applicatif : rechargement entre deux blocs, changement de disposition, plafond anti-mur, sémantique de `touchesNouvelles`.
- Tests V4 isolés : auto-repeat, rafales, 3ᵉ item saturé, réinjection après aide temporelle.
- Test du côté réel de Maj (helper e2e à étendre : `ShiftLeft`/`ShiftRight`, pas un booléen).
- Tests storage : quota, échec partiel d'écriture, corruption JSON structurellement valide.
- Fixtures layouts : matrice physique exhaustive, Retour arrière, touches mortes.
