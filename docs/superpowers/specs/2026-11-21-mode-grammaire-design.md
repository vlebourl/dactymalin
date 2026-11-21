# Mode grammaire : passé, présent ou futur ?

Date : 2026-11-21. Statut : validée, implémentée.

## Pourquoi

L'enfant (CE1) doit apprendre à reconnaître le temps d'une phrase. C'est un besoin
de l'école, pas du clavier : on sort volontairement de la dactylographie. L'app
affiche une phrase simple, et l'enfant dit si elle est au passé, au présent ou
au futur. Il ne doit jamais revoir deux fois la même phrase, donc les phrases
sont générées à la volée par un petit modèle Anthropic, pour un coût négligeable.

**Réussi si** l'enfant peut faire une série de phrases toutes nouvelles, toujours
justes, sans attendre entre deux phrases, et que la seule façon de trouver la
réponse est de regarder le verbe.

## Objectifs

- Au lancement (après le choix du joueur), un écran propose deux modes :
  **Orthographe**, qui mène au mode actuel sans rien y changer, et **Grammaire**,
  qui mène au nouveau mode.
- En grammaire, une phrase s'affiche avec trois gros boutons : **Passé**,
  **Présent**, **Futur**.
- Les phrases sont générées une par une côté serveur, à partir d'un tirage au
  sort (sujet, verbe, thème, temps) dans une banque large.
- Chaque phrase est vérifiée par du code avant d'être affichée.

## Non-objectifs (v1)

- Pas de sauvegarde de la progression en grammaire, ni de statistiques ou de
  courbes. Le score n'existe que pendant la série.
- La phrase n'est pas lue à voix haute. La route voix n'accepte que les mots des
  listes et les consignes ; l'ouvrir à du texte généré est un autre chantier.
- Pas de passé simple ni de futur proche (« il va manger »), qui se forme avec
  le verbe *aller* au présent et embrouillerait l'enfant.
- Pas d'autres notions de grammaire (nature des mots, accords…).
- Pas de banque de phrases pré-générée en base.

## Anti-objectifs (échec même si « ça marche »)

- **Une phrase fausse affichée comme juste.** Corriger un enfant à tort est pire
  que pas d'exercice du tout.
- **Une phrase qui donne la réponse sans passer par le verbe** : « hier »,
  « demain », « bientôt »…
- **Du texte parasite affiché** : introduction, explication, auto-correction du
  modèle (c'est arrivé 4 fois sur 30 sans format imposé, voir l'évaluation).
- **Une clé API visible côté client**, ou une route qui laisse n'importe qui
  générer du texte gratuitement.

## Contraintes

- Pile existante : React + TypeScript au client, Hono au serveur, déployé par
  Coolify.
- La clé Anthropic est **par compte** (décision de Vincent, 2026-11-21 : aucune
  clé dans Coolify, plus de variable `ANTHROPIC_API_KEY`). Le parent la saisit
  dans l'espace parent ; le serveur la **vérifie** par un mini-appel avant de
  l'enregistrer, la stocke **chiffrée** (AES-256-GCM, clé dérivée de
  `BETTER_AUTH_SECRET`, table `cle_anthropic`) et n'en renvoie jamais que les
  4 derniers caractères. Sans clé enregistrée, le bouton Grammaire n'apparaît
  pas pour ce compte.
- La route exige une session et une limite de débit par compte
  (`limiterDebit`), comme `server/src/routes/voix.ts`.
- Programme de CE1 : le passé regroupe le **passé composé** et l'**imparfait**.
  Le présent est le présent de l'indicatif, le futur est le futur simple.
- Règle du dépôt : chaque correctif de bug vient avec un test de régression, et
  la nouvelle logique (validateur, tirage, route) est couverte par vitest.

## Approches envisagées

| | Approche | Gain | Coût |
|---|---|---|---|
| **A ✅ choisie** | Une phrase générée à la demande par une route serveur. Le client précharge la phrase suivante pendant que l'enfant répond. | C'est ce qui a été évalué. Ça réutilise le modèle de la voix (session, débit, variable facultative). Aucun stockage. | Il faut être en ligne. Une latence d'environ 1 à 2 s, masquée par le préchargement. |
| B | Une banque pré-générée en base, avec un suivi de « déjà vu » par profil. | Aucune latence, et une relecture possible. | Une tâche de remplissage, une migration et du suivi, pour un gain faible vu les 300 000 combinaisons et plus. |
| C | Dix phrases par séance en un seul appel. | Un appel par séance. | Non évalué. Le risque de répétition à l'intérieur d'un lot revient. |

Vincent a choisi **A**.

## Évaluation déjà faite (spike du 2026-11-21)

Les appels sont faits un par un avec `claude-haiku-5-5`, effort `low` :

1. **Sans tirage** : 30 phrases sur 30 justes, mais seulement 4 à 5 phrases
   différentes sur 10, et « Demain, » au début de toutes les phrases au futur.
   Rejeté.
2. **Tirage sujet, verbe et thème** : 30 phrases différentes sur 30, temps juste
   30 fois sur 30, mais 4 réponses polluées par une auto-correction en anglais,
   et 5 phrases à deux verbes conjugués.
3. **Avec un format JSON imposé** : 30 sur 30 propres et justes.
4. **JSON, verbes difficiles retirés et liste noire vérifiée par le code** :
   90 phrases sur 90 propres et différentes. Le temps est juste 89 fois sur 89,
   après le rejet d'une phrase par la liste noire (« …demain matin »). Il reste
   un seul mélange de temps : « dessinera un volcan qui crache ».
   Les justesses ont été vérifiées à la main. Dans `resultats4.tsv`, toutes les
   lignes sont marquées `REJET` à cause d'un bug du script. Une raison vide
   veut dire que la phrase a été acceptée. Le bug est corrigé dans `gen3.sh`.
5. **Imparfait** (`resultats-imparfait.tsv`), même configuration : 30 phrases
   acceptées sur 30, justes et différentes, après 2 rejets automatiques pour
   longueur (16 mots). On y trouve souvent des adverbes d'habitude (« souvent »,
   « chaque soir »). Ils vont avec tous les temps, donc ne donnent pas la
   réponse.
6. **Appel de contrôle, version 1** (enum `passe|present|futur|ambigu`,
   `eval-controle-v1.txt`) : sur 179 phrases, 172 sont acceptées. Le contrôle
   repère 2 mélanges sur 3, mais **rate « dessinera un volcan qui crache »**.
   Il rejette aussi à tort 5 phrases justes. Rejeté.
7. **Appel de contrôle, version 2**, retenue par Vincent (liste des verbes
   conjugués, décision prise par le code avec `controleAccepte`,
   `eval-controle-v2.txt`) : sur 179 phrases, 174 sont acceptées, sans aucune
   erreur d'API. **Les 3 vrais mélanges sont refusés**, dont celui du volcan.
   Il reste 2 faux rejets, soit environ 1 %, sans gravité puisqu'on refait
   simplement un tirage :
   - « Elle a **bien** dormi » : l'adverbe sépare l'auxiliaire du participe ;
   - « Vous gonfliez » : le modèle l'a lu comme du présent.

   Le critère de la tâche 3 du plan est tenu.

Le coût est d'environ 330 tokens en entrée et 30 en sortie par phrase, soit à peu
près 0,005 centime. Avec l'appel de contrôle, on arrive à environ 0,01 centime par phrase.

## Conception

### Serveur

**Module de génération** (`server/src/lib/grammaire.ts`) :

- **Banques** dans le code, en constantes : environ 65 sujets, 80 verbes et
  60 thèmes. Ce sont les listes du spike, dans `2026-11-21-mode-grammaire-spike/`. Les verbes retirés sont *savoir,
  vouloir, pouvoir, dire, être et avoir* : ils provoquent des subordonnées ou se
  confondent avec les auxiliaires. Ils sont remplacés par *caresser, nourrir,
  balayer, découper, souffler et gonfler*.
- **Tirage** : un sujet, un verbe, un thème et un temps parmi `passe_compose`,
  `imparfait`, `present` et `futur`, chacun avec la même probabilité.
  **Décision du builder, signalée :** avec ces poids, le « passé » sort une fois
  sur deux. Le builder peut pondérer par catégorie, un tiers chacune, en tirant
  d'abord la catégorie puis le temps du passé. C'est ce qui est recommandé.
- **Appel** au SDK officiel `@anthropic-ai/sdk` (nouvelle dépendance) :
  - modèle `claude-haiku-5-5` ;
  - `output_config: { effort: 'low', format: { type: 'json_schema', schema: { phrase: string } } }` ;
  - le prompt système du spike (`2026-11-21-mode-grammaire-spike/gen3.sh`, variable `SYS`), qui demande la phrase finale
    dans le champ `phrase`.
- **Validateur** : une fonction pure, testée. Elle rejette une phrase :
  - sur plusieurs lignes ;
  - de plus de 15 mots ;
  - qui contient un mot de la liste noire, en comparant des mots entiers sans
    tenir compte des majuscules (expressions de plusieurs mots comprises). La
    liste noire compte 41 entrées : hier, demain, déjà, bientôt, prochain(e)(s),
    dernier/dernière(s), ce soir, etc. « il y a » est volontairement absent,
    parce qu'il bloquait « Il y a un chat. » ;
  - vide, ou dont le JSON est invalide.
- **Appel de contrôle** (décidé par Vincent après évaluation, voir §Évaluation
  6-7) : un deuxième appel, indépendant, relève les verbes conjugués de la phrase
  **sans connaître le temps demandé**, même modèle, effort `low`, format JSON
  imposé `{ verbes: [{ verbe, categorie }] }`. C'est le code qui décide
  (`controleAccepte`) : au moins un verbe, tous de la catégorie demandée, et
  chaque verbe présent dans la phrase. Sinon la phrase est rejetée et on refait
  un tirage.
- **Nouvel essai** : jusqu'à 3 tirages neufs, que l'échec vienne du validateur
  ou de l'appel de contrôle. Si les trois échouent, on renvoie
  une erreur, que le client traite comme « indisponible ».

**Route** `server/src/routes/grammaire.ts`, montée sur `/api/grammaire` dans
`app.ts`, dans le même bloc que la voix (base et auth présentes) :

- `GET /etat` → `{ disponible: boolean }` (vrai si le compte a une clé enregistrée) ;
- `GET /phrase` → `{ phrase: string, categorie: 'passe' | 'present' | 'futur' }`,
  ou `503 { code: 'GRAMMAIRE_INDISPONIBLE' }` sans clé (ou clé illisible) ou
  après trois échecs. Les phrases sont payées par la clé du compte ;
- `exigeSession(auth)` et `limiterDebit(30, 60_000)`.
- `GET|PUT|DELETE /api/compte/cle-anthropic` : session exigée. `PUT { cle }`
  valide le format (`sk-ant-`, 20 à 300 caractères → sinon `CLE_INVALIDE`),
  vérifie la clé (401/403 → `CLE_REFUSEE`, autre échec → 502
  `VERIFICATION_IMPOSSIBLE`), puis l'enregistre chiffrée ; `limiterDebit(10, 60_000)`.
  La clé complète ne repart jamais vers le navigateur et n'est jamais journalisée.

La réponse attendue part avec la phrase. Un enfant qui ouvrirait les outils de
développement pourrait tricher, ce qui est acceptable. Le temps exact (passé
composé ou imparfait) n'est pas envoyé : seule la catégorie compte pour
l'exercice.

### Client

- **Nouvelle vue d'entrée « choix du mode »**, qui devient la première vue de
  l'app, juste après le choix du joueur, à la place du calcul actuel de
  `etatDeDepart` (V1 ou V2) :
  - **Orthographe** mène exactement à ce que l'app montre aujourd'hui au
    démarrage : V2 au premier lancement, sinon V1, et V9 au retour de Google ;
  - **Grammaire** mène à la nouvelle vue ;
  - le retour de Google (`retourDeRattachement`) continue d'aller directement en
    V9, sans passer par ce choix.
- On doit pouvoir **revenir au choix du mode** depuis l'accueil orthographe et
  depuis le mode grammaire. **Décision du builder** : la forme exacte, un bouton
  dans l'en-tête comme l'engrenage.
- Si `/api/grammaire/etat` renvoie `disponible: false`, la carte Grammaire est
  masquée.
  **Décision du builder** : sauter l'écran de choix quand seul Orthographe
  existe, ou l'afficher quand même.
- **Vue grammaire** :
  - la phrase en grand, avec la police de l'app ;
  - trois gros boutons Passé, Présent et Futur, accessibles au clavier ;
  - **bonne réponse** : un retour positif, en réutilisant les sons, les étoiles
    et les encouragements existants, puis la phrase suivante, déjà préchargée ;
  - **mauvaise réponse** : on montre doucement la bonne réponse, puis on passe à
    la suite. **Décision du builder** : dire ou non *quel* verbe regarder. Il n'y
    a pas d'information fiable sur le verbe dans la réponse actuelle ;
  - **séries de 10 phrases**, avec un écran de fin léger : le score et un bouton
    « encore ».
- **Ne jamais revoir la même phrase** : le tirage sur 300 000 combinaisons et
  plus suffit. En complément, le client écarte un doublon exact déjà vu pendant
  la séance (un `Set` en mémoire).
- **Hors ligne, ou 503 en cours de série** : un message simple (« Les phrases ne
  sont pas disponibles pour le moment ») et un retour au choix du mode.

### Tests

- vitest, serveur :
  - le validateur : cas acceptés et rejetés, dont « Il y a un chat. » accepté et
    « …demain matin » rejeté ;
  - la boucle de nouvel essai, avec un client Anthropic simulé ;
  - `controleAccepte` et l'appel de contrôle, avec un client simulé : aucun verbe, un verbe d'une autre catégorie ou absent de la phrase provoque un rejet ;
  - la route : 401 sans session, 503 sans clé, forme de la réponse, 429 au-delà
    de la limite.
- vitest, client : la transition d'état vers le choix du mode, puis vers
  Orthographe ou Grammaire.
- Playwright :
  - le parcours choix du mode, puis Orthographe, arrive au même écran
    qu'aujourd'hui ;
  - le parcours Grammaire, avec `/api/grammaire/phrase` simulé, affiche la
    phrase et réagit à une réponse.

## Laissé au builder

- La forme visuelle exacte du choix du mode et de la vue grammaire. Elle suit les
  tokens et composants existants (`ui.module.css`, `u.bouton`, `u.geant`).
- Le nom et le numéro des nouvelles vues dans le type `Vue`.
- L'emplacement des banques : constantes TS ou JSON dans `server/src/data`.
- Le chargement de la phrase suivante (préchargement d'une phrase d'avance).
- La pondération du tirage (voir plus haut) et le texte exact des messages.
- Les décisions marquées « Décision du builder » ci-dessus.
