#!/usr/bin/env python3
"""Fit every board text line to its measured ink box -> src/styles/board-fit.css.

For each line: font size from the measured cap height, then either letter-spacing
(mode 'track') or a horizontal scale (mode 'scale') so the ink width matches the
board, and the element's left/top so the ink's left edge and cap top land on the
board coordinates (section-local board px). Values are emitted in board units
(calc(n * var(--u))) inside the desktop media query.

Ink boxes come from scripts/measure-board.py, scripts/measure-lines.py and
gridded zooms (scripts/out/z-*.png).
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from PIL import ImageFont

ROOT = Path(__file__).resolve().parents[1]
FS = ROOT / "node_modules/@fontsource"
FONTS = {
    "anton": FS / "anton/files/anton-latin-400-normal.woff",
    "barlow6": FS / "barlow-condensed/files/barlow-condensed-latin-600-normal.woff",
    "barlow7": FS / "barlow-condensed/files/barlow-condensed-latin-700-normal.woff",
    "plex": FS / "ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff",
}


def metrics(path):
    t = TTFont(path)
    u = t["head"].unitsPerEm
    o, h = t["OS/2"], t["hhea"]
    use_typo = bool(o.fsSelection & 128)
    asc, desc = (o.sTypoAscender, -o.sTypoDescender) if use_typo else (h.ascent, -h.descent)
    gap = o.sTypoLineGap if use_typo else h.lineGap
    return dict(asc=asc / u, desc=desc / u, gap=gap / u, cap=o.sCapHeight / u)


M = {k: metrics(p) for k, p in FONTS.items()}
PIL = {k: ImageFont.truetype(str(p), 1000) for k, p in FONTS.items()}


def ink(font, text, ls=0.0):
    """Ink box of `text` at 1 em: (left bearing, width) with letter-spacing ls (em)."""
    f = PIL[font]
    x, xs = 0.0, []
    for ch in text:
        b = f.getbbox(ch)
        if b[2] > b[0]:
            xs.append((x + b[0] / 1000, x + b[2] / 1000))
        x += f.getlength(ch) / 1000 + ls
    return xs[0][0], max(r for _, r in xs) - xs[0][0]


def cap_top(font, lh):
    """Distance from the line box top to the cap top, in em, for line-height lh."""
    m = M[font]
    return (lh - (m["asc"] + m["desc"])) / 2 + m["asc"] - m["cap"]


# selector, font, text, ink x, cap-top y, ink width, cap height, mode, line pitch (for multi-line blocks)
# multi-line blocks: text lines joined by '|', width fitted on the widest line
SPECS = [
    # hero (board y 0..655)
    (".hero-word", "anton", "CONTROL", 33, 106.5, 628, 220, "scale", None),
    (".hero-tag", "barlow7", "GROUND LEVEL.|STARTS AT", 36, 327.4, 125, 12.6, "track", 18),
    (".nav-main a:nth-child(1)", "barlow6", "SERVICES", 336, 41.2, 46, 8.6, "track", None),
    (".nav-main a:nth-child(2)", "barlow6", "OUR WORKSHOP", 415, 41.2, 77, 8.6, "track", None),
    (".nav-main a:nth-child(3)", "barlow6", "CONTACT", 523, 41.2, 44, 8.6, "track", None),
    (".hero-side", "plex", "PRECISION|SAFETY|PERFORMANCE|PEACE OF MIND", 661, 139.5, 55, 6.8, "track", 17.37),
    # alignment (section-local, board y - 655)
    (".al-title .l1", "anton", "EVERY", 35, 23.3, 134, 53.4, "scale", None),
    (".al-title .l2", "anton", "ANGLE", 35, 84, 175, 63.3, "scale", None),
    (".al-title .l3", "anton", "MATTERS", 35, 154.3, 227.7, 59.7, "scale", None),
    (".al-lead", "plex", "KEEPS YOU IN CONTROL.|WHEEL ALIGNMENT", 37.3, 228.3, 186.7, 8.4, "track", 16.7),
    (".al-list", "plex", "BETTER HANDLING|LONGER TYRE LIFE|SAFER STOPPING|A SMOOTHER DRIVE", 51.7, 274.3, 114, 7.3, "track", 15.8),
    (".al-side", "plex", "PRECISION|EQUIPMENT|EXPERIENCED|TECHNICIANS|REAL RESULTS", 665, 55, 51, 6.5, "track", 14.5),
    # services (board y - 1008)
    (".sv-eyebrow", "plex", "OUR SERVICES", 39, 25, 76, 6, "track", None),
    (".sv-title .l1", "anton", "KEEPING", 38, 60, 134, 49, "scale", None),
    (".sv-title .l2", "anton", "YOU ON", 36, 116, 136, 49, "scale", None),
    (".sv-title .l3", "anton", "TRACK", 38, 172, 133, 49.5, "scale", None),
    (".sv-note", "plex", "PROFESSIONAL ADVICE|QUALITY SERVICE|LOCALLY OWNED", 39, 246, 122, 7, "track", 12.5),
    # local (board y - 1305)
    (".lo-word", "anton", "LOCAL", 32.5, 12.5, 367.5, 170, "scale", None),
    (".lo-copy", "barlow7", "FOR EVERYDAY|DRIVES. AND|THE CARS|YOU LOVE.", 34, 196.5, 113.5, 11, "track", 17),
    # contact (board y - 1653)
    (".co-title .l1", "anton", "GET YOUR", 41.7, 28.7, 185, 39, "scale", None),
    (".co-title .l2", "anton", "NEXT DRIVE", 41.7, 75.3, 216.7, 41, "scale", None),
    (".co-title .l3", "anton", "SORTED", 41.7, 124.3, 145, 41, "scale", None),
    (".co-call .txt", "barlow7", "CALL (07) 4775 6161", 81, 190.3, 200.7, 18.3, "track", None),
    (".co-addr .txt", "barlow6", "2/34 PILKINGTON STREET, GARBUTT", 81, 233.7, 245.7, 14, "track", None),
    (".nav-foot a:nth-child(1)", "barlow6", "SERVICES", 318.5, 374.5, 46.5, 8.5, "track", None),
    (".nav-foot a:nth-child(2)", "barlow6", "OUR WORKSHOP", 398.5, 374.5, 78, 8.5, "track", None),
    (".nav-foot a:nth-child(3)", "barlow6", "CONTACT", 511, 374.5, 43, 8.5, "track", None),
]

# service cells: titles centred on the icon axis, descriptions left-aligned
CELLS = [
    # selector, cell rect (x, y, w, h), icon rect, centre x, title cap-top y, desc x, desc cap-top y
    # (section-local board px; emitted relative to the cell, which is the button)
    (".svc-1", (231, 29, 157, 118), (255, 33, 70, 28), 290.5, 76.2, 246, 114.5),
    (".svc-2", (388, 29, 172, 118), (451, 28, 44, 40), 474, 76.2, 429.5, 114.5),
    (".svc-3", (231, 147, 157, 143), (270, 167, 38, 45), 289.5, 222.2, 246, 260.7),
    (".svc-4", (388, 147, 192, 143), (458, 160, 25, 53), 473.5, 222.2, 429.5, 260.5),
]
SVC_TITLE = dict(font="barlow7", cap=10.6, pitch=15.4, track=None)   # track fitted below
SVC_DESC = dict(font="plex", cap=6.6, pitch=11.6, width=("STRAIGHTER DRIVES.", 105))


def r(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


def u(v):
    return f"calc({r(v)} * var(--u))"


def fsz(v):
    """Small notes never drop below 11 px (the unit is 1.0 at a 1024 px window)."""
    return f"max(11px, {u(v)})" if v < 12 else u(v)


def fit(font, text, x, y, w, cap, mode, pitch):
    lines = text.split("|")
    widest = lines[0]
    fs = cap / M[font]["cap"]
    lh = (pitch / fs) if pitch else M[font]["cap"]
    ls, sx = 0.0, 1.0
    lsb, w0 = ink(font, widest)
    if mode == "track":
        n = len(widest) - 1
        ls = (w / fs - w0) / n
        lsb, _ = ink(font, widest, ls)
    else:
        sx = w / (w0 * fs)
    left = x - lsb * fs * sx
    top = y - cap_top(font, lh) * fs
    return dict(fs=fs, lh=lh, ls=ls, sx=sx, left=left, top=top)


out = ["/* generated by scripts/fit-type.py: do not edit by hand */", "@media (min-width: 1024px) {"]
for sel, font, text, x, y, w, cap, mode, pitch in SPECS:
    f = fit(font, text, x, y, w, cap, mode, pitch)
    decl = [f"left: {u(f['left'])}", f"top: {u(f['top'])}", f"font-size: {fsz(f['fs'])}",
            f"line-height: {r(f['lh'])}", f"letter-spacing: {f['ls']:.4f}em"]
    if mode == "scale":
        decl.append(f"--sx: {f['sx']:.4f}")
    out.append(f"  {sel} {{ {'; '.join(decl)}; }}")
    print(f"{sel:28s} fs={f['fs']:.1f} ls={f['ls']:+.3f}em sx={f['sx']:.3f}")

# service titles: one tracking value fitted on the four longest words
fs_t = SVC_TITLE["cap"] / M["barlow7"]["cap"]
tracks = []
for word, w in [("ALIGNMENT", 86), ("BALANCING", 85), ("SUSPENSION", 86), ("REPAIRS", 58), ("WHEEL", 48), ("BRAKE", 44)]:
    _, w0 = ink("barlow7", word)
    tracks.append((w / fs_t - w0) / (len(word) - 1))
ls_t = sum(tracks) / len(tracks)
lh_t = SVC_TITLE["pitch"] / fs_t
fs_d = SVC_DESC["cap"] / M["plex"]["cap"]
word, wd = SVC_DESC["width"]
_, w0 = ink("plex", word)
ls_d = (wd / fs_d - w0) / (len(word) - 1)
lh_d = SVC_DESC["pitch"] / fs_d
lsb_d, _ = ink("plex", "S", ls_d)
print(f"svc title fs={fs_t:.1f} ls={ls_t:.3f}em | desc fs={fs_d:.1f} ls={ls_d:.3f}em")
out.append(f"  .svc h3 {{ font-size: {u(fs_t)}; line-height: {r(lh_t)}; letter-spacing: {ls_t:.4f}em; }}")
out.append(f"  .svc p {{ font-size: {fsz(fs_d)}; line-height: {r(lh_d)}; letter-spacing: {ls_d:.4f}em; }}")
for sel, (x0, y0, w, h), (ix, iy, iw, ih), cx, ty, dx, dy in CELLS:
    t_top = ty - cap_top("barlow7", lh_t) * fs_t
    d_top = dy - cap_top("plex", lh_d) * fs_d
    out.append(f"  {sel} button {{ left: {u(x0)}; top: {u(y0)}; width: {u(w)}; height: {u(h)}; }}")
    out.append(f"  {sel} .ico {{ left: {u(ix - x0)}; top: {u(iy - y0)}; width: {u(iw)}; height: {u(ih)}; }}")
    # titles: centred box of fixed width around cx (trailing tracking compensated with padding-left)
    out.append(f"  {sel} h3 {{ left: {u(cx - 60 - x0)}; width: {u(120)}; top: {u(t_top - y0)}; padding-left: {ls_t:.4f}em; }}")
    out.append(f"  {sel} p {{ left: {u(dx - lsb_d * fs_d - x0)}; top: {u(d_top - y0)}; }}")
out.append("}")
(ROOT / "src/styles/board-fit.css").parent.mkdir(parents=True, exist_ok=True)
(ROOT / "src/styles/board-fit.css").write_text("\n".join(out) + "\n")
print("wrote src/styles/board-fit.css")
