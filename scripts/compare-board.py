#!/usr/bin/env python3
"""Side-by-side and 50% blend of the page capture vs the approved board, per section."""
import sys
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
page = Image.open(sys.argv[1]).convert("RGB")
out = Path(sys.argv[2])
board = Image.open(ROOT / "docs/direcao-com-logo-A.png").convert("RGB").resize((1514, 2078 * 2), Image.LANCZOS)
SECTIONS = {"hero": (0, 655), "alignment": (655, 1008), "services": (1008, 1305), "local": (1305, 1653), "contact": (1653, 2078)}
for name, (a, b) in SECTIONS.items():
    box = (0, a * 2, 1514, b * 2)
    bp, pp = board.crop(box), page.crop(box)
    diff = np.abs(np.asarray(bp, np.int16) - np.asarray(pp, np.int16)).mean()
    sheet = Image.new("RGB", (1514 * 2, (b - a) * 2))
    sheet.paste(bp, (0, 0)); sheet.paste(pp, (1514, 0))
    sheet.resize((1514, (b - a))).save(out / f"side-{name}.jpg", quality=86)
    Image.blend(bp, pp, 0.5).save(out / f"blend-{name}.jpg", quality=86)
    print(f"{name:10s} mean |diff| = {diff:5.1f}")
