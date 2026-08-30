#!/usr/bin/env python3
"""
Diagnostics complémentaires au rendement lexical :
  A. Le corpus réellement embarqué dans l'app, confronté au lexique 7-12 ans.
  B. Le plafond théorique du palier 1 : combien de mots distincts un premier
     palier de k touches peut-il ouvrir, au mieux ?
  C. Le volume d'items nécessaire pour 6 blocs de 8-12 items sans répétition.

Usage : python3 scripts/analyse/diagnostic.py <dossier-donnees>
"""
import itertools, json, sys
from pathlib import Path
import numpy as np
from rendement import charger, pool_caracteres, Univers


def main(dossier):
    app, lex = charger(dossier)
    dblex = {e["mot"] for e in lex}
    corpus = app["corpus"]

    print("# A. Le corpus de l'app face au lexique 7-12 ans (Dubois-Buyse ≤ éch. 27)\n")
    mots_simples = [m for m in corpus if " " not in m]
    phrases = [m for m in corpus if " " in m]
    dedans = [m for m in mots_simples if m in dblex]
    print(f"corpus embarqué : {len(corpus)} items — {len(mots_simples)} mots simples, "
          f"{len(phrases)} suites de mots")
    print(f"mots simples présents dans le lexique 7-12 : {len(dedans)}/{len(mots_simples)} "
          f"({100*len(dedans)/len(mots_simples):.1f} %)")
    hors = [m for m in mots_simples if m not in dblex]
    print(f"hors lexique gradué (soit hors 7-12, soit forme fléchie) : {len(hors)}")
    print("  exemples :", ", ".join(hors[:25]))

    print("\n| Palier | Items dispo (app) | dont nouveaux | dont mots simples | dont dans le lexique 7-12 |")
    print("|---|---|---|---|---|")
    for p in app["dispositions"]["fr-FR"]["paliers"][:7]:
        dispo = p["motsDisponibles"]
        simples = [m for m in dispo if " " not in m]
        print(f"| {p['numero']} | {len(dispo)} | {len(p['motsNouveaux'])} | {len(simples)} | "
              f"{sum(1 for m in simples if m in dblex)} |")

    print("\n# B. Plafond du palier 1 : meilleur premier palier possible\n")
    pool = pool_caracteres(app, "fr-FR")
    univ = Univers(lex, pool)
    # bornage : on ne teste que les 15 caractères les plus porteurs, ce qui
    # donne une BORNE INFÉRIEURE du plafond (recherche exhaustive sur 15 lettres)
    porteur = sorted(pool, key=lambda c: -float(
        univ.poids[(univ.masques & (1 << univ.index[c])) != 0].sum()))[:15]
    print(f"recherche exhaustive sur les 15 caractères les plus porteurs : {''.join(porteur)}")
    print("\n| Taille du palier 1 | Max mots distincts | Jeu de touches | Couverture fréq. |")
    print("|---|---|---|---|")
    for k in range(5, 13):
        best = (0, 0.0, None)
        for combo in itertools.combinations(porteur, k):
            n, p = univ.mesure(univ.masque(combo))
            if (n, p) > (best[0], best[1]):
                best = (n, p, combo)
        print(f"| {k} | {best[0]} | `{''.join(sorted(best[2]))}` | {100*best[1]/univ.poids_total:.2f} % |")

    actuel = [c for c in app["dispositions"]["fr-FR"]["paliers"][0]["nouvelles"] if c in univ.index]
    n, p = univ.mesure(univ.masque(actuel))
    print(f"\npalier 1 actuel `{''.join(actuel)}` (7 touches) : {n} mots distincts, "
          f"{100*p/univ.poids_total:.2f} % de couverture fréquentielle")

    print("\n# C. Besoin d'items : 6 blocs de 8 à 12 items\n")
    print("| Palier | Items requis (6×8) | Items requis (6×12) | Items dispo (app) | Nouveaux (app) | Répétition moyenne à 6×12 |")
    print("|---|---|---|---|---|---|")
    for p in app["dispositions"]["fr-FR"]["paliers"][:7]:
        dispo = len(p["motsDisponibles"])
        rep = 72 / dispo if dispo else float("inf")
        print(f"| {p['numero']} | 48 | 72 | {dispo} | {len(p['motsNouveaux'])} | ×{rep:.2f} |")


if __name__ == "__main__":
    main(sys.argv[1])
