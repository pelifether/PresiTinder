import semantic from "./semantic.json";

export type Dim =
  | "econ"
  | "social"
  | "seguranca"
  | "ambiente"
  | "welfare"
  | "instituicoes";

export interface Question {
  id: string;
  theme: string;
  text: string;
  dim: Dim;
  /** +1: agreeing means a HIGHER score on the dimension; -1: lower */
  direction: 1 | -1;
  /** which compass axis this question feeds */
  axis: "x" | "y";
}

/**
 * Each question is a projection of one rubric dimension onto an everyday
 * statement. Statements were chosen where the 12 plans measurably diverge
 * (verified against scored evidence quotes from the documents).
 */
export const QUESTIONS: Question[] = [
  {
    id: "q1",
    theme: "Economia",
    text: "Empresas estatais, como a Petrobras e os Correios, funcionariam melhor privatizadas.",
    dim: "econ",
    direction: 1,
    axis: "x",
  },
  {
    id: "q2",
    theme: "Direitos sociais",
    text: "Ampliar programas sociais e valorizar o salário mínimo deve ser prioridade, mesmo com o orçamento apertado.",
    dim: "welfare",
    direction: -1,
    axis: "x",
  },
  {
    id: "q3",
    theme: "Segurança",
    text: "Penas mais duras e mais poder para a polícia são o caminho para reduzir o crime.",
    dim: "seguranca",
    direction: 1,
    axis: "y",
  },
  {
    id: "q4",
    theme: "Costumes",
    text: "A escola pública deve ensinar respeito à diversidade de gênero e sexualidade.",
    dim: "social",
    direction: -1,
    axis: "y",
  },
  {
    id: "q5",
    theme: "Meio ambiente",
    text: "Proteger a Amazônia deve vir antes da expansão do agronegócio e da mineração.",
    dim: "ambiente",
    direction: -1,
    axis: "y",
  },
  {
    id: "q6",
    theme: "Instituições",
    text: "O STF concentra poder demais: ministros deveriam ter mandato e limites mais claros.",
    dim: "instituicoes",
    direction: 1,
    axis: "y",
  },
  {
    id: "q7",
    theme: "Papel do Estado",
    text: "O desenvolvimento do país deve ser puxado pelo Estado: bancos públicos, estatais fortes e política industrial.",
    dim: "econ",
    direction: -1,
    axis: "x",
  },
];

export const LIKERT = [
  { v: -2, label: "Discordo muito" },
  { v: -1, label: "Discordo" },
  { v: 0, label: "Neutro" },
  { v: 1, label: "Concordo" },
  { v: 2, label: "Concordo muito" },
] as const;

export interface SemanticEntry {
  resumo: string;
  eixos: string[];
  propostas: string[];
  estilo: string;
  scores: Record<Dim, number>;
  evidencia: Record<Dim, string>;
}

export const SEMANTIC = semantic as Record<string, SemanticEntry>;

const clamp = (v: number) => Math.max(-2, Math.min(2, v));

/** Candidate's expected Likert answer to a question, from their plan's scores. */
export function expectedAnswer(slug: string, q: Question): number {
  const s = SEMANTIC[slug];
  return clamp(s.scores[q.dim] * q.direction);
}

/**
 * Compass position from a set of Likert answers (user or candidate).
 * X: state-led (−) ↔ market-led (+). Y: progressive (−) ↔ conservative (+).
 * Uses only answered questions, so the dot can move after every answer.
 */
export function compassFromAnswers(
  answers: Partial<Record<string, number>>,
): { x: number; y: number } {
  let sx = 0;
  let nx = 0;
  let sy = 0;
  let ny = 0;
  for (const q of QUESTIONS) {
    const a = answers[q.id];
    if (a === undefined) continue;
    // re-orient so that positive = market-led (x) / conservative (y)
    const oriented = a * q.direction;
    if (q.axis === "x") {
      sx += oriented;
      nx++;
    } else {
      sy += oriented;
      ny++;
    }
  }
  return { x: nx ? sx / nx : 0, y: ny ? sy / ny : 0 };
}

export function candidateAnswers(slug: string): Record<string, number> {
  return Object.fromEntries(QUESTIONS.map((q) => [q.id, expectedAnswer(slug, q)]));
}

/** 0–100 affinity between the user's answers and a candidate's plan. */
export function affinity(
  answers: Record<string, number>,
  slug: string,
): number {
  let dist = 0;
  for (const q of QUESTIONS) {
    dist += Math.abs(answers[q.id] - expectedAnswer(slug, q));
  }
  return Math.round(100 * (1 - dist / (4 * QUESTIONS.length)));
}
