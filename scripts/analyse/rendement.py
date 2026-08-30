#!/usr/bin/env python3
"""
Rendement lexical des paliers de « Tape avec moi ».

Mesure, pour un ordre d'ouverture des touches, combien de mots français du
lexique 7-12 ans deviennent typables à chaque palier — en nombre de mots
distincts ET en couverture pondérée par la fréquence d'usage — puis cherche
un meilleur ordre par faisceau + recherche locale.

Entrées :
  app.json          (scripts/analyse/dump-app.mjs)
  lexique-7-12.json (scripts/analyse/construire-lexique.py)

Usage :
  python3 scripts/analyse/rendement.py <dossier-donnees>
"""
import itertools, json, random, sys
from pathlib import Path
import numpy as np

random.seed(20260829)

# ------------------------------------------------------------------ chargement
def charger(dossier):
    d = Path(dossier)
    app = json.load(open(d / "app.json", encoding="utf-8"))
    lex = json.load(open(d / "lexique-7-12.json", encoding="utf-8"))
    return app, lex


def pool_caracteres(app, disp, avec_chiffres=False):
    """Caractères ouvrables dans le sas débutant : touche DIRECTE (aucun
    modificateur, P2 du cahier), non morte, non inerte. C'est exactement la
    contrainte « atteignable par les 4 doigts » : en mode débutant l'index de
    chaque main couvre toute sa moitié, donc toute touche directe est
    atteignable, et aucune touche shiftée ne l'est."""
    cars = {t["car"] for t in app["dispositions"][disp]["directes"]}
    garde = set("abcdefghijklmnopqrstuvwxyzéèàçù")
    pool = sorted(cars & garde)
    if avec_chiffres:
        pool += sorted(c for c in cars if c.isdigit())
    return pool


# ------------------------------------------------------------------ masques
class Univers:
    """Lexique encodé en masques de bits sur l'alphabet `pool`."""

    def __init__(self, lex, pool):
        self.pool = pool
        self.index = {c: i for i, c in enumerate(pool)}
        masques, poids, mots = [], [], []
        self.hors_pool_poids = 0.0
        self.hors_pool_n = 0
        for e in lex:
            m = 0
            ok = True
            for c in e["mot"]:
                i = self.index.get(c)
                if i is None:
                    ok = False
                    break
                m |= 1 << i
            if not ok:
                self.hors_pool_poids += e["poids"]
                self.hors_pool_n += 1
                continue
            masques.append(m)
            poids.append(e["poids"])
            mots.append(e["mot"])
        self.masques = np.array(masques, dtype=np.int64)
        self.poids = np.array(poids, dtype=np.float64)
        self.mots = mots
        self.poids_total = float(self.poids.sum()) + self.hors_pool_poids
        self.n_total = len(masques) + self.hors_pool_n

    def masque(self, chars):
        m = 0
        for c in chars:
            if c in self.index:
                m |= 1 << self.index[c]
        return m

    def typables(self, masque_autorise):
        return (self.masques & ~masque_autorise) == 0

    def mesure(self, masque_autorise):
        t = self.typables(masque_autorise)
        return int(t.sum()), float(self.poids[t].sum())


def evaluer(univ, ordre):
    """ordre = liste de listes de caractères, un élément par palier."""
    lignes, cumul, m = [], [], 0
    for k, palier in enumerate(ordre, 1):
        m |= univ.masque(palier)
        n, p = univ.mesure(m)
        lignes.append({
            "palier": k,
            "nouvelles": "".join(palier),
            "n_cumul": n,
            "couv": p / univ.poids_total,
        })
    for i, l in enumerate(lignes):
        l["n_nouveaux"] = l["n_cumul"] - (lignes[i - 1]["n_cumul"] if i else 0)
        l["couv_gain"] = l["couv"] - (lignes[i - 1]["couv"] if i else 0.0)
    auc = sum(l["couv"] for l in lignes) / len(lignes)
    auc_n = sum(l["n_cumul"] for l in lignes) / len(lignes)
    return lignes, auc, auc_n


# ------------------------------------------------------------------ recherche
def chercher(univ, tailles, largeur=25, candidats=13):
    """Faisceau : à chaque palier on n'essaie que les sous-ensembles des
    `candidats` caractères restants les plus prometteurs (poids des mots encore
    intypables où ils apparaissent)."""
    n = len(univ.pool)
    faisceau = [(0, frozenset(), [])]  # (masque, utilisés, ordre)
    for taille in tailles:
        suivant = {}
        for masque, utilises, ordre in faisceau:
            restants = [c for c in univ.pool if c not in utilises]
            manquants = ~univ.typables(masque)
            score = {}
            for c in restants:
                bit = 1 << univ.index[c]
                sel = manquants & ((univ.masques & bit) != 0)
                score[c] = float(univ.poids[sel].sum())
            tete = sorted(restants, key=lambda c: -score[c])[:candidats]
            for combo in itertools.combinations(tete, taille):
                m2 = masque | univ.masque(combo)
                _, p = univ.mesure(m2)
                cle = m2
                val = (p, m2, utilises | set(combo), ordre + [list(combo)])
                if cle not in suivant or val[0] > suivant[cle][0]:
                    suivant[cle] = val
        faisceau = [(v[1], v[2], v[3]) for v in
                    sorted(suivant.values(), key=lambda v: -v[0])[:largeur]]
    # départage final sur l'AUC (couverture moyenne sur les 6 paliers)
    best = max(faisceau, key=lambda f: evaluer(univ, f[2])[1])
    return best[2]


def affiner(univ, ordre, tours=4000):
    """Recherche locale : échanges de deux caractères entre paliers, plus
    permutations de caractères non encore placés. Améliore l'AUC."""
    ordre = [list(p) for p in ordre]
    places = [c for p in ordre for c in p]
    libres = [c for c in univ.pool if c not in places]
    meilleur = evaluer(univ, ordre)[1]
    for _ in range(tours):
        i, j = random.randrange(len(ordre)), random.randrange(len(ordre))
        if i == j and not libres:
            continue
        a = random.randrange(len(ordre[i]))
        if i != j:
            b = random.randrange(len(ordre[j]))
            ordre[i][a], ordre[j][b] = ordre[j][b], ordre[i][a]
            score = evaluer(univ, ordre)[1]
            if score > meilleur:
                meilleur = score
            else:
                ordre[i][a], ordre[j][b] = ordre[j][b], ordre[i][a]
        else:
            b = random.randrange(len(libres))
            ordre[i][a], libres[b] = libres[b], ordre[i][a]
            score = evaluer(univ, ordre)[1]
            if score > meilleur:
                meilleur = score
            else:
                ordre[i][a], libres[b] = libres[b], ordre[i][a]
    return ordre, meilleur


# ------------------------------------------------------------------ sortie
def table(lignes, univ):
    out = ["| Palier | Nouvelles touches | Mots cumulés | Nouveaux mots | Couverture fréq. cumulée | Gain |",
           "|---|---|---|---|---|---|"]
    for l in lignes:
        out.append(f"| {l['palier']} | `{l['nouvelles']}` | {l['n_cumul']} | +{l['n_nouveaux']} | "
                   f"{100*l['couv']:.2f} % | +{100*l['couv_gain']:.2f} pt |")
    return "\n".join(out)


def main(dossier):
    app, lex = charger(dossier)
    for disp in ("fr-FR", "fr-CH"):
        pool = pool_caracteres(app, disp)
        univ = Univers(lex, pool)
        print(f"\n## {disp}")
        print(f"pool débutant ({len(pool)}) : {''.join(pool)}")
        print(f"lexique : {univ.n_total} mots ; atteignables avec tout le pool : "
              f"{len(univ.mots)} ({100*len(univ.mots)/univ.n_total:.1f} %) ; "
              f"poids atteignable {100*(1-univ.hors_pool_poids/univ.poids_total):.1f} %")

        actuel = [[c for c in p["nouvelles"] if c in univ.index]
                  for p in app["dispositions"][disp]["paliers"][:6]]
        lignes, auc, aucn = evaluer(univ, actuel)
        print("\n### Ordre actuel")
        print(table(lignes, univ))
        print(f"AUC couverture = {100*auc:.2f} %  |  AUC mots = {aucn:.1f}")

        oublies = [c for c in pool if not any(c in p for p in actuel)]
        print(f"caractères du pool JAMAIS ouverts en P1-P6 : {oublies or '—'}")

        for nom, tailles in (("profil actuel (7,4,5,4,4,6)", [7, 4, 5, 4, 4, 6]),
                             ("profil régulier (6,5,5,5,5,5)", [6, 5, 5, 5, 5, 5])):
            if sum(tailles) != len(pool):
                tailles = list(tailles)
                tailles[-1] += len(pool) - sum(tailles)
            ordre = chercher(univ, tailles)
            ordre, _ = affiner(univ, ordre)
            lignes2, auc2, aucn2 = evaluer(univ, ordre)
            print(f"\n### Ordre optimisé — {nom} → tailles {tailles}")
            print(table(lignes2, univ))
            print(f"AUC couverture = {100*auc2:.2f} %  (actuel {100*auc:.2f} %, "
                  f"écart {100*(auc2-auc):+.2f} pt)  |  AUC mots = {aucn2:.1f} "
                  f"(actuel {aucn:.1f}, {aucn2-aucn:+.1f})")


if __name__ == "__main__":
    main(sys.argv[1])
