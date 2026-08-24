"""Apply a comic-book effect to TSE ballot photos: smooth, posterize, ink outlines."""
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "photos-raw"
OUT = ROOT / "public" / "candidatos"
OUT.mkdir(parents=True, exist_ok=True)

TARGET_W = 480


def cartoonify(path: Path) -> Image.Image:
    img = Image.open(path).convert("RGB")
    scale = TARGET_W / img.width
    img = img.resize((TARGET_W, int(img.height * scale)), Image.LANCZOS)

    # Flat color regions: repeated median filtering approximates bilateral smoothing
    smooth = img
    for _ in range(3):
        smooth = smooth.filter(ImageFilter.MedianFilter(7))

    smooth = ImageEnhance.Color(smooth).enhance(1.45)
    smooth = ImageEnhance.Contrast(smooth).enhance(1.12)
    poster = ImageOps.posterize(smooth, 3)
    # Soften posterization banding just a touch
    poster = poster.filter(ImageFilter.GaussianBlur(0.6))

    # Ink outlines: difference of Gaussians gives smoother, more continuous
    # lines than FIND_EDGES on low-res source photos
    gray = smooth.convert("L")
    g1 = np.asarray(gray.filter(ImageFilter.GaussianBlur(1)), dtype=np.float32)
    g2 = np.asarray(gray.filter(ImageFilter.GaussianBlur(3.5)), dtype=np.float32)
    dog = np.abs(g1 - g2)
    mask = (dog > 9.5).astype(np.uint8) * 255
    # Despeckle isolated dots; keep strokes light so faces stay readable
    m_img = Image.fromarray(mask).filter(ImageFilter.MedianFilter(3))
    m = np.asarray(m_img, dtype=np.float32) / 255.0

    base = np.asarray(poster, dtype=np.float32)
    ink = base * (1.0 - m[..., None] * 0.6)
    return Image.fromarray(ink.astype(np.uint8))


for p in sorted(SRC.glob("*.jpg")):
    out = OUT / f"{p.stem}.jpg"
    cartoonify(p).save(out, quality=88)
    print("ok", out.name)
