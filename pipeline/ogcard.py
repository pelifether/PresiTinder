"""Render the Open Graph social card (1200x630) in the site's own visual language.

Fonts are the same Archivo family the site loads from Google Fonts, so the card
looks like a screenshot of the product rather than a separate asset.

    python pipeline/ogcard.py
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FONTS = Path("/tmp/ogfonts")
OUT = ROOT / "public" / "og.png"

W, H = 1200, 630
PAPER = (246, 241, 231)
PAPER_2 = (255, 253, 246)
INK = (25, 21, 18)
MUTED = (117, 105, 92)
ACCENT = (14, 122, 78)
YELLOW = (255, 210, 63)
DANGER = (214, 53, 44)


def black(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONTS / "ArchivoBlack-Regular.ttf"), size)


def sans(size: int, weight: int = 600) -> ImageFont.FreeTypeFont:
    f = ImageFont.truetype(str(FONTS / "Archivo.ttf"), size)
    try:
        f.set_variation_by_axes([100.0, float(weight)])
    except Exception:
        pass
    return f


def shadowed_box(d, box, radius, fill, outline=INK, width=3, offset=6):
    x0, y0, x1, y1 = box
    d.rounded_rectangle(
        (x0 + offset, y0 + offset, x1 + offset, y1 + offset), radius, fill=INK
    )
    d.rounded_rectangle(box, radius, fill=fill, outline=outline, width=width)


def stamp(text, font, color, angle):
    """A rotated outlined stamp, drawn on its own layer so it can be rotated."""
    pad_x, pad_y = 22, 10
    tmp = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    l, t, r, b = tmp.textbbox((0, 0), text, font=font)
    w, h = r - l + pad_x * 2, b - t + pad_y * 2
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    dl = ImageDraw.Draw(layer)
    dl.rounded_rectangle((0, 0, w - 1, h - 1), 14, outline=color, width=6)
    dl.text((pad_x - l, pad_y - t), text, font=font, fill=color)
    return layer.rotate(angle, expand=True, resample=Image.BICUBIC)


def main() -> None:
    img = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(img)

    # dot grid, same 18px rhythm as the site background
    for y in range(0, H, 18):
        for x in range(0, W, 18):
            d.ellipse((x, y, x + 1.6, y + 1.6), fill=(228, 221, 208))

    # ---------- left column ----------
    LX = 74

    # logo badge
    f_logo = black(46)
    presi, tinder = "Presi", "Tinder"
    w_presi = d.textlength(presi, font=f_logo)
    w_tinder = d.textlength(tinder, font=f_logo)
    badge = (LX, 64, LX + w_presi + w_tinder + 44, 64 + 74)
    shadowed_box(d, badge, 13, INK, outline=INK, width=0, offset=5)
    d.text((LX + 22, 64 + 14), presi, font=f_logo, fill=PAPER_2)
    d.text((LX + 22 + w_presi, 64 + 14), tinder, font=f_logo, fill=YELLOW)

    f_year = black(22)
    yx0 = badge[2] + 14
    ybox = (yx0, 82, yx0 + d.textlength("2026", font=f_year) + 30, 82 + 40)
    shadowed_box(d, ybox, 9, ACCENT, outline=INK, width=0, offset=4)
    d.text((yx0 + 15, 82 + 8), "2026", font=f_year, fill=(255, 255, 255))

    # headline
    f_head = black(64)
    lines = ["Qual plano de", "governo é seu", "“match”?"]
    y = 232
    for i, line in enumerate(lines):
        if i == len(lines) - 1:
            # highlight the payoff word
            d.rounded_rectangle(
                (LX - 8, y - 4, LX + d.textlength(line, font=f_head) + 6, y + 74),
                10,
                fill=YELLOW,
            )
        d.text((LX, y), line, font=f_head, fill=INK)
        y += 80

    f_foot = sans(21, 500)
    d.text(
        (LX, 544),
        "os 12 planos do TSE, lidos palavra por palavra",
        font=f_foot,
        fill=MUTED,
    )

    # ---------- right column: a card mid-swipe ----------
    card_layer = Image.new("RGBA", (470, 560), (0, 0, 0, 0))
    dc = ImageDraw.Draw(card_layer)
    cw, ch = 400, 470
    dc.rounded_rectangle((8 + 7, 8 + 7, 8 + cw + 7, 8 + ch + 7), 26, fill=INK)
    dc.rounded_rectangle(
        (8, 8, 8 + cw, 8 + ch), 26, fill=PAPER_2, outline=INK, width=4
    )

    # theme chip
    f_chip = sans(19, 700)
    chip_text = "SEGURANÇA"
    cwid = dc.textlength(chip_text, font=f_chip)
    dc.rounded_rectangle((40, 44, 40 + cwid + 34, 44 + 40), 999, fill=YELLOW, outline=INK, width=3)
    dc.text((40 + 17, 44 + 8), chip_text, font=f_chip, fill=INK)

    f_q = black(38)
    for i, line in enumerate(["Reduzir a", "maioridade", "penal para", "16 anos."]):
        dc.text((40, 168 + i * 48), line, font=f_q, fill=INK)

    f_hint = sans(17, 700)
    dc.text((40, 8 + ch - 52), "← NÃO", font=f_hint, fill=MUTED)
    dc.text((8 + cw - 40 - dc.textlength("SIM →", font=f_hint), 8 + ch - 52), "SIM →", font=f_hint, fill=MUTED)

    sim = stamp("SIM", black(40), ACCENT, 14)
    card_layer.alpha_composite(sim, (8 + cw - sim.width - 26, 96))

    card = card_layer.rotate(-7, expand=True, resample=Image.BICUBIC)
    img.paste(card, (700, 34), card)

    # the two action buttons, echoing the live UI
    for cx, color, kind in ((846, DANGER, "x"), (1028, ACCENT, "heart")):
        cy = 552
        r = 40
        d.ellipse((cx - r + 5, cy - r + 5, cx + r + 5, cy + r + 5), fill=INK)
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=PAPER_2, outline=INK, width=3)
        if kind == "x":
            for dx1, dy1, dx2, dy2 in ((-14, -14, 14, 14), (14, -14, -14, 14)):
                d.line((cx + dx1, cy + dy1, cx + dx2, cy + dy2), fill=color, width=7)
        else:
            d.ellipse((cx - 16, cy - 15, cx - 1, cy), fill=color)
            d.ellipse((cx + 1, cy - 15, cx + 16, cy), fill=color)
            d.polygon(
                ((cx - 16, cy - 5), (cx + 16, cy - 5), (cx, cy + 18)), fill=color
            )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT, optimize=True)
    print(f"wrote {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
