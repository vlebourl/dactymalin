#!/usr/bin/env python3
"""H. Optimisation SOUS contrainte d'équilibre des mains : chaque palier doit
compter au moins 2 touches de chaque moitié du clavier. Vérifie que le gain de
rendement lexical ne repose pas sur des paliers monomanuels.

Expose `optimiser` pour les autres scripts d'analyse.
Usage : python3 scripts/analyse/equilibre.py <dossier-donnees>"""
import random, sys
from rendement import charger, pool_caracteres, Univers, evaluer, table

MIN_PAR_MAIN = 2
TAILLES = [7, 5, 5, 5, 5, 4]


def optimiser(univ, main_de, tailles=TAILLES, essais=12, tours=30000, graine=20260829):
    """Recuit par échanges depuis des découpages aléatoires admissibles.
    Heuristique : le résultat est une BORNE INFÉRIEURE de l'optimum réel."""
    rng = random.Random(graine)
    g = lambda cs: sum(1 for c in cs if main_de.get(c) == "gauche")
    # un palier de moins de 4 touches ne peut pas porter 2 touches de chaque
    # main : la contrainte s'y réduit à la moitié de sa taille.
    seuil = lambda p: min(MIN_PAR_MAIN, len(p) // 2)
    ok = lambda o: all(g(p) >= seuil(p) and len(p) - g(p) >= seuil(p) for p in o)
    pool = list(univ.pool)
    meilleur = None
    for _ in range(essais):
        while True:
            rng.shuffle(pool)
            ordre, k = [], 0
            for t in tailles:
                ordre.append(pool[k:k + t]); k += t
            if ok(ordre):
                break
        score = evaluer(univ, ordre)[1]
        for _ in range(tours):
            i, j = rng.randrange(len(ordre)), rng.randrange(len(ordre))
            if i == j:
                continue
            a, b = rng.randrange(len(ordre[i])), rng.randrange(len(ordre[j]))
            ordre[i][a], ordre[j][b] = ordre[j][b], ordre[i][a]
            s = evaluer(univ, ordre)[1] if ok(ordre) else -1
            if s > score:
                score = s
            else:
                ordre[i][a], ordre[j][b] = ordre[j][b], ordre[i][a]
        if meilleur is None or score > meilleur[0]:
            meilleur = (score, [sorted(p) for p in ordre])
    return meilleur[1]


def main(dossier):
    app, lex = charger(dossier)
    univ = Univers(lex, pool_caracteres(app, "fr-FR"))
    md = {t["car"]: t["main"] for t in app["dispositions"]["fr-FR"]["directes"]}
    g = lambda cs: sum(1 for c in cs if md.get(c) == "gauche")
    eq = lambda cs: f"{g(cs)}G/{len(cs)-g(cs)}D"
    ordre = optimiser(univ, md)
    actuel = [[c for c in p["nouvelles"] if c in univ.index]
              for p in app["dispositions"]["fr-FR"]["paliers"][:6]]
    _, aa, ana = evaluer(univ, actuel)
    lignes, auc, aucn = evaluer(univ, ordre)
    print(f"# H. Optimum sous contrainte ≥{MIN_PAR_MAIN} touches par main et par palier\n")
    print(table(lignes, univ))
    print(f"\nAUC couverture = {100*auc:.2f} % (actuel {100*aa:.2f} %, {100*(auc-aa):+.2f} pt) | "
          f"AUC mots = {aucn:.1f} (actuel {ana:.1f}, {aucn-ana:+.1f})")
    print("équilibre : " + "  ".join(f"P{i+1}={eq(p)}" for i, p in enumerate(ordre)))


if __name__ == "__main__":
    main(sys.argv[1])
