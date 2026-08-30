#!/usr/bin/env python3
"""
T6 — runner. Produit tous les chiffres du rapport recherche/v2/T6-budget-doigts.md.
Usage : python3 scripts/analyse/t6.py <dossier-donnees> [section]
"""
import itertools, json, sys, time
from pathlib import Path
import numpy as np
from rendement import charger, pool_caracteres, Univers, evaluer, table
from doigts import (carte_doigts, budgets, Solveur, mots_de, PAIRES, NOM_PAIRE,
                    COURT, CODE_DOIGT, beam_contraint, affiner_contraint, dispo)

TAILLES = {'fr-FR': [7, 5, 5, 5, 5, 4], 'fr-CH': [7, 5, 5, 5, 4, 3]}
SEUILS = (48, 72)


def prepare(app, lex, disp):
    pool = pool_caracteres(app, disp)
    return pool, Univers(lex, pool), carte_doigts(app, disp, pool)


# ------------------------------------------------------------------ § carte
def sec_carte(app, lex):
    print("\n# A. Carte doigt→touche dérivée du code physique\n")
    for disp in ('fr-FR', 'fr-CH'):
        pool, univ, carte = prepare(app, lex, disp)
        print(f"## {disp} — pool débutant {len(pool)} : {''.join(pool)}")
        print("| Doigt | Touches (caractères directs du pool) | n |")
        print("|---|---|---|")
        for d in ['auriculaire_gauche', 'annulaire_gauche', 'majeur_gauche', 'index_gauche',
                  'index_droit', 'majeur_droit', 'annulaire_droit', 'auriculaire_droit']:
            cs = sorted(c for c, x in carte.items() if x == d)
            print(f"| {d.replace('_',' ')} | `{' '.join(cs)}` | {len(cs)} |")
        print()


# ------------------------------------------------------------------ § budgets
def sec_budgets(app, lex):
    print("\n# B. Budgets de doigts — meilleur jeu de k touches (EXACT)\n")
    res = {}
    for disp in ('fr-FR', 'fr-CH'):
        pool, univ, carte = prepare(app, lex, disp)
        print(f"## {disp}")
        print("| Budget | Doigts | Touches dispo | k | Meilleur jeu (max mots) | Mots | Couv. | Meilleur jeu (max couv.) | Mots | Couv. |")
        print("|---|---|---|---|---|---|---|---|---|---|")
        res[disp] = {}
        for nom, nb, dg, chars in budgets(carte):
            s = Solveur(univ, chars)
            ligne = {}
            for k in (5, 7, 9):
                a = s.meilleur(k, 'mots')
                ligne[k] = {'mots': a}
            s.liberer()
            for k in (5, 7, 9):
                ligne[k]['couv'] = s.meilleur(k, 'couv')
            # plafond : tout le budget
            plein = univ.mesure(univ.masque(chars))
            s.liberer()
            res[disp][nom] = {'chars': chars, 'n': len(chars), 'k': ligne,
                              'plafond': (plein[0], plein[1] / univ.poids_total),
                              'doigts': 2 * nb}
            for k in (5, 7, 9):
                jm, nm, cm = ligne[k]['mots']
                jc, nc, cc = ligne[k]['couv']
                print(f"| {nom} ({2*nb} doigts) | {2*nb} | {len(chars)} | {k} | "
                      f"`{''.join(jm)}` | **{nm}** | {100*cm:.2f} % | "
                      f"`{''.join(jc)}` | {nc} | **{100*cc:.2f} %** |")
            print(f"| {nom} — plafond (toutes les {len(chars)} touches) | {2*nb} | {len(chars)} | {len(chars)} | "
                  f"`{''.join(chars)}` | **{plein[0]}** | {100*plein[1]/univ.poids_total:.2f} % | — | — | — |")
        print()
        json.dump(res[disp], open(f"/tmp/dactylo-data/t6-budgets-{disp}.json", "w"), ensure_ascii=False)
    return res


# ------------------------------------------- § seuil 48/72 items par budget
def sec_seuils(app, lex):
    print("\n# D. À partir de quel budget y a-t-il 48 / 72 mots distincts ?\n")
    for disp in ('fr-FR', 'fr-CH'):
        pool, univ, carte = prepare(app, lex, disp)
        print(f"## {disp}")
        print("| Budget | Touches dispo | Plafond mots (tout le budget) | k mini pour 48 mots | k mini pour 72 mots |")
        print("|---|---|---|---|---|")
        for nom, nb, dg, chars in budgets(carte):
            s = Solveur(univ, chars)
            plafond = univ.mesure(univ.masque(chars))[0]
            kmin = {}
            for seuil in SEUILS:
                kmin[seuil] = None
                if plafond >= seuil:
                    for k in range(3, len(chars) + 1):
                        r = s.meilleur(k, 'mots')
                        if r and r[1] >= seuil:
                            kmin[seuil] = (k, r[0], r[1])
                            break
            s.liberer()
            f = lambda x: f"**{x[0]}** (`{''.join(x[1])}` → {x[2]} mots)" if x else "**jamais**"
            print(f"| {nom} ({2*nb} doigts) | {len(chars)} | {plafond} | {f(kmin[48])} | {f(kmin[72])} |")
        print()


# ------------------------------------------------------------------ § parcours
def calendriers(ordre_paires, n_etapes=6, strict=False):
    """Assignation monotone des 4 paires de doigts aux étapes. La 1re paire
    ouvre toujours à l'étape 1 ; les suivantes à une étape >= (strict : >)."""
    out = []
    rng = range(1, n_etapes + 1)
    for s2 in rng:
        for s3 in rng:
            for s4 in rng:
                if not (1 <= s2 <= s3 <= s4):
                    continue
                if strict and not (1 < s2 < s3 < s4):
                    continue
                cal = {}
                for i, s in enumerate((1, s2, s3, s4)):
                    for f in ordre_paires[i]:
                        cal[f] = s
                out.append((cal, (1, s2, s3, s4)))
    return out


def evalue_calendrier(univ, carte, cal, tailles, largeur=30, candidats=14, tours=6000):
    dp = dispo(carte, cal, len(tailles))
    if any(len(dp[i]) < sum(tailles[:i + 1]) for i in range(len(tailles))):
        return None
    o = beam_contraint(univ, tailles, dp, largeur, candidats)
    if o is None:
        return None
    o, _ = affiner_contraint(univ, o, dp, tours)
    lignes, auc, aucn = evaluer(univ, o)
    return o, auc, aucn, lignes


ECHELLE = [
    ("V1 — 2 doigts à l'étape 1 (index seuls), puis 1 paire/étape", (1, 2, 3, 4)),
    ("V2 — 4 doigts à l'étape 1 (index+majeurs), puis 1 paire/étape", (1, 1, 2, 3)),
    ("V3 — 6 doigts à l'étape 1, auriculaires à l'étape 2", (1, 1, 1, 2)),
    ("V4 — 8 doigts dès l'étape 1 (doigt définitif, aucun budget)", (1, 1, 1, 1)),
]


def sec_parcours(app, lex, rapide=False):
    print("\n# C. Meilleur parcours complet en 6 étapes sous contrainte de doigt\n")
    from rendement import chercher, affiner
    for disp in ('fr-FR', 'fr-CH'):
        pool, univ, carte = prepare(app, lex, disp)
        tailles = list(TAILLES[disp])
        tailles[-1] += len(pool) - sum(tailles)
        print(f"## {disp} — profil de tailles {tailles} (identique à T3)")

        o0 = chercher(univ, tailles)
        o0, _ = affiner(univ, o0, 8000)
        _, auc0, aucn0 = evaluer(univ, o0)
        actuel = [[c for c in p["nouvelles"] if c in univ.index]
                  for p in app["dispositions"][disp]["paliers"][:6]]
        _, auca, aucna = evaluer(univ, actuel)
        print(f"\nRéférences — ordre ACTUEL de l'app : AUC couv. {100*auca:.2f} %, AUC mots {aucna:.1f}")
        print(f"           — optimum SANS contrainte de doigt (R0, méthode T3) : "
              f"AUC couv. {100*auc0:.2f} %, AUC mots {aucn0:.1f}")
        print(f"           R0 = `{' / '.join(''.join(p) for p in o0)}`\n")

        # --- échelle de budgets, ordre de dextérité imposé
        print("### C.1 L'échelle des budgets (ordre de dextérité index→majeurs→annulaires→auriculaires)\n")
        print("| Variante | Ouvertures | Mots à l'étape 1 | AUC couv. | Δ vs R0 | AUC mots | Parcours |")
        print("|---|---|---|---|---|---|---|")
        details = {}
        for nom, steps in ECHELLE:
            cal = {}
            for i, s in enumerate(steps):
                for f in PAIRES[i]:
                    cal[f] = s
            r = evalue_calendrier(univ, carte, cal, tailles, 30, 14, 8000)
            if r is None:
                print(f"| {nom} | {steps} | — | **infaisable** | — | — | — |")
                continue
            o, auc, aucn, lignes = r
            details[nom] = (o, auc, aucn, lignes)
            print(f"| {nom} | {steps} | **{lignes[0]['n_cumul']}** | **{100*auc:.2f} %** | "
                  f"{100*(auc-auc0):+.2f} pt | {aucn:.1f} | `{' / '.join(''.join(p) for p in o)}` |")

        # --- balayage libre de l'ordre des paires
        print("\n### C.2 Balayage libre : et si l'ordre des paires de doigts n'est pas imposé ?\n")
        res = []
        t0 = time.time()
        for op in itertools.permutations(PAIRES):
            nom = "→".join(NOM_PAIRE[PAIRES.index(p)] for p in op)
            for cal, steps in calendriers(op, len(tailles)):
                r = evalue_calendrier(univ, carte, cal, tailles, 12, 10, 1200)
                if r:
                    res.append((r[1], r[2], nom, steps, r[0], r[3]))
        res.sort(key=lambda x: -x[0])
        print(f"{len(res)} calendriers réalisables explorés en {time.time()-t0:.0f} s "
              f"(24 ordres de paires × assignations monotones aux 6 étapes ; "
              f"faisceau allégé, donc bornes inférieures).\n")
        # re-raffiner le top 8 au faisceau plein
        fin = []
        for auc, aucn, nom, steps, o, lignes in res[:8]:
            # reconstruire le calendrier depuis nom + steps
            op = [PAIRES[NOM_PAIRE.index(x)] for x in nom.split("→")]
            cal = {}
            for i, s in enumerate(steps):
                for f in op[i]:
                    cal[f] = s
            r = evalue_calendrier(univ, carte, cal, tailles, 30, 14, 8000)
            fin.append((r[1], r[2], nom, steps, r[0], r[3]))
        fin.sort(key=lambda x: -x[0])
        print("| Rang | Ordre des paires | Ouvertures | Doigts à l'étape 1 | Mots à l'étape 1 | AUC couv. | Δ vs R0 | AUC mots |")
        print("|---|---|---|---|---|---|---|---|")
        for i, (auc, aucn, nom, steps, o, lignes) in enumerate(fin, 1):
            nd = 2 * sum(1 for s in steps if s == 1)
            print(f"| {i} | {nom} | {steps} | {nd} | {lignes[0]['n_cumul']} | **{100*auc:.2f} %** | "
                  f"{100*(auc-auc0):+.2f} pt | {aucn:.1f} |")
        # meilleur strictement échelonné (une paire par étape, 2 doigts au départ)
        strictes = [x for x in res if x[3] == (1, 2, 3, 4)]
        if strictes:
            auc, aucn, nom, steps, o, lignes = strictes[0]
            op = [PAIRES[NOM_PAIRE.index(x)] for x in nom.split("→")]
            cal = {f: s for i, s in enumerate(steps) for f in op[i]}
            o, auc, aucn, lignes = evalue_calendrier(univ, carte, cal, tailles, 30, 14, 8000)
            print(f"\nMeilleur sas STRICT (2 doigts puis 1 paire/étape), ordre {nom} : "
                  f"AUC {100*auc:.2f} % ({100*(auc-auc0):+.2f} pt), {lignes[0]['n_cumul']} mots à l'étape 1")

        print("\n### C.3 Détail des parcours de l'échelle\n")
        for nom, steps in ECHELLE:
            if nom not in details:
                continue
            o, auc, aucn, lignes = details[nom]
            print(f"**{nom}**\n")
            print(table(lignes, univ))
            print(f"\nAUC couverture = {100*auc:.2f} % (R0 {100*auc0:.2f} %, Δ {100*(auc-auc0):+.2f} pt ; "
                  f"actuel {100*auca:.2f} %, Δ {100*(auc-auca):+.2f} pt) | AUC mots = {aucn:.1f} "
                  f"(R0 {aucn0:.1f}, {aucn-aucn0:+.1f})\n")
        print()


# ------------------------------------------------------------------ § prix du sas
def sec_prix(app, lex):
    print("\n# E. Le prix du sas : ce que l'index-toute-la-moitié fait gagner\n")
    for disp in ('fr-FR', 'fr-CH'):
        pool, univ, carte = prepare(app, lex, disp)
        bud = budgets(carte)
        plein = Solveur(univ, pool)
        print(f"## {disp}")
        print("| k | Mode ACTUEL (index = moitié de clavier, {n} car.) | 2 doigts | 4 doigts | 6 doigts | 8 doigts = plein |"
              .format(n=len(pool)))
        print("|---|---|---|---|---|---|")
        for k in (5, 7, 9):
            a = plein.meilleur(k, 'mots')
            cols = []
            for nom, nb, dg, chars in bud:
                s = Solveur(univ, chars)
                r = s.meilleur(k, 'mots')
                s.liberer()
                cols.append(f"{r[1]} (`{''.join(r[0])}`)")
            print(f"| {k} | **{a[1]}** (`{''.join(a[0])}`) | " + " | ".join(cols) + " |")
        plein.liberer()
        print()


def main():
    dossier = sys.argv[1]
    quoi = sys.argv[2] if len(sys.argv) > 2 else 'tout'
    app, lex = charger(dossier)
    if quoi in ('tout', 'carte'):
        sec_carte(app, lex)
    if quoi in ('tout', 'budgets'):
        sec_budgets(app, lex)
    if quoi in ('tout', 'seuils'):
        sec_seuils(app, lex)
    if quoi in ('tout', 'prix'):
        sec_prix(app, lex)
    if quoi in ('tout', 'parcours'):
        sec_parcours(app, lex, rapide=(len(sys.argv) > 3))


if __name__ == '__main__':
    main()
