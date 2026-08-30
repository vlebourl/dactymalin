#!/usr/bin/env python3
"""
Lexique v3 — cible 8-11 ans, formes fléchies incluses.

Deux changements par rapport à `construire-lexique.py` (qui servait T3/T6) :

1. **Bande d'échelons resserrée sur 8-11 ans.** Dubois-Buyse gradue en 43
   échelons : CP=1-7, CE1=8-11, CE2=12-15, CM1=16-19, CM2=20-23, 6e=24-27.
   La cible étant 8-11 ans, on garde les échelons <= 23 (jusqu'au CM2) — les
   échelons bas restent inclus : un enfant de 8 ans connaît les mots du CP.

2. **Formes fléchies.** Dubois-Buyse ne liste que la forme de base : `rire`
   compte pour un mot. Lexique 3.83 porte les 142 694 formes avec leur lemme :
   on retient toute forme dont le LEMME est dans Dubois-Buyse <= 23. `rire`
   devient `rire, ris, rit, rient, riait...`, tous typables avec les mêmes
   touches et tous du lexique de l'âge.

   Garde-fou : une forme fléchie n'est retenue que si sa fréquence propre
   atteint SEUIL_FLECHIE occurrences/million, sinon on ferait entrer les
   imparfaits du subjonctif. Les formes présentes en propre dans Dubois-Buyse
   entrent toujours, quelle que soit leur fréquence.

Usage :
  python3 construire-lexique-v3.py <dossier-donnees> [seuil] > lexique-v3.json
"""
import csv, json, sys
from pathlib import Path

ECHELON_MAX = 23        # CM2 / 11 ans
SEUIL_FLECHIE = 0.10    # occurrences par million (moyenne livres/films)


def main(dossier, seuil=SEUIL_FLECHIE):
    d = Path(dossier)

    # --- Dubois-Buyse : mot|échelon|nature
    db = {}
    with open(d / "duboisbuyse.txt", encoding="latin-1") as f:
        for ligne in f:
            parts = ligne.rstrip("\n").split("|")
            if len(parts) < 2 or not parts[1].strip().isdigit():
                continue
            mot, ech = parts[0].strip().lower(), int(parts[1])
            if ech <= ECHELON_MAX and mot:
                if mot not in db or ech < db[mot]:
                    db[mot] = ech

    # --- Lexique383 : toutes les formes, avec lemme et fréquences
    formes = {}
    with open(d / "Lexique383.tsv", encoding="utf-8") as f:
        for r in csv.DictReader(f, delimiter="\t"):
            ortho, lemme = r["ortho"].lower(), r["lemme"].lower()
            try:
                fl, ff = float(r["freqlivres"] or 0), float(r["freqfilms2"] or 0)
            except ValueError:
                continue
            prev = formes.get(ortho)
            if prev is None or fl + ff > prev[1] + prev[2]:
                formes[ortho] = (lemme, fl, ff, r["cgram"],
                                 r.get("genre", ""), r.get("nombre", ""))

    lex, dont_flechies = [], 0
    vus = set()

    def ajoute(mot, echelon, fl, ff, flechie, gram):
        nonlocal dont_flechies
        if mot in vus or any(c in mot for c in " -'’"):
            return
        vus.add(mot)
        if flechie:
            dont_flechies += 1
        cg, genre, nombre, lemme = gram
        lex.append({"mot": mot, "echelon": echelon,
                    "freqlivres": fl, "freqfilms2": ff,
                    "flechie": flechie,
                    # grammaire : sert au générateur de groupes nominaux
                    # (accord déterminant/nom/adjectif). Vide si inconnu.
                    "cgram": cg, "genre": genre, "nombre": nombre,
                    "lemme": lemme,
                    "poids": max((fl + ff) / 2, 0.01)})

    # 1) les formes de base de Dubois-Buyse
    for mot, ech in sorted(db.items()):
        lemme, fl, ff, cg, genre, nombre = formes.get(
            mot, (mot, 0.0, 0.0, "", "", ""))
        ajoute(mot, ech, fl, ff, False, (cg, genre, nombre, lemme))

    # 2) les formes fléchies dont le lemme est dans Dubois-Buyse
    for ortho, (lemme, fl, ff, cg, genre, nombre) in sorted(formes.items()):
        if lemme in db and (fl + ff) / 2 >= seuil:
            ajoute(ortho, db[lemme], fl, ff, True, (cg, genre, nombre, lemme))

    print(f"[lexique v3] Dubois-Buyse échelon<= {ECHELON_MAX} : {len(db)} lemmes ; "
          f"seuil fléchies {seuil}/M ; total retenu : {len(lex)} "
          f"(dont {dont_flechies} formes fléchies ajoutées)", file=sys.stderr)
    json.dump(lex, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main(sys.argv[1], float(sys.argv[2]) if len(sys.argv) > 2 else SEUIL_FLECHIE)
