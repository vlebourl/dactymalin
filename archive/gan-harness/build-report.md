## GAN Harness Build Report

**Brief :** Tape avec moi — webapp d'apprentissage de la dactylographie pour un enfant de 7-12 ans, selon gan-harness/spec.md (dérivée de CAHIER-DES-CHARGES.md) et STACK.md
**Result :** PASS
**Iterations :** 4 / 15
**Final Score :** 8.0 / 10 (seuil 7.5)

### Score Progression
| Iter | Design | Originality | Craft | Functionality | Total |
|------|--------|-------------|-------|---------------|-------|
| 1 | 6 | 6 | 6 | 7 | 6.2 |
| 2 | 7 | 7 | 6 | 7 | 6.7 |
| 3 | 8 | 7 | 7 | 7 | 7.3 |
| 4 | 8 | 7 | 8 | 9 | 8.0 |

### Remaining Issues (feedback-004)
1. Photos de doigts tranchées net par le haut du cercle des pastilles (recadrage à refaire).
2. Piège Maj : aucune signature visuelle sur le clavier avant l'erreur (seule la phrase change).
3. Légendes secondaires à 16-16,8 px selon la taille — plancher exigé : 18 px.
4. Main schématique du barreau 3 : désigne X au lieu de S dans certains cas (décalage d'une rangée).
Non traité assumé : 375 px au palier 7 (blocs chevauchant la barre d'espace).

### Gates finales (au moment du PASS)
- vitest : 158 tests verts (noyau pur + jsdom ciblé)
- tsc --noEmit : propre
- Playwright chromium : 22 e2e verts
- 0 erreur/warning console sur 7 vues, 12 blocs, 5 tailles
- Aucun échec disqualifiant (pas de WPM, classement, chrono, rouge sémantique, mot hors palier, texte anglais)

### Files
- gan-harness/spec.md, eval-rubric.md, feedback/feedback-001..004.md, generator-state.md, screenshots/ (~90 captures)
- Commits : bfb1ce1 (iter 1) → 61dc55d (iter 2) → 3d46de7 (iter 3) → e0c4d48 (iter 4)

---

## Post-PASS : gates de sortie (2026-08-24)

| Gate | Verdict | Suites |
|---|---|---|
| Revue sécurité (ecc:security-reviewer) | PASS avec 1 MEDIUM | Google Fonts → Lexend auto-hébergée (883e85d) + e2e réseau (8667d43) |
| Revue adversariale Codex du code | REJET (9 findings) | iteration-005 (16dd40a) : 9 fixes + couverture |
| Contre-vérification Codex | REJET (3 failles + 1 nouveau) | iteration-006 (e2ee3bf) : 4 fixes |
| Verdict Codex final | REJET (2 défauts) | iteration-007 (87b98e5) : clamp BLOC_MAX + célébration gelée |
| **Verdict Codex de clôture** | **LIVRABLE** | — |

État final : 209 tests vitest, 40 e2e Playwright chromium, tsc propre, `vite build` OK,
aucune requête réseau externe. Restent les 4 réserves visuelles mineures de feedback-004
(photos de pastilles recadrées haut, signature visuelle du piège Maj, légendes 16 vs 18 px,
main du barreau 3) — consignées, non bloquantes.
