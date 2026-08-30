#!/usr/bin/env python3
"""
Lot 0 — les jeux de touches par étape, pour les deux parcours et les deux
dispositions, sous les contraintes arbitrées le 2026-08-30.

Ce que ce script produit, et que rien d'autre ne produit :

  * **Découverte** — aucune contrainte de doigt (l'index balaie sa moitié de
    clavier). L'espace de recherche est le pool entier dès l'étape 1.
  * **Dactylo** — budget de doigts : une touche n'est ouvrable qu'une fois son
    doigt définitif ouvert. Plusieurs calendriers d'ouverture sont comparés,
    dont l'ordre de dextérité (consensus du marché) et l'ordre
    `index -> annulaires -> auriculaires -> majeurs` que T6 §4.d mesure comme
    optimal pour le français.

Contrainte de recette, qui remplace les 48/72 de T3 : une leçon dure 10-15 min,
soit ~50-60 exercices, et aucun mot ne doit s'y répéter. **Chaque étape doit
donc rendre typables au moins PLANCHER mots distincts**, cumulés.

Usage :
  python3 spec-parcours.py <dossier-donnees> [lexique.json] [--rapide]
"""
import json, sys
from pathlib import Path

from rendement import charger, pool_caracteres, Univers, evaluer, chercher, affiner
from doigts import carte_doigts, beam_contraint, affiner_contraint, dispo, PAIRES

PLANCHER = 60

# Calendriers d'ouverture des paires de doigts : doigt -> étape d'ouverture.
CALENDRIERS = {
    'dexterite':   [('index', 1), ('majeurs', 2), ('annulaires', 3), ('auriculaires', 4)],
    'lexical':     [('index', 1), ('annulaires', 2), ('auriculaires', 3), ('majeurs', 4)],
    # Les deux suivants ouvrent DEUX paires à l'étape 1 : c'est la seule façon
    # de franchir le plancher de 60 items (les deux index seuls ne portent
    # qu'une voyelle, `u`, cf. T6 §2.d).
    'dexterite-4': [('index', 1), ('majeurs', 1), ('annulaires', 2), ('auriculaires', 3)],
    'lexical-4':   [('index', 1), ('annulaires', 1), ('auriculaires', 2), ('majeurs', 3)],
    'lexical-t6':  [('index', 1), ('annulaires', 1), ('auriculaires', 1), ('majeurs', 2)],
}
NOM_PAIRE = {'index': 0, 'majeurs': 1, 'annulaires': 2, 'auriculaires': 3}


def calendrier_doigts(nom):
    """-> {doigt: étape d'ouverture}"""
    out = {}
    for paire, etape in CALENDRIERS[nom]:
        for d in PAIRES[NOM_PAIRE[paire]]:
            out[d] = etape
    return out


def tailles_pour(n_chars, n_etapes=6, premiere=8):
    """Profil de tailles : étape 1 large (contrainte des 60 items), le reste
    réparti au plus égal, décroissant."""
    reste = n_chars - premiere
    base, sup = divmod(reste, n_etapes - 1)
    t = [premiere] + [base + (1 if i < sup else 0) for i in range(n_etapes - 1)]
    return t


def rapport(titre, univ, ordre, plancher=PLANCHER):
    lignes, auc, auc_n = evaluer(univ, ordre)
    print(f"\n### {titre}")
    print(f"AUC couverture **{auc:.2%}** · AUC mots {auc_n:.1f}")
    print("| Étape | Nouvelles touches | Mots cumulés | Nouveaux | Couverture | >= %d ? |"
          % plancher)
    print("|---|---|---|---|---|---|")
    for l in lignes:
        ok = "oui" if l["n_cumul"] >= plancher else f"**NON ({l['n_cumul']})**"
        print(f"| {l['palier']} | `{' '.join(l['nouvelles'])}` | {l['n_cumul']} | "
              f"+{l['n_nouveaux']} | {l['couv']:.2%} | {ok} |")
    return auc, lignes


def main(dossier, chemin_lex=None, rapide=False):
    app, _ = charger(dossier)
    lex = json.load(open(chemin_lex, encoding="utf-8")) if chemin_lex else None
    if lex is None:
        raise SystemExit("passer le lexique v3 en 2e argument")
    largeur, cand, tours = (12, 10, 1500) if rapide else (30, 14, 8000)

    resume = []
    for disp in ("fr-FR", "fr-CH"):
        pool = pool_caracteres(app, disp)
        univ = Univers(lex, pool)
        tailles = tailles_pour(len(pool))
        print(f"\n\n## {disp} — pool {len(pool)} caractères, profil {tailles}")
        print(f"lexique : {len(univ.mots)} mots typables sur {len(lex)}")

        # --- Découverte : aucune contrainte de doigt
        ordre = chercher(univ, tailles, largeur=largeur, candidats=cand)
        ordre, _ = affiner(univ, ordre, tours=tours)
        auc, lignes = rapport(f"{disp} · DÉCOUVERTE (aucune contrainte de doigt)",
                              univ, ordre)
        resume.append((disp, "decouverte", "-", auc, lignes[0]["n_cumul"]))

        # --- Dactylo : budget de doigts, plusieurs calendriers
        carte = carte_doigts(app, disp, pool)
        for nom in CALENDRIERS:
            cal = calendrier_doigts(nom)
            dpe = dispo(carte, cal, len(tailles))
            o = beam_contraint(univ, tailles, dpe, largeur=largeur, candidats=cand)
            if o is None:
                print(f"\n### {disp} · DACTYLO · {nom} — INFAISABLE "
                      f"(pas assez de touches ouvertes pour le profil)")
                continue
            o, _ = affiner_contraint(univ, o, dpe, tours=tours)
            auc, lignes = rapport(f"{disp} · DACTYLO · calendrier `{nom}` "
                                  f"({' -> '.join(p for p, _ in CALENDRIERS[nom])})",
                                  univ, o)
            resume.append((disp, "dactylo", nom, auc, lignes[0]["n_cumul"]))

    print("\n\n## Résumé\n")
    print("| Disposition | Parcours | Calendrier | AUC couv. | Mots étape 1 |")
    print("|---|---|---|---|---|")
    for d, p, c, a, n1 in resume:
        print(f"| {d} | {p} | {c} | {a:.2%} | {n1}{'' if n1 >= PLANCHER else ' ATTENTION'} |")


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    main(args[0], args[1] if len(args) > 1 else None, "--rapide" in sys.argv)
