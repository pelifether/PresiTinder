# O experimento silencioso do PresiTinder 🧪

Se você chegou aqui pelo link do rodapé: sim, é verdade. O PresiTinder não é
só um quiz — é também um experimento aberto sobre **se a estética partidária
influencia respostas políticas**. Não era segredo; só era discreto. Este
documento é o protocolo completo, publicado antes de qualquer análise.

## Hipótese

Um visitante que responde o quiz dentro de uma "roupa" com as cores (e o
emoji) de um partido tende a deslizar as respostas na direção daquele campo
político — mesmo sem perceber a ambientação.

## Os seis braços

Cada visitante recebe, na primeira visita, um de seis pacotes de cor,
sorteado uniformemente e persistido em `localStorage` (quem volta, volta para
o mesmo braço). Os pacotes usam as paletas dos partidos das seis candidaturas
mais proeminentes:

| id       | Partido | Emoji | Cor-marca |
| -------- | ------- | ----- | --------- |
| `pt`     | PT      | ⭐    | vermelho `#c0281c` |
| `pl`     | PL      | 🇧🇷    | azul-marinho `#1b3f8f` + amarelo |
| `psd`    | PSD     | 🤝    | azul `#2f6fb7` |
| `novo`   | NOVO    | 🍊    | laranja `#d95410` |
| `missao` | MISSÃO  | 🚀    | mostarda `#8a6d00` |
| `pco`    | PCO     | ✊    | vinho `#7c1616` |

O tema troca apenas acentos de marca: botões, badges, chips, barra de
progresso e o emoji do logo. **Os selos SIM/NÃO ficam verde/vermelho em todos
os braços** — colorir o "sim" com cor de partido confundiria usabilidade com
tratamento, e o efeito medido viraria ruído.

## O que é registrado

Ao terminar um quiz, um registro é criado:

```json
{ "v": 1, "t": 1787264000, "b": "pt", "q": ["e1", "s3", "..."], "a": [1, -1, 0], "m": "lula", "p": 78 }
```

`b` = braço, `q` = perguntas sorteadas, `a` = respostas (−1 não, 0 pulou,
1 sim), `m` = match, `p` = afinidade. Nada de nome, IP, cookie ou
identificador — o registro nem sai do seu navegador sozinho.

## Como os dados viajam (não há servidor)

O site é estático (GitHub Pages) e não fala com banco de dados nenhum. Dois
canais, ambos voluntários:

1. **`localStorage`** (`pt_runs`): seu histórico fica com você.
2. **URL**: ao terminar, o registro é codificado no fragmento da URL
   (`#r=...`). Se você compartilhar o link do seu resultado, o dado viaja
   junto, aberto para quem quiser decodificar (base64url de JSON).

Isso significa que a "coleta" depende de gente compartilhando links — uma
amostra enviesada por autosseleção, e a gente sabe disso.

## Limitações (sem cerimônia)

- Sem braço de controle neutro: medimos diferenças *entre* partidos, não
  contra uma linha de base. Barato de adicionar depois, se valer a pena.
- Amostra por autosseleção via links compartilhados; sem poder estatístico
  garantido.
- Um dispositivo ≈ um participante; nada impede alguém de limpar o storage e
  repetir.

É um experimento honesto do tamanho do site que o carrega: pequeno, aberto e
com senso de humor. A revelação completa — com os dados que existirem — sai
como piada interna em algum momento da campanha.
