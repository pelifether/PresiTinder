import semantic from "./semantic.json";

export type Dim =
  | "econ"
  | "social"
  | "seguranca"
  | "ambiente"
  | "welfare"
  | "instituicoes"
  | "soberania"
  | "metodo";

/**
 * Scores run −SCALE…+SCALE. It used to be 2, which put PCB, PSTU and UP on
 * an identical vector: all three sat on the floor of every axis, so the quiz
 * could only separate them by coin flip. Widening the scale gives "left",
 * "very left" and "rupture-maximal" distinct room. See pipeline/rescore.py.
 */
export const SCALE = 4;

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
   * How radical the proposal is on its dimension, 0…SCALE: how far a plan has
   * to lean before it would actually endorse *this* measure. "Cut taxes" (1)
   * is signed by most of the right; "privatise everything including
   * Petrobras" (3) only by the most radical. Without this, a yes/no answer
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
    pivot: 3,
  },
  {
    id: "e2",
    theme: "Economia",
    text: "Suspender o pagamento da dívida pública até auditá-la.",
    dim: "econ",
    dir: -1,
    axis: "x",
    pivot: 3,
  },
  {
    id: "e3",
    theme: "Economia",
    text: "Menos imposto e menos Estado: é assim que a economia cresce.",
    dim: "econ",
    dir: 1,
    axis: "x",
    pivot: 1,
  },
  {
    id: "e4",
    theme: "Economia",
    text: "Bancos públicos e política industrial devem puxar o crescimento.",
    dim: "econ",
    dir: -1,
    axis: "x",
    pivot: 1,
  },

  // ---------- direitos sociais e trabalho (axis x) ----------
  {
    id: "w1",
    theme: "Trabalho e renda",
    text: "Trocar o Bolsa Família por frentes de trabalho remunerado.",
    dim: "welfare",
    dir: 1,
    axis: "x",
    pivot: 2.5,
  },
  {
    id: "w2",
    theme: "Trabalho e renda",
    text: "Reduzir a jornada de trabalho sem reduzir o salário.",
    dim: "welfare",
    dir: -1,
    axis: "x",
    pivot: 2.5,
  },
  {
    id: "w3",
    theme: "Trabalho e renda",
    text: "O salário mínimo deve subir bem acima da inflação.",
    dim: "welfare",
    dir: -1,
    axis: "x",
    pivot: 1,
  },
  {
    id: "w4",
    theme: "Serviços públicos",
    text: "Hospitais, escolas e presídios rendem mais na mão da iniciativa privada.",
    dim: "welfare",
    dir: 1,
    axis: "x",
    pivot: 1.5,
  },

  // ---------- costumes (axis y) ----------
  {
    id: "s1",
    theme: "Costumes",
    text: "A escola deve falar sobre diversidade de gênero e sexualidade.",
    dim: "social",
    dir: -1,
    axis: "y",
    pivot: 1,
  },
  {
    id: "s2",
    theme: "Costumes",
    text: "A família tradicional deve orientar as políticas públicas.",
    dim: "social",
    dir: 1,
    axis: "y",
    pivot: 1,
  },
  {
    id: "s3",
    theme: "Costumes",
    text: "Cotas raciais devem ser mantidas e ampliadas.",
    dim: "social",
    dir: -1,
    axis: "y",
    pivot: 1,
  },
  {
    id: "s4",
    theme: "Costumes",
    text: "O aborto deve seguir proibido, sem novas exceções.",
    dim: "social",
    dir: 1,
    axis: "y",
    pivot: 1,
  },

  // ---------- segurança (axis y) ----------
  {
    id: "g1",
    theme: "Segurança",
    text: "Construir presídios de segurança máxima no modelo de El Salvador.",
    dim: "seguranca",
    dir: 1,
    axis: "y",
    pivot: 2.5,
  },
  {
    id: "g2",
    theme: "Segurança",
    text: "Desmilitarizar a Polícia Militar.",
    dim: "seguranca",
    dir: -1,
    axis: "y",
    pivot: 2.5,
  },
  {
    id: "g3",
    theme: "Segurança",
    text: "Reduzir a maioridade penal para 16 anos.",
    dim: "seguranca",
    dir: 1,
    axis: "y",
    pivot: 2.5,
  },
  {
    id: "g4",
    theme: "Segurança",
    text: "Menos prisões e mais prevenção: é o que reduz o crime.",
    dim: "seguranca",
    dir: -1,
    axis: "y",
    pivot: 0.5,
  },

  // ---------- meio ambiente (axis y) ----------
  {
    id: "a1",
    theme: "Meio ambiente",
    text: "Simplificar o licenciamento ambiental para destravar agro e mineração.",
    dim: "ambiente",
    dir: 1,
    axis: "y",
    pivot: 0.5,
  },
  {
    id: "a2",
    theme: "Meio ambiente",
    text: "Desmatamento zero, mesmo travando projetos econômicos.",
    dim: "ambiente",
    dir: -1,
    axis: "y",
    pivot: 1.5,
  },
  {
    id: "a3",
    theme: "Energia",
    text: "Ampliar a exploração de petróleo em novas fronteiras.",
    dim: "ambiente",
    dir: 1,
    axis: "y",
    pivot: 0.5,
    // O plano do PT comemora a retomada dos investimentos em petróleo e gás
    // e os recordes de produção da Petrobras.
    stances: { lula: 2 },
  },

  // ---------- instituições (axis y) ----------
  {
    id: "i1",
    theme: "Instituições",
    text: "Ministros do STF com mandato fixo, e não cargo vitalício.",
    dim: "instituicoes",
    dir: 1,
    axis: "y",
    pivot: 1,
  },
  {
    id: "i2",
    theme: "Instituições",
    text: "Convocar uma nova Constituinte para refundar as instituições.",
    dim: "instituicoes",
    dir: -1,
    axis: "y",
    pivot: 3,
  },
  {
    id: "i3",
    theme: "Instituições",
    text: "Mais plebiscitos e conselhos populares nas decisões do governo.",
    dim: "instituicoes",
    dir: -1,
    axis: "y",
    pivot: 1,
  },

  // ---------- soberania (axis x) ----------
  {
    id: "b1",
    theme: "Brasil no mundo",
    text: "Sair do BRICS e priorizar acordos com OCDE, Estados Unidos e Europa.",
    dim: "soberania",
    dir: 1,
    axis: "x",
    pivot: 3,
  },
  {
    id: "b2",
    theme: "Brasil no mundo",
    text: "Reestatizar, sem indenização, o que foi vendido ao capital estrangeiro.",
    dim: "soberania",
    dir: -1,
    axis: "x",
    pivot: 2.5,
  },
  {
    id: "b3",
    theme: "Brasil no mundo",
    text: "Ampliar acordos de livre comércio, mesmo expondo a indústria nacional.",
    dim: "soberania",
    dir: 1,
    axis: "x",
    pivot: 1,
  },

  // ---------- método de mudança (axis y) ----------
  {
    id: "m1",
    theme: "Como se muda o Brasil",
    text: "Mudança de verdade vem da mobilização e da greve, não das urnas.",
    dim: "metodo",
    dir: -1,
    axis: "y",
    pivot: 2.5,
  },
  {
    id: "m2",
    theme: "Como se muda o Brasil",
    text: "O Brasil muda por reforma administrativa e metas de gestão, não por ruptura.",
    dim: "metodo",
    dir: 1,
    axis: "y",
    pivot: 1.5,
  },
  {
    id: "m3",
    theme: "Como se muda o Brasil",
    text: "Empresas estratégicas devem ficar sob controle dos trabalhadores.",
    dim: "metodo",
    dir: -1,
    axis: "y",
    pivot: 2,
  },
];

export const PER_SESSION = 10;

/** Every dimension shows up; the two axes stay balanced (4 on x, 6 on y). */
const QUOTA: Record<Dim, number> = {
  econ: 2,
  welfare: 1,
  social: 2,
  seguranca: 1,
  ambiente: 1,
  instituicoes: 1,
  soberania: 1,
  metodo: 1,
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
  /**
   * One sentence that frames the *candidate*, not the document. `resumo`
   * opens with a noun phrase ("Plano de continuidade do governo Lula…"),
   * which reads like a library catalogue entry when dropped into the result
   * card. This says who is running and what they are running on.
   */
  pitch: string;
  eixos: string[];
  propostas: string[];
  estilo: string;
  scores: Record<Dim, number>;
  evidencia: Record<Dim, string>;
}

export const SEMANTIC = semantic as Record<string, SemanticEntry>;

const clamp = (v: number) => Math.max(-SCALE, Math.min(SCALE, v));

/**
 * How strongly a plan leans toward SIM (+) or NÃO (−) on a question, −1…+1.
 *
 * The lean is how far past the question's pivot the plan sits, then divided
 * by the largest lean that side of the pivot allows. Normalising instead of
 * clamping matters: `score * dir − pivot` reaches −7 on a −4 plan facing a
 * pivot-3 card, and the old hard clamp flattened every such plan onto −4.
 * That silently rebuilt the floor effect one level down — four different
 * far-left plans came out with the same stance on the same card.
 */
export function stance(slug: string, q: Question): number {
  const override = q.stances?.[slug];
  if (override !== undefined) return clamp(override) / SCALE;
  const raw = SEMANTIC[slug].scores[q.dim] * q.dir - q.pivot;
  const span = raw >= 0 ? SCALE - q.pivot : SCALE + q.pivot;
  return span <= 0 ? Math.sign(raw) : raw / span;
}

/**
 * The interval a single swipe puts the user in, on the card's dimension.
 *
 * This is what the pivots are really for. Swiping SIM on "privatise
 * everything including Petrobras" (pivot 3) says the user sits in [3, 4] on
 * economics; SIM on "cut taxes" (pivot 1) only says [1, 4]. NÃO says they
 * stop short of the pivot. Reading a SIM as *maximum* intensity instead is
 * what made the most extreme plan on each side win every time.
 */
function bounds(q: Question, a: Exclude<Answer, 0>): [number, number] {
  const [lo, hi] = a === 1 ? [q.pivot, SCALE] : [-SCALE, q.pivot];
  return q.dir === 1 ? [lo, hi] : [-hi, -lo];
}

/**
 * The user's estimated position per dimension, for dimensions they answered.
 * Answers on the same dimension are intersected rather than averaged: SIM to
 * "cut taxes" and SIM to "privatise everything" is a tighter statement than
 * either card alone, and averaging the two would wrongly place the user
 * halfway between them.
 */
export function userProfile(
  session: Question[],
  answers: Record<string, Answer>,
): Partial<Record<Dim, number>> {
  const box: Partial<Record<Dim, [number, number]>> = {};
  for (const q of session) {
    const a = answers[q.id];
    if (!a) continue;
    const [lo, hi] = bounds(q, a);
    const cur = box[q.dim] ?? [-SCALE, SCALE];
    box[q.dim] = [Math.max(cur[0], lo), Math.min(cur[1], hi)];
  }
  const out: Partial<Record<Dim, number>> = {};
  for (const dim of Object.keys(box) as Dim[]) {
    // Contradictory swipes make lo > hi; the midpoint still lands sensibly
    // between the conflicting claims.
    out[dim] = (box[dim]![0] + box[dim]![1]) / 2;
  }
  return out;
}

const dimsOf = <T,>(f: (d: Dim) => T) =>
  Object.fromEntries(
    ([...new Set(BANK.map((q) => q.dim))] as Dim[]).map((d) => [d, f(d)]),
  ) as Record<Dim, T>;

/**
 * The span of positions a voter can actually express on each dimension, given
 * the pivots available in the bank, and the span the 12 plans occupy.
 *
 * These two spans are not the same, and that mismatch is a real bias: a
 * binary swipe cannot say "maximally pro-market", so the field's most extreme
 * plan would sit permanently out of reach of every voter. Plans are therefore
 * mapped affinely from their own span onto the expressible one before any
 * distance is taken — the field's extremes line up with the most extreme
 * answer pattern a voter can give.
 */
const USER_SPAN = dimsOf((d) => {
  const mids = BANK.filter((q) => q.dim === d).flatMap((q) =>
    ([1, -1] as const).map((a) => {
      const [lo, hi] = bounds(q, a);
      return (lo + hi) / 2;
    }),
  );
  return [Math.min(...mids), Math.max(...mids)] as [number, number];
});

const PLAN_SPAN = dimsOf((d) => {
  const vals = Object.values(SEMANTIC).map((e) => e.scores[d]);
  return [Math.min(...vals), Math.max(...vals)] as [number, number];
});

/** A plan's position on a dimension, rescaled to what voters can express. */
function planOnVoterScale(score: number, dim: Dim): number {
  const [pLo, pHi] = PLAN_SPAN[dim];
  const [uLo, uHi] = USER_SPAN[dim];
  if (pHi === pLo) return (uLo + uHi) / 2;
  return uLo + ((score - pLo) / (pHi - pLo)) * (uHi - uLo);
}

const X_DIMS: Dim[] = ["econ", "welfare", "soberania"];

/**
 * User position, −1…+1 on each axis, from the same estimates the match uses.
 * X: + Estado (−) ↔ + Mercado (+). Y: progressista (−) ↔ conservador (+).
 * Skipped and unanswered cards are simply left out, so the dot moves after
 * every real answer.
 */
export function userCompass(
  session: Question[],
  answers: Record<string, Answer>,
): { x: number; y: number } {
  const prof = userProfile(session, answers);
  const axis = (dims: Dim[]) => {
    const vals = dims.map((d) => prof[d]).filter((v) => v !== undefined);
    return vals.length
      ? vals.reduce((a, b) => a! + b!, 0)! / vals.length / SCALE
      : 0;
  };
  const dims = Object.keys(prof) as Dim[];
  return {
    x: axis(dims.filter((d) => X_DIMS.includes(d))),
    y: axis(dims.filter((d) => !X_DIMS.includes(d))),
  };
}

export interface AxisPair {
  id: string;
  title: string;
  /** horizontal dimension; negative pole on the left */
  x: { dim: Dim; neg: string; pos: string };
  /** vertical dimension; positive pole on top (SVG y is inverted on draw) */
  y: { dim: Dim; neg: string; pos: string };
}

/**
 * The eight dimensions read as four maps instead of one.
 *
 * The single compass averages three dimensions onto x and five onto y, which
 * is what makes it readable but also what hides the disagreements: two plans
 * can land on the same dot and still be opposites on the environment. Each
 * pair below is one dimension per axis, so nothing is averaged away.
 */
export const AXIS_PAIRS: AxisPair[] = [
  {
    id: "classico",
    title: "Economia × Costumes",
    x: { dim: "econ", neg: "+ ESTADO", pos: "+ MERCADO" },
    y: { dim: "social", neg: "PROGRESSISTA", pos: "CONSERVADOR" },
  },
  {
    id: "social",
    title: "Trabalho × Segurança",
    x: { dim: "welfare", neg: "EXPANDIR", pos: "CONTER" },
    y: { dim: "seguranca", neg: "PREVENÇÃO", pos: "PUNIÇÃO" },
  },
  {
    id: "estado",
    title: "Ambiente × Instituições",
    x: { dim: "ambiente", neg: "CLIMA 1º", pos: "AGRO 1º" },
    y: { dim: "instituicoes", neg: "REFUNDAR", pos: "CONTER" },
  },
  {
    id: "mundo",
    title: "Brasil no mundo × Método",
    x: { dim: "soberania", neg: "SOBERANIA", pos: "INTEGRAÇÃO" },
    y: { dim: "metodo", neg: "RUPTURA", pos: "GESTÃO" },
  },
];

/**
 * Candidate position, −1…+1. Taken straight from the plan's scores rather
 * than from the sampled questions, so a candidate never moves between runs.
 */
export function candidateCompass(slug: string): { x: number; y: number } {
  const s = SEMANTIC[slug].scores;
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  return {
    x: mean([s.econ, s.welfare, s.soberania]) / SCALE,
    y: mean([s.social, s.seguranca, s.ambiente, s.instituicoes, s.metodo]) / SCALE,
  };
}

export function answeredCount(answers: Record<string, Answer>): number {
  return Object.values(answers).filter((a) => a !== 0).length;
}

/**
 * 0–100 agreement between the user's swipes and a plan, unrounded.
 *
 * A proximity model on one shared scale: each answered card places the user
 * (see `userProfile`) and the plan (see `planOnVoterScale`) on the card's
 * dimension, and pays for how close they land. Credit is therefore graded,
 * and a plan that overshoots the user is penalised as much as one that
 * undershoots.
 *
 * The old version only checked whether the *signs* matched, so any two plans
 * leaning the same way on all ten cards scored identically no matter how
 * differently they committed — that, more than the narrow scale, is what
 * produced the ties.
 *
 * Each card is divided by how many cards of its dimension were served, so a
 * doubled theme never counts twice.
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

  const prof = userProfile(session, answers);
  let num = 0;
  let den = 0;
  for (const q of session) {
    const a = answers[q.id];
    if (!a) continue;
    // A read-and-checked stance for this exact proposal beats the dimension
    // average (e.g. the PT plan celebrates new oil frontiers).
    const raw = q.stances?.[slug] ?? SEMANTIC[slug].scores[q.dim];
    const [uLo, uHi] = USER_SPAN[q.dim];
    const gap = Math.abs(prof[q.dim]! - planOnVoterScale(raw, q.dim));
    const weight = 1 / served[q.dim]!;
    num += weight * (1 - Math.min(1, gap / (uHi - uLo)));
    den += weight;
  }
  return den ? (100 * num) / den : 50;
}

/**
 * Plans ranked for a finished session. Ordering is deterministic: agreement
 * first, then distance to the user's point on the compass, then slug. The
 * previous version broke ties with Math.random(), which was the only honest
 * option while three plans were literally indistinguishable.
 */
export function ranking(
  session: Question[],
  answers: Record<string, Answer>,
  slugs: string[],
): { slug: string; pct: number }[] {
  const me = userCompass(session, answers);
  const dist = (slug: string) => {
    const c = candidateCompass(slug);
    return Math.hypot(c.x - me.x, c.y - me.y);
  };
  return slugs
    .map((slug) => ({ slug, pct: affinity(session, answers, slug) }))
    .sort(
      (a, b) =>
        b.pct - a.pct ||
        dist(a.slug) - dist(b.slug) ||
        a.slug.localeCompare(b.slug),
    );
}

export const DIM_LABEL: Record<Dim, string> = {
  econ: "economia",
  social: "costumes",
  seguranca: "segurança pública",
  ambiente: "meio ambiente",
  welfare: "trabalho e renda",
  instituicoes: "instituições",
  // Bare nouns: these get slotted into both "combinam em ___" and
  // "sobre ___", so a leading article breaks one of the two.
  soberania: "política externa",
  metodo: "método de mudança",
};

/**
 * Share of the cards the user answered where the plan leans the same way,
 * 0…1. This is plain directional agreement, not the proximity score used for
 * ranking: "we lined up on 6 of your 10 answers". The headline percentage is
 * a distance and cannot fall below ~55% for a *best* match out of twelve
 * plans, so it is the wrong number to put a "you don't really match anyone"
 * warning on.
 */
export function concordance(
  session: Question[],
  answers: Record<string, Answer>,
  slug: string,
): number {
  const rel = session.filter((q) => answers[q.id]);
  if (!rel.length) return 0;
  const hits = rel.filter((q) => {
    const s = stance(slug, q);
    return s !== 0 && Math.sign(s) === Math.sign(answers[q.id]!);
  });
  return hits.length / rel.length;
}

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
