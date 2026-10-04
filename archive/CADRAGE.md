# Cadrage — App d'apprentissage de la frappe (enfant 7–12 ans)

Statut : cadrage validé, phase de recherche multi-agent PAS ENCORE lancée.
Date : 2026-08-23

## Le projet
Application web pour apprendre à taper au clavier à un enfant (fils de l'utilisateur).
Interface claire, style typ.ing / kbr.com / monkeytype mais simplifiée et adaptée à un enfant.

Éléments centraux :
- Affiche un mot ou un nombre à taper
- Représentation visuelle du clavier correspondant à la disposition réellement utilisée
- Indication du doigt à utiliser pour la prochaine lettre/chiffre
- Mode débutant : uniquement pouce gauche, pouce droit, index gauche, index droit

## Mission (phase de recherche)
Recherche de l'existant + brainstorming adverse autonome.
Pour CHAQUE idée : 1 agent qui la défend, 1 agent qui la contredit, 1 agent qui juge et tranche.
Aboutir à un cahier des charges SANS aucune intervention de l'utilisateur.
Le cahier des charges présente : le projet, son fonctionnement, et des designs
réalisés avec Google Stitch pour chacune des vues possibles.

**Hors scope : la stack technique.** Ne pas en parler.

## Décisions de cadrage (5 questions validées)
1. Maquettes : **Google Stitch via son MCP** (serveur ajouté : https://stitch.googleapis.com/mcp)
2. Claviers couverts : **FR-FR (AZERTY) + CH-FR / Suisse romand (QWERTZ)** — détection auto + sélecteur manuel
3. Portée : **MVP jouable** (~5-7 vues : leçon, clavier, guide-doigt, mode débutant, écran de fin)
4. Gamification : **légère et non compétitive** — feedback immédiat, étoiles, encouragements.
   PAS de score visible, PAS de chrono anxiogène.
5. Contenu à taper : **français uniquement** — lettres, syllabes, vrais mots FR adaptés 7-12 ans,
   chiffres, accents et touches mortes. Interface en français.

## État technique
- MCP `stitch` ajouté en scope user, health check ✔ Connected.
- Outils Stitch non chargés tant que Claude Code n'a pas redémarré.
- Extension claude-in-chrome NON connectée (non nécessaire si Stitch MCP fonctionne).
- Hook deny-secrets.sh bloque toute lecture de ~/.env* — l'utilisateur exécute lui-même via `!`.

## Prochaine action après redémarrage
1. Vérifier que les outils stitch sont exposés (ToolSearch "stitch").
2. Lancer la phase ultracode multi-agent (Workflow) : recherche existant → idées →
   triades défenseur/contradicteur/juge → synthèse → maquettes Stitch par vue → cahier des charges.

## Ressources créées
- Projet Stitch : `projects/866540852572627722` (titre provisoire "Clavier Malin")
- Workflow de recherche : run `wf_057125f3-fd4`
