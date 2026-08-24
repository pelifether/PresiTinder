"""Cartoonify TSE ballot photos with AnimeGAN2 (bryandlee/animegan2-pytorch).

Replaces the hand-rolled PIL difference-of-Gaussians filter, whose ink lines
came out speckly. AnimeGAN2's `face_paint_512_v2` weights are a widely used,
battle-tested portrait stylizer; the model and weights are pulled from torch
hub on first run.

    .venv/bin/python pipeline/cartoonify2.py [--out DIR]
"""

import argparse
import sys
from pathlib import Path

import torch
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "photos-raw"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(ROOT / "public" / "candidatos"))
    ap.add_argument("--only", nargs="*", help="slugs to process (default: all)")
    args = ap.parse_args()
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    torch.hub.set_dir(str(ROOT / ".venv" / "torchhub"))
    model = torch.hub.load(
        "bryandlee/animegan2-pytorch:main",
        "generator",
        pretrained="face_paint_512_v2",
        device="cpu",
    )
    face2paint = torch.hub.load(
        "bryandlee/animegan2-pytorch:main", "face2paint", device="cpu", size=512
    )

    photos = sorted(SRC.glob("*.jpg"))
    if args.only:
        photos = [p for p in photos if p.stem in args.only]
    if not photos:
        sys.exit("no source photos found")

    for p in photos:
        img = Image.open(p).convert("RGB")
        styled = face2paint(model, img)
        # back to the original ballot-photo aspect ratio
        styled = styled.resize(img.size, Image.LANCZOS)
        dst = out_dir / p.name
        styled.save(dst, quality=90)
        print(f"{p.stem}: {img.size} -> {dst}")


if __name__ == "__main__":
    main()
