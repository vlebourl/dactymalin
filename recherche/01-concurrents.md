# Patterns d'interface — apps de frappe modernes × interfaces enfants 7-12 ans

## 1. Disposition de l'écran d'exercice

### Ce que font les références

| App | Texte à taper | Clavier visuel | Indicateur de doigt |
|---|---|---|---|
| Monkeytype | Centre, 3 lignes défilantes, curseur type éditeur | Absent par défaut | Aucun |
| Keybr | Bloc de texte centré haut | Clavier sous le texte, touche cible surlignée | Coloration par doigt sur le clavier + mains schématiques optionnelles |
| typ.ing | Ligne unique très large, minimalisme extrême | Absent | Aucun |
| TypingClub / typing.com (les vraies refs enfants) | Ligne courte en haut | Clavier grand, ~40 % de l'écran, sous le texte | Mains dessinées sous le clavier, doigt cible animé/surligné |

### Le pattern qui tient pour un enfant

Un **axe vertical unique, ordre de lecture descendant** : cible → clavier → mains. L'œil de l'enfant fait un aller-retour court et toujours dans le même sens. Toute information placée latéralement (barre de progression à droite, stats en colonne) casse ce flux — les enfants de 7-12 ans n'ont pas encore le balayage visuel opportuniste des adultes.

```
┌──────────────────────────────────┐
│        [encouragement / mot]     │  zone 1 : QUOI taper   (~25 % hauteur)
│         c h a t                  │  lettre courante agrandie/soulignée
├──────────────────────────────────┤
│   ▢▢▢▢▢▢▢▢▢▢▢▢                   │  zone 2 : OÙ taper     (~40 %)
│   ▢▢▢▢▢▢▢▢▢▢▢▢   touche cible    │
│   ▢▢▢▢▢▢▢▢▢▢▢    en surbrillance │
├──────────────────────────────────┤
│      🖐 mains, doigt actif        │  zone 3 : AVEC QUOI    (~25 %)
└──────────────────────────────────┘
```

Point critique en mode 4 doigts : la zone 3 devient *plus* importante que la zone 2, parce que la contrainte n'est pas « où est la touche » mais « quel doigt y va ». Envisager d'inverser leur poids visuel dans ce mode (mains grandes, clavier réduit) plutôt que de garder une seule disposition.

### Le mot à taper : lettre par lettre, pas mot par mot
Les enfants lisent encore en décodage syllabique. Afficher le mot entier avec la lettre courante **agrandie + soulignée + colorée du doigt** (triple redondance) et les lettres déjà tapées estompées vers le vert. Ne jamais faire disparaître les lettres tapées : l'enfant a besoin de voir sa progression matérialisée.

### Défilement
Aucun. Un mot = un écran. Le texte qui défile (Monkeytype) est un pattern adulte qui suppose une lecture anticipatrice ; chez l'enfant il produit de la panique. Une suite de mots courts avec transition explicite entre chaque bat un flux continu.

---

## 2. Signaler l'erreur sans décourager

### Le spectre des traitements d'erreur observés

1. **Bloquant** (TypingClub, Keybr en mode strict) — la frappe fausse ne fait pas avancer le curseur. L'enfant doit trouver la bonne touche.
2. **Non bloquant marqué** (Monkeytype) — la lettre fausse s'affiche en rouge, on continue, l'erreur est comptée à la fin.
3. **Non bloquant silencieux** — on avance, l'erreur n'apparaît qu'au bilan.

Pour 7-12 ans avec objectif d'apprentissage moteur, **le mode bloquant est le bon** : il empêche la mémorisation du mauvais geste. Mais bloquant ≠ punitif. Deux réglages font toute la différence :

- **La cible reste visible et s'intensifie** au lieu que l'erreur soit soulignée. Sur une frappe fausse : la touche correcte pulse plus fort, le doigt correct s'anime. L'attention est redirigée vers la solution, pas vers la faute.
- **La touche fausse reçoit un retour neutre et bref** : léger grisé / secousse de 150-200 ms sur la touche pressée, pas de rouge, pas de croix, pas de son d'échec. Le rouge et le buzzer sont les deux signaux les plus cités comme sources d'abandon chez le jeune apprenant.

### Règles de conception du feedback d'erreur
- **Erreur = état transitoire, jamais un compteur cumulatif visible.** Un « 3 erreurs » affiché à l'écran transforme la session en évaluation.
- **Aucune persistance visuelle** : l'erreur disparaît dès la bonne frappe. Pas de trace rouge dans le mot terminé.
- **Escalade d'aide plutôt qu'escalade d'alerte** : 1ʳᵉ erreur → surbrillance renforcée ; 2ᵉ → le doigt s'anime ; 3ᵉ → une flèche relie le doigt à la touche, et éventuellement le nom du doigt s'écrit en clair. C'est le pattern « hint ladder » des jeux éducatifs bien conçus : plus l'enfant échoue, plus l'interface aide, jamais plus elle ne juge.
- **Son** : un son doux et court sur la réussite, **silence** sur l'erreur. L'asymétrie (récompense sonore vs absence) est perçue comme neutre ; un son d'erreur est perçu comme un reproche. Sons désactivables — beaucoup d'enfants jouent dans une pièce commune.

---

## 3. Représenter « ce doigt-là »

Trois techniques, à combiner et non à choisir :

**a) Coloration par doigt sur le clavier.** Chaque touche porte en permanence la couleur du doigt qui lui revient. C'est la convention historique (Mavis Beacon, TypingClub, Keybr, la quasi-totalité des posters de dactylo). Avantage majeur : l'enfant apprend la **carte** du clavier, pas juste la touche du moment. Inconvénient : un clavier arc-en-ciel permanent est visuellement chargé. Compromis : couleurs à faible saturation en permanence, saturation pleine sur la touche cible seulement.

**b) Mains schématiques sous le clavier.** Deux mains vues de dessus, stylisées, doigt actif rempli de sa couleur + légère animation d'appui (translation vers le bas de quelques pixels, boucle lente). C'est le seul dispositif qui enseigne réellement le geste. Les mains photoréalistes sont à éviter (vallée de l'étrange, et une main d'adulte ne ressemble pas à celle de l'enfant) — silhouette vectorielle neutre, sans genre ni couleur de peau marquée.

**c) Lien spatial explicite.** Une ligne/arc reliant le doigt animé à la touche cible. Puissant pour le débutant, à réserver au mode aide (voir hint ladder) car il encombre.

### Conventions de coloration par doigt

Il n'existe **pas de standard formel** ; il existe une convention de fait, largement partagée mais avec des variantes selon les éditeurs. Le noyau stable :

- **Une couleur par doigt, symétrique entre les deux mains** (l'index gauche et l'index droit partagent la même couleur). C'est la variante la plus courante et la plus pédagogique : elle enseigne « index » comme concept, pas « index gauche » et « index droit » comme deux choses. Variante concurrente : une teinte par main, saturations différentes par doigt — meilleure pour distinguer les mains, moins bonne pour nommer les doigts.
- **Familles chromatiques usuelles** : auriculaires et annulaires dans les tons froids (bleu/violet), majeurs en vert, index en jaune/orange, pouces en gris/neutre ou une couleur à part (la barre d'espace est souvent laissée neutre).
- **Les index héritent de deux colonnes** (ex. AZERTY : R/T/F/G/V/B à gauche) — ces touches sont colorées identiquement, ce qui rend visible que l'index « couvre plus de terrain ».

Pour ce projet, ne pas copier une palette existante : la contrainte du **mode 4 doigts** impose sa propre logique. En mode débutant, seules 4 couleurs existent (index G, index D, pouce G, pouce D) et **toutes les autres touches sont grises**. Le passage en mode complet ajoute des couleurs progressivement — la palette devient un indicateur de progression en soi, ce qui est plus lisible qu'un arc-en-ciel figé dès le premier jour.

Contrainte incontournable : **la couleur ne doit jamais être le seul porteur d'information**. Le doigt cible est signalé par couleur + position + animation + (en mode aide) nom écrit.

---

## 4. Typographie et contraste pour un jeune lecteur

- **Taille du mot cible** : très grande, de l'ordre de 48-72 px effectifs sur un écran de portable. Les enfants de 7-12 ans lisent avec un empan visuel réduit ; le sous-dimensionnement est l'erreur la plus fréquente des apps recyclées de l'adulte.
- **Labels des touches** : 18-24 px minimum. Un clavier visuel avec des étiquettes de 11 px est illisible en vision périphérique — or c'est exactement l'usage (l'enfant regarde le mot, perçoit le clavier du coin de l'œil).
- **Fonte** : sans-serif à formes ouvertes et **« a » et « g » à un seul étage** — c'est la forme que l'enfant écrit et lit à l'école. Distinguer impérativement I majuscule / l minuscule / 1, et 0 / O. Les fontes « scolaires » cursives sont à proscrire pour la cible à taper : le clavier est en capitales, l'enfant doit faire la correspondance.
- **Casse** : la question est réelle sur AZERTY, où les capitales sont gravées sur les touches mais où le contenu français s'écrit en minuscules. Recommandation : afficher le mot cible **en minuscules** (c'est ce que l'enfant doit produire) et les touches en capitales comme sur le matériel physique. Ne pas « corriger » le clavier en minuscules, il doit ressembler à la machine.
- **Contraste** : viser un rapport élevé, au-delà du minimum réglementaire (4.5:1) — 7:1 sur le texte cible. **Éviter le blanc pur sur noir pur** et le noir pur sur blanc pur : un fond légèrement crème/gris très clair réduit la fatigue et est explicitement recommandé pour les lecteurs dyslexiques.
- **Interlettrage et interlignage généreux** : espacement des lettres légèrement augmenté sur le mot cible. C'est l'intervention typographique dont le bénéfice pour les lecteurs en difficulté est le mieux établi — davantage que le choix de la fonte elle-même.

---

## 5. Accessibilité

**Dyslexie.** Le levier le plus solide n'est pas une fonte spéciale (l'efficacité des fontes « dys » type OpenDyslexic est contestée par les études contrôlées ; le bénéfice mesuré vient surtout de l'espacement qu'elles imposent). Le levier réel : espacement lettres/mots augmenté, lignes courtes, fond non blanc, un seul mot à la fois, pas de temps limite. Proposer un réglage « texte plus espacé » plutôt qu'un « mode dyslexie » étiqueté — un enfant n'aime pas cocher une case qui le désigne.

**Daltonisme.** Le deutéranopie/protanopie touche ~8 % des garçons — statistiquement pertinent pour un utilisateur unique masculin. Conséquences directes : jamais de couple rouge/vert comme opposition succès/erreur ; palette de doigts choisie pour rester distinguable en vision dichromatique (privilégier les écarts de **luminosité** entre doigts voisins, pas seulement de teinte) ; et redondance systématique (forme, position, animation, texte).

**Motricité.** Enfant de 7 ans = frappes longues, doubles frappes involontaires, touches modificatrices maintenues. L'interface ne doit jamais pénaliser une frappe lente. Compatibilité avec les touches rémanentes du système pour Maj/AltGr — critique en français où é, à, ç, et les touches mortes (^ ¨) exigent des combinaisons. Zones cliquables du clavier visuel largement dimensionnées si la souris est utilisable pour explorer.

**Général.** Pas de flash rapide ni de clignotement > 3 Hz. Toute animation doit respecter la préférence système « réduire les animations ». Pas d'information portée uniquement par le son.

---

## 6. Rythme de session

**Durée.** L'attention soutenue pour une tâche motrice répétitive : ~5-10 minutes pour 7-8 ans, ~10-15 minutes pour 11-12 ans. Les apps de dactylo enfant découpent en leçons de 1 à 3 minutes. Modèle recommandé : **micro-blocs de 8-12 items** (mots ou nombres), soit 60-90 secondes, enchaînables. La session est terminée quand l'enfant le décide, jamais imposée.

**Granularité de la récompense.** Trois niveaux, du plus fréquent au plus rare :
- *Par lettre correcte* : micro-feedback immédiat (< 100 ms), la touche s'illumine, un son doux. C'est le renforcement qui construit l'automatisme.
- *Par mot terminé* : célébration courte (0.5-1 s), une étoile, une petite animation. Assez marquée pour être satisfaisante, assez courte pour ne pas casser le rythme.
- *Par bloc terminé* : écran de fin.

Le piège est l'inflation : si chaque mot déclenche des confettis plein écran de 3 secondes, l'enfant passe plus de temps à regarder qu'à taper, et l'effet se dévalue en quelques jours.

**Écran de fin.** Il doit répondre à « qu'est-ce que j'ai réussi ? », jamais à « quel est mon niveau ? ». Contenu recommandé :
- Le nombre d'étoiles gagnées dans ce bloc (représentation figurative, pas un nombre).
- **Une progression cumulée** — la vraie source de motivation durable : lettres/doigts « débloqués », une carte du clavier qui se colore au fil des semaines. Une trace persistante bat un score volatil.
- Une phrase d'encouragement variée (10-15 formulations en rotation ; la répétition d'une seule phrase est immédiatement perçue comme creuse par un enfant de 10 ans).
- Deux boutons seulement : « Encore » (par défaut, mis en avant) et « Retour ».
- Aucun temps, aucun pourcentage, aucune comparaison à une session précédente.

**Une nuance à assumer.** L'énoncé exclut le chrono anxiogène — juste. Mais la vitesse est l'objectif final de la dactylo, et la retirer entièrement du feedback prive l'enfant de la sensation de progrès. Piste compatible : rendre la fluidité *sensible* sans la mesurer — une frappe rapide et régulière produit une animation plus vive, un enchaînement visuel plus fluide. Le rythme se ressent, il ne se note pas.

---

## 7. Six recommandations d'interface

1. **Un seul axe vertical : mot → clavier → mains.** Trois zones empilées, ordre de lecture fixe, rien sur les côtés. En mode 4 doigts, inverser le poids visuel : mains grandes, clavier secondaire, puisque la difficulté est le choix du doigt et non la localisation de la touche.

2. **Triple redondance sur la cible.** La prochaine lettre est signalée simultanément par : agrandissement dans le mot, surbrillance de la touche sur le clavier, et remplissage animé du doigt sur les mains — les trois portant la même couleur de doigt. Aucun de ces trois canaux ne suffit seul (daltonisme, vision périphérique, attention).

3. **Une palette de doigts qui grandit avec l'enfant.** Mode débutant : 4 couleurs seulement (index G/D, pouces G/D), tout le reste du clavier en gris neutre. Chaque nouveau doigt appris ajoute sa couleur. La carte du clavier devient elle-même la barre de progression.

4. **Erreur = escalade d'aide, pas d'alerte.** Frappe bloquante, retour neutre et bref sur la touche fausse (secousse grise, jamais de rouge, jamais de son), et intensification progressive de l'indice sur la bonne touche à chaque nouvel échec, jusqu'au nom du doigt écrit en clair. Aucune trace d'erreur ne persiste après la bonne frappe.

5. **Une taille de police qui paraît excessive à un adulte.** Mot cible 48-72 px, étiquettes de touches 18-24 px minimum, espacement des lettres augmenté, fond crème plutôt que blanc pur, fonte sans-serif à « a » et « g » simples. Régler l'échelle sur un enfant de 7 ans, pas sur le parent qui valide la maquette.

6. **Blocs courts, récompense à trois niveaux, sortie toujours ouverte.** Blocs de 8-12 items (60-90 s), micro-feedback par lettre, étoile par mot, écran de fin par bloc avec « Encore » comme action par défaut. L'écran de fin montre ce qui a été débloqué cumulativement, jamais une performance.

---

## 8. Trois anti-patterns

1. **Transposer l'esthétique Monkeytype.** Minimalisme sombre, texte défilant sur plusieurs lignes, densité d'information, curseur discret : c'est une interface pour adulte expert qui connaît déjà le clavier et cherche à optimiser un chiffre. Chez un enfant de 7 ans elle produit surcharge et anxiété. Le texte qui défile en particulier suppose une lecture anticipatrice que l'enfant n'a pas.

2. **Faire porter l'information par la seule couleur.** Doigt identifié uniquement par sa teinte, succès en vert / erreur en rouge, touches distinguées par nuances proches. Casse pour ~8 % des garçons, et fragile pour tous en vision périphérique — or le clavier est justement regardé du coin de l'œil.

3. **L'inflation du renforcement.** Confettis plein écran, mascotte qui parle, animation de 3 secondes à chaque mot, badges qui pleuvent. Trois effets : le temps de jeu réel s'effondre, la récompense se dévalue en quelques sessions, et l'enfant finit par optimiser pour l'animation plutôt que pour le geste. Corollaire du même travers : le compteur d'erreurs affiché en permanence, qui transforme un exercice en examen — et qu'aucune formulation encourageante ne rattrape.