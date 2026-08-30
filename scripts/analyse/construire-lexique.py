#!/usr/bin/env python3
"""
Construit un lexique français 7-12 ans avec fréquence d'usage.

Deux sources libres, jointes sur la forme orthographique :

1. Échelle Dubois-Buyse (Ters, Mayer, Reichenbach — OCDL), version texte
   diffusée par o.bacquet.free.fr : ~4000 mots gradués en 43 « échelons »
   scolaires. Elle donne l'ADÉQUATION À L'ÂGE (échelons 1-27 = CP à 6e,
   soit 6-12 ans) mais aucune fréquence d'usage.
2. Lexique 3.83 (lexique.org, CC-BY-SA) : 142 694 formes avec `freqlivres`
   (occurrences par million dans un corpus de livres) et `freqfilms2`
   (sous-titres). Elle donne la FRÉQUENCE mais aucune notion d'âge.

Le lexique final = mots Dubois-Buyse d'échelon <= 27, pondérés par la
fréquence Lexique383 de la forme.

Usage :
  python3 scripts/analyse/construire-lexique.py <dossier-donnees> > lexique-7-12.json

<dossier-donnees> doit contenir `duboisbuyse.txt` (latin-1) et `Lexique383.tsv`.
Téléchargement :
  curl -o db.zip http://o.bacquet.free.fr/duboisbuyse_txt.zip && unzip db.zip
  curl -O http://www.lexique.org/databases/Lexique383/Lexique383.tsv
"""
import csv, json, sys, unicodedata
from pathlib import Path

ECHELON_MAX = 27  # 6e / 12 ans (CP=1-7, CE1=8-11, CE2=12-15, CM1=16-19, CM2=20-23, 6e=24-27)

def main(dossier):
    d = Path(dossier)

    # --- Dubois-Buyse : mot|échelon|nature
    db = {}
    with open(d / "duboisbuyse.txt", encoding="latin-1") as f:
        for ligne in f:
            parts = ligne.rstrip("\n").split("|")
            if len(parts) < 2 or not parts[1].strip().isdigit():
                continue
            mot, ech = parts[0].strip().lower(), int(parts[1])
            nature = parts[2].strip() if len(parts) > 2 else ""
            if ech <= ECHELON_MAX and mot:
                if mot not in db or ech < db[mot]["echelon"]:
                    db[mot] = {"echelon": ech, "nature": nature}

    # --- Lexique383 : fréquences par forme
    freq = {}
    with open(d / "Lexique383.tsv", encoding="utf-8") as f:
        for r in csv.DictReader(f, delimiter="\t"):
            m = r["ortho"].lower()
            try:
                fl, ff = float(r["freqlivres"] or 0), float(r["freqfilms2"] or 0)
            except ValueError:
                continue
            # une forme peut apparaître plusieurs fois (homographes) : on garde le max
            prev = freq.get(m)
            if prev is None or fl + ff > prev[0] + prev[1]:
                freq[m] = (fl, ff)

    lex = []
    sans_freq = 0
    for mot, info in sorted(db.items()):
        # le curriculum n'admet ni espace ni trait d'union ni apostrophe typo
        if any(c in mot for c in " -'’"):
            continue
        fl, ff = freq.get(mot, (0.0, 0.0))
        if (fl, ff) == (0.0, 0.0):
            sans_freq += 1
        lex.append({
            "mot": mot,
            "echelon": info["echelon"],
            "nature": info["nature"],
            "freqlivres": fl,
            "freqfilms2": ff,
            # poids d'usage : moyenne des deux registres, plancher pour ne pas
            # annuler un mot scolaire absent des corpus adultes
            "poids": max((fl + ff) / 2, 0.01),
        })

    print(f"[lexique] Dubois-Buyse échelon<= {ECHELON_MAX} : {len(db)} mots ; "
          f"retenus après filtrage typographique : {len(lex)} ; "
          f"sans fréquence Lexique383 : {sans_freq}", file=sys.stderr)
    json.dump(lex, sys.stdout, ensure_ascii=False)

if __name__ == "__main__":
    main(sys.argv[1])
