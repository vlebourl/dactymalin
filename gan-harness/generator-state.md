# Generator State — Iteration 002

## Ce qui a changé, point par point (feedback-001)

### Critiques
1. **Légendes CH-FR (point 1)** — `Touche` porte désormais `legendePrincipale` / `legendeSecondaire` ; `legendes()` rend TOUJOURS le caractère sans modificateur en dominante, sans aucune branche sur le type de caractère. AZERTY : `&` gros / `1` petit. CH-FR : `4` gros / `ç` petit.
   Régressions ajoutées (`layouts.test.ts`) : la rangée CH rend `1…0` en dominante et `+ " * ç %…` en secondaire ; invariant général « dominante == `base` » sur les deux tables. Les deux échouaient avant le correctif.
2. **Tab (point 2)** — `Tab` n'est plus jamais `preventDefault`. `Space` n'est neutralisé que si `document.activeElement` n'est pas un contrôle focalisable. Anneau `:focus-visible` explicite sur `button` et `[role=switch]`.
   Régressions : `src/hooks/useKeyInput.test.ts` (jsdom) — Tab non `defaultPrevented`, Espace neutralisé sur `BODY` mais pas sur un bouton focalisé, cleanup des écouteurs. E2e `boucle.spec.ts` : 4 × Tab depuis V4 ⇒ `activeElement` = BUTTON.
3. **Contraste du mot (point 3)** — nouveaux jetons : `--encre-mot #33413f` (≈9,5:1) pour les lettres **à venir**, `--encre-tapee #9aa398` pour les lettres **déjà tapées**. Les deux états sont maintenant distincts (F1).

### Majeurs
4. **Quota de nombres CH-FR (point 4)** — `composerBloc` impose un plancher de 2 items numériques aux positions 3 et 7 quand la disposition ouvre des chiffres. `generator.test.ts` : ≥ 2 nombres par bloc CH palier 1 sur 8 graines, 0 nombre en FR-FR, majorité de vrais mots préservée.
5. **Fin de bloc vivante (point 5)** — `BilanBloc.items` remonte les items réellement validés ; V5 en tire 3 au hasard. Le clavier miniature n'allume que les touches **devenues** maîtrisées pendant ce bloc (`estMaitrisee` avant/après), avec repli sur les touches propres du bloc.
6. **`motPrecedent` supprimé (point 6)** — l'item reste sur l'axe vertical, seul à l'écran.
7. **Cible / erreur repensés (point 7)** — cible = `--teal-cible #2fa294` / `--orange-cible #e08a2e` (saturée et CLAIRE) + halo + `scale(1.16)` + graisse 700. Erreur = enfoncement : teinte de base conservée, `saturate(0.1) brightness(0.72)`, `translateY(3px) scale(0.94)`, ombre interne, bord bas écrasé. La cible n'est plus la tache la plus sombre de l'écran.
8. **Légendes miniatures (point 8)** — plancher `--legende-min: 14px` ; V5 30→44 px, V6 34→clamp(24,3.6vw,46), V3 34→clamp(26,4.4vw,54). Sous 700 px, la seconde légende est **supprimée** plutôt que rendue illisible.
9. **375 px (point 9)** — taille de touche `clamp(21px, 6.1vw, 58px)` : `scrollWidth == innerWidth` à 375, 768 et 1440 (mesuré). La bande de doigts passe en deux étages sous 700 px.
10. **Bande de pastilles (point 10)** — `grid-template-columns: 1fr auto 1fr` (vrai centrage) ; pastilles inactives : diamètre 54-76 px, opacité 0.8, `saturate(0.5)` sans `opacity()` — le doigt reste reconnaissable.

### Mineurs
11. Barreau 3 ancré au **bord bas du bloc concerné**, à l'aplomb de la touche ; flèche partant du bout de l'index ; bulle du nom de lettre à 21 px, posée au-dessus de la touche.
12. Touches hors leçon : `--encre-touche-eteinte #6b7066` (≈3,9:1).
13. « VERR. MAJ » remplacé par l'illustration de la touche + « Ton clavier écrit en grandes lettres. »
14. Glyphes bruts remplacés par des SVG : engrenage V1, cadenas / étoile / flèche / point V6.
15. V7 : radios **illustrés** — `ui/MiniClavier.tsx` extrait de V2 et partagé, avec le nom complet de la disposition.
16. `tu es` et `vite fait` retirés du corpus + test « les items multi-mots sont des groupes nominaux ».
17. `aria-live` : mot courant + doigt (région visuellement masquée), bandeau Verr.Maj, rappel Maj.
18. V3 agrandi (clavier + mains 150 px) ; frontière élargie et étiquette à 13 px minimum.

## Sprint 2 poursuivi
- **Piège Maj** : `core/maj.ts` (`verdictMaj`, `mainDeLaMaj` contralatérale) + tests. En jeu : la bonne touche sans modificateur n'est **pas** une erreur — la cible reste allumée, un rappel de la touche Maj apparaît avec la main opposée. Le barreau 3 est suspendu tant que c'est une quasi-réussite.
- **Voix du barreau 3** : déjà en place (speechSynthesis, dégradation visuelle sans voix fr).
- **E2e versionnés** : `playwright.config.ts` + `tests/e2e/` — `boucle`, `erreur`, `detection`, `capslock` + `helpers/keyboard.ts` (CDP `Input.dispatchKeyEvent` alimenté par `core/layouts.ts`, repli KeyboardEvent synthétique hors Chromium) et `helpers/app.ts`. **11/11 verts en Chromium.**

## État des tests
- `npm run test` : **146 verts** (9 fichiers, dont le premier test de hook en jsdom).
- `npx tsc --noEmit` : propre (`src`, `tests`, configs).
- `npx playwright test --project=chromium` : **11 verts**.
- Zéro erreur / warning console sur les 7 vues (vérifié en e2e).

## Limites connues
- Les projets Playwright `firefox-repli` / `webkit-repli` sont configurés mais leurs binaires ne sont pas installés dans cet environnement (`npx playwright install` requis) — le spec `detection` est écrit pour y tourner tel quel (repli KeyboardEvent).
- La main du barreau 3 déborde sous le bloc clavier et recouvre partiellement la barre d'espace pendant l'overlay (transitoire).
- Piège Maj : la touche Maj n'est pas encore **dessinée dans le clavier** (ajouter ShiftLeft/ShiftRight aux tables élargirait le clavier de ~2 unités) ; le rappel est un badge à côté de la cible. À trancher au Sprint 3, avec le palier 7.

## Dev Server
- URL : http://localhost:3000 (HTTP 200 vérifié)
- Statut : en cours (`nohup npm run dev`, log `/tmp/vite-tapeavecmoi.log`)
- Commande : `npm run dev`
