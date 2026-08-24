"""Compute word frequencies and TF-IDF distinctive terms for each government plan."""
import json
import math
import re
import unicodedata
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TEXT_DIR = ROOT / "data" / "text"
OUT = ROOT / "src" / "data" / "wordfreq.json"

# General pt-BR stopwords + domain boilerplate that appears in every plan
# and carries no discriminating signal.
STOPWORDS = set("""
a à às ao aos as até com como da das de dela dele deles do dos e é em entre era
essa essas esse esses esta estas este estes eu foi for foram há isso isto já lhe
mais mas me mesmo meu minha muito na não nas nem no nos nós o os ou para pela
pelas pelo pelos por qual quando que quem se sem ser seu seus sua suas são só
também te tem têm ter teu tu tua um uma umas uns vai vamos vocês você às vez
ainda além ante apenas aqui assim cada casos onde outro outra outros outras
pode podem possa sobre sob tal tais tanto toda todas todo todos deve devem
devem deverá serão será sendo sido estão está estar bem tais qualquer partir
forma formas maior menor grande grandes anos ano dia dias etc num numa nesse
nessa neste nesta desses dessas desse dessa deste desta àquele àquela contra
depois antes durante enquanto porque porém contudo entretanto seja sejam
foram fosse fossem éramos eram ele ela eles elas nosso nossa nossos nossas
lo la los las nos vos meio través vez vezes fim modo modos tipo tipos
""".split())

DOMAIN_STOP = set("""
brasil brasileiro brasileira brasileiros brasileiras país pais nacional
nacionais governo governos plano planos programa programas proposta propostas
política políticas político políticos público pública públicos públicas
federal presidente presidência república estado estados milhões bilhões
capítulo capítulos livro livros eixo eixos seção seções página páginas
item itens tópico tópicos
""".split())

# Candidate self-references and party names: showing a candidate's own name as
# their "top word" is noise, not signal.
SELF_STOP = {
    "clariana-barao": {"clariana", "barão", "barao", "democracia", "cristã"},
    "edmilson-costa": {"edmilson", "costa", "pcb", "comunista"},
    "augusto-cury": {"augusto", "cury", "avante"},
    "flavio-bolsonaro": {"flávio", "flavio", "bolsonaro"},
    "hertz-dias": {"hertz", "dias", "pstu"},
    "lula": {"lula", "luiz", "inácio"},
    "renan-santos": {"renan", "santos"},
    "ronaldo-caiado": {"ronaldo", "caiado", "kassab", "psd"},
    "rui-costa-pimenta": {"rui", "pimenta", "pco", "operária"},
    "samara": {"samara", "unidade", "popular"},
    "wilson-grassi": {"wilson", "grassi", "democrata", "partido"},
    "zema": {"romeu", "zema", "novo"},
}

WORD_RE = re.compile(r"[a-záàâãéêíóôõúüç]{3,}", re.IGNORECASE)


def clean_pdf_text(text: str) -> str:
    """De-hyphenate line breaks and drop running headers/footers
    (identical lines repeated across many pages)."""
    text = re.sub(r"(\w)-\n(\w)", r"\1\2", text)
    lines = text.split("\n")
    freq = Counter(l.strip() for l in lines if len(l.strip()) > 3)
    kept = [l for l in lines if freq[l.strip()] <= 8]
    return "\n".join(kept)


def tokens(text: str) -> list[str]:
    return [w.lower() for w in WORD_RE.findall(text)]


def content_words(toks: list[str]) -> list[str]:
    return [t for t in toks if t not in STOPWORDS]


def main():
    docs = {}
    for f in sorted(TEXT_DIR.glob("*.txt")):
        toks = content_words(tokens(clean_pdf_text(f.read_text(encoding="utf-8"))))
        docs[f.stem] = toks

    n_docs = len(docs)
    # document frequency over unigrams and bigrams
    df: Counter = Counter()
    grams_per_doc = {}
    for slug, toks in docs.items():
        bigrams = [f"{a} {b}" for a, b in zip(toks, toks[1:])]
        grams = Counter(toks) + Counter(bigrams)
        grams_per_doc[slug] = grams
        df.update(grams.keys())

    out = {}
    for slug, toks in docs.items():
        skip = DOMAIN_STOP | SELF_STOP.get(slug, set())
        counts = Counter(t for t in toks if t not in skip)
        top = [{"w": w, "n": n} for w, n in counts.most_common(20)]

        grams = grams_per_doc[slug]
        total = sum(grams.values())
        scored = []
        for g, n in grams.items():
            if n < 4 or g in skip or any(p in skip for p in g.split()):
                continue
            # skip bigrams whose parts are stopwords-ish boilerplate
            tf = n / total
            idf = math.log(n_docs / df[g])
            if idf <= 0:
                continue
            scored.append((tf * idf, g, n))
        scored.sort(reverse=True)
        distinctive = [{"w": g, "n": n} for _, g, n in scored[:12]]

        out[slug] = {
            "totalWords": len(toks),
            "top": top,
            "distinctive": distinctive,
        }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"wrote {OUT}")
    for slug, d in out.items():
        print(slug, d["totalWords"], "|", ", ".join(x["w"] for x in d["top"][:8]))


if __name__ == "__main__":
    main()
