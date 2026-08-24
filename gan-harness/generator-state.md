# Generator State — Iteration 005 (gate de sortie Codex)

Réponse point par point à `gan-harness/feedback/codex-gate-001.md`. Chaque
correction embarque son test de régression (rouge avant / vert après, vérifié
en rétablissant l'ancien code).

## Bloquants

| # | Statut | Correction | Test |
|---|--------|-----------|------|
| 1 | CORRIGÉ | `blocDeDepart(maitrise)` reconstruit un n° de bloc monotone au chargement (`state.tsx`) ; `blocsSurPalier` remis à 0 au changement de disposition | `src/state.test.ts` — « une occurrence par session finit par maîtriser la touche », « remet blocsSurPalier à zéro », « changer de clavier ne peut plus ouvrir le palier » |
| 2 | CORRIGÉ | Reducer de leçon extrait dans `src/core/lecon.ts` ; `surBarreau()` compte la saturation À L'INSTANT où le barreau 3 est atteint (erreur comprise), plus à la sortie de l'item | `src/core/lecon.test.ts` — « compte le 3ᵉ item saturé dès que la saturation survient », « le dernier item du bloc est compté », « un item propre rompt la série », « jamais deux fois » |

## Majeurs

| # | Statut | Correction | Test |
|---|--------|-----------|------|
| 3 | CORRIGÉ | Matrice physique complète des deux tables (kbdfr / kbdsf_2) : `²`, `)/°`, `=/+`, `$/£`, `*/µ`, `</>` en FR-FR ; `§/°`, `'/?`, `^` mort, `¨` mort, `$/£` en CH-FR ; Retour arrière dessiné et inerte partout. Nouveau drapeau `inerte` + prédicat `estProposable()` : DESSINABLE ≠ PROPOSABLE | `src/core/layouts.test.ts` — bloc « matrice physique exhaustive » (fixture MATRICE écrite à la main), Retour arrière, touches mortes, non-proposabilité ; `tests/e2e/debordement.spec.ts` — touches inertes éteintes et sans cadenas |
| 4 | CORRIGÉ | `f.repeat` ignoré dans V4 : une touche maintenue ne valide plus deux lettres et ne fait plus grimper l'aide | `src/hooks/useKeyInput.test.ts` — « transmet le drapeau d'auto-répétition tel quel » ; garde côté vue dans `V4Lecon.tsx` |
| 5 | CORRIGÉ | `useKeyInput` suit l'état de `ShiftLeft`/`ShiftRight` (Set + resync sur `shiftKey`/`blur`) et expose `majGauche`/`majDroite` ; le reducer traite la Maj homolatérale en quasi-réussite | `useKeyInput.test.ts` (3 cas), `lecon.test.ts` (2 cas), e2e `palier7.spec.ts` « la Maj HOMOLATÉRALE ne valide pas ». Helper e2e étendu : `frapperCouple` émet de vrais keydown/keyup `ShiftLeft`/`ShiftRight`, plus un booléen |
| 6 | CORRIGÉ | `itemAide` déduit de `barreau >= 2` dans `surBarreau()`, plus d'un drapeau posé sur la seule erreur : l'inactivité réinjecte | `lecon.test.ts` — « réinjecte un item aidé par pure inactivité » |
| 7 | CORRIGÉ | `estIntact()` valide TOUS les champs avec les bornes de `valider()` ; écritures backup et principale dans deux `try` isolés | `storage.test.ts` — blocs « corruption structurellement valide » (5 cas) et « quota et échec partiel d'écriture » (2 cas) |
| 8 | CORRIGÉ | Frappes ignorées quand le focus est sur un contrôle ; horloge du caractère rebasée sur `visibilitychange`/`focus` (action `reprise`) ; les boutons de la leçon rendent le focus après un clic souris | `useKeyInput.test.ts` — « ignore une frappe partie d'un contrôle focalisé » ; `lecon.test.ts` — « rebase l'horloge du caractère au retour » ; e2e « un clic souris rend le clavier à la leçon » |

## Mineur

| # | Statut | Correction | Test |
|---|--------|-----------|------|
| 9 | CORRIGÉ | Repli supprimé : `touchesNouvelles` vaut exactement les touches franchies (ensemble vide sinon) | `state.test.ts` — 3 cas dans « touchesNouvelles » |

## Lacunes de couverture

- Reducer applicatif → `src/state.test.ts` (11 tests) : rechargement entre blocs, changement de disposition, plafond anti-mur, sémantique de `touchesNouvelles`.
- V4 isolé → `src/core/lecon.test.ts` (12 tests) : saturation, rafales, 3ᵉ item saturé, réinjection temporelle, Maj contralatérale, retour d'onglet.
- Côté réel de Maj → helper e2e `ShiftLeft`/`ShiftRight` + test `palier7.spec.ts`.
- Storage → quota, échec partiel d'écriture, corruption structurellement valide.
- Layouts → matrice physique exhaustive, Retour arrière, touches mortes.

## Non-régression visuelle

`tests/e2e/debordement.spec.ts` : 10 combinaisons (375 / 768 / 1024 / 1280 / 1440 px × paliers 1 et 7), 6 vues chacune. Zéro débordement horizontal, aucune touche hors cadre.

Élargir les rangées d'un tiers a demandé de re-dimensionner les claviers :
- V4 `clamp(16px, 4.6vw, 56px)` (palier < 7) / `clamp(14px, 4.1vw, 48px)` (palier 7)
- V1 `clamp(13px, 2.7vw, 38px)`, V3 `clamp(16px, 4.4vw, 54px)`, V5 `clamp(13px, 3.4vw, 42px)`, V6 `clamp(13px, 2.7vw, 38px)`
- V3 : colonnes de mains contraintes (`.coteMain`) et rangée autorisée à passer à la ligne
- MiniClavier : taille de touche en variable CSS, réduite sous 430 px
- V2 : `min-width: min(300px, 100%)` sur les cartes

Trois de ces débordements (V1, V3, V5 à 375 px) PRÉEXISTAIENT à cette itération et sont corrigés au passage.

## Cadenas

Le cadenas ne se pose plus que sur une touche dont un caractère appartient
réellement au curriculum ET dont rien n'est encore ouvert : `)`, `=`, `²`,
`'` n'arrivent jamais, ils restent simplement éteints.

## Known Issues

- La règle contralatérale est permissive dans un seul cas : Maj déjà enfoncée au moment où la fenêtre prend le focus (aucun `keydown` observé). On accepte alors la frappe plutôt que de la refuser à tort. Documenté dans `useKeyInput.ts`.

## Dev Server

- URL : http://localhost:3000 — 200
- Commande : `npm run dev`

## Gates

- `npm run test` : 202 tests, 12 fichiers, vert
- `npx tsc --noEmit` : vert
- `npx playwright test --project=chromium` : 38 tests, vert
