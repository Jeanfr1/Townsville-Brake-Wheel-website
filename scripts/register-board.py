#!/usr/bin/env python3
"""Register each board section against its high-res source (SIFT + similarity).

Writes scripts/out/board-registration.json: for every scene, the source image's
scale and offset in board px, so CSS can place the plate where the board has it.
Also writes overlay PNGs (source warped onto the board, 50% blend) for checking.
"""
import json, sys
from pathlib import Path
import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "scripts" / "out"
OUT.mkdir(parents=True, exist_ok=True)
BOARD = cv2.imread(str(ROOT / "docs/direcao-com-logo-A.png"))

# board section bands (board px, measured from row-difference seams)
SCENES = {
    "hero":      (0, 655,   ["images-master/hero-mid.png", "images-master/hero-lifted.png", "images-master/hero-revealed.png"]),
    "alignment": (655, 1008, ["images-master/alignment.png"]),
    "local":     (1305, 1653, ["originals/classic-original.png"]),
    "contact":   (1653, 2078, ["originals/workshop-original.png"]),
}

sift = cv2.SIFT_create(nfeatures=6000)


def gray(img):
    return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)


def register(band, src):
    kb, db = sift.detectAndCompute(gray(band), None)
    ks, ds = sift.detectAndCompute(gray(src), None)
    m = cv2.BFMatcher().knnMatch(ds, db, k=2)
    good = [a for a, b in m if a.distance < 0.75 * b.distance]
    if len(good) < 8:
        return None
    ps = np.float32([ks[g.queryIdx].pt for g in good])
    pb = np.float32([kb[g.trainIdx].pt for g in good])
    M, inl = cv2.estimateAffinePartial2D(ps, pb, method=cv2.RANSAC, ransacReprojThreshold=4)
    if M is None:
        return None
    s = float(np.hypot(M[0, 0], M[1, 0]))
    rot = float(np.degrees(np.arctan2(M[1, 0], M[0, 0])))
    return dict(scale=s, rot=rot, tx=float(M[0, 2]), ty=float(M[1, 2]), inliers=int(inl.sum()), matches=len(good), M=M.tolist())


result = {"board": {"w": BOARD.shape[1], "h": BOARD.shape[0]}, "scenes": {}}
for name, (y0, y1, sources) in SCENES.items():
    band = BOARD[y0:y1]
    best = None
    for rel in sources:
        src = cv2.imread(str(ROOT / rel))
        r = register(band, src)
        print(name, rel, None if r is None else {k: round(v, 3) if isinstance(v, float) else v for k, v in r.items() if k != "M"})
        if r and (best is None or r["inliers"] > best["inliers"]):
            best = dict(r, source=rel, w=src.shape[1], h=src.shape[0])
            warped = cv2.warpAffine(src, np.array(r["M"]), (band.shape[1], band.shape[0]))
            cv2.imwrite(str(OUT / f"overlay-{name}.png"), cv2.addWeighted(band, 0.5, warped, 0.5, 0))
    if best:
        best["band"] = [y0, y1]
        result["scenes"][name] = best

(OUT / "board-registration.json").write_text(json.dumps(result, indent=1))
print("wrote", OUT / "board-registration.json")
