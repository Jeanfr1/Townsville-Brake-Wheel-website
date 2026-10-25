#!/usr/bin/env python3
"""Ink boxes of the approved board's text and marks (board px).

Each ROI is searched for pixels matching an ink predicate; prints the tight
bounding box and writes scripts/out/board-ink.json + an overlay for checking.
"""
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
B = np.asarray(Image.open(ROOT / "docs/direcao-com-logo-A.png").convert("RGB")).astype(int)
R, G, Bl = B[..., 0], B[..., 1], B[..., 2]
INK = {
    "white": (R > 165) & (G > 165) & (Bl > 155) & ((R - Bl) < 60),
    "yellow": (R > 160) & (G > 120) & (Bl < 120) & (R - Bl > 90),
    "black": (R < 70) & (G < 70) & (Bl < 70),
    "dark": (R + G + Bl) < 150,
}
ROIS = {
    # hero
    "logo": ((40, 0, 250, 125), "yellow"),
    "nav-services": ((325, 35, 398, 56), "white"),
    "nav-workshop": ((404, 35, 506, 56), "white"),
    "nav-contact": ((514, 35, 580, 56), "white"),
    "nav-sep1": ((396, 35, 404, 56), "yellow"),
    "nav-sep2": ((505, 35, 514, 56), "yellow"),
    "btn": ((582, 20, 735, 72), "yellow"),
    "btn-text": ((600, 36, 715, 56), "black"),
    "tagline": ((28, 320, 175, 362), "dark"),
    "tagline-dash": ((28, 366, 90, 380), "yellow"),
    "hero-side": ((655, 132, 757, 202), "white"),
    "hero-vline": ((640, 80, 655, 330), "yellow"),
    "hero-hline": ((600, 98, 757, 110), "yellow"),
    # alignment
    "al-title": ((25, 665, 270, 880), "white"),
    "al-dot": ((262, 860, 285, 885), "yellow"),
    "al-lead": ((28, 890, 240, 925), "white"),
    "al-list": ((45, 932, 190, 1000), "white"),
    "al-bar": ((30, 932, 44, 1000), "yellow"),
    "al-side": ((660, 698, 757, 790), "white"),
    # services
    "sv-eyebrow": ((30, 1035, 160, 1052), "black"),
    "sv-title": ((30, 1065, 210, 1238), "black"),
    "sv-dot": ((170, 1218, 195, 1240), "white"),
    "sv-note": ((30, 1255, 175, 1300), "black"),
    "sv-vline": ((380, 1040, 395, 1290), "black"),
    "sv-hline": ((225, 1158, 550, 1170), "black"),
    "sv-ic1": ((245, 1040, 335, 1080), "black"),
    "sv-t1": ((240, 1085, 345, 1118), "black"),
    "sv-d1": ((240, 1120, 360, 1145), "black"),
    "sv-ic2": ((445, 1040, 505, 1080), "black"),
    "sv-t2": ((430, 1085, 520, 1118), "black"),
    "sv-d2": ((425, 1120, 545, 1145), "black"),
    "sv-ic3": ((265, 1180, 315, 1225), "black"),
    "sv-t3": ((240, 1228, 345, 1262), "black"),
    "sv-d3": ((240, 1265, 345, 1290), "black"),
    "sv-ic4": ((455, 1175, 490, 1228), "black"),
    "sv-t4": ((425, 1228, 530, 1262), "black"),
    "sv-d4": ((425, 1265, 570, 1290), "black"),
    # local
    "lo-title": ((25, 1318, 405, 1495), "white"),
    "lo-copy": ((28, 1500, 155, 1570), "white"),
    "lo-dash": ((28, 1574, 90, 1590), "yellow"),
    # contact
    "co-title": ((35, 1685, 270, 1835), "white"),
    "co-dot": ((185, 1810, 205, 1835), "yellow"),
    "co-ic1": ((35, 1848, 72, 1885), "yellow"),
    "co-call": ((75, 1850, 290, 1885), "white"),
    "co-ic2": ((35, 1890, 72, 1930), "yellow"),
    "co-addr": ((75, 1892, 335, 1925), "white"),
    "ft-logo": ((35, 1950, 250, 2075), "yellow"),
    "ft-line": ((272, 2020, 290, 2075), "yellow"),
    "ft-services": ((310, 2038, 372, 2058), "white"),
    "ft-workshop": ((385, 2038, 482, 2058), "white"),
    "ft-contact": ((500, 2038, 560, 2058), "white"),
    "ft-btn": ((582, 2015, 735, 2068), "yellow"),
}
out = {}
img = Image.open(ROOT / "docs/direcao-com-logo-A.png").convert("RGB").resize((757 * 2, 2078 * 2))
d = ImageDraw.Draw(img)
for name, ((x0, y0, x1, y1), ink) in ROIS.items():
    m = INK[ink][y0:y1, x0:x1]
    ys, xs = np.nonzero(m)
    if len(xs) < 4:
        print(f"{name:14s} NO INK"); continue
    # trim isolated noise: keep rows/cols with >=2 ink px
    cols = np.nonzero(m.sum(0) >= 1)[0]; rows = np.nonzero(m.sum(1) >= 1)[0]
    bx0, bx1, by0, by1 = x0 + cols[0], x0 + cols[-1] + 1, y0 + rows[0], y0 + rows[-1] + 1
    out[name] = [int(bx0), int(by0), int(bx1 - bx0), int(by1 - by0)]
    print(f"{name:14s} x={bx0:4d} y={by0:4d} w={bx1-bx0:4d} h={by1-by0:4d}")
    d.rectangle([x0 * 2, y0 * 2, x1 * 2, y1 * 2], outline=(0, 160, 255))
    d.rectangle([bx0 * 2, by0 * 2, bx1 * 2, by1 * 2], outline=(255, 0, 80), width=2)
(ROOT / "scripts/out").mkdir(parents=True, exist_ok=True)
(ROOT / "scripts/out/board-ink.json").write_text(json.dumps(out, indent=1))
img.save(ROOT / "scripts/out/board-ink.png")
