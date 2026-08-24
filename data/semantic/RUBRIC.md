# Rubrica de análise semântica — Planos de Governo, Presidência 2026

Você vai ler o texto integral de um plano de governo protocolado no TSE e produzir um JSON de análise.

## Regras de ouro
1. Pontue APENAS com base no texto do documento. Ignore o que você sabe sobre o candidato, partido ou notícias. Se o documento surpreender, siga o documento.
2. Toda pontuação diferente de 0 exige evidência: citação VERBATIM do texto (≤ 200 caracteres, pode usar "..." para elipse).
3. Se o documento não trata de uma dimensão, pontue 0 e escreva "ausente" na evidência.
4. Scores são inteiros ou meios (-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2).

## Dimensões (score de -2 a +2)

### econ — Papel do Estado na economia
- -2: planificação/estatização ampla, fim ou controle rígido do mercado, revogação de privatizações em massa
- -1: Estado indutor forte — bancos públicos, planejamento, conteúdo local, política industrial, controle de preços pontual
- 0: misto/pragmático ou ausente
- +1: reformas pró-mercado — abertura comercial, simplificação, redução de impostos, concessões
- +2: privatização ampla, Estado mínimo, desregulamentação radical

### social — Costumes e pautas sociais
- -2: pautas progressistas centrais (direitos LGBTQIA+, aborto, antirracismo estrutural, feminismo como eixos do plano)
- -1: progressista — políticas de igualdade e diversidade presentes e afirmativas
- 0: ausente/neutro
- +1: conservador — família tradicional, "valores", oposição a pautas progressistas presentes
- +2: conservadorismo central — combate à "ideologia de gênero", defesa da vida desde a concepção como eixos do plano

### seguranca — Segurança pública
- -2: desencarceramento, desmilitarização, fim da guerra às drogas
- -1: prevenção, causas sociais, controle de armas
- 0: misto/gerencial ou ausente
- +1: endurecimento penal, mais polícia, presídios
- +2: armamento da população, excludente de ilicitude, "bandido tratado como bandido", forças armadas na segurança

### ambiente — Meio ambiente e clima
- -2: transição ecológica é eixo estruturante do plano (economia verde, desmatamento zero como prioridade nº1)
- -1: compromisso forte com clima/desmatamento, mas não é o eixo central
- 0: menção protocolar ou ausente
- +1: prioridade ao agronegócio/mineração com flexibilização de licenciamento
- +2: desmonte explícito da agenda ambiental

### welfare — Direitos sociais e trabalho
- -2: expansão radical — redução de jornada sem redução de salário, renda básica ampla, revogação de reformas trabalhistas
- -1: expansão moderada — valorização do salário mínimo, ampliação de programas sociais existentes
- 0: manter o que existe ou ausente
- +1: focalização, contrapartidas, disciplina fiscal sobre gastos sociais
- +2: corte amplo do Estado social, "quem precisa" apenas, privatização de serviços

### instituicoes — Ordem institucional
- -2: ruptura/refundação — assembleia constituinte, poder popular, governo dos trabalhadores
- -1: reformas democráticas participativas — conselhos, plebiscitos, democratização da mídia/Justiça
- 0: status quo institucional ou ausente
- +1: reformas de contenção — limitar STF, mandato para ministros, fim do foro privilegiado com viés de contenção judicial
- +2: confronto institucional — anistia a condenados políticos, revisão ampla de decisões do Judiciário

## JSON de saída (escreva em data/semantic/<slug>.json)
{
  "slug": "...",
  "titulo_plano": "título ou lema do documento",
  "paginas_estimadas": 0,
  "resumo": "resumo fiel em pt-BR, 50-70 palavras, tom neutro jornalístico",
  "eixos_centrais": ["3 a 5 temas que estruturam o plano, em ordem de ênfase"],
  "propostas_marcantes": ["5 propostas CONCRETAS e distintivas deste plano, curtas (≤15 palavras cada)"],
  "estilo": "1 frase sobre o estilo do documento (técnico, panfletário, gerencial, visionário...)",
  "scores": {
    "econ": {"v": 0, "ev": "citação verbatim"},
    "social": {"v": 0, "ev": "..."},
    "seguranca": {"v": 0, "ev": "..."},
    "ambiente": {"v": 0, "ev": "..."},
    "welfare": {"v": 0, "ev": "..."},
    "instituicoes": {"v": 0, "ev": "..."}
  }
}
