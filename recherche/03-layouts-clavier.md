# État de l'art pédagogique — apprentissage du doigté chez l'enfant de 7 à 12 ans

## 0. Avertissement sur la qualité des preuves

La littérature *évaluée par les pairs* sur l'enseignement du clavier aux enfants est mince et ancienne. La majorité des affirmations circulantes (« commencer à 7 ans », « 15 min par jour ») viennent d'éditeurs de logiciels ou de blogs pédagogiques, pas d'études contrôlées. En revanche, trois corpus scientifiques solides s'appliquent par transfert : (a) la recherche HCI sur la frappe réelle (Feit et al., CHI 2016), (b) l'apprentissage moteur (distribution de la pratique, interférence proactive), (c) la théorie de la charge cognitive (effet de partage de l'attention). Ce rapport distingue explicitement ce qui est **établi**, **plausible** et **folklore**.

---

## 1. Maturité de la main : à quel âge la position de repos à 8 doigts est-elle tenable ?

**Ce qui est raisonnablement documenté**
- Le critère pertinent n'est pas l'âge mais la **taille de main** : l'enfant est prêt quand les doigts atteignent les touches sans que le poignet ne se déplace ni ne se torde. Repère opérationnel courant : la paume repose confortablement sur le repose-poignet et les 4 doigts couvrent 4 touches contiguës ([Ratatype](https://www.ratatype.com/typing-tips/0406-at-what-age-should-you-teach-a-child-to-type-and-how-can-you-avoid-putting-them-off/)).
- Les services d'ergothérapie pédiatrique (NHS Pays de Galles) situent l'usage confortable du clavier **à deux mains vers 7 ans**, avec adaptation du matériel avant ([ABUHB Children's OT](https://abuhb.nhs.wales/files/childrens-ot/keyboard-skills-advice-pdf/), [BCUHB touch typing](https://bcuhb.nhs.wales/services/hospital-services/occupational-therapy/childrens-emergency-department/service-areas/east-area-wrexham-and-flintshire/forms-and-pdfs/ecot-s006-touch-typing/)).
- La recommandation scolaire dominante place l'enseignement **formel** du doigté en 4e année (~9-10 ans), au motif que la coordination visuo-motrice n'est pas suffisamment développée avant ([typing.com](https://www.typing.com/blog/age-kids-developmentally-reading-typing/), [Tech & Learning](https://www.techlearning.com/tl-advisor-blog/11263)).
- Prérequis moteurs cités par les ergothérapeutes : **isolation des doigts** (bouger un doigt sans les autres) et arche palmaire stable ([The OT Toolbox](https://www.theottoolbox.com/typing-programs-for-kids/)).

**Ce qui est plausible mais que je ne peux pas sourcer solidement**
L'individuation des doigts — surtout **auriculaire et annulaire**, qui partagent des connexions tendineuses et corticales — continue de mûrir bien au-delà de 7 ans. C'est cohérent avec le constat de terrain que les petits doigts « décrochent » de la rangée de repos et que les enfants compensent en déplaçant toute la main. Je le donne comme hypothèse forte, pas comme fait établi.

**Conclusion pour un enfant de 7 ans** : la géométrie (atteindre les touches) est probablement acquise ; l'**ancrage statique simultané des 8 doigts** ne l'est pas. À 7 ans on peut apprendre un mapping doigt→touche correct ; exiger la posture complète des 8 doigts d'emblée est prématuré. Vers 9-10 ans, les deux sont réalistes. La cible d'âge 7-12 recouvre donc deux publics moteurs distincts — l'app doit le refléter par une progression, pas par un réglage unique.

---

## 2. Apprentissage moteur : ce qui prédit réellement la performance

L'étude la plus décisive est **Feit, Weir & Oulasvirta, « How We Type », CHI 2016** (30 participants, capture de mouvement, mention Best Paper) ([site du labo Aalto](https://userinterfaces.aalto.fi/how-we-type/), [Zenodo](https://zenodo.org/records/4034268)).

Résultats clés :
- Les autodidactes utilisant **moins de 10 doigts atteignent des vitesses comparables** aux dactylos formés. Le nombre de doigts n'est pas le prédicteur.
- Trois prédicteurs de la performance : **(1) un mapping non ambigu** (une lettre est toujours frappée par le même doigt), **(2) la préparation anticipée** de la frappe suivante, **(3) un mouvement global des mains minimal**.
- On peut taper sans regarder ses doigts sans avoir jamais appris la méthode à 10 doigts.

C'est le résultat central pour ce projet : **ce que l'app doit installer, c'est la constance du mapping et l'immobilité des mains — pas le compte de doigts.**

Corollaires d'apprentissage moteur :
- **Interférence proactive** : modifier une compétence déjà automatisée provoque une chute de performance initiale et mobilise des fonctions inhibitrices ([ScienceDirect, 2021](https://www.sciencedirect.com/science/article/abs/pii/S016794572100049X)). C'est le vrai coût du « désapprentissage » — il est réel, mais il s'applique à un mapping *automatisé*, pas à quelques semaines de pratique.
- **Vitesse avant précision = plateau** : taper vite avec erreurs renforce simultanément les programmes moteurs corrects et incorrects, qui entrent en compétition. La précision d'abord n'est pas une politesse, c'est une contrainte motrice.

---

## 3. Charge cognitive et durée de session

- **Effet de partage de l'attention** : la production motrice est horizontale (clavier) et le résultat vertical (écran). Chez le scripteur novice, les allers-retours regard clavier↔écran sont coûteux et dégradent la performance ([Scientific Reports, 2025](https://www.nature.com/articles/s41598-025-03369-x) ; [split attention effect](https://en.wikipedia.org/wiki/Split_attention_effect)). Conséquence directe : **la zone de texte, le clavier virtuel et l'indication de doigt doivent être verticalement contigus**, pour que le regard n'ait quasi aucun trajet à faire.
- Le novice doit chercher visuellement chaque lettre : charge intrinsèque maximale. Ajouter du bruit visuel (score, chrono, animations) est de la **charge extrinsèque** — exactement ce que la théorie dit d'éliminer chez le débutant. Cela valide, sur base théorique et pas seulement affective, le choix « pas de score, pas de chrono ».
- **Pratique distribuée > pratique massée** pour l'acquisition motrice et la rétention à court et long terme ([Human Kinetics](https://us.humankinetics.com/blogs/excerpt/distribution-of-practice-in-motor-learning-and-development) ; Colino et al., [PDF](https://www.krigolsonteaching.com/uploads/4/3/8/4/43848243/colino_et_al._practice_paper.pdf)). Illustration classique : 3 × 10 min sur trois jours battent 1 × 30 min (Bloom & Shuell, 1981).
- La recommandation praticienne convergente est **10 à 15 minutes par jour**, avec pauses et étirements ([Ratatype guide enseignants](https://www.ratatype.com/faq/The-ultimate-Guide-for-Teachers-to-teach-touch-typing-to-children/)). Pour un enfant de 7-8 ans, viser plutôt **5-10 minutes**, découpées en séries courtes.

---

## 4. Quelles séquences de lettres enseigner en premier, et pourquoi

**Le canon (méthode dactylographique classique, AZERTY)**
1. **Rangée de repos** : `Q S D F` — `J K L M` (l'équivalent AZERTY de ASDF-JKL;), avec les pouces sur la barre d'espace. Repères tactiles : ergots sur `F` et `J`.
2. Puis les touches les plus fréquentes, **une rangée à la fois**, chaque doigt montant/descendant dans **sa colonne** et revenant au repos. Aucun déplacement latéral, **sauf les index qui couvrent deux colonnes**.
3. Progression : lettres → mots → phrases → majuscules → chiffres ([cours-et-fiches](https://cours-et-fiches.com/apprendre-dactylographie/), [ticken.be](https://www.ticken.be/fr/dactylographie/ecoles.html)).

**Pourquoi cet ordre** : la rangée de repos est le point d'ancrage qui rend le mapping non ambigu et le mouvement global minimal — les deux prédicteurs de Feit. Ce n'est pas un ordre optimisé par fréquence de lettres, c'est un ordre optimisé par **stabilité posturale**.

**La variante développementale** : *Keyboarding Without Tears* (K-5) enseigne les touches par **rangées horizontales codées en couleur** et fait taper **d'abord d'une seule main**, à deux mains ensuite ([lwtears](https://www.lwtears.com/technology/developmentally-appropriate)). C'est le précédent commercial le plus proche du « mode réduit » demandé : commencer avec **moins de doigts que la cible** est une pratique établie chez les jeunes enfants, pas une invention.

**Contrainte propre au français** : la fréquence élevée de `e`, `s`, `a`, `i`, `n`, `t`, `r` fait que la rangée de repos AZERTY (`qsdfjklm`) donne peu de mots réels — d'où l'usage de **syllabes** avant les mots. Les accents et touches mortes (`^`, `¨`) doivent arriver tard, après stabilisation du mapping de base, car ils introduisent une séquence à deux frappes.

---

## 5. Le mode « 4 doigts » (pouces + index) : défendable ou nocif ?

**Réponse : défendable — sous une condition unique et non négociable.**

**L'argument pour**
- Le prédicteur n° 1 de la performance est la **constance du mapping**, pas le nombre de doigts (Feit et al.). Un mode à 4 doigts avec mapping strict entraîne *exactement* la bonne variable.
- Dans la méthode cible à 8 doigts, les index couvrent déjà `F G R T V B` (gauche) et `H J Y U N` (droite), et les pouces la barre d'espace. **Un mode restreint aux zones index+pouces n'est pas une méthode alternative : c'est littéralement la première leçon de la méthode standard**, isolée. Aucun geste appris n'aura à être défait. Le « désapprentissage » n'existe que si le mode enseigne une association doigt→touche *contradictoire* avec la cible.
- Précédent pédagogique établi : KWT fait taper d'une seule main avant les deux.
- Bénéfice en charge cognitive : réduire l'espace des réponses de 26+ touches à ~11 fait chuter la charge intrinsèque au moment où elle est maximale — précisément le levier prescrit par la théorie de la charge cognitive.

**Le risque réel, et il est unique**
Si le mode laisse (ou pousse) un index à frapper une touche qui appartient à un autre doigt dans la méthode cible — `a`, `e`, `p`, `o`, `q`, `m`… — alors on installe un mapping **contradictoire** qui devra être inhibé plus tard, avec l'interférence proactive documentée et une chute de performance à la transition. C'est là, et seulement là, que le mode devient du hunt-and-peck déguisé.

**Condition de validité, à graver dans la spec**
> En mode 4 doigts, **aucune touche affichée ne doit sortir des colonnes attribuées aux index et aux pouces dans la disposition active**. Le contenu à taper est contraint par le clavier, jamais l'inverse.

**Conséquence pratique à anticiper** : en AZERTY, l'alphabet index-only se réduit à `f g r t v b` + `h j y u n` (+ espace, + chiffres `4 5` / `6 7`). Les mots français réellement typables sont rares (`tu`, `un`, `nu`, `vu`, `but`, `brut`, `jury`, `futur`, `gnu`…). Le mode 4 doigts devra donc reposer majoritairement sur des **syllabes, chiffres et pseudo-mots**, pas sur du vocabulaire riche. C'est une contrainte de conception à assumer dès maintenant : le mode 4 doigts est un **sas court** (quelques séances), pas un niveau où l'enfant peut stagner des semaines. Et il faut une porte de sortie explicite vers l'ajout progressif des majeurs, annulaires puis auriculaires.

**Verdict** : mode 4 doigts = **oui**, comme étape 1 d'une progression additive (4 → 6 → 8 doigts), avec verrouillage strict du mapping. **Non** s'il est implémenté comme « tape avec ce que tu veux, on t'indique juste un index » — ce serait alors la seule version qui ancre une mauvaise habitude.

---

## 6. Cinq enseignements actionnables

1. **Contraindre le contenu par le clavier, pas l'inverse.** Chaque leçon déclare un ensemble de touches autorisées ; le générateur de mots/syllabes/chiffres ne peut produire que ce qui est typable avec les doigts déjà enseignés. C'est la règle qui rend le mode 4 doigts sain et qui doit gouverner toute la progression.

2. **Un doigt = une touche, toujours, dès la première seconde.** L'indication de doigt doit être une vérité unique et non ambiguë, identique en mode 4 doigts et en mode 8 doigts. Ne jamais proposer d'alternative « c'est plus facile avec l'autre main ».

3. **Colocaliser mot à taper, clavier virtuel et indicateur de doigt sur un axe vertical serré.** L'objectif explicite est de supprimer le trajet du regard (effet de partage de l'attention). Corollaire : prévoir un **estompage progressif** du clavier virtuel (surbrillance → clavier grisé → clavier masqué), sinon l'aide devient une béquille permanente et l'enfant ne quittera jamais le regard de l'écran-clavier.

4. **Séances courtes et quotidiennes : 5-10 min à 7-8 ans, 10-15 min à 10-12 ans**, découpées en micro-séries de 30-60 s avec une pause visuelle entre chaque. La pratique distribuée bat la pratique massée pour l'acquisition *et* la rétention. Prévoir une fin de séance nette et proposée par l'app, pas laissée à l'enfant.

5. **Précision avant vitesse, et le renforcer dans le feedback.** Comptabiliser une répétition comme réussie uniquement si elle est frappée sans erreur ; en cas d'erreur, faire retaper la lettre (pas la ligne entière) plutôt que d'avancer. Cela évite la co-construction de programmes moteurs concurrents qui plafonnent la vitesse. Cette règle est parfaitement compatible avec la gamification non compétitive : on célèbre la propreté du geste, pas le chrono.

---

## Sources

- [How We Type: Movement Strategies and Performance in Everyday Typing — Feit, Weir & Oulasvirta, CHI 2016 (page projet)](https://userinterfaces.aalto.fi/how-we-type/) et [dépôt Zenodo](https://zenodo.org/records/4034268)
- [Comparing the effects of typing and handwriting on spelling performance in school — Scientific Reports, 2025](https://www.nature.com/articles/s41598-025-03369-x)
- [Split attention effect](https://en.wikipedia.org/wiki/Split_attention_effect)
- [On the role of different subdimensions of inhibition for successful motor skill change — ScienceDirect, 2021](https://www.sciencedirect.com/science/article/abs/pii/S016794572100049X)
- [Distribution of practice in motor learning and development — Human Kinetics](https://us.humankinetics.com/blogs/excerpt/distribution-of-practice-in-motor-learning-and-development)
- [Colino et al., Distribution of Practice has Time Dependent Effects on Motor Skill Acquisition (PDF)](https://www.krigolsonteaching.com/uploads/4/3/8/4/43848243/colino_et_al._practice_paper.pdf)
- [Occupational Therapy Advice for Keyboard Skills — Aneurin Bevan UHB (NHS Wales)](https://abuhb.nhs.wales/files/childrens-ot/keyboard-skills-advice-pdf/)
- [Touch Typing — Betsi Cadwaladr UHB, ergothérapie pédiatrique](https://bcuhb.nhs.wales/services/hospital-services/occupational-therapy/childrens-emergency-department/service-areas/east-area-wrexham-and-flintshire/forms-and-pdfs/ecot-s006-touch-typing/)
- [At What Age Are Kids Developmentally Ready for Typing? — typing.com](https://www.typing.com/blog/age-kids-developmentally-reading-typing/)
- [How and When to Teach Children to Type — Tech & Learning](https://www.techlearning.com/tl-advisor-blog/11263)
- [Keyboarding Without Tears — Developmentally Appropriate](https://www.lwtears.com/technology/developmentally-appropriate)
- [Ratatype — guide pour enseignants](https://www.ratatype.com/faq/The-ultimate-Guide-for-Teachers-to-teach-touch-typing-to-children/) et [à quel âge apprendre](https://www.ratatype.com/typing-tips/0406-at-what-age-should-you-teach-a-child-to-type-and-how-can-you-avoid-putting-them-off/)
- [Apprendre la dactylographie — cours-et-fiches.com (méthode AZERTY, rangée de repos)](https://cours-et-fiches.com/apprendre-dactylographie/)
- [Le cours de dactylographie dans le programme scolaire — ticken.be](https://www.ticken.be/fr/dactylographie/ecoles.html)
- [Typing Programs for Kids — The OT Toolbox](https://www.theottoolbox.com/typing-programs-for-kids/)