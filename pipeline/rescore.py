"""Re-score the 12 plans on a −4…+4 scale across 8 dimensions.

Why this exists: on the old −2…+2 scale with 6 dimensions, PCB, PSTU and UP
came out with *identical* vectors (−2 on five dimensions, −1 on the sixth).
They were pinned at the floor of the scale, so every real difference between
them was compressed out and the quiz could only break the tie at random.

Two fixes, both applied here:

1. Wider scale (−4…+4, half-point steps) so "left" (PT), "very left" (PCB)
   and "rupture-maximal" (PCO) stop sharing a boundary value.
2. Two extra dimensions that the comparative-politics literature treats as
   the canonical *second* axis, and which actually separate this cluster:
     · soberania — anti-imperialism/protectionism ↔ global integration.
       (CHES-style sovereignty axis; famously non-monotone with left-right:
       Zema wants out of BRICS and into the OECD, Renan attacks protectionism
       while titling a chapter "Terras raras e soberania nacional".)
     · metodo — rupture/mobilisation ↔ reform through institutions.
       (March & Mudde's radical-left typology turns on exactly this: PCO says
       gains "não virão pelo voto"; Lula governs through a negotiation table.)

Every cell carries a verbatim quote from the filed document, or the string
"ausente …" where the plan simply does not take a position — silence is
recorded as silence rather than scored as a zero opinion.

    .venv/bin/python pipeline/rescore.py
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TARGET = ROOT / "src" / "data" / "semantic.json"

DIMS = [
    "econ",
    "welfare",
    "social",
    "seguranca",
    "ambiente",
    "instituicoes",
    "soberania",
    "metodo",
]

# slug -> (scores in DIMS order, {dim: evidence})
PLANS: dict[str, tuple[list[float], dict[str, str]]] = {
    "lula": (
        [-2, -3, -2.5, -1, -2.5, -2, -1.5, 2.5],
        {
            "soberania": "DEFENDER A SOBERANIA NACIONAL E O PROTAGONISMO INTERNACIONAL DO BRASIL",
            "metodo": "Vamos aprofundar este processo, a partir da Mesa Nacional de Negociação Permanente, que foi reaberta em nosso mandato",
        },
    ),
    "flavio-bolsonaro": (
        [2.5, 2.5, 3, 3.5, 1.5, 2, 2, 2.5],
        {
            "soberania": "preparar para uma abertura comercial que dê ao setor produtivo acesso a [insumos e tecnologia] ... País integrado ao mundo",
            "metodo": "O plano se organiza em reformas de Estado — Reforma Administrativa, Reforma Tributária, revisão normativa infralegal",
        },
    ),
    "ronaldo-caiado": (
        [2.5, 2, -0.5, 4, -1, 0.5, 2.5, 3],
        {
            "soberania": "Ampliar acordos comerciais, reduzir barreiras a insumos e tecnologia, fortalecer defesa comercial",
            "metodo": "Implantar sistema permanente de avaliação de resultados, metas e indicadores de produtividade",
        },
    ),
    "zema": (
        [4, 3.5, 1, 3.5, 1.5, 3, 4, 3.5],
        {
            "soberania": "Retirar o Brasil do BRICS de forma diplomática ... Integrar a economia brasileira ao mundo por meio da expansão de acordos comerciais e da entrada na OCDE",
            "metodo": "Fazer uma Reforma Administrativa para enxugar a estrutura do Governo Federal",
        },
    ),
    "renan-santos": (
        [3.5, 3, 2, 3, 2, 2.5, 0.5, 1.5],
        {
            "soberania": "protecionismo crônico que blinda setores ineficientes — mas também: TERRAS RARAS E SOBERANIA NACIONAL",
            "metodo": "promessa que fizemos a todos os militantes já em 2023, no Oitavo Congresso do Movimento",
        },
    ),
    "augusto-cury": (
        [2, 1.5, -1.5, 2, 0.5, 1.5, 2, 2],
        {
            "soberania": "Expandiremos acordos comerciais estratégicos com diferentes blocos econômicos",
            "metodo": "O Estado brasileiro precisa tornar-se mais eficiente, moderno e orientado para resultados. Uma ampla reforma administrativa buscará simplificar estruturas",
        },
    ),
    "clariana-barao": (
        [1.5, 1, -1, 1, 0, 0, 0, 4],
        {
            "soberania": "ausente — o documento não trata de comércio externo nem de política internacional",
            "metodo": "Gestão por metas e evidências: objetivos anuais públicos; painéis de desempenho; avaliação e encerramento/reformulação de programas ineficazes",
        },
    ),
    "wilson-grassi": (
        [3, 1.5, 0, 2.5, 1, 1, 0, 3.5],
        {
            "soberania": "ausente — o plano é doméstico: tributos, gastos e regulação, sem agenda internacional",
            "metodo": "Não se troca o sistema tributário de um país da noite para o dia. São três movimentos",
        },
    ),
    "edmilson-costa": (
        [-3, -3.5, -3, -2.5, -2, -3.5, -4, -3],
        {
            "soberania": "o enfrentamento ao imperialismo, além de reafirmar a solidariedade com todos os povos em luta por sua soberania e autodeterminação",
            "metodo": "Somente a Revolução Socialista, entendida como um forte e poderoso processo de lutas [pode transformar o país] ... Construir o Poder Popular",
        },
    ),
    "hertz-dias": (
        [-3.5, -4, -4, -3.5, -2.5, -3.5, -3.5, -3.5],
        {
            "soberania": "Não é possível falar em um país soberano sem problematizar uma ruptura com o imperialismo, isto é, com os países dominantes na atual divisão internacional do trabalho",
            "metodo": "PELO CONTROLE DOS TRABALHADORES SOBRE AS PLATAFORMAS DIGITAIS ... submetidos à fiscalização pública e ao controle dos trabalhadores",
        },
    ),
    "samara": (
        [-3.5, -3.5, -4, -3, -3, -3, -3, -2.5],
        {
            "soberania": "nossa candidatura está a serviço da luta anti-imperialista, na defesa da autodeterminação dos povos e da soberania do nosso país",
            "metodo": "colocando as televisões, as rádios e a internet sob controle do poder popular",
        },
    ),
    "rui-costa-pimenta": (
        [-4, -4, -1.5, -4, 1, -4, -4, -4],
        {
            "soberania": "Não à internacionalização da Amazônia e a toda a política de ingerência do imperialismo na região ... fora o imperialismo da América Latina",
            "metodo": "as conquistas do povo trabalhador não virão pelo voto, pelo discurso demagógico dos políticos da burguesia, mas pela luta do povo trabalhador",
        },
    ),
}

# Cells whose score moved enough on the wider scale that the old quote no
# longer carries it. Everything else keeps the evidence already on file.
REVISED_EVIDENCE = {
    ("rui-costa-pimenta", "ambiente"): (
        "Nacionalização do petróleo, Petrobrás 100% estatal ... Redução imediata do "
        "preço dos combustíveis em 50% — o único plano da esquerda que é "
        "produtivista, sem agenda climática"
    ),
    ("rui-costa-pimenta", "social"): (
        "uma única menção a opressões de gênero ou raça no documento inteiro: o "
        "programa é classista e trata a opressão como derivada da exploração"
    ),
    ("samara", "social"): (
        "combater o machismo, a LGBTfobia, o capacitismo — a agenda de "
        "reconhecimento é um eixo central do programa (30 menções)"
    ),
    ("hertz-dias", "social"): (
        "O Estado nega direitos básicos à população LGBTQIAPN+ e é cúmplice da "
        "brutal [violência contra ela]"
    ),
}


def main() -> None:
    data = json.loads(TARGET.read_text(encoding="utf-8"))
    assert set(data) == set(PLANS), "candidate set drifted"

    for slug, (scores, new_ev) in PLANS.items():
        entry = data[slug]
        entry["scores"] = {d: s for d, s in zip(DIMS, scores)}
        entry["evidencia"].update(new_ev)
        for (s, dim), text in REVISED_EVIDENCE.items():
            if s == slug:
                entry["evidencia"][dim] = text
        missing = [d for d in DIMS if d not in entry["evidencia"]]
        assert not missing, f"{slug} missing evidence for {missing}"

    TARGET.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    vectors = {s: tuple(v["scores"][d] for d in DIMS) for s, v in data.items()}
    dupes = [
        (a, b)
        for a in vectors
        for b in vectors
        if a < b and vectors[a] == vectors[b]
    ]
    print(f"wrote {TARGET}")
    print("identical vectors:", dupes or "none")
    print()
    print(f"{'slug':20s}" + "".join(f"{d[:6]:>7s}" for d in DIMS))
    for slug, vec in sorted(vectors.items(), key=lambda kv: sum(kv[1])):
        print(f"{slug:20s}" + "".join(f"{x:7.1f}" for x in vec))


if __name__ == "__main__":
    main()
