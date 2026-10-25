#!/usr/bin/env python3
"""Compose README assets in .github/assets/ from scripts/out/readme/ captures."""
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
IN = ROOT / "scripts/out/readme"
OUT = ROOT / ".github/assets"
OUT.mkdir(parents=True, exist_ok=True)
INK, YEL = (11, 11, 11), (242, 195, 41)
MONO = ImageFont.truetype(str(ROOT / "animation/IBMPlexMono-Regular.ttf"), 22)

# banner
Image.open(IN / "banner.png").convert("RGB").save(OUT / "banner.png", optimize=True)

# hero GIF: hold first and last frames
frames = sorted((IN / "gif").glob("f_*.png"))
seq = [frames[0]] * 4 + frames[::2] + [frames[-1]] * 10
tmp = IN / "gifseq"
tmp.mkdir(exist_ok=True)
for old in tmp.glob("s_*.png"):
    old.unlink()
for i, f in enumerate(seq):
    dst = tmp / f"s_{i:04d}.png"
    if dst.exists() or dst.is_symlink():
        dst.unlink()
    dst.symlink_to(f.resolve())
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", "8", "-i", str(tmp / "s_%04d.png"),
                "-vf", "fps=8,scale=800:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle",
                "-loop", "0", str(OUT / "hero-scroll.gif")], check=True)


def browser(img, w=1200):
    img = img.convert("RGB").resize((w, round(img.height * w / img.width)), Image.LANCZOS)
    bar = 40
    frame = Image.new("RGB", (w, img.height + bar), (28, 28, 28))
    d = ImageDraw.Draw(frame)
    for i, c in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
        d.ellipse([16 + i * 22, 14, 28 + i * 22, 26], fill=c)
    d.rounded_rectangle([110, 9, w - 110, 31], 11, fill=(44, 44, 44))
    d.text((w // 2, 20), "townsville-brake-wheel.vercel.app", fill=(170, 170, 165), font=ImageFont.truetype(str(ROOT / "animation/IBMPlexMono-Regular.ttf"), 13), anchor="mm")
    frame.paste(img, (0, bar))
    return frame


def shadowed(canvas, img, xy, r=18):
    sh = Image.new("RGBA", (img.width + 80, img.height + 80), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle([40, 48, 40 + img.width, 48 + img.height], r, fill=(0, 0, 0, 150))
    sh = sh.filter(ImageFilter.GaussianBlur(18))
    canvas.alpha_composite(sh, (xy[0] - 40, xy[1] - 40))
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, img.width, img.height], r, fill=255)
    canvas.paste(img, xy, mask)


# desktop sections: 2 x 2 browser frames
shots = [browser(Image.open(IN / f"d-{n}.png")) for n in ["alignment", "services", "local", "contact"]]
W, H = shots[0].size
pad = 56
sheet = Image.new("RGBA", (W * 2 + pad * 3, H * 2 + pad * 3), INK + (255,))
for i, s in enumerate(shots):
    shadowed(sheet, s, (pad + (i % 2) * (W + pad), pad + (i // 2) * (H + pad)), 12)
d = ImageDraw.Draw(sheet)
d.rectangle([0, sheet.height - 8, sheet.width, sheet.height], fill=YEL)
sheet.convert("RGB").resize((sheet.width // 2 * 2 // 2, sheet.height // 2)).save(OUT / "desktop-sections.jpg", quality=86, optimize=True)


# phones
def phone(img, w=360):
    img = img.convert("RGB").resize((w, round(img.height * w / img.width)), Image.LANCZOS)
    status = Image.new("RGB", (w, img.height + 38), (11, 11, 11))   # status bar above the page
    status.paste(img, (0, 38))
    img = status
    b = 12
    body = Image.new("RGBA", (w + b * 2, img.height + b * 2), (0, 0, 0, 0))
    ImageDraw.Draw(body).rounded_rectangle([0, 0, body.width - 1, body.height - 1], 46, fill=(30, 30, 30, 255), outline=(70, 70, 70, 255), width=2)
    m = Image.new("L", img.size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, img.width, img.height], 36, fill=255)
    body.paste(img, (b, b), m)
    ImageDraw.Draw(body).rounded_rectangle([w // 2 - 50, b + 7, w // 2 + 74, b + 31], 12, fill=(0, 0, 0, 255))
    return body


ph = [phone(Image.open(IN / f"m-{n}.png")) for n in ["hero", "alignment", "services", "contact"]]
pw, phh = ph[0].size
gap = 48
sheet = Image.new("RGBA", (pw * 4 + gap * 5, phh + gap * 2), INK + (255,))
for i, p in enumerate(ph):
    sheet.alpha_composite(p, (gap + i * (pw + gap), gap))
ImageDraw.Draw(sheet).rectangle([0, sheet.height - 8, sheet.width, sheet.height], fill=YEL)
sheet.convert("RGB").save(OUT / "mobile-screens.jpg", quality=86, optimize=True)

for f in sorted(OUT.iterdir()):
    print(f.name, f.stat().st_size // 1024, "KB", Image.open(f).size)
