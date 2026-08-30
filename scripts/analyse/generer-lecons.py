#!/usr/bin/env python3
"""
Génère les données de leçons du cahier v2 : `src/data/lexique-v3.json` et
`src/data/parcours.json`.

**Ce que produit ce script, et pourquoi c'est découpé ainsi.**

`lexique-v3.json` porte le contenu *typable*, sans notion d'étape : des mots,
des groupes nominaux et des phrases. L'application filtre ce contenu à
l'exécution par l'ensemble de caractères ouverts, exactement comme le fait
`src/core/corpus.ts` aujourd'hui. C'est ce qui évite de dupliquer le corpus
cumulé à chaque étape.

`parcours.json` porte la structure : deux parcours, deux dispositions, dix
étapes, et pour chaque étape les caractères qu'elle ouvre et le doigt de
chacun. Les jeux de touches sont ceux du cahier v2 §4.5, calculés par
`spec-parcours.py`. Ils sont écrits ici en dur : **ce sont la spécification,
pas un résultat à recalculer à chaque build.**

**Les constructions sont volontairement conservatrices.** Le contenu est lu par
un enfant qui apprend encore l'orthographe (P3 : ce qui est affiché est
toujours vrai). Le générateur écarte donc tout ce qui demanderait une règle
qu'il ne peut pas vérifier : pas d'élision (`l'arbre`), donc aucun nom à
initiale vocalique ou en `h` ; pas d'adjectif postposé, dont la place dépend du
sens ; pas de phrase au pluriel, dont l'accord verbal multiplie les pièges.

Usage :
  python3 generer-lecons.py <dossier-donnees> <racine-du-depot>
"""
import json, sys, unicodedata
from pathlib import Path

# --------------------------------------------------------------- étapes
# Cahier v2 §4.5. Une entrée par étape DE LETTRES, dans l'ordre.
LETTRES = {
    ("decouverte", "fr-FR"): ["easirtup", "onmdv", "lcéfb", "ghqxè", "jzyà", "çkwù"],
    ("decouverte", "fr-CH"): ["easirtup", "onmdv", "lcéf", "bghq", "xjèz", "yàkw"],
    ("dactylo", "fr-FR"):    ["eirtnudv", "solcb", "apméf", "ghqxè", "jzyà", "çkwù"],
    ("dactylo", "fr-CH"):    ["eirtnudv", "somlc", "apéf", "bghq", "xjèz", "yàkw"],
}

# Étapes qui n'ouvrent aucune lettre. La position de `majuscule` diffère entre
# parcours (cahier v2, décision 16 : tôt en Dactylo pour ouvrir les phrases).
SPECIALES = {
    "decouverte": {7: "majuscule", 8: "chiffres", 9: "ponctuation", 10: "contenu"},
    "dactylo":    {3: "majuscule", 8: "chiffres", 9: "ponctuation", 10: "contenu"},
}

TITRES = {
    "majuscule": ("Majuscule et le point", "Tu écris les noms avec une grande lettre."),
    "chiffres": ("Les chiffres", "Tu écris les nombres."),
    "ponctuation": ("La ponctuation", None),
    "contenu": ("Des phrases", "Tu écris des phrases."),
}

# Calendrier des doigts de Dactylo (cahier v2 §4.5), indexé sur les étapes
# DE LETTRES et non sur les numéros d'étape (P8.1).
BUDGET_DACTYLO = {
    1: ["index_gauche", "index_droit", "majeur_gauche", "majeur_droit"],
    2: ["annulaire_gauche", "annulaire_droit"],
    3: ["auriculaire_gauche", "auriculaire_droit"],
}

DOIGTS = {
    'auriculaire_gauche': ['Backquote', 'Digit1', 'KeyQ', 'KeyA', 'KeyZ', 'IntlBackslash'],
    'annulaire_gauche':   ['Digit2', 'KeyW', 'KeyS', 'KeyX'],
    'majeur_gauche':      ['Digit3', 'KeyE', 'KeyD', 'KeyC'],
    'index_gauche':       ['Digit4', 'Digit5', 'KeyR', 'KeyT', 'KeyF', 'KeyG', 'KeyV', 'KeyB'],
    'index_droit':        ['Digit6', 'Digit7', 'KeyY', 'KeyU', 'KeyH', 'KeyJ', 'KeyN', 'KeyM'],
    'majeur_droit':       ['Digit8', 'KeyI', 'KeyK', 'Comma'],
    'annulaire_droit':    ['Digit9', 'KeyO', 'KeyL', 'Period'],
    'auriculaire_droit':  ['Digit0', 'Minus', 'Equal', 'KeyP', 'BracketLeft',
                           'BracketRight', 'Semicolon', 'Quote', 'Backslash', 'Slash'],
}
CODE_DOIGT = {c: d for d, codes in DOIGTS.items() for c in codes}

PLANCHER = 60

# ------------------------------------------------------ groupes nominaux
DETERMINANTS = {
    ("m", "s"): ["un", "le", "mon"],
    ("f", "s"): ["une", "la", "ma"],
    ("m", "p"): ["des", "les", "mes", "deux", "trois"],
    ("f", "p"): ["des", "les", "mes", "deux", "trois"],
}
# Adjectifs ANTÉPOSÉS seulement : leur place ne dépend pas du sens.
ADJ_ANTEPOSES = ["petit", "grand", "gros", "joli", "jeune", "beau", "bon"]
# Formes devant voyelle : jamais produites ici (les noms à initiale vocalique
# sont exclus), mais elles partagent le lemme et doivent être écartées.
FORMES_ELIDEES = {"bel", "vieil", "nouvel", "fol", "mol"}

# Verbes intransitifs à la 3ᵉ personne du singulier : ils font une phrase
# complète avec un simple groupe nominal, sans complément obligatoire.
# Tous conviennent indifféremment à une personne ou à un animal terrestre —
# c'est ce qui permet de les croiser librement avec SUJETS_ANIMES.
VERBES_3S = [
    "dort", "mange", "joue", "court", "chante", "saute", "rit", "marche",
    "arrive", "part", "danse", "pleure", "dessine", "écoute", "regarde",
    "travaille", "monte", "descend", "revient", "sourit", "attend",
]

# **Pourquoi ces deux listes sont écrites à la main.** Le lexique porte le
# genre, le nombre et la catégorie grammaticale ; il ne porte ni l'animation ni
# la concrétude. Sans elles, le croisement libre produit « Une confiance
# tombe. » ou « un joli dieu » — grammaticalement justes, absurdes à lire pour
# un enfant. Les groupes « déterminant + nom » restent, eux, ouverts à tout le
# lexique : ils ne peuvent pas être absurdes.
SUJETS_ANIMES = [
    "chat", "chien", "lapin", "cheval", "papa", "garçon", "enfant", "bébé",
    "frère", "lion", "tigre", "singe", "canard", "mouton", "cochon", "renard",
    "loup", "chaton", "monsieur", "docteur", "voisin", "cousin", "roi",
    "prince", "géant", "nain", "clown", "pirate", "dragon", "robot",
    "fille", "maman", "dame", "reine", "princesse", "souris", "poule",
    "vache", "chèvre", "tortue", "grenouille", "girafe", "chatte", "chienne",
    "voisine", "cousine", "maîtresse", "sorcière", "fée", "poupée",
]
NOMS_CONCRETS = SUJETS_ANIMES + [
    "bateau", "ballon", "train", "camion", "vélo", "avion", "soleil", "lune",
    "feuille", "fleur", "livre", "cahier", "crayon", "jouet", "gâteau",
    "pain", "fruit", "chapeau", "manteau", "nuage", "rivière", "montagne",
    "maison", "voiture", "porte", "fenêtre", "table", "chaise", "lampe",
    "jardin", "chemin", "village", "bois", "champ", "pont", "mur", "toit",
]

VOYELLES = set("aeiouyàâäéèêëîïôöùûü")


def sans_accent(s):
    return "".join(c for c in unicodedata.normalize("NFD", s)
                   if unicodedata.category(c) != "Mn")


def initiale_risquee(mot):
    """Élision ou liaison : on ne construit aucun groupe sur ces noms."""
    return not mot or mot[0] in VOYELLES or sans_accent(mot[0]) == "h"


def construire(lex):
    """-> (mots, groupes, phrases), chacun une liste de (texte, poids)."""
    par_mot = {e["mot"]: e for e in lex}
    mots = [(e["mot"], e["poids"]) for e in lex]

    noms = [e for e in lex
            if e["cgram"] == "NOM" and e["genre"] in ("m", "f") and e["nombre"] in ("s", "p")
            and not initiale_risquee(e["mot"])]
    noms.sort(key=lambda e: -e["poids"])

    # (lemme, genre, nombre) -> forme de l'adjectif antéposé
    adjs = {}
    for e in lex:
        if e["cgram"] != "ADJ" or e["lemme"] not in ADJ_ANTEPOSES:
            continue
        if e["mot"] in FORMES_ELIDEES:
            continue
        if e["genre"] in ("m", "f") and e["nombre"] in ("s", "p"):
            cle = (e["lemme"], e["genre"], e["nombre"])
            if cle not in adjs or e["poids"] > par_mot[adjs[cle]]["poids"]:
                adjs[cle] = e["mot"]

    concrets = set(NOMS_CONCRETS)
    animes = set(SUJETS_ANIMES)
    verbes = [v for v in VERBES_3S if v in par_mot]

    groupes, phrases = [], []
    for e in noms[:900]:
        g, n, mot = e["genre"], e["nombre"], e["mot"]
        base = e["lemme"] if e["lemme"] in concrets else mot
        for det in DETERMINANTS[(g, n)]:
            groupes.append((f"{det} {mot}", e["poids"]))
            # adjectif : seulement sur un nom concret, sinon « un joli dieu »
            if base in concrets:
                for lemme in ADJ_ANTEPOSES:
                    forme = adjs.get((lemme, g, n))
                    if forme:
                        # devant un adjectif antéposé, « des » devient « de »
                        d2 = "de" if det == "des" else det
                        groupes.append((f"{d2} {forme} {mot}", e["poids"] * 0.5))
        # phrases : sujet animé, singulier, verbe intransitif — l'accord est
        # garanti et le sens ne peut pas être absurde
        if n == "s" and base in animes:
            det = "Un" if g == "m" else "Une"
            for v in verbes:
                phrases.append((f"{det} {mot} {v}.", e["poids"] * 0.3))

    groupes.sort(key=lambda t: -t[1])
    phrases.sort(key=lambda t: -t[1])
    return mots, groupes[:6000], phrases[:3000]


# ------------------------------------------------------------- parcours
def carte_doigts(app, disp):
    return {t["car"]: CODE_DOIGT[t["code"]]
            for t in app["dispositions"][disp]["directes"]
            if t["code"] in CODE_DOIGT}


def etapes_de(parcours, disp, carte):
    lettres = LETTRES[(parcours, disp)]
    speciales = SPECIALES[parcours]
    out, i_lettre, ouverts = [], 0, []
    for n in range(1, 11):
        if n in speciales:
            genre = speciales[n]
            titre, promesse = TITRES[genre]
            e = {"n": n, "genre": genre, "titre": titre,
                 "promesse": promesse, "nouvelles": [], "doigts": {},
                 # une étape spéciale n'ouvre pas de doigt, mais elle doit
                 # porter l'état courant : sinon l'app le perd entre deux
                 # étapes de lettres
                 "doigtsOuverts": list(ouverts) if parcours == "dactylo" else None}
            if genre == "majuscule" and parcours == "dactylo":
                # P8.2 : l'auriculaire entre ici comme PORTEUR DU MODIFICATEUR,
                # pas comme frappeur de lettres — ses lettres viennent à
                # l'étape suivante.
                e["doigtsModificateur"] = ["auriculaire_gauche", "auriculaire_droit"]
            out.append(e)
            continue
        if i_lettre >= len(lettres):
            raise SystemExit(f"{parcours}/{disp} : plus de lettres pour l'étape {n}")
        jeu = lettres[i_lettre]
        i_lettre += 1
        if parcours == "dactylo":
            for d in BUDGET_DACTYLO.get(i_lettre, []):
                if d not in ouverts:
                    ouverts.append(d)
        nouvelles = list(jeu)
        manquants = [c for c in nouvelles if c not in carte]
        if manquants:
            raise SystemExit(f"{parcours}/{disp} étape {n} : caractères hors "
                             f"disposition : {manquants}")
        if parcours == "dactylo":
            hors = [c for c in nouvelles if carte[c] not in ouverts]
            if hors:
                raise SystemExit(f"{parcours}/{disp} étape {n} : touches dont le "
                                 f"doigt n'est pas ouvert : {hors}")
        out.append({
            "n": n, "genre": "lettres", "titre": None, "promesse": None,
            "nouvelles": nouvelles,
            "doigts": {c: carte[c] for c in nouvelles},
            "doigtsOuverts": list(ouverts) if parcours == "dactylo" else None,
        })
    return out


def typables(textes, autorises):
    ok = set(autorises) | {" "}
    return [t for t, _ in textes if set(t.lower()) <= ok]


def main(dossier, racine):
    d, r = Path(dossier), Path(racine)
    app = json.load(open(d / "app.json", encoding="utf-8"))
    lex = json.load(open(d / "lexique-v3.json", encoding="utf-8"))

    mots, groupes, phrases = construire(lex)
    print(f"[contenu] {len(mots)} mots, {len(groupes)} groupes nominaux, "
          f"{len(phrases)} phrases", file=sys.stderr)

    data = r / "src" / "data"
    data.mkdir(parents=True, exist_ok=True)
    json.dump({"mots": [{"t": t, "p": round(p, 3)} for t, p in mots],
               "groupes": [{"t": t, "p": round(p, 3)} for t, p in groupes],
               "phrases": [{"t": t, "p": round(p, 3)} for t, p in phrases]},
              open(data / "lexique-v3.json", "w", encoding="utf-8"),
              ensure_ascii=False, separators=(",", ":"))

    parcours, alertes = {}, []
    for p in ("decouverte", "dactylo"):
        parcours[p] = {}
        for disp in ("fr-FR", "fr-CH"):
            carte = carte_doigts(app, disp)
            et = etapes_de(p, disp, carte)
            cumul = []
            for e in et:
                cumul += e["nouvelles"]
                if e["genre"] != "lettres":
                    e["items"] = None
                    continue
                nm = len(typables(mots, cumul))
                ng = len(typables(groupes, cumul))
                e["items"] = {"mots": nm, "groupes": ng, "total": nm + ng}
                if nm + ng < PLANCHER:
                    alertes.append(f"{p}/{disp} étape {e['n']} : {nm + ng} items")
            parcours[p][disp] = {"lecons_par_etape": 7, "etapes": et}

    json.dump(parcours, open(data / "parcours.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)

    print("\n| Parcours | Disp. | Étape | Ouvre | Mots | Groupes | Total |")
    print("|---|---|---|---|---|---|---|")
    for p in parcours:
        for disp in parcours[p]:
            for e in parcours[p][disp]["etapes"]:
                if e["items"] is None:
                    continue
                it = e["items"]
                print(f"| {p} | {disp} | {e['n']} | `{' '.join(e['nouvelles'])}` "
                      f"| {it['mots']} | {it['groupes']} | **{it['total']}** |")
    if alertes:
        print("\n**PLANCHER DE 60 NON ATTEINT :**")
        for a in alertes:
            print(" -", a)
    else:
        print(f"\nPlancher de {PLANCHER} items : **franchi partout.**")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
