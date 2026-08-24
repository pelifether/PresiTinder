import semantic from "./semantic.json";

export type Dim =
  | "econ"
  | "social"
  | "seguranca"
  | "ambiente"
  | "welfare"
  | "instituicoes";

/** NÃO (swipe left) · pular (swipe up) · SIM (swipe right) */
export type Answer = -1 | 0 | 1;

export interface Question {
  id: string;
  theme: string;
  text: string;
  dim: Dim;
  /** +1: SIM means a HIGHER score on the dimension; -1: lower */
  dir: 1 | -1;
  /** which compass axis this question feeds */
  axis: "x" | "y";
  /**
   * How radical the proposal is on its dimension, 0…2: how far a plan has to
   * lean before it would actually endorse *this* measure. "Cut taxes" (0.5)
   * is signed by most of the right; "privatise everything including
   * Petrobras" (1.5) only by the most radical. Without this, a yes/no answer
   * would carry sign but no intensity, and every plan on the same side of an
   * issue would look equally close to the user.
   */
  pivot: number;
  /**
   * Plans whose text explicitly contradicts the dimension projection.
   * Only used where the document was read and checked directly.
   */
  stances?: Record<string, number>;
}

/**
 * Question bank. Every statement is drawn from a proposal that actually
 * appears in at least one of the 12 filed plans, so each one separates the
 * field instead of testing generic ideology. SIM-means-right and
 * SIM-means-left are balanced 11/11 across the bank, so a user who swipes
 * right on everything is not pushed to either pole.
 */
export const BANK: Question[] = [
  // ---------- economia (axis x) ----------
  {
    id: "e1",
    theme: "Economia",
    text: "Privatizar todas as estatais, inclusive a Petrobras.",
    dim: "econ",
    dir: 1,
    axis: "x",
    pivot: 1.5,
  },
  {
    id: "e2",
    theme: "Economia",
    text: "Suspender o pagamento da dívida pública até auditá-la.",
    dim: "econ",
    dir: -1,
    axis: "x",
    pivot: 1.5,
  },
  {
    id: "e3",
    theme: "Economia",
    text: "Menos imposto e menos Estado: é assim que a economia cresce.",
    dim: "econ",
    dir: 1,
    axis: "x",
    pivot: 0.5,
  },
  {
    id: "e4",
    theme: "Economia",
    text: "Bancos públicos e política industrial devem puxar o crescimento.",
    dim: "econ",
    dir: -1,
    axis: "x",
    pivot: 0.5,
  },

  // ---------- direitos sociais e trabalho (axis x) ----------
  {
    id: "w1",
    theme: "Trabalho e renda",
    text: "Trocar o Bolsa Família por frentes de trabalho remunerado.",
    dim: "welfare",
    dir: 1,
    axis: "x",
    pivot: 1.25,
  },
  {
    id: "w2",
    theme: "Trabalho e renda",
    text: "Reduzir a jornada de trabalho sem reduzir o salário.",
    dim: "welfare",
    dir: -1,
    axis: "x",
    pivot: 1.25,
  },
  {
    id: "w3",
    theme: "Trabalho e renda",
    text: "O salário mínimo deve subir bem acima da inflação.",
    dim: "welfare",
    dir: -1,
    axis: "x",
    pivot: 0.5,
  },
  {
    id: "w4",
    theme: "Serviços públicos",
    text: "Hospitais, escolas e presídios rendem mais na mão da iniciativa privada.",
    dim: "welfare",
    dir: 1,
    axis: "x",
    pivot: 0.75,
  },

  // ---------- costumes (axis y) ----------
  {
    id: "s1",
    theme: "Costumes",
    text: "A escola deve falar sobre diversidade de gênero e sexualidade.",
    dim: "social",
    dir: -1,
    axis: "y",
    pivot: 0.5,
  },
  {
    id: "s2",
    theme: "Costumes",
    text: "A família tradicional deve orientar as políticas públicas.",
    dim: "social",
    dir: 1,
    axis: "y",
    pivot: 0.5,
  },
  {
    id: "s3",
    theme: "Costumes",
    text: "Cotas raciais devem ser mantidas e ampliadas.",
    dim: "social",
    dir: -1,
    axis: "y",
    pivot: 0.5,
  },
  {
    id: "s4",
    theme: "Costumes",
    text: "O aborto deve seguir proibido, sem novas exceções.",
    dim: "social",
    dir: 1,
    axis: "y",
    pivot: 0.5,
  },

  // ---------- segurança (axis y) ----------
  {
    id: "g1",
    theme: "Segurança",
    text: "Construir presídios de segurança máxima no modelo de El Salvador.",
    dim: "seguranca",
    dir: 1,
    axis: "y",
    pivot: 1.25,
  },
  {
    id: "g2",
    theme: "Segurança",
    text: "Desmilitarizar a Polícia Militar.",
    dim: "seguranca",
    dir: -1,
    axis: "y",
    pivot: 1.25,
  },
  {
    id: "g3",
    theme: "Segurança",
    text: "Reduzir a maioridade penal para 16 anos.",
    dim: "seguranca",
    dir: 1,
    axis: "y",
    pivot: 1.25,
  },
  {
    id: "g4",
    theme: "Segurança",
    text: "Menos prisões e mais prevenção: é o que reduz o crime.",
    dim: "seguranca",
    dir: -1,
    axis: "y",
    pivot: 0.25,
  },

  // ---------- meio ambiente (axis y) ----------
  {
    id: "a1",
    theme: "Meio ambiente",
    text: "Simplificar o licenciamento ambiental para destravar agro e mineração.",
    dim: "ambiente",
    dir: 1,
    axis: "y",
    pivot: 0.25,
  },
  {
    id: "a2",
    theme: "Meio ambiente",
    text: "Desmatamento zero, mesmo travando projetos econômicos.",
    dim: "ambiente",
    dir: -1,
    axis: "y",
    pivot: 0.75,
  },
  {
    id: "a3",
    theme: "Energia",
    text: "Ampliar a exploração de petróleo em novas fronteiras.",
    dim: "ambiente",
    dir: 1,
    axis: "y",
    pivot: 0.25,
    // O plano do PT comemora a retomada dos investimentos em petróleo e gás
    // e os recordes de produção da Petrobras.
    stances: { lula: 1 },
  },

  // ---------- instituições (axis y) ----------
  {
    id: "i1",
    theme: "Instituições",
    text: "Ministros do STF com mandato fixo, e não cargo vitalício.",
    dim: "instituicoes",
    dir: 1,
    axis: "y",
    pivot: 0.5,
  },
  {
    id: "i2",
    theme: "Instituições",
    text: "Convocar uma nova Constituinte para refundar as instituições.",
    dim: "instituicoes",
    dir: -1,
    axis: "y",
    pivot: 1.5,
  },
  {
    id: "i3",
    theme: "Instituições",
    text: "Mais plebiscitos e conselhos populares nas decisões do governo.",
    dim: "instituicoes",
    dir: -1,
    axis: "y",
    pivot: 0.5,
  },
];

export const PER_SESSION = 10;

/** Every dimension shows up; the two axes stay balanced (4 on x, 6 on y). */
const QUOTA: Record<Dim, number> = {
  econ: 2,
  welfare: 2,
  social: 2,
  seguranca: 2,
  ambiente: 1,
  instituicoes: 1,
};

function shuffle<T>(input: T[]): T[] {
  const a = [...input];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * A fresh, shuffled 10-question session. Sampling is stratified by dimension
 * (a random draw could hand someone five economy cards and no security ones)
 * and then dealt round-robin, so no two consecutive cards share a theme.
 */
export function buildSession(): Question[] {
  const picked = new Map<Dim, Question[]>();
  for (const q of BANK) {
    const bucket = picked.get(q.dim) ?? [];
    bucket.push(q);
    picked.set(q.dim, bucket);
  }
  for (const [dim, qs] of picked) {
    picked.set(dim, shuffle(qs).slice(0, QUOTA[dim]));
  }

  const dims = shuffle([...picked.keys()]);
  const out: Question[] = [];
  for (let round = 0; out.length < PER_SESSION; round++) {
    let added = false;
    for (const d of dims) {
      const q = picked.get(d)![round];
      if (q) {
        out.push(q);
        added = true;
      }
    }
    if (!added) break;
  }
  return out;
}

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

/**
 * How strongly a plan leans toward SIM (+) or NÃO (−) on a question, −2…+2.
 * Derived from the plan's dimension score unless the document was read to say
 * otherwise (see `stances`).
 */
export function stance(slug: string, q: Question): number {
  const override = q.stances?.[slug];
  if (override !== undefined) return clamp(override);
  const oriented = SEMANTIC[slug].scores[q.dim] * q.dir;
  return clamp(oriented - q.pivot);
}

/**
 * User position, −1…+1 on each axis.
 * X: + Estado (−) ↔ + Mercado (+). Y: progressista (−) ↔ conservador (+).
 * Skipped and unanswered cards are simply left out, so the dot moves after
 * every real answer.
 */
export function userCompass(
  session: Question[],
  answers: Record<string, Answer>,
): { x: number; y: number } {
  let sx = 0;
  let nx = 0;
  let sy = 0;
  let ny = 0;
  for (const q of session) {
    const a = answers[q.id];
    if (!a) continue;
    const oriented = a * q.dir;
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

/**
 * Candidate position, −1…+1. Taken straight from the plan's scores rather
 * than from the sampled questions, so a candidate never moves between runs.
 */
export function candidateCompass(slug: string): { x: number; y: number } {
  const s = SEMANTIC[slug].scores;
  return {
    x: (s.econ + s.welfare) / 4,
    y: (s.social + s.seguranca + s.ambiente + s.instituicoes) / 8,
  };
}

export function answeredCount(answers: Record<string, Answer>): number {
  return Object.values(answers).filter((a) => a !== 0).length;
}

/**
 * 0–100 agreement between the user's swipes and a plan.
 * Each card counts for how strongly the plan commits (|stance|), and is
 * divided by how many cards of its dimension were served, so a doubled theme
 * never counts twice. Cards where the plan is silent carry no signal.
 */
export function affinity(
  session: Question[],
  answers: Record<string, Answer>,
  slug: string,
): number {
  const served: Partial<Record<Dim, number>> = {};
  for (const q of session) {
    if (answers[q.id]) served[q.dim] = (served[q.dim] ?? 0) + 1;
  }

  let num = 0;
  let den = 0;
  for (const q of session) {
    const a = answers[q.id];
    if (!a) continue;
    const s = stance(slug, q);
    const conviction = Math.abs(s) / 2;
    if (conviction === 0) continue;
    const weight = conviction / served[q.dim]!;
    den += weight;
    if (Math.sign(a) === Math.sign(s)) num += weight;
  }
  return den ? Math.round((100 * num) / den) : 50;
}

export const DIM_LABEL: Record<Dim, string> = {
  econ: "economia",
  social: "costumes",
  seguranca: "segurança pública",
  ambiente: "meio ambiente",
  welfare: "trabalho e renda",
  instituicoes: "instituições",
};

/** The dimensions where the user and the plan actually agreed, strongest first. */
export function agreementHighlights(
  session: Question[],
  answers: Record<string, Answer>,
  slug: string,
): Dim[] {
  const seen = new Set<Dim>();
  return session
    .filter((q) => {
      const a = answers[q.id];
      const s = stance(slug, q);
      return a && s !== 0 && Math.sign(a) === Math.sign(s);
    })
    .sort((p, q) => Math.abs(stance(slug, q)) - Math.abs(stance(slug, p)))
    .filter((q) => (seen.has(q.dim) ? false : seen.add(q.dim)))
    .map((q) => q.dim);
}
