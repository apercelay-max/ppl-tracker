"""
Fabrique l'icône « haltère en verre » (proposition n°8) de PPL Tracker.

Le verre de l'app est un backdrop-filter : impossible dans un PNG figé. On le
« peint » donc — on reprend le fond, on le sature / éclaircit / floute, et on
ne garde ce résultat qu'à l'intérieur de la forme de l'haltère, plus un liseré
lumineux en haut et en bas. C'est exactement ce que fait la vignette n°8 de
l'artifact, mais calculé une fois pour toutes.

Sortie : public/icon-512.png, icon-192.png, apple-touch-icon.png (180).
"""

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

S = 1024  # on travaille en 1024 puis on réduit : bien plus net en petit

# ── 1. Le fond « mesh » : trois halos colorés sur un violet très sombre ──────
BASE = np.array([0x17, 0x0b, 0x1e], dtype=np.float64)
HALOS = [
    # (couleur, centre x, centre y, rayon x, rayon y) en fractions de l'image
    # Rapprochés du centre par rapport à la vignette de l'artifact : là-bas le
    # glyphe est grand, ici il doit rester dans les 68 % centraux, donc c'est
    # le centre de l'image qui a besoin de couleur.
    ((0xff, 0x5a, 0x3c), 0.16, 0.12, 0.82, 0.90),
    ((0xc0, 0x26, 0xd3), 0.88, 0.26, 0.82, 0.88),
    ((0x3b, 0x3a, 0xd6), 0.54, 1.00, 0.90, 0.86),
]

yy, xx = np.mgrid[0:S, 0:S].astype(np.float64) / S
bg = np.repeat(BASE[None, None, :], S, 0).repeat(S, 1)
for color, cx, cy, rx, ry in HALOS:
    d = np.sqrt(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2)
    # même profil que le radial-gradient CSS : plein au centre, éteint à 62 %
    a = np.clip(1.0 - d / 0.72, 0.0, 1.0) ** 1.05
    bg = bg * (1 - a[..., None]) + np.array(color, dtype=np.float64) * a[..., None]

background = Image.fromarray(np.clip(bg, 0, 255).astype(np.uint8), "RGB")

# ── 2. La forme de l'haltère ────────────────────────────────────────────────
# Dessinée dans une grille de 128, puis ramenée à 76 % de la largeur : Android
# peut recouper l'icône en rond (icon-512 est déclarée "maskable"), le glyphe
# doit donc rester dans les 80 % centraux.
GLYPH_BOX = 128.0
SCALE = 0.76
k = S * SCALE / GLYPH_BOX
offset = (S - GLYPH_BOX * k) / 2


def g(v):
    """Coordonnée du repère 128 → pixel de l'image finale."""
    return offset + v * k


BARS = [
    (40, 56, 88, 72, 8),    # la barre centrale
    (24, 38, 40, 90, 7),    # disque intérieur gauche
    (88, 38, 104, 90, 7),   # disque intérieur droit
    (10, 50, 21, 78, 5),    # disque extérieur gauche
    (107, 50, 118, 78, 5),  # disque extérieur droit
]

mask = Image.new("L", (S, S), 0)
md = ImageDraw.Draw(mask)
for x0, y0, x1, y1, r in BARS:
    md.rounded_rectangle([g(x0), g(y0), g(x1), g(y1)], radius=r * k, fill=255)

# ── 3. Le verre : le fond, flouté, saturé et éclairci, gardé dans la forme ──
glass = background.filter(ImageFilter.GaussianBlur(radius=S * 0.012))
arr = np.asarray(glass, dtype=np.float64)
grey = arr.mean(axis=2, keepdims=True)
arr = grey + (arr - grey) * 1.75         # saturation ×1,75
arr = arr * 1.30                          # luminosité ×1,30
arr = arr + (255.0 - arr) * 0.34          # voile blanc : c'est lui qui détache
                                          # le glyphe du fond en petite taille
glass = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB")

icon = background.copy()

# Ombre portée douce : sans elle, le verre clair posé sur un fond clair (le
# halo violet, à droite) se confond avec lui.
shadow = mask.filter(ImageFilter.GaussianBlur(radius=S * 0.02))
shadow_arr = np.asarray(shadow, np.float64) / 255.0 * 0.42
icon = Image.composite(
    Image.new("RGB", (S, S), (10, 4, 16)),
    icon,
    Image.fromarray(np.clip(shadow_arr * 255, 0, 255).astype(np.uint8)),
)
icon.paste(glass, (0, 0), mask)

# ── 4. Le liseré : la lumière qui accroche le bord haut et le bord bas ──────
edge = mask.filter(ImageFilter.MaxFilter(1))
inner = mask.filter(ImageFilter.GaussianBlur(radius=S * 0.007))
inner = inner.point(lambda v: 255 if v > 248 else 0)
rim = Image.fromarray(
    np.clip(np.asarray(mask, np.int16) - np.asarray(inner, np.int16), 0, 255).astype(np.uint8)
)

# Haut lumineux, bas plus discret, rien au milieu — mais calé sur la HAUTEUR
# DU GLYPHE, pas sur celle de l'image : l'haltère occupe le tiers central, une
# rampe calculée sur l'image entière ne l'aurait jamais éclairé.
gy0, gy1 = g(38), g(90)
h = (np.linspace(0, S - 1, S)[:, None] - gy0) / max(gy1 - gy0, 1)
ramp = np.clip(1 - h / 0.28, 0, 1) * 0.95        # bord supérieur
ramp = ramp + np.clip((h - 0.72) / 0.28, 0, 1) * 0.5  # bord inférieur
ramp = np.clip(ramp, 0, 1)
rim_alpha = (np.asarray(rim, np.float64) / 255.0) * ramp
icon = Image.composite(
    Image.new("RGB", (S, S), (255, 255, 255)),
    icon,
    Image.fromarray(np.clip(rim_alpha * 255, 0, 255).astype(np.uint8)),
)

# ── 5. Le reflet du haut de la tuile, comme sur les icônes iOS ──────────────
gloss = np.clip(1 - (np.linspace(0, 1, S)[:, None] / 0.52), 0, 1) ** 1.6 * 0.16
icon = Image.composite(
    Image.new("RGB", (S, S), (255, 255, 255)),
    icon,
    Image.fromarray(np.clip(gloss.repeat(S, 1) * 255, 0, 255).astype(np.uint8)),
)

# ── 6. Export ───────────────────────────────────────────────────────────────
# Carré plein, sans coins arrondis : iOS et Android appliquent eux-mêmes leur
# masque. Une icône déjà arrondie se retrouverait rognée deux fois.
import sys
out = sys.argv[1] if len(sys.argv) > 1 else "public"
for size, name in [(512, "icon-512.png"), (192, "icon-192.png"), (180, "apple-touch-icon.png")]:
    icon.resize((size, size), Image.LANCZOS).save(f"{out}/{name}", optimize=True)
    print(f"{name} ({size}px)")
