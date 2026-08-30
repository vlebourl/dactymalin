#!/usr/bin/env python3
"""I. Contrôle de robustesse : le verdict tient-il avec un AUTRE lexique ?
On refait la mesure sur les 5000 formes les plus fréquentes de Lexique383
(livres), sans Dubois-Buyse, et on ré-optimise sur ce lexique-là.
Usage : python3 scripts/analyse/robustesse.py <dossier-donnees>"""
import csv, sys
from pathlib import Path
from rendement import charger, pool_caracteres, Univers, evaluer, table
from equilibre import optimiser


def lexique383(dossier, n=5000):
    formes = {}
    with open(Path(dossier) / "Lexique383.tsv", encoding="utf-8") as f:
        for r in csv.DictReader(f, delimiter="\t"):
            m = r["ortho"].lower()
            if not m.isalpha() or len(m) > 12:
                continue
            try:
                fl = float(r["freqlivres"] or 0)
            except ValueError:
                continue
            formes[m] = max(formes.get(m, 0.0), fl)
    top = sorted(formes.items(), key=lambda kv: -kv[1])[:n]
    return [{"mot": m, "poids": max(f, 0.01)} for m, f in top]


def main(dossier):
    app, lex_db = charger(dossier)
    lex383 = lexique383(dossier)
    db = {e["mot"] for e in lex_db}
    manquants = [e["mot"] for e in lex383[:100] if e["mot"] not in db]
    print("# I. Robustesse\n")
    print(f"Dubois-Buyse (éch. ≤ 27) ne couvre que {100-len(manquants)} des 100 formes les "
          f"plus fréquentes de Lexique383.\nAbsentes (toutes grammaticales) : "
          f"{', '.join(manquants)}\n")

    pool = pool_caracteres(app, "fr-FR")
    md = {t["car"]: t["main"] for t in app["dispositions"]["fr-FR"]["directes"]}
    actuel = [[c for c in p["nouvelles"] if c in pool]
              for p in app["dispositions"]["fr-FR"]["paliers"][:6]]

    for nom, lex in (("Dubois-Buyse ≤27, pondéré Lexique383", lex_db),
                     ("Lexique383 seul, 5000 formes les plus fréquentes", lex383)):
        univ = Univers(lex, pool)
        opt = optimiser(univ, md)
        _, aa, ana = evaluer(univ, actuel)
        lignes, ao, ano = evaluer(univ, opt)
        na, _ = univ.mesure(univ.masque(actuel[0]))
        no, _ = univ.mesure(univ.masque(opt[0]))
        print(f"## {nom} — {univ.n_total} mots")
        print(f"optimum ré-optimisé sur CE lexique : "
              + " | ".join("".join(p) for p in opt))
        print(f"AUC couverture : actuel {100*aa:.2f} % → optimum {100*ao:.2f} % "
              f"({100*(ao-aa):+.2f} pt)")
        print(f"AUC mots       : actuel {ana:.1f} → optimum {ano:.1f} ({ano-ana:+.1f})")
        print(f"mots typables au palier 1 : actuel {na} → optimum {no}\n")
        print(table(lignes, univ) + "\n")


if __name__ == "__main__":
    main(sys.argv[1])
