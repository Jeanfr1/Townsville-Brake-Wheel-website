#!/usr/bin/env python3
"""Car + cover cut-outs for the hero depth effect (CONTROL sits behind the car).

Runs the ISNet general-use segmentation model (the one rembg ships,
~/.u2net/isnet-general-use.onnx) on each registered hero plate and writes
assets-src/hero-<state>-fg.png (plate pixels + matte alpha).

Needs onnxruntime (kept out of the base Python; run with an isolated venv):
  <venv>/bin/python scripts/make-mattes.py
"""
import json
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets-src"
MODEL = Path.home() / ".u2net/isnet-general-use.onnx"
STATES = ["mid", "lifted", "revealed"]
SIZE = 1024

sess = ort.InferenceSession(str(MODEL), providers=["CPUExecutionProvider"])
name = sess.get_inputs()[0].name

FRAME = json.loads((ROOT / "scripts/out/hero-frame.json").read_text())


def predict(img):
    """ISNet matte (0..1 float) at the image's own size."""
    x = np.asarray(img.resize((SIZE, SIZE), Image.LANCZOS)).astype(np.float32) / 255.0
    x = ((x - 0.5) / 1.0).transpose(2, 0, 1)[None]
    pred = sess.run(None, {name: x})[0][0, 0]
    pred = (pred - pred.min()) / (pred.max() - pred.min() + 1e-8)
    return np.asarray(Image.fromarray((pred * 255).astype(np.uint8)).resize(img.size, Image.BICUBIC)).astype(np.float32) / 255


for state in STATES:
    plate = Image.open(SRC / f"hero-{state}.png").convert("RGB")
    # whole plate, plus the board frame alone (in the tighter crop ISNet keeps the cover)
    m = predict(plate)
    k, ext = FRAME["K"], FRAME["ext"]
    x0, x1 = round(ext * k), round((ext + FRAME["board"][0]) * k)
    m[:, x0:x1] = np.maximum(m[:, x0:x1], predict(plate.crop((x0, 0, x1, plate.height))))
    # tighten soft fringes a little so sky does not halo over the letters
    m = np.clip((m - 0.15) / 0.7, 0, 1)
    matte = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
    fg = plate.copy()
    fg.putalpha(matte)
    fg.save(SRC / f"hero-{state}-fg.png")
    matte.save(ROOT / "scripts/out" / f"matte-{state}.png")
    print("ok", state, plate.size)
