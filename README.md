# PresidenTinder · 2026

Dê match com um plano de governo. Quiz e análise dos planos dos candidatos à
Presidência do Brasil em 2026, baseados exclusivamente nos documentos oficiais
protocolados no
[TSE / DivulgaCandContas](https://divulgacandcontas.tse.jus.br/divulga/#/candidato/BR/BR/20322002026).

**Ao vivo:** https://presi-tinder.vercel.app/

## O que tem aqui

- **Quiz "PresidenTinder"** (página principal): 10 cards, respondidos como no
  Tinder — arrasta pra esquerda (NÃO), pra direita (SIM) ou pra cima (pular).
  A cada resposta, sua posição se move num mapa político 2D
  (Estado ↔ Mercado × Progressista ↔ Conservador). Os candidatos só aparecem
  no mapa no fim, junto com o plano que mais combina com você, a explicação e
  uma citação do documento. Empate mostra os dois (ou três) planos empatados
  lado a lado, sem desempate arbitrário.
  Abaixo do resultado, as 8 dimensões viram **4 mapas** — um par de dimensões
  por mapa, nada de média — que passam de lado até você tocar num deles.
  O resultado é compartilhável: o link gera um card social renderizado na hora
  com o match e o mapa (`api/og`).
- **Aba "Propostas"**: 5 visualizações dos 12 planos — estimativa de uso de
  IA por documento, palavras mais repetidas em cada plano, termos distintivos
  por TF-IDF (chips), tamanho de cada documento e a matriz semântica
  candidatos × 8 dimensões (heatmap com a citação que justifica cada nota no
  hover).

## Método

1. Os 12 planos de governo em PDF foram convertidos para texto
   (`data/text/`).
2. Cada documento foi lido por inteiro e pontuado em **8 dimensões**, com nota
   de −4 a +4 (passos de 0,5) e citação verbatim obrigatória como evidência
   (`pipeline/rescore.py`). Seis dimensões são as clássicas (economia, direitos
   sociais, costumes, segurança, ambiente, instituições); duas foram
   acrescentadas porque são o "segundo eixo" canônico da literatura comparada
   e, na prática, são o que separa planos que nas seis primeiras pareciam
   iguais:
   - **soberania** — anti-imperialismo/protecionismo ↔ integração global. Não
     é monótona com a esquerda-direita: o NOVO quer sair do BRICS e entrar na
     OCDE, enquanto a MISSÃO ataca o "protecionismo crônico" e ao mesmo tempo
     dedica um capítulo a "terras raras e soberania nacional".
   - **método** — ruptura/mobilização ↔ reforma pelas instituições. O PCO diz
     que as conquistas "não virão pelo voto"; o PT governa por mesa de
     negociação.
3. **Banco de 28 perguntas**, cada uma tirada de uma proposta que aparece de
   fato em algum plano. Cada sessão sorteia 10, com amostragem estratificada
   (as 8 dimensões sempre aparecem) e distribuição round-robin, então dois
   cards seguidos nunca são do mesmo tema.
4. Uma resposta sim/não carrega direção mas não intensidade. A intensidade
   está na pergunta: cada uma tem um **pivô** (0…4) — o quanto um plano precisa
   se inclinar antes de endossar *aquela* medida. "Menos imposto" (1) é
   assinado por quase toda a direita; "privatizar tudo, inclusive a Petrobras"
   (3) só pelo mais radical.
5. O pivô também posiciona *você*: um SIM em "privatizar tudo" (pivô 3) diz que
   você está em [3, 4] na economia; um SIM em "menos imposto" (pivô 1) só diz
   [1, 4]. As respostas de uma mesma dimensão são **interseccionadas**, e o
   resultado é comparado com a nota do plano na mesma escala — um modelo de
   proximidade, em que um plano que passa longe demais é penalizado tanto
   quanto um que fica curto. Antes disso a afinidade só olhava o *sinal* da
   resposta, e dois planos do mesmo lado empatavam por construção.
6. Onde o texto do documento contradiz a projeção da dimensão, a posição é
   corrigida à mão e comentada no código (`stances` em `src/data/quiz.ts`) —
   por exemplo, o plano do PT comemora a retomada da exploração de petróleo,
   apesar da nota ambiental progressista.
7. Frequência de palavras: remoção de stopwords, cabeçalhos repetidos de
   página, hifenização e autorreferências (nome do próprio candidato).

### Limites conhecidos

- As notas são por dimensão, não por pergunta: dentro de uma mesma dimensão, um
  plano responde a todas as perguntas na mesma direção (a intensidade varia pelo
  pivô), salvo os `stances` corrigidos à mão.
- Dez cards binários não separam completamente cinco planos de direita muito
  parecidos: quem responde exatamente como o Zema o vê no top 3 em ~67% das
  sessões, porque em várias dimensões ele divide o extremo do campo com
  Caiado, Flávio e Renan. É limite de informação do instrumento, não de dados.
- A ordenação por meio ponto dentro de um mesmo bloco (Cury +2 vs. Caiado +2,5)
  é juízo de leitura, não medição. O sinal e a ordem de grandeza são o que
  sustentamos.
- Empates de verdade caíram de ~16% para ~1% das sessões (`node
  scripts/testquiz.mjs`). Quando ainda acontecem, o site avisa em vez de
  fingir precisão.

## Rodar

```bash
npm install
npm run dev
node scripts/testquiz.mjs   # valida o motor do quiz (empates, recuperação)
npm run check:api           # roda as funções de api/ e renderiza cards de teste
```

Pipeline de dados (só necessário para regenerar `src/data/`, as fotos e o card
social):

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python pipeline/wordfreq.py
.venv/bin/python pipeline/rescore.py
.venv/bin/python pipeline/ogcard.py   # precisa das fontes Archivo em /tmp/ogfonts
```

## Estrutura

- `data/pdfs/` — planos originais (TSE), servidos em `/planos/<slug>.pdf`.
  Nomes de candidatos no site (exceto rótulos dos mapas políticos) apontam
  para o PDF protocolado.
- `data/text/` — texto extraído (pdftotext)
- `data/semantic/` — rubrica e análises por candidato (JSON com evidências)
- `pipeline/` — scripts de processamento
- `src/` — aplicação (Vite + React + TypeScript + Framer Motion)
- `api/` — funções serverless (card social dinâmico, captura de e-mail)

## Deploy

Vercel, deploy contínuo a cada push na `main` (projeto
`pelifethers-projects/presi-tinder`). O site é servido da raiz do domínio — o
`base` do Vite é `/` — e o `vercel.json` reescreve qualquer rota desconhecida
para `/index.html`, sem engolir `/api/*` nem os arquivos estáticos.

### Funções (`api/`)

- **`/r/<payload>`** → `api/share`: HTML com as metatags OpenGraph/Twitter do
  resultado compartilhado. Robô de rede social lê as metatags; navegador de
  verdade é mandado para `/?r=<payload>`.

  O payload é um único segmento de caminho, `idxs_pct_x100_y100`: os índices
  em `CANDIDATES` separados por `.` (mais de um só em caso de empate), a
  afinidade de 0 a 100, e a posição do usuário na bússola multiplicada por 100.
  Exemplo: `/r/4_86_-42_-31` — candidato 4, 86% de afinidade, usuário em
  x = −0,42 e y = −0,31. Entrada inválida cai no card genérico, nunca em erro.

- **`/api/og?i=4&p=86&x=-42&y=-31`** → PNG 1200×630 com `@vercel/og`: a tag
  "DEU MATCH!", a(s) foto(s), nome, partido, número, a afinidade e a bússola
  com o ponto do usuário. As fontes vivem em `api/_fonts/` (satori precisa do
  binário; não dá pra usar o webfont do site).

- **`POST /api/subscribe`** `{"email": "..."}` → `{"ok": true}`: captura de
  e-mail da página de resultado. É *write-only* de propósito — não existe
  endpoint que liste, leia ou exporte o que foi coletado. A leitura é feita
  direto no console do Upstash.

### Variáveis de ambiente

Só o `subscribe` precisa de configuração, e ela é opcional: sem as credenciais
ele continua respondendo 200 (a página nunca trava pro visitante) e apenas
registra um aviso no log.

| variável | onde |
| --- | --- |
| `KV_REST_API_URL` | injetada automaticamente ao conectar um store Upstash Redis em Vercel → Storage |
| `KV_REST_API_TOKEN` | idem |

Alternativamente, `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`
(mesmos valores, nomes nativos do Upstash) definidos em Vercel → Settings →
Environment Variables, nos três ambientes. Veja `.env.example`. Nenhum segredo
vai pro repositório.

Os endereços ficam num SET `subscribers` (deduplicado) e a data da primeira
inscrição num hash `subscribers:first_seen`.

Análise independente, sem filiação partidária. Não substitui a leitura dos
planos.
