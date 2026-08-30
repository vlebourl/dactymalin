#!/usr/bin/env python3
"""
Variantes contraintes du découpage en paliers (FR-FR) :
  D. plafond du palier 1 quand on impose les repères tactiles F et J ;
  E. équilibre gauche/droite des paliers, actuel vs optimisé ;
  F. ordre optimisé complet sous contrainte « f et j au palier 1 ».

Usage : python3 scripts/analyse/variantes.py <dossier-donnees>
"""
import itertools, random, sys
from rendement import charger, pool_caracteres, Univers, evaluer, chercher, affiner, table

random.seed(20260829)
FORCES = ("f", "j")


def main(dossier):
    app, lex = charger(dossier)
    pool = pool_caracteres(app, "fr-FR")
    univ = Univers(lex, pool)
    main_de = {t["car"]: t["main"] for t in app["dispositions"]["fr-FR"]["directes"]}
    eq = lambda cs: (lambda g: f"{g}G/{len(cs)-g}D")(sum(1 for c in cs if main_de.get(c) == "gauche"))

    print("# D. Plafond du palier 1 quand on impose les repères F et J\n")
    porteur = sorted(pool, key=lambda c: -float(
        univ.poids[(univ.masques & (1 << univ.index[c])) != 0].sum()))[:16]
    cand = [c for c in porteur if c not in FORCES]
    print("| Taille P1 | Max mots distincts | Jeu de touches | Couverture fréq. |")
    print("|---|---|---|---|")
    for k in (7, 8, 9):
        best = (0, 0.0, None)
        for combo in itertools.combinations(cand, k - 2):
            s = tuple(sorted(combo + FORCES))
            n, p = univ.mesure(univ.masque(s))
            if (n, p) > (best[0], best[1]):
                best = (n, p, s)
        print(f"| {k} | {best[0]} | `{''.join(best[2])}` | {100*best[1]/univ.poids_total:.2f} % |")

    actuel = [[c for c in p["nouvelles"] if c in univ.index]
              for p in app["dispositions"]["fr-FR"]["paliers"][:6]]
    opt = affiner(univ, chercher(univ, [6, 5, 5, 5, 5, 5]))[0]
    print("\n# E. Équilibre des mains (mode 4 doigts : moitié gauche / moitié droite)\n")
    print("| Palier | Actuel | équilibre | Optimisé libre | équilibre |")
    print("|---|---|---|---|---|")
    for i in range(6):
        print(f"| {i+1} | `{''.join(actuel[i])}` | {eq(actuel[i])} | "
              f"`{''.join(sorted(opt[i]))}` | {eq(opt[i])} |")

    print("\n# F. Ordre optimisé sous contrainte « f et j au palier 1 » (profil 7,5,5,5,5,4)\n")
    ordre = [list(p) for p in chercher(univ, [7, 5, 5, 5, 5, 4])]
    for forced in FORCES:                       # injection initiale
        if forced in ordre[0]:
            continue
        src = next(i for i, p in enumerate(ordre) if forced in p)
        sortant = max(
            (c for c in ordre[0] if c not in FORCES),
            key=lambda c: univ.mesure(univ.masque([x for x in ordre[0] if x != c] + [forced]))[1])
        ordre[0][ordre[0].index(sortant)] = forced
        ordre[src][ordre[src].index(forced)] = sortant
    assert all(f in ordre[0] for f in FORCES)
    meilleur = evaluer(univ, ordre)[1]
    for _ in range(8000):                       # recherche locale contrainte
        i, j = random.randrange(6), random.randrange(6)
        if i == j:
            continue
        a, b = random.randrange(len(ordre[i])), random.randrange(len(ordre[j]))
        if (i == 0 and ordre[i][a] in FORCES) or (j == 0 and ordre[j][b] in FORCES):
            continue
        ordre[i][a], ordre[j][b] = ordre[j][b], ordre[i][a]
        s = evaluer(univ, ordre)[1]
        if s > meilleur:
            meilleur = s
        else:
            ordre[i][a], ordre[j][b] = ordre[j][b], ordre[i][a]
    assert all(f in ordre[0] for f in FORCES)
    lignes, auc, aucn = evaluer(univ, [sorted(p) for p in ordre])
    _, aa, ana = evaluer(univ, actuel)
    print(table(lignes, univ))
    print(f"\nAUC couverture = {100*auc:.2f} % (actuel {100*aa:.2f} %, {100*(auc-aa):+.2f} pt) | "
          f"AUC mots = {aucn:.1f} (actuel {ana:.1f}, {aucn-ana:+.1f})")
    print("équilibre : " + "  ".join(f"P{i+1}={eq(p)}" for i, p in enumerate(ordre)))


if __name__ == "__main__":
    main(sys.argv[1])
