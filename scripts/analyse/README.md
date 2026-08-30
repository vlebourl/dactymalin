# scripts/analyse — mesure du rendement lexical des paliers

Scripts jetables mais reproductibles, servant le rapport
`recherche/v2/T3-rendement-lexical.md`. Rien ici n'est importé par l'app.

## Données (non versionnées — à retélécharger)

```bash
D=/tmp/dactylo-data && mkdir -p $D && cd $D
curl -o db.zip http://o.bacquet.free.fr/duboisbuyse_txt.zip && unzip -o db.zip
mv duboisbuyse.txt $D/ 2>/dev/null || true          # échelle Dubois-Buyse, 3726 mots
curl -O http://www.lexique.org/databases/Lexique383/Lexique383.tsv   # 142 694 formes
```

## Chaîne

```bash
cd <racine du dépôt>
node scripts/analyse/dump-app.mjs > $D/app.json        # paliers + corpus RÉELS de l'app
python3 scripts/analyse/construire-lexique.py $D > $D/lexique-7-12.json
cd scripts/analyse                                     # les scripts s'importent entre eux
python3 rendement.py   $D    # tableau des deux dispositions + recherche par faisceau
python3 diagnostic.py  $D    # corpus de l'app, plafond du palier 1, besoin d'items
python3 variantes.py   $D    # contrainte repères F/J, équilibre des mains
python3 p1-cible.py    $D    # trois candidats de palier 1 et l'ordre qui en découle
python3 equilibre.py   $D    # optimum sous contrainte ≥2 touches par main et par palier
python3 robustesse.py  $D    # même verdict avec un autre lexique ?
python3 ch.py          $D    # CH-FR
python3 t6.py          $D    # T6 : budgets de doigts (tout)
python3 t6.py          $D carte     # juste la carte doigt->touche
python3 t6.py          $D budgets   # meilleur jeu de k touches par budget (exact)
python3 t6.py          $D seuils    # seuil 48/72 items par budget
python3 t6.py          $D prix      # prix du sas a quatre doigts
python3 t6.py          $D parcours  # parcours 6 etapes sous contrainte (~2 min)
```

`t6.py` sert `recherche/v2/T6-budget-doigts.md`. Il s'appuie sur `doigts.py` :
carte doigt->touche derivee du `code` PHYSIQUE (donc CH-FR est deduit, pas
recopie) et solveur EXACT du meilleur jeu de k touches (transformee zeta sur
les sous-ensembles, jusqu'a 2^30 masques / 4 Gio de RAM). Contrairement a
`rendement.py`, ces optima-la ne sont pas des bornes inferieures : ils sont
exacts, et ils retrouvent au chiffre pres les valeurs heuristiques de T3 §3.b
(27 / 89 / 227 mots pour k = 5 / 7 / 9).

Compter ~4 Gio de RAM libre pour `budgets`, `seuils` et `prix`.

Dépendances : Node ≥ 23 (strip-types), Python 3.11 + numpy ≥ 2.0
(`np.bitwise_count`). Aucun `node_modules`
requis : `dump-app.mjs` recopie les trois modules `src/core` concernés dans un
dossier temporaire.

## Ce que les scripts NE font pas

Aucune écriture dans `src/`. La recherche d'ordre optimal (un ORDRE de
paliers) reste heuristique (faisceau + recuit par échanges) : les ordres
publiés sont des **bornes inférieures** de l'optimum réel — y compris les AUC
de parcours de T6 §4. Seuls les meilleurs JEUX de k touches (`doigts.Solveur`,
T6 §2/§3/§6/§7) sont exacts, ce qui ne fragilise pas le verdict — un ordre
qui bat l'ordre actuel suffit à réfuter « optimisé ».

## Chaîne v2 — cahier des charges v2 (2026-08-30)

Les scripts ci-dessus servaient les rapports `recherche/v2/T3` et `T6`. Les
trois suivants servent le **cahier v2** et produisent les données que
l'application importe.

```bash
D=/tmp/dactylo-data
cd scripts/analyse

# 1. Lexique 8-11 ans, formes fléchies incluses (2 802 lemmes -> 5 877 mots).
#    Le seuil est la fréquence minimale d'une forme fléchie, en occurrences par
#    million. À 5.0 les formes sont toutes de l'âge ; en dessous entrent les
#    passés simples et les subjonctifs imparfaits.
python3 construire-lexique-v3.py $D 5.0 > $D/lexique-v3.json

# 2. Recherche des jeux de touches : 2 parcours x 2 dispositions x 5
#    calendriers de doigts, sous le plancher de 60 items par étape. ~2 min.
#    N'écrit rien : c'est ce calcul qui a produit les tables du cahier §4.5.
python3 spec-parcours.py $D $D/lexique-v3.json

# 3. Génère les données de l'app à partir des tables ARBITRÉES du cahier :
#    src/data/parcours.json et src/data/lexique-v3.json
python3 generer-lecons.py $D ../..
```

**Le partage des rôles entre 2 et 3 est délibéré.** `spec-parcours.py`
*cherche* et ne décide pas ; `generer-lecons.py` porte en dur les jeux de
touches retenus, parce qu'ils sont devenus une décision et non un résultat. Un
build ne doit pas pouvoir changer le parcours d'un enfant en cours de route
parce qu'une heuristique a trouvé mieux.

`generer-lecons.py` vérifie trois invariants et s'arrête si l'un tombe :
chaque caractère existe sur la disposition, chaque touche de Dactylo a son
doigt déjà ouvert, et chaque étape franchit le plancher de 60 items.
