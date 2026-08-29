# Bibliothèque de leçons perso

Décision du 2026-08-29, arrêtée au terme d'une session de contradiction (skill
`grilling`). Ce document est le contrat : ce qu'on construit, ce qu'on a écarté
et pourquoi, ce qu'on accepte de perdre.

Il fait suite à `COMPTES-ET-DEPLOIEMENT.md`, qui a introduit les comptes en les
laissant **facultatifs**. Ici ils deviennent **obligatoires**, et la liste unique
`motsPerso` devient une bibliothèque.

---

## 1. Ce qu'on construit

Le parent se connecte une fois. Il gère une bibliothèque de listes de mots au
niveau du **foyer**. L'enfant, lui, **choisit** depuis l'accueil : le parcours
d'apprentissage, ou l'une des listes. Il ne saisit rien.

---

## 2. Comptes

| Point | Décision |
|---|---|
| Modèle | Compte **parent unique** → profils enfants → progression. L'enfant ne voit jamais le login. |
| Obligatoire ? | Oui, pour lancer l'app. C'était facultatif jusqu'ici. |
| Google SSO | **Ajouté** à l'email/mot de passe, pas substitué. |
| Migration de base | **Aucune** : `account` porte déjà `provider_id`, `issuer`, `id_token`, `access_token`, `scope` (`server/src/db/schema.ts:31-50`). |
| Liaison de comptes | **Désactivée.** Google et mot de passe sur la même adresse = deux comptes distincts. |
| Suppression de compte | `DELETE /api/compte`, livrée dès l'étape 1. |

### Pourquoi pas de liaison automatique

`requireEmailVerification` est à `false` (`server/src/auth.ts:30`). Avec la
liaison automatique, n'importe qui crée un compte mot de passe avec une adresse
Gmail qu'il ne possède pas ; le login Google du propriétaire légitime atterrit
alors **dans le compte de l'attaquant**. Le bon état final est
« liaison + vérification d'email », mais la vérification exige un envoi de
courriels (SMTP, domaine, délivrabilité) qui n'existe pas. Deux comptes
distincts, donc, et une friction assumée.

### Pourquoi la suppression de compte maintenant

Tant que le compte était facultatif, s'en passer était tenable. Obligatoire, il
n'y a plus de porte de sortie. Le coût est faible : les clés étrangères sont
déjà en `cascade` (`schema.ts:18,31,66,81`), supprimer la ligne `user` emporte
sessions, comptes, profils, progressions et listes.

---

## 3. Hors ligne

L'app ne s'ouvre sur un écran de login qu'**au premier lancement**. Ensuite elle
**démarre hors ligne** tant que la session Better Auth est valide (60 jours,
`auth.ts:37`) : profils et listes en cache restent jouables.

L'**édition** de la bibliothèque exige le réseau. Le cache des listes est en
**lecture seule** — pas de file d'attente, pas de fusion de conflits d'édition
(deux appareils qui renomment la même liste). C'est une machinerie entière pour
un cas qui n'arrivera pas : préparer une liste est un geste de parent, posé, à
la maison.

Écarté : le mode strict (« pas de réseau, pas d'app »). Il transforme une app
d'apprentissage en app qui refuse de démarrer quand un serveur unique, sans
redondance, tombe.

---

## 4. Données

### La liste

```
liste(id text PK, user_id text → user cascade, nom text, mots jsonb, cree_le)
```

- **Appartient au compte**, pas au profil enfant. La dictée du CE1 sert au
  grand ; les prénoms de la famille servent aux deux. Attacher au profil force
  le parent à ressaisir.
- **Mots en `jsonb`**, pas une ligne par mot : on ne requête jamais un mot
  isolé, on charge toujours la liste entière. Même choix que `progression.etat`
  (`schema.ts:85`).
- **Forme minimale** : `{id, nom, mots[], créée le}`. Pas d'icône, pas de
  couleur, pas d'ordre imposé ni de taille de bloc paramétrable. `composerBlocDeListe`
  mélange et coupe à 12 — ça marche, on ne le paramètre pas avant qu'un usage
  réel le demande.
- **Privée au compte.** Ni partage par lien, ni catalogue public. Ce sont des
  produits différents : le partage apporte modération et contenu tiers arbitraire,
  le catalogue apporte un travail éditorial. On ne les bâcle pas maintenant.
- **Bornes** : 30 listes par compte, 100 mots par liste, 1 à 30 caractères par
  mot. Les deux dernières sont les bornes actuelles de `motsValides` (alors `motsPersoValides`).

### Ce qui disparaît

- **`motsPerso`** : retiré du type `Sauvegarde` (`src/core/storage.ts:27`), du
  blob `progression.etat`, de `fusion.ts:40`, et des tests. **Pas de code de
  migration** — on est en beta, personne n'utilise. Écrire, tester puis
  supprimer une migration pour sauver une liste qu'on retape en une minute est
  du travail net négatif.
- **`CLE_LIENS`** et l'appariement local↔serveur **par prénom en minuscules**
  (`src/core/sync.ts:26,190`). Les profils viennent désormais du serveur ; leur
  id serveur est le seul id. Trois bugs disparaissent par soustraction :
  homonymes fusionnés silencieusement, renommage qui casse le lien, `Date.now()`
  qui fait toujours gagner le local sur les préférences (`sync.ts:207`).

### Ce qui reste

La progression est toujours **locale d'abord**, avec file d'attente et
`fusion.ts` — le hors ligne (§3) l'exige, et deux appareils sur un même compte
aussi.

---

## 5. Écrans

| Écran | Décision |
|---|---|
| **Portail de connexion** | Nouvelle vue montée **au-dessus de `FournisseurApp`** dans `src/main.tsx`, au même étage que V0 aujourd'hui. Il vit avant qu'un profil soit choisi : il ne peut structurellement pas être une valeur de `app.vue`. |
| **V9** | Refondu en **espace parent** : profils, bibliothèque, suppression de compte. |
| **Compte neuf** | On demande **le prénom du premier enfant**. Plus de « Joueur 1 » créé d'office (`src/core/profils.ts:51-57`) — un nom que personne ne garde et que personne ne pense à changer. |
| **« Qui joue ? »** | Raccourci conservé : un seul profil → on saute l'écran (`profils.ts:76-86`). |
| **Accueil V1** | Le gros bouton « On commence ! », puis une **grille de cartes**, une par liste, cliquables directement. Le **textarea disparaît**. |

Écarté : un écran de sélection de liste intercalé. Une liste = un bouton ; un
enfant reconnaît la carte de sa liste au coup d'œil. Un écran de plus n'aurait
de sens qu'au-delà d'une quinzaine de listes, ce que le plafond de 30 rend
improbable.

### Qui édite

Le **parent seul**, depuis l'espace parent. L'enfant choisit. Un enfant qui
apprend à taper ne saisit pas une liste de vingt mots, et le textarea est
aujourd'hui l'élément le plus lourd d'un écran censé dire « appuie ici pour
jouer ».

---

## 6. Promesse réseau — amendée

Elle devient : **« aucun tiers pendant la leçon »**.

Google SSO envoie l'utilisateur sur `accounts.google.com` et fait connaître le
service à Google. C'est incompatible avec la formulation d'origine, et la police
Lexend est servie localement **exprès** pour ne pas toucher Google Fonts.

L'amendement est **étroit** : `tests/e2e/reseau.spec.ts:32-46` reste intact, et
un nouveau test vérifie que le trafic Google n'apparaît **que** sur l'écran de
connexion, jamais après. L'écran de connexion est vu par le parent, une fois.
Restreindre la promesse à « pendant la leçon » la garde vraie là où elle compte ;
l'assouplir globalement l'aurait vidée de sens.

---

## 7. Tests

### Postgres devient obligatoire pour l'e2e

Aucun test ne peut plus atteindre la leçon sans être connecté. Un helper
`connecte(page)` crée un compte par l'API en `beforeEach` ; les `skip`
conditionnels sur `db:'ok'` (`tests/e2e/compte.spec.ts:16-24`) disparaissent.
Le hook `.githooks/pre-push` exigera donc une base locale — `docker-compose.yml`
la fournit déjà, `npm run test:db` pointe dessus.

**Écarté : un contournement d'auth en mode test.** Cela met un chemin de
bypass dans le code de production, la classe de bug qui finit activée en prod
par une variable mal posée.

### Google SSO — trois niveaux, pas de faux serveur OAuth

1. e2e : le bouton existe et pointe vers la bonne route Better Auth.
2. serveur : `socialProviders` est configuré **si et seulement si** les deux
   variables d'environnement sont présentes.
3. manuel : une vérification de bout en bout, consignée au runbook.

Un faux serveur OAuth testerait surtout notre capacité à écrire un serveur
OAuth. Ce qui casse en pratique — clé, secret, URL de redirection — n'est
vérifiable que sur le vrai Google.

### `sync.ts`

Il n'a **aucun** test unitaire aujourd'hui, alors que c'est le module qui a
produit les trois bugs ci-dessus, et que l'étape 2 le réécrit.

- Unitaires, `fetch` simulé : file d'attente hors ligne, rejeu au retour du
  réseau, conflit 409 rejoué **une seule fois**, cache des listes en lecture seule.
- **Un e2e à deux contextes navigateur**, même compte : une progression faite
  sur l'un apparaît sur l'autre. C'est le seul test qui prouve la promesse
  centrale du compte. Il était prévu au plan de `COMPTES-ET-DEPLOIEMENT.md`
  sans jamais être écrit.

### Bibliothèque

- Unitaire : validateur de liste (nom, bornes, plafond de 30).
- Serveur : **isolation** — un compte A ne lit, ne modifie et ne supprime aucune
  liste d'un compte B, **sur les quatre routes**. Non négociable : c'est là que
  fuient les données d'une famille vers une autre.
- e2e : le parent crée une liste, l'enfant la joue, le palier ne bouge pas
  (adaptation de `tests/e2e/lecon-perso.spec.ts`).

---

## 8. Routes

Calquées sur `/api/profils` : session obligatoire, filtre `user_id` sur
**chaque** requête (`server/src/routes/profils.ts:41,67,88`), validateur partagé
client/serveur (`estIntact` l'est déjà, `profils.ts:10`).

| Méthode | Route | Note |
|---|---|---|
| `GET` | `/api/listes` | les listes du compte |
| `POST` | `/api/listes` | refus au-delà de 30 |
| `PUT` | `/api/listes/:id` | filtre `user_id` |
| `DELETE` | `/api/listes/:id` | filtre `user_id` |
| `DELETE` | `/api/compte` | cascade complète |

---

## 9. Livraison — 4 étapes

L'ordre est contraint : 2 dépend du compte obligatoire de 1, 3 dépend du socle
serveur de 2. Chaque étape est poussable et testable seule.

1. **Connexion obligatoire** — portail avant `FournisseurApp`, Google SSO,
   création du premier profil, suppression de compte, helper e2e.
2. **Profils serveur-first** — suppression de `CLE_LIENS` et de l'appariement
   par prénom, réécriture et tests de `sync.ts`.
3. **Bibliothèque** — table `liste`, routes, espace parent, cache hors ligne.
4. **Accueil** — grille de listes, suppression du textarea et de `motsPerso`.

---

## 10. Risques acceptés

Énoncés, pas subis.

- **L'app ne démarre plus jamais sans un premier passage en ligne.** Serveur
  unique, pas de redondance. (La CI est arrivée depuis : le workflow
  `Vérifications` garde la porte, et le déploiement attend son verdict.)
- **Pas de récupération de mot de passe** (`src/views/V9Compte.tsx:176-178`).
  Aujourd'hui la perdre coûte la synchronisation ; demain elle coûte l'app.
  Google SSO couvre les comptes Google, pas les autres.
- **Google apprend l'existence du service** et qui s'y connecte.
- **Deux comptes possibles pour une même personne**, jusqu'à ce qu'un envoi de
  courriels existe.
