import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Compass from "./Compass";
import { CANDIDATES } from "../data/candidates";
import {
  affinity,
  compassFromAnswers,
  expectedAnswer,
  LIKERT,
  QUESTIONS,
  SEMANTIC,
  type Question,
} from "../data/quiz";

type Phase = "intro" | "asking" | "result";

const DIM_LABEL: Record<string, string> = {
  econ: "economia",
  social: "costumes",
  seguranca: "segurança pública",
  ambiente: "meio ambiente",
  welfare: "direitos sociais",
  instituicoes: "instituições",
};

function whyMatch(slug: string, answers: Record<string, number>): {
  intro: string;
  quote: string;
  quoteDim: string;
} {
  const s = SEMANTIC[slug];
  // dimensions where user and plan are closest, favoring strong plan positions
  const ranked = QUESTIONS.map((q) => ({
    q,
    gap: Math.abs(answers[q.id] - expectedAnswer(slug, q)),
    strength: Math.abs(s.scores[q.dim]),
  })).sort((a, b) => a.gap - b.gap || b.strength - a.strength);
  const best = ranked.slice(0, 2).map((r) => DIM_LABEL[r.q.dim]);
  const evDim = ranked.find(
    (r) => s.evidencia[r.q.dim] && !s.evidencia[r.q.dim].startsWith("ausente"),
  );
  return {
    intro: `Suas respostas se aproximam deste plano principalmente em ${best[0]} e ${best[1]}. ${s.resumo}`,
    quote: evDim ? s.evidencia[evDim.q.dim] : "",
    quoteDim: evDim ? DIM_LABEL[evDim.q.dim] : "",
  };
}

export default function Quiz() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [pulse, setPulse] = useState(0);

  const user = useMemo(
    () => (Object.keys(answers).length ? compassFromAnswers(answers) : null),
    [answers],
  );

  const ranking = useMemo(() => {
    if (phase !== "result") return [];
    return CANDIDATES.filter((c) => c.hasPlan)
      .map((c) => ({ c, pct: affinity(answers, c.slug) }))
      .sort((a, b) => b.pct - a.pct);
  }, [phase, answers]);

  function answer(q: Question, v: number) {
    setAnswers((prev) => ({ ...prev, [q.id]: v }));
    setPulse((p) => p + 1);
    if (idx + 1 < QUESTIONS.length) {
      setIdx(idx + 1);
    } else {
      setTimeout(() => setPhase("result"), 900);
    }
  }

  function restart() {
    setPhase("intro");
    setIdx(0);
    setAnswers({});
    setPulse(0);
  }

  if (phase === "intro") {
    return (
      <section>
        <div className="hero">
          <h1>Qual candidato pensa como você?</h1>
          <p>
            Responda 7 perguntas e veja qual plano de governo combina mais com
            suas ideias.
          </p>
        </div>
        <div style={{ textAlign: "center" }}>
          <motion.button
            className="btn"
            style={{ fontSize: 18, padding: "16px 38px" }}
            whileHover={{ scale: 1.04, rotate: -1 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setPhase("asking")}
          >
            COMEÇAR
          </motion.button>
        </div>
        <Compass user={null} pulse={0} />
      </section>
    );
  }

  if (phase === "result") {
    const top = ranking[0];
    const why = whyMatch(top.c.slug, answers);
    return (
      <section>
        <motion.div
          className="card result-card"
          initial={{ scale: 0.7, opacity: 0, rotate: -3 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <div className="result-kicker">Seu presidente é…</div>
          <img
            className="result-photo"
            src={`/candidatos/${top.c.slug}.jpg`}
            alt={top.c.name}
          />
          <div className="result-name">{top.c.name}</div>
          <div className="result-party">
            {top.c.party} · nº {top.c.number} · {top.pct}% de afinidade
          </div>
          <div className="result-why">
            <p style={{ marginTop: 0 }}>{why.intro}</p>
            {why.quote && (
              <p style={{ marginBottom: 0 }}>
                Do plano, sobre {why.quoteDim}: <em>“{why.quote}”</em>
              </p>
            )}
          </div>

          <div className="ranking">
            {ranking.slice(1, 6).map(({ c, pct }) => (
              <div className="rank-row" key={c.slug}>
                <img
                  className="rank-avatar"
                  src={`/candidatos/${c.slug}.jpg`}
                  alt={c.name}
                />
                <div>
                  {c.name}
                  <div className="rank-bar-track">
                    <div
                      className="rank-bar"
                      style={{ width: `${pct}%`, background: c.color }}
                    />
                  </div>
                </div>
                <span className="rank-pct">{pct}%</span>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 13, color: "var(--muted)" }}>
            Pablo Marçal (PRTB) não protocolou plano de governo e ficou fora do
            cálculo.
          </p>
          <button className="btn ghost" onClick={restart}>
            Refazer o quiz
          </button>
        </motion.div>
        <Compass user={user} pulse={pulse} highlight={top.c.slug} />
      </section>
    );
  }

  const q = QUESTIONS[idx];
  return (
    <section>
      <div className="card quiz-card">
        <div className="q-meta">
          <span className="q-count">
            Pergunta {idx + 1} de {QUESTIONS.length}
          </span>
          <span className="q-theme">{q.theme}</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={q.id}
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -60, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <div className="q-text">{q.text}</div>
            <div className="likert">
              {LIKERT.map((opt) => (
                <motion.button
                  key={opt.v}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => answer(q, opt.v)}
                >
                  <span className="dot" />
                  {opt.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="progress-track">
          <motion.div
            className="progress-fill"
            animate={{ width: `${(idx / QUESTIONS.length) * 100}%` }}
            transition={{ type: "spring", stiffness: 160, damping: 20 }}
          />
        </div>
      </div>
      <Compass user={user} pulse={pulse} />
    </section>
  );
}
