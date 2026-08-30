#!/usr/bin/env python3
"""
T6 — Budget de doigts : que coûte un mapping doigt→touche DÉFINITIF ?

Le doigt d'une touche ne dépend PAS du caractère qu'elle produit : il dépend de
sa POSITION PHYSIQUE. On mappe donc `code` (le keycode physique, identique
d'une disposition à l'autre) → doigt, une fois pour toutes, puis on lit dans
`app.json` quel caractère chaque code produit sur AZERTY et sur CH-FR. Le
mapping CH-FR est ainsi DÉRIVÉ, pas recopié.

Usage : python3 scripts/analyse/doigts.py <dossier-donnees>
"""
import itertools, json, random, sys
from pathlib import Path
import numpy as np
from rendement import charger, pool_caracteres, Univers, evaluer, table

random.seed(20260829)

# ------------------------------------------------------------ doigts / codes
# Doigté standard à dix doigts, par colonne physique (ISO/ANSI, méthode
# classique : l'auriculaire prend la colonne 1 + la rangée des chiffres à sa
# gauche, l'index prend DEUX colonnes).
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

PAIRES = [('index_gauche', 'index_droit'),
          ('majeur_gauche', 'majeur_droit'),
          ('annulaire_gauche', 'annulaire_droit'),
          ('auriculaire_gauche', 'auriculaire_droit')]
NOM_PAIRE = ['index', 'majeurs', 'annulaires', 'auriculaires']
COURT = {'auriculaire_gauche': 'AuG', 'annulaire_gauche': 'AnG', 'majeur_gauche': 'MaG',
         'index_gauche': 'InG', 'index_droit': 'InD', 'majeur_droit': 'MaD',
         'annulaire_droit': 'AnD', 'auriculaire_droit': 'AuD'}


def carte_doigts(app, disp, pool):
    """caractère du pool → doigt définitif, via le code physique."""
    carte = {}
    for t in app['dispositions'][disp]['directes']:
        if t['car'] in pool:
            d = CODE_DOIGT.get(t['code'])
            if d is None:
                raise SystemExit(f"code physique non mappé : {t['code']}")
            carte[t['car']] = d
    manquants = [c for c in pool if c not in carte]
    if manquants:
        raise SystemExit(f"caractères du pool sans doigt : {manquants}")
    return carte


def budgets(carte):
    """(a) 2 index, (b) +2 majeurs, (c) +2 annulaires, (d) +2 auriculaires."""
    out, doigts_ouverts = [], set()
    for i, paire in enumerate(PAIRES):
        doigts_ouverts |= set(paire)
        chars = sorted(c for c, d in carte.items() if d in doigts_ouverts)
        out.append((NOM_PAIRE[i], i + 1, set(doigts_ouverts), chars))
    return out


# --------------------------------------------------- meilleur jeu de k touches
def _zeta(vals, n):
    """Transformée zeta sur les sous-ensembles : v[M] = somme des v[S], S inclus
    dans M. En place, n passes."""
    for i in range(n):
        b = 1 << i
        w = vals.reshape(-1, 2 * b)
        w[:, b:] += w[:, :b]
    return vals


def _argmax_popcount(vals, n, k, bloc=1 << 24):
    """argmax de vals[M] sur les M de popcount exactement k, par blocs."""
    best_v, best_m = None, None
    for deb in range(0, 1 << n, bloc):
        idx = np.arange(deb, min(deb + bloc, 1 << n), dtype=np.uint32)
        sel = np.bitwise_count(idx) == k
        if not sel.any():
            continue
        sous = vals[deb:deb + len(idx)][sel]
        j = int(np.argmax(sous))
        v = sous[j]
        if best_v is None or v > best_v:
            best_v, best_m = v, int(idx[sel][j])
    return best_m, best_v


class Solveur:
    """Optimum EXACT du meilleur jeu de k touches dans un sous-alphabet donné.

    Deux réductions, toutes deux SANS PERTE (donc l'optimum reste exact) :
      - on ne garde que les mots entièrement typables avec `chars` ;
      - on retire de `chars` les caractères présents dans AUCUN de ces mots :
        les ajouter à un jeu ne change ni le compte ni le poids, donc un
        optimum peut toujours être choisi sans eux (on recomplète après coup).
    """

    LIMITE_BITS = 30  # 2^30 uint16 = 2 Gio, 2^30 float32 = 4 Gio

    def __init__(self, univ, chars):
        self.univ = univ
        self.chars_demandes = list(chars)
        autorise = univ.masque(chars)
        sel = univ.typables(autorise)
        self.masques = univ.masques[sel]
        self.poids = univ.poids[sel]
        self.mots = [m for m, ok in zip(univ.mots, sel.tolist()) if ok]
        utile = 0
        for m in self.masques.tolist():
            utile |= m
        self.utiles = [c for c in chars if utile >> univ.index[c] & 1]
        self.inutiles = [c for c in chars if c not in self.utiles]
        self.n = len(self.utiles)
        if self.n > self.LIMITE_BITS:
            raise SystemExit(f"alphabet utile de {self.n} bits > {self.LIMITE_BITS}")
        loc = {c: i for i, c in enumerate(self.utiles)}
        self.loc = loc
        self.mloc = np.zeros(len(self.masques), dtype=np.int64)
        for j, m in enumerate(self.masques.tolist()):
            v = 0
            for c in self.utiles:
                if m >> univ.index[c] & 1:
                    v |= 1 << loc[c]
            self.mloc[j] = v
        self._cnt = None
        self._poi = None

    def _table(self, quoi):
        t = np.zeros(1 << self.n, dtype=np.uint16 if quoi == 'mots' else np.float32)
        src = np.ones(len(self.mloc), dtype=t.dtype) if quoi == 'mots' \
            else self.poids.astype(np.float32)
        np.add.at(t, self.mloc, src)
        return _zeta(t, self.n)

    def meilleur(self, k, objectif='mots'):
        """-> (jeu trie, n_mots, couverture). Optimum exact."""
        if k > len(self.chars_demandes):
            return None
        kk = min(k, self.n)
        cle = '_cnt' if objectif == 'mots' else '_poi'
        t = getattr(self, cle)
        if t is None:
            t = self._table(objectif)
            setattr(self, cle, t)
        m, _ = _argmax_popcount(t, self.n, kk)
        jeu = [c for c in self.utiles if m >> self.loc[c] & 1]
        if len(jeu) < k:  # completer sans effet sur le score
            jeu += [c for c in self.chars_demandes if c not in jeu][:k - len(jeu)]
        gm = self.univ.masque(jeu)
        n_mots, p = self.univ.mesure(gm)
        return sorted(jeu), n_mots, p / self.univ.poids_total

    def liberer(self):
        self._cnt = self._poi = None


def meilleur_k(univ, chars, k, objectif='mots'):
    return Solveur(univ, chars).meilleur(k, objectif)


def mots_de(univ, jeu):
    t = univ.typables(univ.masque(jeu))
    return [m for m, ok in zip(univ.mots, t.tolist()) if ok]


# ------------------------------------------------------------------ parcours
def beam_contraint(univ, tailles, dispo_par_etape, largeur=30, candidats=14):
    """Faisceau identique à rendement.chercher, mais les touches d'une étape
    sont bornées à `dispo_par_etape[k]` (les touches des doigts déjà ouverts)."""
    faisceau = [(0, frozenset(), [])]
    for k, taille in enumerate(tailles):
        dispo = dispo_par_etape[k]
        suivant = {}
        for masque, utilises, ordre in faisceau:
            restants = [c for c in dispo if c not in utilises]
            if len(restants) < taille:
                continue
            manquants = ~univ.typables(masque)
            score = {}
            for c in restants:
                bit = 1 << univ.index[c]
                score[c] = float(univ.poids[manquants & ((univ.masques & bit) != 0)].sum())
            tete = sorted(restants, key=lambda c: -score[c])[:candidats]
            for combo in itertools.combinations(tete, taille):
                m2 = masque | univ.masque(combo)
                _, p = univ.mesure(m2)
                v = (p, m2, utilises | set(combo), ordre + [list(combo)])
                if m2 not in suivant or v[0] > suivant[m2][0]:
                    suivant[m2] = v
        if not suivant:
            return None
        faisceau = [(v[1], v[2], v[3]) for v in
                    sorted(suivant.values(), key=lambda v: -v[0])[:largeur]]
    return max(faisceau, key=lambda f: evaluer(univ, f[2])[1])[2]


def affiner_contraint(univ, ordre, dispo_par_etape, tours=8000):
    """Échanges entre étapes, refusés si une touche part vers une étape où son
    doigt n'est pas encore ouvert."""
    ordre = [list(p) for p in ordre]
    meilleur = evaluer(univ, ordre)[1]
    n = len(ordre)
    for _ in range(tours):
        i, j = random.randrange(n), random.randrange(n)
        if i == j:
            continue
        a, b = random.randrange(len(ordre[i])), random.randrange(len(ordre[j]))
        ci, cj = ordre[i][a], ordre[j][b]
        if cj not in dispo_par_etape[i] or ci not in dispo_par_etape[j]:
            continue
        ordre[i][a], ordre[j][b] = cj, ci
        s = evaluer(univ, ordre)[1]
        if s > meilleur:
            meilleur = s
        else:
            ordre[i][a], ordre[j][b] = ci, cj
    return ordre, meilleur


def dispo(carte, calendrier, n_etapes):
    """calendrier : doigt -> étape d'ouverture (1-indexée). -> liste par étape
    des caractères disponibles."""
    out = []
    for e in range(1, n_etapes + 1):
        ouverts = {d for d, s in calendrier.items() if s <= e}
        out.append(sorted(c for c, d in carte.items() if d in ouverts))
    return out
