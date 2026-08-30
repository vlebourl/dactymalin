#!/usr/bin/env python3
"""G. Trois candidats de palier 1 à 7 touches, et l'ordre complet qui en découle.
Usage : python3 scripts/analyse/p1-cible.py <dossier-donnees>"""
import random, sys
from rendement import charger, pool_caracteres, Univers, evaluer, chercher, affiner, table
random.seed(20260829)

def optimiser_suite(univ, p1, tailles):
    """Optimise P2..P6 à P1 fixé : faisceau sur l'univers restreint, puis
    recherche locale qui ne touche jamais au palier 1."""
    ordre = [list(p1)] + [list(p) for p in chercher(univ, tailles[1:])][:5]
    # le faisceau a pu replacer des caractères de P1 : on répare
    vus, propre = set(p1), [list(p1)]
    for pal in ordre[1:]:
        propre.append([c for c in pal if c not in vus])
        vus |= set(pal)
    restants = [c for c in univ.pool if c not in vus]
    for pal, taille in zip(propre[1:], tailles[1:]):
        while len(pal) < taille and restants:
            pal.append(restants.pop(0))
    meilleur = evaluer(univ, propre)[1]
    for _ in range(8000):
        i, j = random.randrange(1, 6), random.randrange(1, 6)
        if i == j or not propre[i] or not propre[j]:
            continue
        a, b = random.randrange(len(propre[i])), random.randrange(len(propre[j]))
        propre[i][a], propre[j][b] = propre[j][b], propre[i][a]
        s = evaluer(univ, propre)[1]
        if s > meilleur:
            meilleur = s
        else:
            propre[i][a], propre[j][b] = propre[j][b], propre[i][a]
    return propre

def main(dossier):
    app, lex = charger(dossier)
    univ = Univers(lex, pool_caracteres(app, "fr-FR"))
    main_de = {t["car"]: t["main"] for t in app["dispositions"]["fr-FR"]["directes"]}
    eq = lambda cs: (lambda g: f"{g}G/{len(cs)-g}D")(sum(1 for c in cs if main_de.get(c) == "gauche"))
    actuel = [[c for c in p["nouvelles"] if c in univ.index]
              for p in app["dispositions"]["fr-FR"]["paliers"][:6]]
    _, aa, ana = evaluer(univ, actuel)

    for nom, p1 in (("actuel", "efjnstu"),
                    ("F/J conservés, 2 touches changées", "efjortu"),
                    ("optimum libre 7 touches", "aeimnrt")):
        t = univ.typables(univ.masque(p1))
        mots = sorted((univ.mots[i] for i in range(len(univ.mots)) if t[i]),
                      key=lambda m: (len(m), m))
        print(f"\n## Palier 1 = `{' '.join(p1)}` — {nom} — {eq(p1)}")
        print(f"{int(t.sum())} mots du lexique 7-12 : {', '.join(mots)}")
        ordre = optimiser_suite(univ, p1, [7, 5, 5, 5, 5, 4])
        lignes, auc, aucn = evaluer(univ, [sorted(p) for p in ordre])
        print(table(lignes, univ))
        print(f"AUC couverture = {100*auc:.2f} % ({100*(auc-aa):+.2f} pt vs actuel) | "
              f"AUC mots = {aucn:.1f} ({aucn-ana:+.1f})")
        print("équilibre : " + "  ".join(f"P{i+1}={eq(p)}" for i, p in enumerate(ordre)))

if __name__ == "__main__":
    main(sys.argv[1])
