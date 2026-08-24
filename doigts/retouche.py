from PIL import Image
import numpy as np, pathlib
from scipy import ndimage

BASE = pathlib.Path("/Users/lyra/Documents/Obsidian/Anima/Projects/typing_app/doigts")
SRC, FULL, WEB = BASE/"detoures", BASE/"detoures-nettoyes", BASE/"web"
FULL.mkdir(exist_ok=True); WEB.mkdir(exist_ok=True)

# alliance : boîte (x0,x1,y0,y1) mesurée APRÈS recadrage et rognage alpha,
# donc dans le repère de l'image nettoyée. Fractions de la taille pour rester robuste.
RINGS_F = {"index_gauche":  (0.2311, 0.4874, 0.4410, 0.4995),
           "pousse_gauche": (0.1324, 0.2706, 0.1002, 0.1804)}
# coupe basse (fraction de hauteur) : retire la montre et l'avant-bras
CROP = {"index_gauche":0.540, "pousse_gauche":0.455,
        "index_droit":0.620, "pousse_droit":0.550}
RENAME = {"pousse_gauche":"pouce_gauche", "pousse_droit":"pouce_droit"}

def erase_ring(im, box, pad=18, feather=6, seed=7):
    """Efface l'anneau colonne par colonne. L'alliance touche souvent le bord du doigt :
    une seule bande de peau de référence (au-dessus OU en dessous) suffit."""
    x0,x1,y0,y1 = box
    a = np.asarray(im).astype(np.float32).copy()
    H = a.shape[0]
    opaque = a[:,:,3] > 200
    h = y1-y0
    ramp = np.ones(h, dtype=np.float32)
    f = min(feather, h//2)
    if f: ramp[:f]=np.linspace(0,1,f); ramp[-f:]=np.linspace(1,0,f)
    rng = np.random.default_rng(seed)

    for x in range(x0, x1):
        top_rows = [y for y in range(max(0,y0-pad), y0) if opaque[y,x]]
        bot_rows = [y for y in range(y1, min(H,y1+pad)) if opaque[y,x]]
        top = a[top_rows, x, :3].mean(axis=0) if len(top_rows)>=3 else None
        bot = a[bot_rows, x, :3].mean(axis=0) if len(bot_rows)>=3 else None
        if top is None and bot is None:
            continue                       # colonne entièrement hors du doigt
        if top is None: top = bot
        if bot is None: bot = top

        t = np.linspace(0,1,h,dtype=np.float32)[:,None]
        fill = top[None,:]*(1-t) + bot[None,:]*t
        fill = np.clip(fill + rng.normal(0, 2.6, (h,1)), 0, 255)   # grain fin, pas de motif

        col_op = opaque[y0:y1, x]
        if not col_op.any(): continue
        w = (ramp * col_op).astype(np.float32)[:,None]
        a[y0:y1, x, :3] = a[y0:y1, x, :3]*(1-w) + fill*w

    return Image.fromarray(np.clip(a,0,255).astype(np.uint8), "RGBA")

def keep_main_blob(im):
    a = np.asarray(im).copy()
    solid = a[:,:,3] > 24
    lab, n = ndimage.label(solid)
    if n <= 1: return im
    sizes = ndimage.sum(solid, lab, range(1,n+1))
    a[(lab != int(np.argmax(sizes))+1) & (lab != 0), 3] = 0
    return Image.fromarray(a, "RGBA")

def trim_alpha(im):
    bb = im.getchannel("A").point(lambda v: 255 if v>8 else 0).getbbox()
    return im.crop(bb) if bb else im

for n in ["index_gauche","index_droit","pousse_gauche","pousse_droit"]:
    im = Image.open(SRC/f"{n}.png").convert("RGBA")
    W,H = im.size
    im = im.crop((0,0,W,int(H*CROP[n])))
    im = keep_main_blob(im)
    im = trim_alpha(im)
    if n in RINGS_F:
        cw,ch = im.size
        fx0,fx1,fy0,fy1 = RINGS_F[n]
        im = erase_ring(im, (int(cw*fx0), int(cw*fx1), int(ch*fy0), int(ch*fy1)))
    name = RENAME.get(n,n)
    im.save(FULL/f"{name}.png")
    for hh,suf in ((512,""),(1024,"@2x")):
        im.resize((round(im.size[0]*hh/im.size[1]), hh), Image.LANCZOS).save(WEB/f"{name}{suf}.png", optimize=True)
    print(f"{name:14s} {im.size[0]}x{im.size[1]}")
