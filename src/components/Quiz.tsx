import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Compass from "./Compass";
import SwipeCard from "./SwipeCard";
import { CANDIDATES, bySlug } from "../data/candidates";
import { asset } from "../lib/asset";
import wordfreq from "../data/wordfreq.json";
import {
  agreementHighlights,
  answeredCount,
  buildSession,
  concordance,
  DIM_LABEL,
  PER_SESSION,
  ranking as rankPlans,
  SEMANTIC,
  userCompass,
  type Answer,
  type Question,
} from "../data/quiz";

const TOP_WORDS = wordfreq as Record<
  string,
  { top: { w: string; n: number }[] }
>;

type Phase = "intro" | "asking" | "result";

const IconNo = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
  </svg>
);

const IconSkip = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path d="M12 19V6m0 0l-6 6m6-6l6 6" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const IconYes = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
    <path
      d="M12 20.3s-7.4-4.7-7.4-9.7a4.3 4.3 0 0 1 7.4-2.9 4.3 4.3 0 0 1 7.4 2.9c0 5-7.4 9.7-7.4 9.7z"
      fill="currentColor"
    />
  </svg>
);

/** First sentence only — the result card should tease the plan, not retell it. */
function firstSentence(text: string): string {
  return text.match(/^.*?\.(?=\s+[A-ZÀ-Ú])/s)?.[0] ?? text;
}

function whyMatch(
  slug: string,
  session: Question[],
  answers: Record<string, Answer>,
) {
  const s = SEMANTIC[slug];
  const dims = agreementHighlights(session, answers, slug);
  const where =
    dims.length >= 2
      ? `${DIM_LABEL[dims[0]]} e ${DIM_LABEL[dims[1]]}`
      : dims.length === 1
        ? DIM_LABEL[dims[0]]
        : null;
  const evDim = dims.find(
    (d) => s.evidencia[d] && !s.evidencia[d].startsWith("ausente"),
  );
  return {
    where,
    resumo: firstSentence(s.resumo),
    quote: evDim ? s.evidencia[evDim] : "",
    quoteDim: evDim ? DIM_LABEL[evDim] : "",
  };
}

export default function Quiz() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [session, setSession] = useState<Question[]>(buildSession);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [pulse, setPulse] = useState(0);
  const [forced, setForced] = useState<Answer | null>(null);

  const answered = answeredCount(answers);
  const user = useMemo(
    () => (answered ? userCompass(session, answers) : null),
    [answered, session, answers],
  );

  const ranking = useMemo(() => {
    if (phase !== "result") return [];
    return rankPlans(
      session,
      answers,
      CANDIDATES.map((c) => c.slug),
    ).map((r) => ({ c: bySlug[r.slug], pct: r.pct }));
  }, [phase, session, answers]);

  useEffect(() => {
    if (phase !== "asking") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setForced(-1);
      else if (e.key === "ArrowRight") setForced(1);
      else if (e.key === "ArrowUp") setForced(0);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  function handleAnswer(q: Question, v: Answer) {
    setForced(null);
    setAnswers((prev) => ({ ...prev, [q.id]: v }));
    // A skip carries no information, so the dot stays put.
    if (v !== 0) setPulse((p) => p + 1);
    if (idx + 1 < session.length) setIdx(idx + 1);
    else window.setTimeout(() => setPhase("result"), 650);
  }

  function restart() {
    setSession(buildSession());
    setPhase("intro");
    setIdx(0);
    setAnswers({});
    setPulse(0);
    setForced(null);
  }

  if (phase === "intro") {
    return (
      <section>
        <div className="hero">
          <h1>Qual candidato pensa como você?</h1>
          <p>Responda {PER_SESSION} perguntas rápidas e descubra.</p>
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
          <p className="intro-hint">
            arraste os cards — esquerda não, direita sim, para cima pula
          </p>
        </div>
        <Compass user={null} pulse={0} />
      </section>
    );
  }

  if (phase === "result") {
    if (!answered) {
      return (
        <section>
          <div className="card result-card">
            <div className="result-kicker">Sem match</div>
            <p style={{ fontSize: 17 }}>
              Você pulou todas as perguntas, então não há o que comparar.
              Responda pelo menos uma para ver seu resultado.
            </p>
            <button className="btn" onClick={restart}>
              Tentar de novo
            </button>
          </div>
          <Compass user={null} pulse={0} />
        </section>
      );
    }

    const top = ranking[0];
    const why = whyMatch(top.c.slug, session, answers);
    const pct = Math.round(top.pct);
    // Near-exact scores are now rare enough to call out honestly when they do
    // happen, instead of hiding a coin flip.
    const tied = ranking.slice(1).filter((r) => Math.abs(r.pct - top.pct) < 0.5);
    const topWords = TOP_WORDS[top.c.slug]?.top.slice(0, 5) ?? [];
    const wordMax = topWords[0]?.n ?? 1;
    return (
      <section>
        <motion.div
          className="card result-card"
          initial={{ scale: 0.7, opacity: 0, rotate: -3 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          {concordance(session, answers, top.c.slug) < 0.5 && (
            <p className="match-warning">
              Você não bate com nenhum candidato em mais de 50% de concordância
            </p>
          )}
          <div className="result-kicker">deu match!</div>
          <img
            className="result-photo"
            src={asset(`candidatos/${top.c.slug}.jpg`)}
            alt={top.c.name}
          />
          <div className="result-name">{top.c.name}</div>
          <div className="result-party">
            {top.c.party} · nº {top.c.number} · {pct}% de afinidade
          </div>
          <div className="result-why">
            <p style={{ marginTop: 0 }}>
              {why.where
                ? `Vocês combinam principalmente em ${why.where}. `
                : ""}
              {why.resumo}
            </p>
            {why.quote && (
              <p>
                Do plano, sobre {why.quoteDim}: <em>“{why.quote}”</em>
              </p>
            )}
            {tied.length > 0 && (
              <p style={{ marginBottom: 0 }}>
                <strong>Empate técnico</strong> com{" "}
                {tied.map((t) => `${t.c.name} (${t.c.party})`).join(", ")}: nas
                dimensões medidas, esses planos são equivalentes.
              </p>
            )}
          </div>

          <div className="result-words">
            <div className="result-words-title">
              As 5 palavras que o plano mais repete
            </div>
            <div className="wordbars">
              {topWords.map((e) => (
                <div className="wordbar-row" key={e.w}>
                  <span className="wordbar-label">{e.w}</span>
                  <div className="wordbar-track">
                    <div
                      className="wordbar-fill"
                      style={{
                        width: `${(e.n / wordMax) * 100}%`,
                        background: top.c.color,
                      }}
                    />
                  </div>
                  <span className="wordbar-n">{e.n}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="ranking">
            {ranking.slice(1, 6).map((r) => (
              <div className="rank-row" key={r.c.slug}>
                <img
                  className="rank-avatar"
                  src={asset(`candidatos/${r.c.slug}.jpg`)}
                  alt={r.c.name}
                />
                <div>
                  {r.c.name}
                  <div className="rank-bar-track">
                    <div
                      className="rank-bar"
                      style={{ width: `${r.pct}%`, background: r.c.color }}
                    />
                  </div>
                </div>
                <span className="rank-pct">{Math.round(r.pct)}%</span>
              </div>
            ))}
          </div>

          <button className="btn ghost" onClick={restart}>
            Jogar de novo
          </button>
        </motion.div>
        <Compass user={user} pulse={pulse} showCandidates highlight={top.c.slug} />
      </section>
    );
  }

  const q = session[idx];
  const next = session[idx + 1];
  return (
    <section>
      <div className="swipe-top">
        <span className="q-count">
          {idx + 1}/{session.length}
        </span>
        <div className="progress-track">
          <motion.div
            className="progress-fill"
            animate={{ width: `${(idx / session.length) * 100}%` }}
            transition={{ type: "spring", stiffness: 160, damping: 20 }}
          />
        </div>
      </div>

      <div className="swipe-stack">
        {next && (
          <div className="swipe-card behind" aria-hidden="true">
            <div className="swipe-head">
              <span className="q-theme">{next.theme}</span>
            </div>
            <p className="swipe-q">{next.text}</p>
          </div>
        )}
        <SwipeCard
          key={q.id}
          q={q}
          forced={forced}
          onAnswer={(v) => handleAnswer(q, v)}
        />
      </div>

      <div className="swipe-actions">
        <button className="swipe-btn no" onClick={() => setForced(-1)} aria-label="Não">
          <IconNo />
        </button>
        <button className="swipe-btn skip" onClick={() => setForced(0)} aria-label="Pular pergunta">
          <IconSkip />
        </button>
        <button className="swipe-btn yes" onClick={() => setForced(1)} aria-label="Sim">
          <IconYes />
        </button>
      </div>

      <Compass user={user} pulse={pulse} />
    </section>
  );
}
