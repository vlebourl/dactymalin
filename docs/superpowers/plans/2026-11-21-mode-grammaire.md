# Mode grammaire — plan d'implémentation

> **Pour les agents :** sous-skill requis : `superpowers:subagent-driven-development` (recommandé) ou `superpowers:executing-plans`, tâche par tâche. Les étapes utilisent des cases `- [ ]`.

**But :** un mode « Passé, présent ou futur ? ». Le choix se fait au lancement de l'app, et le serveur génère chaque phrase avec Claude Haiku 5.5 puis la vérifie avant de l'envoyer.

**Architecture :**
- Un module serveur pur fait le tirage, la validation et la génération. Le client Anthropic y est injecté pour être simulé dans les tests.
- La route `/api/grammaire` suit le modèle de `/api/voix` : session obligatoire, limite de débit, et réponse « indisponible » quand la clé manque.
- Côté client, le choix du mode se fait dans `main.tsx`, entre le choix du joueur et `App`. Il n'apparaît que si le serveur déclare la grammaire disponible, si bien que les parcours actuels et les tests e2e existants ne changent pas.

**Pile :** Hono, `@anthropic-ai/sdk` (nouvelle dépendance, `^1.12.0`), React 19, vitest, Playwright.

**Spec :** `docs/superpowers/specs/2026-11-21-mode-grammaire-design.md`. Le spike est dans `docs/superpowers/specs/2026-11-21-mode-grammaire-spike/`.

## Contraintes globales

- Modèle : `claude-haiku-5-5`, avec `output_config.effort: 'low'` et un format `json_schema`. Pas de `thinking: disabled`, pas de `temperature` (ces paramètres sont refusés).
- Variable `ANTHROPIC_API_KEY` facultative. Une chaîne vide compte comme absente.
- Catégories envoyées au client : `'passe' | 'present' | 'futur'`. Les temps tirés sont `passe_compose | imparfait | present | futur_simple`.
- Le tirage se fait en deux temps : d'abord la catégorie (1/3 chacune), puis, pour `passe`, `passe_compose` ou `imparfait` à 1/2 chacun.
- Validateur : une seule ligne, 15 mots au plus, aucun mot de la liste noire. La liste noire compte 37 entrées, copiées de `mots-interdits.txt` du spike, sans « il y a ».
- Au plus 3 tirages par phrase. Ensuite, `503 { erreur, code: 'GRAMMAIRE_INDISPONIBLE' }`.
- Limite de débit : `limiterDebit(30, 60_000)`.
- Série de 10 phrases.
- Dépôt public : aucun prénom réel d'enfant dans le code ni dans les tests. La banque utilise « Maël ».
- Tout le texte visible est en français, avec le ton des écrans existants.
- Chemins absolus dans les commandes. Ne pas faire `cd client`.

## Points à surveiller en revue

1. **Clé présente dans le shell local au moment des e2e.** Le choix du mode apparaîtrait et casserait les ~40 specs qui attendent V1/V2. Le harnais force `ANTHROPIC_API_KEY: ''` (tâche 4).
2. **Le SDK lève une erreur (réseau, 429, 5xx) ou renvoie `stop_reason: 'refusal'` / `max_tokens`.** C'est compté comme un essai raté, jamais comme une phrase (tâche 2).
3. **`/api/grammaire/etat` échoue au démarrage (hors ligne).** L'app démarre en orthographe, sans écran de choix, comme aujourd'hui (tâche 5).
4. **Double-clic sur un bouton de réponse, ou réponse pendant le chargement de la phrase suivante.** Une seule réponse est comptée par phrase (tâche 6).
5. **Retour de Google (`retourDeRattachement()`).** On ne passe jamais par le choix du mode, on va directement en V9 (tâche 5).

---

### Tâche 1 : banques, tirage et validateur (serveur, logique pure)

**Fichiers :**
- Créer : `server/src/lib/grammaire-banques.ts`, avec les constantes `SUJETS`, `VERBES`, `THEMES` et `MOTS_INTERDITS` (`readonly string[]`), recopiées des `.txt` du spike.
- Créer : `server/src/lib/grammaire.ts`.
- Test : `server/src/lib/__tests__/grammaire.test.ts`.

**Interfaces produites :**
```ts
export type Categorie = 'passe' | 'present' | 'futur';
export type Temps = 'passe_compose' | 'imparfait' | 'present' | 'futur_simple';
export type Tirage = { sujet: string; verbe: string; theme: string; temps: Temps };
export const CATEGORIE_DU_TEMPS: Record<Temps, Categorie>;
export function tirer(alea?: () => number): Tirage;
export function phraseValide(phrase: string): boolean;
```

- [ ] **Étape 1 : écrire les tests qui échouent**
  - `tirer` :
    - avec `alea` constant à `0`, on obtient le premier sujet, le premier verbe, le premier thème et la catégorie `passe` ;
    - sur 3 000 tirages réels, chaque catégorie est à 1/3 ± 0,05, et `imparfait` représente 1/2 ± 0,07 des passés ;
    - aucun tirage ne contient `savoir`, `vouloir`, `pouvoir`, `dire`, `être` ou `avoir`.
  - `phraseValide` :
    - accepte `« Il y a un chat. »` et `« Le hérisson dort sous les feuilles. »` ;
    - rejette `« Le géant chantera une chanson joyeuse au marché demain matin. »`, `« Demain, Léa mangera une pomme. »`, `« Léa a déjà mangé. »`, `« La semaine prochaine, on partira. »`, une phrase de 16 mots (prendre celle du renard dans `resultats-imparfait.tsv`), une phrase contenant `\n`, `""` et `"   "` ;
    - « Mon grand-père répare la passerelle. » est acceptée : `passé` ne doit pas être repéré à l'intérieur de « passerelle ».
- [ ] **Étape 2 :** `npx vitest run server/src/lib/__tests__/grammaire.test.ts`. Attendu : échec, module introuvable.
- [ ] **Étape 3 : implémenter.** Comparaison insensible à la casse, sur des mots entiers, avec la frontière `(?<!\p{L})mot(?!\p{L})` et le drapeau `u` (même logique que `valider.pl`). Le compte des mots découpe sur les espaces et les apostrophes.
- [ ] **Étape 4 :** relancer le test. Attendu : PASS.
- [ ] **Étape 5 :** commit `Grammaire : banques, tirage et validateur de phrases`.

### Tâche 2 : génération et appel de contrôle, avec un client injecté

**Fichiers :**
- Modifier : `package.json` (`npm install @anthropic-ai/sdk@^1.12.0`).
- Modifier : `server/src/lib/grammaire.ts`.
- Test : `server/src/lib/__tests__/grammaire.test.ts`.

**Interfaces :**
- Consomme : `tirer`, `phraseValide`, `CATEGORIE_DU_TEMPS` (tâche 1).
- Produit :
```ts
/** Un appel au modèle qui renvoie l'objet JSON du format imposé, ou null (refus, coupure, JSON invalide, erreur réseau). */
export type Demander = (systeme: string, utilisateur: string, schema: object) => Promise<unknown | null>;
export type PhraseGrammaire = { phrase: string; categorie: Categorie };
export type Generateur = () => Promise<PhraseGrammaire | null>;
export function creerGenerateur(demander: Demander, alea?: () => number): Generateur;
export function demanderAvecAnthropic(cle: string): Demander;
```

- [ ] **Étape 1 : tests avec un `demander` simulé**, qui renvoie une file de réponses :
  - une phrase valide, puis un contrôle qui renvoie la bonne catégorie : on obtient `{ phrase, categorie }` en exactement 2 appels ;
  - un contrôle qui renvoie `ambigu` ou une autre catégorie : on refait un tirage ;
  - une phrase rejetée par `phraseValide` : pas d'appel de contrôle pour cette phrase, et on refait un tirage ;
  - `demander` qui renvoie `null` ou `{ phrase: 42 }` : compté comme un essai raté ;
  - trois échecs : `null`, avec au plus 6 appels au total ;
  - la consigne envoyée au contrôle ne contient ni le temps tiré, ni le nom de la catégorie attendue (on le vérifie sur l'argument `utilisateur` capturé).
- [ ] **Étape 2 :** lancer le test. Attendu : échec.
- [ ] **Étape 3 : implémenter `creerGenerateur`.**
  - Le prompt de génération est la variable `SYS` de `gen3.sh`, mot pour mot. Le message utilisateur a la forme `Sujet : … Verbe : … Thème : … Temps : <libellé>.`, avec ces libellés : `passé composé`, `imparfait`, `présent de l'indicatif`, `futur simple`.
  - Le schéma de génération est `{phrase: string}`. Le schéma de contrôle est `{categorie: enum ['passe','present','futur','ambigu']}`.
  - Prompt système du contrôle (texte fixé) : « Tu aides un enfant de CE1. Dis si cette phrase est au passé, au présent ou au futur, d'après ses verbes conjugués. Le passé composé et l'imparfait sont du passé. Si la phrase contient des verbes conjugués de catégories différentes, réponds ambigu. ». Le message utilisateur ne contient que la phrase.
- [ ] **Étape 4 : implémenter `demanderAvecAnthropic(cle)`.**
  - `new Anthropic({ apiKey: cle, maxRetries: 1, timeout: 15_000 })`, puis `client.messages.create({ model: 'claude-haiku-5-5', max_tokens: 1024, output_config: { effort: 'low', format: { type: 'json_schema', schema } }, system, messages: [{ role: 'user', content: utilisateur }] })`.
  - Si `stop_reason !== 'end_turn'`, renvoyer `null`. Sinon, assembler les blocs `text`, puis faire un `JSON.parse` dans un `try`.
  - Toute erreur renvoie `null`. Journaliser `console.error` avec la classe de l'erreur (`Anthropic.APIError` et son statut), jamais la clé.
- [ ] **Étape 5 :** tests au vert, puis `npm run typecheck`.
- [ ] **Étape 6 :** commit `Grammaire : génération et contrôle de la phrase`.

### Tâche 3 : évaluer le contrôle avant de le brancher (étape bloquante)

**Fichiers :**
- Créer : `scripts/evaluer-controle-grammaire.ts`.

**Interfaces :** consomme `demanderAvecAnthropic` et le prompt de contrôle de la tâche 2. Exporter ce prompt sous le nom `PROMPT_CONTROLE` depuis `grammaire.ts` s'il ne l'est pas déjà.

- [ ] **Étape 1 : écrire le script.**
  - Il lit les phrases acceptées de `resultats2.tsv`, `resultats3.tsv`, `resultats4.tsv` (raison vide) et `resultats-imparfait.tsv`.
  - Pour chacune, il déduit la catégorie attendue de la première colonne (`passé` et `imparfait` donnent `passe`), lance le contrôle seul, puis affiche les accords, les désaccords (en listant chacun) et les `ambigu`.
  - La clé est lue dans `process.env.ANTHROPIC_API_KEY`. Lancement avec `node --import tsx scripts/evaluer-controle-grammaire.ts`.
- [ ] **Étape 2 : lancer le script (humain, avec la clé).** Critère : « dessinera un volcan qui crache » sort en `ambigu` ou `present`, et il y a au plus 5 % de désaccords sur le reste. Noter les chiffres dans la section « Évaluation » de la spec.
  - **Si le critère n'est pas tenu, on s'arrête là** et on en parle avec Vincent avant la tâche 4.
- [ ] **Étape 3 :** commit `Grammaire : évaluation de l'appel de contrôle` (le script et la spec mise à jour).

### Tâche 4 : environnement, route et branchement serveur

**Fichiers :**
- Modifier : `server/src/env.ts`. Ajouter `ANTHROPIC_API_KEY: z.preprocess((v) => (v === '' ? undefined : v), z.string().min(1).optional())`.
- Créer : `server/src/routes/grammaire.ts`.
- Modifier : `server/src/app.ts`.
  - Ajouter `grammaire?: Generateur | null` dans `Deps`.
  - `app.route('/api/grammaire', routesGrammaire(deps.auth, deps.grammaire ?? null))`, dans le même bloc que `/api/voix`.
- Modifier : `server/src/index.ts`.
  - `const grammaire = env.ANTHROPIC_API_KEY ? creerGenerateur(demanderAvecAnthropic(env.ANTHROPIC_API_KEY)) : null`, passé à `creerApp`.
  - Ajouter `grammaire ${grammaire ? 'active' : 'absente'}` à la ligne de démarrage.
- Modifier : `playwright.config.ts`. Ajouter `ANTHROPIC_API_KEY: ''` dans l'`env` du serveur d'API.
- Tests :
  - `server/src/routes/__tests__/grammaire.test.ts` : vraie base, sauté sans `TEST_DATABASE_URL`, même harnais que `voix.test.ts` ;
  - un cas dans le test d'environnement existant (ou dans un nouveau `server/src/__tests__/env-grammaire.test.ts`).

**Interface produite :** `export function routesGrammaire(auth: Auth, generer: Generateur | null): Hono<AvecCompte>`.
- `GET /etat` renvoie `{ disponible: generer !== null }`.
- `GET /phrase` renvoie `200 PhraseGrammaire`, ou `503 { erreur: 'phrases indisponibles', code: 'GRAMMAIRE_INDISPONIBLE' }`.
- En-tête `Cache-Control: no-store` sur `/phrase`.

- [ ] **Étape 1 : tests de la route.**
  - 401 sans session, sur `/etat` comme sur `/phrase`.
  - Avec un `Generateur` simulé qui renvoie `{phrase:'Le chat dort.', categorie:'present'}` : réponse 200 avec ce JSON exact et `Cache-Control: no-store`.
  - Sans générateur : `/etat` renvoie `{disponible:false}` et `/phrase` renvoie 503 `GRAMMAIRE_INDISPONIBLE`.
  - Générateur qui renvoie `null` : 503.
  - Le 31ᵉ appel en moins d'une minute renvoie 429.
- [ ] **Étape 2 : test d'environnement.** `lireEnv({... ANTHROPIC_API_KEY: ''})` donne `undefined`, et `'sk-x'` est conservé.
- [ ] **Étape 3 :** implémenter, puis `npm run test:db -- server/src/routes/__tests__/grammaire.test.ts` (avec le Postgres de test lancé) et `npx vitest run server`.
- [ ] **Étape 4 :** commit `Grammaire : route serveur /api/grammaire`.

### Tâche 5 : choix du mode au lancement

**Fichiers :**
- Créer : `src/core/grammaire.ts`, avec `export async function grammaireDisponible(): Promise<boolean>`. Elle fait un `fetch('/api/grammaire/etat')` et renvoie `false` sur toute erreur ou tout statut non-OK. Elle ne garde rien en cache.
- Créer : `src/views/ChoixMode.tsx`, avec `export function ChoixMode({ onChoix }: { onChoix: (m: 'orthographe' | 'grammaire') => void })`. Deux gros boutons, **Orthographe** et **Grammaire** (`u.bouton u.primaire u.geant`), et `document.body.dataset.vue = 'MODE'`.
- Créer : `src/ui/mode.tsx`, avec `export const ContexteMode = createContext<{ changerDeMode: (() => void) | null }>({ changerDeMode: null })`.
- Modifier : `src/main.tsx`.
  - Dans `Racine`, après `synchroniserProfils`, attendre `grammaireDisponible()` avant d'afficher, comme pour le compte. Le résultat est passé à `Joueur`.
  - Dans `Joueur`, ajouter un état `mode: 'orthographe' | 'grammaire' | null`. Sa valeur initiale est `'orthographe'` si la grammaire n'est pas disponible ou si `retourDeRattachement()` est vrai, `null` sinon.
  - `null` affiche `<ChoixMode>`.
  - `'grammaire'` affiche `<FournisseurApp><VGrammaire /></FournisseurApp>` (tâche 6). En attendant cette tâche, afficher un simple « Bientôt ».
  - `'orthographe'` affiche le `FournisseurApp` / `Garde` / `App` actuel.
  - `ContexteMode` fournit `changerDeMode`, qui remet le mode à `null`, seulement quand la grammaire est disponible.
  - Le changement de joueur remet le mode à `null` : `mode` vit dans `Joueur`, sous la clé du profil.
- Modifier : `src/views/V1Accueil.tsx`. Si `changerDeMode` n'est pas nul, ajouter dans l'en-tête un bouton « Changer de mode » (le premier `<span />` vide, à gauche de l'engrenage).
- Vérifier que `retourDeRattachement` est exporté depuis son module. Sinon, l'exporter.
- Tests :
  - `src/core/grammaire.test.ts` : `fetch` simulé avec `{disponible:true}` donne `true`, une réponse 401 donne `false`, une erreur réseau donne `false`.
  - `tests/e2e/choix-mode.spec.ts`, avec `page.route('**/api/grammaire/etat', …)`.

- [ ] **Étape 1 : écrire les tests qui échouent.**
  - Test unitaire, comme décrit ci-dessus.
  - e2e :
    1. `etat` → `{disponible:true}` : après `ouvrir(page)`, `body[data-vue="MODE"]` est visible. Un clic sur « Orthographe » donne `data-vue="V1"`. Un clic sur « Changer de mode » ramène à `MODE`.
    2. Sans route simulée (le serveur de test n'a pas de clé) : `ouvrir(page)` arrive directement en `V1`, et le bouton « Changer de mode » n'existe pas.
    3. `etat` qui répond 500 : arrivée directe en `V1`.
  - Si `ouvrir` attend `V1`, le scénario 1 attend `MODE` lui-même, via `page.goto('/')` après la graine.
- [ ] **Étape 2 :** `npx vitest run src/core/grammaire.test.ts`, puis `npx playwright test tests/e2e/choix-mode.spec.ts`. Attendu : échec.
- [ ] **Étape 3 :** implémenter.
- [ ] **Étape 4 :** les deux tests au vert. Puis la suite e2e complète, `npx playwright test`, pour prouver qu'aucun parcours existant n'a bougé.
- [ ] **Étape 5 :** commit `Grammaire : choix du mode au lancement`.

### Tâche 6 : la vue grammaire

**Fichiers :**
- Modifier : `src/core/grammaire.ts`. Ajouter la logique de série, pure.
- Créer : `src/views/VGrammaire.tsx` (`data-vue="GRAMMAIRE"`), avec les styles dans `vues.module.css`.
- Modifier : `src/main.tsx`. Remplacer le « Bientôt » par `<VGrammaire />`.
- Tests : `src/core/grammaire.test.ts` et `tests/e2e/grammaire.spec.ts`.

**Interfaces produites (`src/core/grammaire.ts`) :**
```ts
export type Categorie = 'passe' | 'present' | 'futur';
export type PhraseGrammaire = { phrase: string; categorie: Categorie };
export const PHRASES_PAR_SERIE = 10;
export async function phraseSuivante(dejaVues: Set<string>): Promise<PhraseGrammaire | null>;
export type Serie = { faites: number; justes: number; courante: PhraseGrammaire | null; reponse: Categorie | null };
export function repondre(serie: Serie, choix: Categorie): Serie;
export function serieFinie(serie: Serie): boolean;
```
- `phraseSuivante` appelle `/api/grammaire/phrase`. Elle renvoie `null` sur toute erreur. Si la phrase est déjà dans `dejaVues`, elle redemande, une fois au plus. Elle ajoute la phrase retenue à `dejaVues`.
- `repondre` ignore toute réponse quand `reponse !== null`, ce qui couvre le double-clic. Sinon, elle fixe `reponse` et incrémente `faites`, ainsi que `justes` si la réponse est bonne.

- [ ] **Étape 1 : tests unitaires.**
  - `repondre` : une bonne réponse incrémente `justes` et `faites`. Une deuxième réponse sur la même phrase ne change rien.
  - `serieFinie` : vraie à `faites === 10`.
  - `phraseSuivante` : un doublon déclenche un deuxième appel. Une réponse 503 donne `null`.
- [ ] **Étape 2 : e2e.** `etat` et `phrase` sont simulés. `phrase` renvoie une file de 11 phrases distinctes aux catégories connues.
  1. La phrase est affichée en grand, avec trois boutons « Passé », « Présent » et « Futur ».
  2. Une bonne réponse donne un retour positif, puis la phrase suivante.
  3. Une mauvaise réponse montre la bonne (le bouton juste est marqué), puis la phrase suivante.
  4. Après 10 réponses, l'écran de fin affiche le score `x / 10`, un bouton « Encore » qui relance une série, et un bouton « Changer de mode ».
  5. Si `phrase` répond 503, le message « Les phrases ne sont pas disponibles pour le moment. » s'affiche avec un bouton de retour au choix du mode.
  6. Un double-clic rapide sur un bouton ne compte qu'une réponse.
- [ ] **Étape 3 : implémenter `VGrammaire`.**
  - Précharger la phrase suivante dès qu'une phrase s'affiche.
  - Retour positif : `sonItem(app.reglages.sons)` et un `encouragementSuivant()`. Vérifier les noms exacts dans `src/ui/son.ts` et `src/core/encouragements.ts`.
  - Délai avant la phrase suivante : environ 1,2 s, ou un bouton « Suivant ». C'est le builder qui choisit.
  - Les boutons de réponse sont de vrais `<button>`, donc accessibles au clavier, avec `aria-pressed` sur le choix fait.
- [ ] **Étape 4 :** les tests unitaires et e2e au vert, puis `npm run lint` et `npm run typecheck`.
- [ ] **Étape 5 :** commit `Grammaire : vue passé, présent ou futur`.

### Fin

- [ ] Suite complète : `npm run typecheck && npm run lint && npx vitest run && npx playwright test`.
- [ ] Ajouter `ANTHROPIC_API_KEY` au `README.md` / `docs/DEPLOIEMENT-RUNBOOK.md` (variables d'environnement), en précisant que l'absence de clé masque le mode grammaire.
- [ ] Ouvrir la PR vers `main`.
