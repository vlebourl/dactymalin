#!/usr/bin/env python3
"""
Recadrage COMMUN des quatre photos de doigts (feedback F4, points 10 et 7).

Les quatre prises de vue n'ont ni la même échelle, ni le même angle : brutes,
la pastille « index gauche » montre un avant-bras et « pouce droit » un poing.
On ramène ici les quatre à un cadre carré unique :

  - échelle : le côté du carré vaut `cote` fois la LARGEUR DE MAIN mesurée sur
    la boîte alpha, si bien que les quatre mains occupent la même surface ;
  - cadrage : le carré est centré sur le doigt actif (`centre`, en fraction de
    la boîte alpha), pas sur la masse de la main ;
  - fond : transparent, aucune bordure ajoutée.

Usage : python3 doigts/recadrage.py
"""
from pathlib import Path
from PIL import Image

RACINE = Path(__file__).resolve().parent
SOURCES = RACINE / 'detoures-nettoyes'
SORTIE = RACINE.parent / 'public' / 'doigts'
TAILLE = 256  # 1x ; le @2x fait le double

# centre (x, y) et côté du carré, en fractions de la boîte alpha (largeur).
CADRES = {
    'index_gauche': dict(centre=(0.68, 0.32), cote=1.14),
    'index_droit': dict(centre=(0.32, 0.32), cote=1.14),
    'pouce_gauche': dict(centre=(0.70, 0.44), cote=0.87),
    'pouce_droit': dict(centre=(0.30, 0.44), cote=0.87),
}


def recadrer(nom: str, centre, cote) -> None:
    src = Image.open(SOURCES / f'{nom}.png').convert('RGBA')
    boite = src.getbbox()
    if boite is None:
        raise SystemExit(f'{nom} : image vide')
    gx, hy, dx, by = boite
    largeur, hauteur = dx - gx, by - hy
    side = int(largeur * cote)
    cx = gx + centre[0] * largeur
    cy = hy + centre[1] * hauteur
    carre = src.crop(
        (int(cx - side / 2), int(cy - side / 2), int(cx + side / 2), int(cy + side / 2))
    )
    for suffixe, taille in (('', TAILLE), ('@2x', TAILLE * 2)):
        carre.resize((taille, taille), Image.LANCZOS).save(
            SORTIE / f'{nom}{suffixe}.png', optimize=True
        )
    print(f'{nom} : boîte {largeur}×{hauteur} → carré {side}px centré ({int(cx)}, {int(cy)})')


if __name__ == '__main__':
    SORTIE.mkdir(parents=True, exist_ok=True)
    for nom, cadre in CADRES.items():
        recadrer(nom, **cadre)
