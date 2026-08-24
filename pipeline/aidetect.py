"""Stylometric estimate of how AI-assisted each plan's text is.

This is NOT Pangram or any trained detector — those are closed models. It is
an honest proxy built from features the detection literature broadly agrees
on, computed transparently so anyone can rerun and dispute it:

  1. Density of pt-BR LLM cliché phrases ("além disso", "vale ressaltar",
     "não apenas ... mas também"). Caveat: government prose used some of
     these before LLMs existed; the list is tuned for phrases whose *density*
     exploded with LLM text, but the overlap is real.
  2. Sentence-length burstiness (coefficient of variation). Model text runs
     eerily uniform; human manifestos mix slogans with page-long sentences.
  3. Em/en-dash density, a well-documented LLM tell.
  4. Share of sentences opened by a stock connective.
  5. Lexical diversity over fixed 1000-word windows (length-normalised).

Each feature maps to 0..1 through fixed anchors chosen before looking at the
per-candidate results, then a weighted sum gives 0-100. Treat it as an
estimate with error bars, not a verdict.

    .venv/bin/python pipeline/aidetect.py
"""

import json
import re
import statistics
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "text"
OUT = ROOT / "src" / "data" / "aiscore.json"

CLICHES = [
    r"além disso",
    r"ademais",
    r"nesse sentido",
    r"neste sentido",
    r"nesse contexto",
    r"neste contexto",
    r"dessa forma",
    r"desta forma",
    r"vale ressaltar",
    r"vale destacar",
    r"é importante ressaltar",
    r"é importante destacar",
    r"cabe destacar",
    r"cabe ressaltar",
    r"é fundamental",
    r"é essencial",
    r"é crucial",
    r"desempenham? um papel",
    r"papel fundamental",
    r"papel crucial",
    r"papel central",
    r"não apenas",
    r"mas também",
    r"de forma efica[zs]",
    r"de forma eficiente",
    r"de maneira efica[zs]",
    r"de maneira eficiente",
    r"de forma integrada",
    r"de forma transversal",
    r"abordagem integrada",
    r"abordagem holística",
    r"soluções inovadoras",
    r"no cenário atual",
    r"no contexto atual",
]

STARTERS = re.compile(
    r"^(além disso|ademais|nesse sentido|neste sentido|nesse contexto|dessa"
    r" forma|desta forma|por fim|vale (ressaltar|destacar)|é fundamental|é"
    r" essencial|é crucial|cabe (destacar|ressaltar))\b",
    re.IGNORECASE,
)

WORD = re.compile(r"[a-záàâãéêíóôõúüç]+", re.IGNORECASE)


def sentences(text: str) -> list[str]:
    flat = re.sub(r"\s+", " ", text)
    parts = re.split(r"(?<=[.!?])\s+", flat)
    return [p for p in parts if 4 <= len(WORD.findall(p)) <= 120]


def anchored(value: float, zero_at: float, one_at: float) -> float:
    """Linear map with clamping; works for inverted anchors too."""
    t = (value - zero_at) / (one_at - zero_at)
    return max(0.0, min(1.0, t))


def analyze(text: str) -> dict:
    words = WORD.findall(text.lower())
    n = len(words)
    per_1k = 1000.0 / max(n, 1)

    cliches = sum(len(re.findall(c, text, re.IGNORECASE)) for c in CLICHES)
    sents = sentences(text)
    lens = [len(WORD.findall(s)) for s in sents]
    burst = statistics.pstdev(lens) / statistics.mean(lens) if len(lens) > 5 else 0.7
    dashes = len(re.findall(r"—|\s–\s", text))
    starters = sum(1 for s in sents if STARTERS.match(s.strip()))
    starter_share = starters / max(len(sents), 1)

    windows = [w for w in (words[i : i + 1000] for i in range(0, max(n - 999, 1), 1000)) if len(w) >= 500]
    if not windows:
        windows = [words]
    ttr = statistics.mean(len(set(w)) / len(w) for w in windows)

    f = {
        "cliche": anchored(cliches * per_1k, zero_at=0.5, one_at=4.0),
        "burst": anchored(burst, zero_at=0.85, one_at=0.40),
        "dash": anchored(dashes * per_1k, zero_at=0.5, one_at=6.0),
        "starter": anchored(starter_share, zero_at=0.01, one_at=0.08),
        "ttr": anchored(ttr, zero_at=0.52, one_at=0.38),
    }
    weights = {"cliche": 0.35, "burst": 0.25, "dash": 0.15, "starter": 0.15, "ttr": 0.10}
    score = round(100 * sum(f[k] * weights[k] for k in f))
    return {
        "score": score,
        "raw": {
            "cliches_per_1k": round(cliches * per_1k, 2),
            "burstiness": round(burst, 3),
            "dashes_per_1k": round(dashes * per_1k, 2),
            "starter_share": round(starter_share, 4),
            "ttr_1k": round(ttr, 3),
            "words": n,
        },
        "norm": {k: round(v, 3) for k, v in f.items()},
    }


def main() -> None:
    out = {}
    for path in sorted(SRC.glob("*.txt")):
        res = analyze(path.read_text(encoding="utf-8", errors="ignore"))
        out[path.stem] = res
        print(
            f"{path.stem:20s} {res['score']:3d}  "
            f"cliche={res['raw']['cliches_per_1k']:5.2f}/1k "
            f"burst={res['raw']['burstiness']:.2f} "
            f"dash={res['raw']['dashes_per_1k']:5.2f}/1k "
            f"starters={res['raw']['starter_share']:.1%} "
            f"ttr={res['raw']['ttr_1k']:.2f}"
        )
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n")
    print(f"\nwrote {OUT}")


if __name__ == "__main__":
    main()
