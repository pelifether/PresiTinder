# PresiTinder · 2026

Dê match com um plano de governo. Quiz e análise dos planos dos candidatos à
Presidência do Brasil em 2026, baseados exclusivamente nos documentos oficiais
protocolados no
[TSE / DivulgaCandContas](https://divulgacandcontas.tse.jus.br/divulga/#/candidato/BR/BR/20322002026).

**Ao vivo:** https://pelifether.github.io/PresiTinder/

## O que tem aqui

- **Quiz "PresiTinder"** (página principal): 10 cards, respondidos como no
  Tinder — arrasta pra esquerda (NÃO), pra direita (SIM) ou pra cima (pular).
  A cada resposta, sua posição se move num mapa político 2D
  (Estado ↔ Mercado × Progressista ↔ Conservador). Os candidatos só aparecem
  no mapa no fim, junto com o plano que mais combina com você, a explicação e
  uma citação do documento.
- **Aba "Propostas"**: 4 visualizações dos 12 planos — palavras mais
  frequentes por plano (barras), matriz semântica candidatos × 6 dimensões
  (heatmap com evidência no hover), termos distintivos por TF-IDF (chips) e
  tamanho de cada documento.

## Método

1. Os 12 planos de governo em PDF (Pablo Marçal/PRTB não protocolou plano)
   foram convertidos para texto (`data/text/`).
2. Cada documento foi lido por inteiro e pontuado numa rubrica fixa de
   6 dimensões (`data/semantic/RUBRIC.md`), com nota de −2 a +2 e citação
   verbatim obrigatória como evidência. Todas as 68 citações foram validadas
   automaticamente contra os textos-fonte.
3. **Banco de 22 perguntas**, cada uma tirada de uma proposta que aparece de
   fato em algum plano. Cada sessão sorteia 10, com amostragem estratificada
   (as 6 dimensões sempre aparecem) e distribuição round-robin, então dois
   cards seguidos nunca são do mesmo tema.
4. Uma resposta sim/não carrega direção mas não intensidade. A intensidade
   está na pergunta: cada uma tem um **pivô** (0…2) — o quanto um plano precisa
   se inclinar antes de endossar *aquela* medida. "Menos imposto" (0,5) é
   assinado por quase toda a direita; "privatizar tudo, inclusive a Petrobras"
   (1,5) só pelo mais radical. Sem isso, todo plano do mesmo lado de um tema
   pareceria igualmente perto de você.
5. A afinidade pesa cada card pela convicção do plano e divide pelo número de
   cards da mesma dimensão, então um tema sorteado duas vezes não conta dobrado.
   Onde o plano é silencioso, o card não conta.
6. Onde o texto do documento contradiz a projeção da dimensão, a posição é
   corrigida à mão e comentada no código (`stances` em `src/data/quiz.ts`) —
   por exemplo, o plano do PT comemora a retomada da exploração de petróleo,
   apesar da nota ambiental progressista.
7. Frequência de palavras: remoção de stopwords, cabeçalhos repetidos de
   página, hifenização e autorreferências (nome do próprio candidato).

### Limites conhecidos

As notas são por dimensão, não por pergunta: dentro de uma mesma dimensão, um
plano responde a todas as perguntas na mesma direção (a intensidade varia pelo
pivô). Planos que pontuam igual nas 6 dimensões — os três programas da esquerda
de ruptura são idênticos — empatam de verdade; o site sorteia a ordem e avisa do
empate em vez de fingir precisão.

## Rodar

```bash
npm install
npm run dev
```

Pipeline de dados (só necessário para regenerar `src/data/`, as fotos e o card
social):

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python pipeline/wordfreq.py
.venv/bin/python pipeline/cartoonify.py
.venv/bin/python pipeline/ogcard.py   # precisa das fontes Archivo em /tmp/ogfonts
```

## Estrutura

- `data/pdfs/` — planos originais (TSE)
- `data/text/` — texto extraído (pdftotext)
- `data/semantic/` — rubrica e análises por candidato (JSON com evidências)
- `pipeline/` — scripts de processamento
- `src/` — aplicação (Vite + React + TypeScript + Framer Motion)

## Deploy

GitHub Pages via Actions (`.github/workflows/deploy.yml`) a cada push na `main`.
O `base` do Vite é `/PresiTinder/`.

Análise independente, sem filiação partidária. Não substitui a leitura dos
planos.
