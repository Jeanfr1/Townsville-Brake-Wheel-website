#!/usr/bin/env python3
"""Build the site's master plates from the kit (output: assets-src/, gitignored).

  hero-<state>.png   the four reveal states, registered to hero-mid and placed in
                     the approved board's hero frame (757 x 655 board px at K);
                     the sky above the source image is extended for the board's
                     taller crop
  hero-mobile.png    kit's portrait hero, upscaled
  alignment.png      kit close-up, upscaled x2
  local.png          supplied red classic photo, viewer UI removed, upscaled
  contact.png        supplied workshop photo, viewer UI removed, upscaled
  logo-seal.png      approved logo A with its oval filled dark (as on the board)
  scripts/out/hero-frame.json   placement numbers used by the CSS

Run: ~/anaconda3/bin/python3 scripts/prepare-images.py [name ...]
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage

sys.path.insert(0, str(Path(__file__).parent))
from upscale import sr4  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets-src"
OUT = ROOT / "scripts" / "out"
SRC.mkdir(exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)

BOARD_W, HERO_H = 757, 655          # board px
# The hero plate reaches EXT board px past each side of the board frame: on wide
# screens the board sits centred (desktop density = a 1024 px board, see board.css)
# and the kit's own frame already holds real pixels 58 px left / 82 px right of it.
EXT = 140
PLATE_W = 3072                       # hero plate width in px
K = PLATE_W / (BOARD_W + 2 * EXT)    # plate px per board px
STATES = ["covered", "mid", "lifted", "revealed"]


def rgb(path):
    return np.asarray(Image.open(ROOT / path).convert("RGB"))


def save(name, arr, **kw):
    Image.fromarray(arr).save(SRC / name, **kw)
    print("  ->", SRC / name, arr.shape[1], "x", arr.shape[0])


def upscale(arr, factor):
    """Real-ESRGAN x4, then area-resample to the wanted factor."""
    big = sr4(arr)
    h, w = arr.shape[:2]
    return cv2.resize(big, (round(w * factor), round(h * factor)), interpolation=cv2.INTER_AREA)


def sift_pairs(a, b, ratio=0.75):
    sift = cv2.SIFT_create(nfeatures=8000)
    ka, da = sift.detectAndCompute(cv2.cvtColor(a, cv2.COLOR_RGB2GRAY), None)
    kb, db = sift.detectAndCompute(cv2.cvtColor(b, cv2.COLOR_RGB2GRAY), None)
    m = cv2.BFMatcher().knnMatch(da, db, k=2)
    good = [p for p, q in m if p.distance < ratio * q.distance]
    return (np.float32([ka[g.queryIdx].pt for g in good]),
            np.float32([kb[g.trainIdx].pt for g in good]))


def fit_scale_translate(ps, pb):
    """RANSAC similarity for inliers, then least squares for s, tx, ty (no rotation)."""
    _, inl = cv2.estimateAffinePartial2D(ps, pb, method=cv2.RANSAC, ransacReprojThreshold=4)
    ps, pb = ps[inl.ravel() == 1], pb[inl.ravel() == 1]
    cs, cb = ps.mean(0), pb.mean(0)
    s = float(((ps - cs) * (pb - cb)).sum() / ((ps - cs) ** 2).sum())
    t = cb - s * cs
    err = float(np.abs(ps * s + t - pb).mean())
    return s, float(t[0]), float(t[1]), len(ps), err


# ---------------------------------------------------------------- hero
def hero():
    mid = rgb("images-master/hero-mid.png")
    h, w = mid.shape[:2]
    board = np.asarray(Image.open(ROOT / "docs/direcao-com-logo-A.png").convert("RGB"))[:HERO_H]
    ps, pb = sift_pairs(mid, board)
    s, tx, ty, n, err = fit_scale_translate(ps, pb)
    print(f"hero-mid -> board: s={s:.4f} tx={tx:.1f} ty={ty:.1f} inliers={n} err={err:.2f}px")
    frame = {"board": [BOARD_W, HERO_H], "ext": EXT, "plate": [PLATE_W, round(HERO_H * K)], "K": K,
             "source": [w, h], "s": s, "tx": tx, "ty": ty}

    factor = s * K                                   # source px -> plate px
    ox, oy = round((tx + EXT) * K), round(ty * K)
    PH = round(HERO_H * K)
    for state in STATES:
        src = rgb(f"images-master/hero-{state}.png")
        if state != "mid":                           # register each state onto hero-mid
            a, b = sift_pairs(src, mid)
            M, inl = cv2.estimateAffinePartial2D(a, b, method=cv2.RANSAC, ransacReprojThreshold=3)
            print(f"  {state} -> mid: scale={np.hypot(M[0,0],M[1,0]):.4f} "
                  f"rot={np.degrees(np.arctan2(M[1,0],M[0,0])):.2f} t=({M[0,2]:.1f},{M[1,2]:.1f}) inl={int(inl.sum())}")
            src = cv2.warpAffine(src, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
        big = upscale(src, factor)
        plate = np.zeros((PH, PLATE_W, 3), np.uint8)
        # paste with clipping
        x0, y0 = max(0, ox), max(0, oy)
        x1, y1 = min(PLATE_W, ox + big.shape[1]), min(PH, oy + big.shape[0])
        plate[y0:y1, x0:x1] = big[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
        side_fill(plate, x0, x1)
        save(f"hero-{state}.png", plate)
    (OUT / "hero-frame.json").write_text(json.dumps(frame, indent=1))
    hero_sky()


def side_fill(plate, x0, x1):
    """Beyond the kit's real pixels: mirror the edge, blur and darken it outward.

    Only the outermost strip of very wide screens ever shows it."""
    p = plate.astype(np.float32)
    for side in ("left", "right"):
        n = x0 if side == "left" else plate.shape[1] - x1
        if n <= 0:
            continue
        src = p[:, x0:x0 + n][:, ::-1] if side == "left" else p[:, x1 - n:x1][:, ::-1]
        soft = cv2.GaussianBlur(src, (0, 0), 14)
        t = np.linspace(1, 0, n)[None, :, None] if side == "left" else np.linspace(0, 1, n)[None, :, None]
        # t = distance from the real edge, 0..1
        fill = (src * (1 - t) + soft * t) * (1 - 0.65 * t)
        if side == "left":
            plate[:, :x0] = fill.clip(0, 255).astype(np.uint8)
        else:
            plate[:, x1:] = fill.clip(0, 255).astype(np.uint8)


def hero_sky(band=150):
    """Extend the sky above the source image (board crop is taller than the kit's frame).

    The sky is identical in all four registered states, so every plate gets the same
    extension, mirrored from the clothless 'revealed' plate and softened with distance.
    In 'lifted' the cover leaves the top of the frame: fade it out over `band` rows
    so it never ends on a hard horizontal line.
    """
    frame = json.loads((OUT / "hero-frame.json").read_text())
    oy = round(frame["ty"] * frame["K"])
    plates = {st: np.asarray(Image.open(SRC / f"hero-{st}.png").convert("RGB")).copy() for st in STATES}
    ref = plates["revealed"].astype(np.float32)
    mirror = ref[oy + 1:2 * oy + 1][::-1]
    soft = cv2.GaussianBlur(mirror, (0, 0), 9)
    k = np.linspace(1, 0, oy)[:, None, None] ** 0.6       # 1 at the seam, 0 at the top
    ext = (mirror * k + soft * (1 - k)).clip(0, 255).astype(np.uint8)
    ramp = (np.linspace(0, 1, band) ** 1.5)[:, None, None]
    for st, plate in plates.items():
        if st == "lifted":
            seg = plate[oy:oy + band].astype(np.float32)
            plate[oy:oy + band] = (seg * ramp + ref[oy:oy + band] * (1 - ramp)).astype(np.uint8)
        plate[:oy] = ext
        save(f"hero-{st}.png", plate)


def hero_mobile():
    save("hero-mobile.png", upscale(rgb("images-master/hero-mobile.png"), 1.5))


def alignment():
    save("alignment.png", upscale(rgb("images-master/alignment.png"), 2))


# ------------------------------------------------- supplied photographs
def inpaint_circles(arr, circles):
    mask = np.zeros(arr.shape[:2], np.uint8)
    for cx, cy, r in circles:
        cv2.circle(mask, (cx, cy), r, 255, -1)
    return cv2.inpaint(arr, mask, 9, cv2.INPAINT_TELEA)


def column_fill(arr, cx, cy, r, clone_cols=(), clone_dy=-45):
    """Remove a round viewer button from vertical textures (corrugated wall, pillar).

    Each column inside the circle gets the median colour of the same column just
    above and below the circle, plus the fine grain of the rows above it; columns
    listed in clone_cols (a lattice window) are cloned from clone_dy rows away.
    The result is feathered into the photo with a soft circular mask.
    """
    out = arr.astype(np.float32).copy()
    y0, y1 = cy - r, cy + r
    ring = np.concatenate([arr[y0 - 14:y0 - 3], arr[y1 + 3:y1 + 9]]).astype(np.float32)
    med = np.median(ring, axis=0)                                   # per-column colour
    above = arr[y0 - 2 * r - 6:y0 - 6].astype(np.float32)          # same height, just above
    grain = above - np.median(above, axis=0, keepdims=True)
    fill = med[None] + grain
    for x in clone_cols:
        fill[:, x] = arr[y0 + clone_dy:y1 + clone_dy, x]
    yy, xx = np.mgrid[y0:y1, 0:arr.shape[1]]
    d = np.sqrt((yy - cy) ** 2 + (xx - cx) ** 2)
    m = np.clip((r + 3 - d) / 6, 0, 1)[..., None]
    out[y0:y1] = out[y0:y1] * (1 - m) + fill * m
    return out.clip(0, 255).astype(np.uint8)


def local():
    a = rgb("originals/classic-original.png")
    # viewer arrows over the walls (left and right of the car)
    a = column_fill(a, 42, 490, 40, clone_cols=range(0, 20))
    a = column_fill(a, 1265, 490, 40)
    a = a[88:]                                       # viewer title bar and close button
    save("local.png", upscale(a, 2))


def contact():
    a = rgb("originals/workshop-original.png")[90:]  # viewer caption over the sky
    save("contact.png", upscale(a, 2.5))


# ---------------------------------------------------------------- logo
def logo():
    im = Image.open(ROOT / "originals/Townsville-Logo-A-Transparente.png").convert("RGBA")
    a = np.asarray(im).copy()
    solid = a[..., 3] > 24
    inside = ndimage.binary_fill_holes(solid)
    fill = inside & ~solid
    out = a.copy()
    # oval interior filled dark like the approved board; strokes untouched
    base = np.zeros_like(a)
    base[inside] = (17, 17, 17, 255)
    alpha = a[..., 3:4].astype(np.float32) / 255
    out = (a[..., :3] * alpha + base[..., :3] * (1 - alpha)).astype(np.uint8)
    out = np.dstack([out, np.where(inside, 255, a[..., 3]).astype(np.uint8)])
    x0, y0, x1, y1 = Image.fromarray(out).getbbox()
    out = out[y0:y1, x0:x1]
    save("logo-seal.png", out)
    print("  fill px:", int(fill.sum()))


JOBS = {"hero": hero, "hero-sky": hero_sky, "hero-mobile": hero_mobile, "alignment": alignment,
        "local": local, "contact": contact, "logo": logo}

if __name__ == "__main__":
    for name in sys.argv[1:] or JOBS:
        print("==", name)
        JOBS[name]()
