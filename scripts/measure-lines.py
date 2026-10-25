#!/usr/bin/env python3
"""Split multi-line board ROIs into per-line ink boxes (board px)."""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image
ROOT = Path(__file__).resolve().parents[1]
B = np.asarray(Image.open(ROOT / "docs/direcao-com-logo-A.png").convert("RGB")).astype(int)
R, G, Bl = B[..., 0], B[..., 1], B[..., 2]
INK = {"white": (R > 165) & (G > 165) & (Bl > 155) & ((R - Bl) < 60),
       "black": (R + G + Bl) < 200, "dark": (R + G + Bl) < 150,
       "yellow": (R > 160) & (G > 120) & (Bl < 120) & (R - Bl > 90)}
ROIS = {
    "tagline": ((28, 320, 175, 362), "dark"),
    "hero-side": ((655, 132, 757, 202), "white"),
    "nav": ((325, 35, 580, 56), "white"),
    "al-title": ((25, 665, 266, 880), "white"),
    "al-lead": ((28, 885, 240, 925), "white"),
    "al-list": ((45, 930, 190, 1000), "white"),
    "al-side": ((660, 698, 757, 790), "white"),
    "sv-eyebrow": ((30, 1030, 120, 1052), "black"),
    "sv-title": ((30, 1065, 172, 1238), "black"),
    "sv-note": ((30, 1255, 175, 1300), "black"),
    "sv-t1": ((240, 1080, 345, 1115), "black"), "sv-d1": ((240, 1118, 360, 1145), "black"),
    "sv-t2": ((430, 1080, 520, 1115), "black"), "sv-d2": ((425, 1118, 545, 1145), "black"),
    "sv-t3": ((240, 1226, 345, 1262), "black"), "sv-d3": ((240, 1265, 345, 1292), "black"),
    "sv-t4": ((425, 1226, 530, 1262), "black"), "sv-d4": ((425, 1265, 575, 1292), "black"),
    "lo-title": ((25, 1318, 405, 1495), "white"),
    "lo-copy": ((28, 1500, 155, 1570), "white"),
    "co-title": ((35, 1685, 268, 1835), "white"),
    "co-call": ((75, 1850, 290, 1885), "white"),
    "co-addr": ((75, 1890, 335, 1925), "white"),
    "ft-nav": ((300, 2030, 570, 2065), "white"),
    "btn-text": ((600, 36, 715, 56), "black"),
    "ft-btn-text": ((600, 2022, 715, 2045), "black"),
}
out = {}
for name, ((x0, y0, x1, y1), ink) in ROIS.items():
    m = INK[ink][y0:y1, x0:x1]
    rows = m.sum(1) > 0
    lines, start = [], None
    for i, r in enumerate(list(rows) + [False]):
        if r and start is None: start = i
        if not r and start is not None:
            if i - start >= 2: lines.append((start, i))
            start = None
    res = []
    for a, b in lines:
        cols = np.nonzero(m[a:b].sum(0))[0]
        res.append([int(x0 + cols[0]), int(y0 + a), int(cols[-1] - cols[0] + 1), int(b - a)])
    out[name] = res
    print(f"{name:12s}", " | ".join(f"x{l[0]} y{l[1]} w{l[2]} h{l[3]}" for l in res))
(ROOT / "scripts/out/board-lines.json").write_text(json.dumps(out, indent=1))
