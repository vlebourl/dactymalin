#!/usr/bin/env python3
"""J. Même mesure pour CH-FR (QWERTZ suisse romand).
Usage : python3 scripts/analyse/ch.py <dossier-donnees>"""
import sys
from rendement import charger, pool_caracteres, Univers, evaluer, table
from equilibre import optimiser

def main(dossier):
    app, lex = charger(dossier)
    pool = pool_caracteres(app, "fr-CH")
    univ = Univers(lex, pool)
    md = {t["car"]: t["main"] for t in app["dispositions"]["fr-CH"]["directes"]}
    actuel = [[c for c in p["nouvelles"] if c in univ.index]
              for p in app["dispositions"]["fr-CH"]["paliers"][:6]]
    opt = optimiser(univ, md, tailles=[7, 5, 5, 5, 4, 3], essais=8, tours=25000)
    _, aa, ana = evaluer(univ, actuel)
    lignes, ao, ano = evaluer(univ, opt)
    print(f"# J. CH-FR — pool débutant ({len(pool)}) : {''.join(pool)}\n")
    print(table(lignes, univ))
    print(f"\nactuel AUC {100*aa:.2f} % → optimum {100*ao:.2f} % ({100*(ao-aa):+.2f} pt) ; "
          f"AUC mots {ana:.1f} → {ano:.1f} ({ano-ana:+.1f})")
    for d in ("fr-FR", "fr-CH"):
        n = [len([c for c in p["nouvelles"] if c != " "])
             for p in app["dispositions"][d]["paliers"][:7]]
        print(f"touches à valider par palier, {d} : {n} (total {sum(n)})")

if __name__ == "__main__":
    main(sys.argv[1])
