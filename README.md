# MeuPresidente · 2026

Quiz e análise dos planos de governo dos candidatos à Presidência do Brasil em
2026, baseados exclusivamente nos documentos oficiais protocolados no
[TSE / DivulgaCandContas](https://divulgacandcontas.tse.jus.br/divulga/#/candidato/BR/BR/20322002026).

## O que tem aqui

- **Quiz "MeuPresidente"** (página principal): 7 perguntas em escala Likert.
  A cada resposta, sua posição se move num mapa político 2D
  (Estado ↔ Mercado × Progressista ↔ Conservador). No fim, o site revela o
  candidato cujo plano mais se aproxima das suas respostas, com explicação e
  citação do documento.
- **Aba "Propostas"**: 4 visualizações dos 12 planos —
  palavras mais frequentes por plano (barras), matriz semântica
  candidatos × 6 dimensões (heatmap com evidência no hover), termos
  distintivos por TF-IDF (chips) e tamanho de cada documento.

## Método

1. Os 12 planos de governo em PDF (Pablo Marçal/PRTB não protocolou plano)
   foram convertidos para texto (`data/text/`).
2. Cada documento foi lido por inteiro e pontuado numa rubrica fixa de
   6 dimensões (`data/semantic/RUBRIC.md`), com nota de −2 a +2 e citação
   verbatim obrigatória como evidência. Todas as 68 citações foram validadas
   automaticamente contra os textos-fonte.
3. As 7 perguntas do quiz são projeções dessas dimensões em afirmações
   cotidianas. A "resposta esperada" de cada candidato a cada pergunta deriva
   das notas do plano — usuário e candidatos vivem no mesmo espaço, e a
   afinidade é a distância média entre as respostas.
4. Frequência de palavras: remoção de stopwords, cabeçalhos repetidos de
   página, hifenização e autorreferências (nome do próprio candidato).

## Rodar

```bash
npm install
npm run dev
```

Pipeline de dados (só necessário para regenerar `src/data/` e as fotos):

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python pipeline/wordfreq.py
.venv/bin/python pipeline/cartoonify.py
```

## Estrutura

- `data/pdfs/` — planos originais (TSE)
- `data/text/` — texto extraído (pdftotext)
- `data/semantic/` — rubrica e análises por candidato (JSON com evidências)
- `pipeline/` — scripts de processamento
- `src/` — aplicação (Vite + React + TypeScript + Framer Motion)

Análise independente, sem filiação partidária. Não substitui a leitura dos
planos.
