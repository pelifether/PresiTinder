import { useEffect, useRef, useState, type ReactNode } from "react";
import { CANDIDATES, bySlug } from "../data/candidates";
import PlanLink from "./PlanLink";
import wordfreq from "../data/wordfreq.json";
import aiscore from "../data/aiscore.json";
import { asset } from "../lib/asset";
import { SCALE, SEMANTIC, type Dim } from "../data/quiz";

interface WordEntry {
  w: string;
  n: number;
}

interface DocStats {
  totalWords: number;
  top: WordEntry[];
  distinctive: WordEntry[];
}

const stats = wordfreq as Record<string, DocStats>;
const ai = aiscore as Record<string, number>;

const DIMS: { key: Dim; label: string; left: string; right: string }[] = [
  { key: "econ", label: "Economia", left: "+ Estado", right: "+ Mercado" },
  { key: "welfare", label: "Dir. sociais", left: "Expandir", right: "Conter" },
  { key: "social", label: "Costumes", left: "Progressista", right: "Conservador" },
  { key: "seguranca", label: "Segurança", left: "Prevenção", right: "Punição" },
  { key: "ambiente", label: "Ambiente", left: "Clima 1º", right: "Agro 1º" },
  { key: "instituicoes", label: "Instituições", left: "Refundar", right: "Conter" },
  { key: "soberania", label: "Brasil no mundo", left: "Soberania", right: "Integração" },
  { key: "metodo", label: "Método", left: "Ruptura", right: "Gestão" },
];

/** diverging scale: red (left) → paper (0) → blue (right) */
function cellColor(v: number): string {
  const t = Math.max(-SCALE, Math.min(SCALE, v)) / SCALE;
  if (t < 0) {
    const a = -t;
    return `rgba(214, 53, 44, ${0.12 + a * 0.75})`;
  }
  const a = t;
  return `rgba(27, 63, 143, ${a === 0 ? 0.04 : 0.12 + a * 0.75})`;
}

/** traffic-light grading requested for the AI estimate */
function aiColor(score: number): string {
  if (score >= 90) return "#d6352c";
  if (score >= 60) return "#f26522";
  if (score >= 30) return "#e3a008";
  return "#0e7a4e";
}

const ORDERED = [...CANDIDATES].sort(
  (a, b) => SEMANTIC[a.slug].scores.econ - SEMANTIC[b.slug].scores.econ,
);

const AI_RANKED = Object.entries(ai)
  .map(([slug, score]) => ({ c: bySlug[slug], score }))
  .filter((e) => e.c)
  .sort((a, b) => b.score - a.score);

const IconRobot = () => (
  <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">
    <g fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="8" width="16" height="11" rx="3" />
      <path d="M12 5.2V8M8.5 22h7" />
      <circle cx="12" cy="3.6" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="9.2" cy="13" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="14.8" cy="13" r="1.3" fill="currentColor" stroke="none" />
    </g>
  </svg>
);

/**
 * Lights the pink keyword in a heading the first time it scrolls into view.
 * One-shot: re-lighting on every pass turns the page into a strobe.
 */
function useLit<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [lit, setLit] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setLit(true);
        io.disconnect();
      },
      { threshold: 0.55 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, lit] as const;
}

function SectionTitle({
  children,
  sub,
}: {
  children: ReactNode;
  sub?: ReactNode;
}) {
  const [ref, lit] = useLit<HTMLDivElement>();
  return (
    <div className={`section-divider${lit ? " lit" : ""}`} ref={ref}>
      <h3>{children}</h3>
      {sub && <p>{sub}</p>}
    </div>
  );
}

function WordBars({ words, color }: { words: WordEntry[]; color: string }) {
  const max = words[0]?.n ?? 1;
  return (
    <div className="wordbars">
      {words.map((e) => (
        <div className="wordbar-row" key={e.w}>
          <span className="wordbar-label">{e.w}</span>
          <div className="wordbar-track">
            <div
              className="wordbar-fill"
              style={{ width: `${(e.n / max) * 100}%`, background: color }}
            />
          </div>
          <span className="wordbar-n">{e.n}</span>
        </div>
      ))}
    </div>
  );
}

export default function Propostas() {
  const [headRef, headLit] = useLit<HTMLDivElement>();
  return (
    <section>
      <div className={`prop-header${headLit ? " lit" : ""}`} ref={headRef}>
        <h2>
          Quanto a <span className="hl-word">IA ajudou</span> no plano?
        </h2>
        <p>
          Estimativas do{" "}
          <a
            href="https://www.pangram.com/research/model-card/pangram-4"
            target="_blank"
            rel="noreferrer"
          >
            Pangram 4.0
          </a>{" "}
          — você pode reproduzir por conta
        </p>
      </div>
      <div className="ai-grid">
        {AI_RANKED.map(({ c, score }) => (
          <article className="card ai-box" key={c.slug}>
            {score >= 95 && (
              <span
                className="ai-robot"
                title="Praticamente todo o documento foi classificado como escrito por IA"
              >
                <IconRobot />
              </span>
            )}
            <img
              className="ai-avatar"
              src={asset(`candidatos/${c.slug}.jpg`)}
              alt={c.name}
            />
            <div className="ai-pct" style={{ color: aiColor(score) }}>
              {score}%
            </div>
            <div className="ai-name">
              <PlanLink slug={c.slug}>{c.name}</PlanLink>
            </div>
            <div
              className="ai-bar"
              style={{ width: `${score}%`, background: aiColor(score) }}
            />
          </article>
        ))}
      </div>
      <SectionTitle>
        <span className="hl-word">Palavras</span> mais repetidas
      </SectionTitle>

      <div className="prop-grid">
        {CANDIDATES.map((c) => (
          <article className="card cand-card" key={c.slug}>
            <div className="cand-head">
              <img
                className="cand-photo"
                src={asset(`candidatos/${c.slug}.jpg`)}
                alt={c.name}
              />
              <div>
                <div className="cand-name">
                  <PlanLink slug={c.slug}>{c.name}</PlanLink>
                </div>
                <div className="cand-party">{c.party}</div>
              </div>
              <div className="cand-word">{stats[c.slug].top[0].w}</div>
            </div>
            <WordBars words={stats[c.slug].top.slice(0, 7)} color={c.color} />
          </article>
        ))}
      </div>

      <SectionTitle
        sub="Termos estatisticamente distintivos de cada documento (TF-IDF)"
      >
        <span className="hl-word">O que é único</span> de cada candidato
      </SectionTitle>
      <div className="prop-grid">
        {CANDIDATES.map((c) => (
          <article className="card chip-card" key={c.slug}>
            <div className="chip-owner">
              <span className="chip-dot" style={{ background: c.color }} />
              <PlanLink slug={c.slug}>{c.name}</PlanLink>
            </div>
            <div className="chips">
              {stats[c.slug].distinctive.slice(0, 5).map((e) => (
                <span className="chip" key={e.w}>
                  {e.w}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>

      <SectionTitle>
        <span className="hl-word">Quantas palavras</span> tem o plano?
      </SectionTitle>
      <div className="card" style={{ padding: "22px 26px" }}>
        <div className="wordbars">
          {[...CANDIDATES]
            .sort((a, b) => stats[b.slug].totalWords - stats[a.slug].totalWords)
            .map((c) => {
              const max = Math.max(
                ...CANDIDATES.map((x) => stats[x.slug].totalWords),
              );
              const n = stats[c.slug].totalWords;
              return (
                <div className="wordbar-row size-row" key={c.slug}>
                  <span className="wordbar-label">
                    <PlanLink slug={c.slug}>{c.name}</PlanLink>
                  </span>
                  <div className="wordbar-track">
                    <div
                      className="wordbar-fill"
                      style={{ width: `${(n / max) * 100}%`, background: c.color }}
                    />
                  </div>
                  <span className="wordbar-n">
                    {(n / 1000).toFixed(1).replace(".", ",")} mil
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      <SectionTitle>
        A <span className="hl-word">matriz semântica</span>
      </SectionTitle>
      <Matrix />
    </section>
  );
}

interface Tip {
  x: number;
  y: number;
  below: boolean;
  title: string;
  body: string;
}

function Matrix() {
  // The table scrolls horizontally, and a scroll container clips absolutely
  // positioned children — so the tooltip is a single fixed-position node
  // placed from the hovered cell's rect instead of living inside the cell.
  const [tip, setTip] = useState<Tip | null>(null);

  const show = (el: HTMLElement, title: string, body: string) => {
    const r = el.getBoundingClientRect();
    const below = r.top < 190;
    setTip({
      x: Math.min(Math.max(r.left + r.width / 2, 170), window.innerWidth - 170),
      y: below ? r.bottom + 10 : r.top - 10,
      below,
      title,
      body,
    });
  };

  return (
    <div className="card matrix-card">
      <table className="heat-table">
        <thead>
          <tr>
            <th />
            {DIMS.map((d) => (
              <th key={d.key}>
                <div>{d.label}</div>
                <span className="heat-poles">
                  {d.left} ↔ {d.right}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ORDERED.map((c) => (
            <tr key={c.slug}>
              <td className="heat-name">
                <img src={asset(`candidatos/${c.slug}.jpg`)} alt="" />
                <PlanLink slug={c.slug}>{c.name}</PlanLink>
              </td>
              {DIMS.map((d) => {
                const v = SEMANTIC[c.slug].scores[d.key];
                const ev = SEMANTIC[c.slug].evidencia[d.key];
                const title = `${c.name} · ${d.label} ${v > 0 ? `+${v}` : v}`;
                const body = ev.startsWith("ausente") ? ev : `“${ev}”`;
                return (
                  <td key={d.key}>
                    {/* The native title= attribute waits about a second
                        before showing, which read as broken. */}
                    <div
                      className="heat-cell"
                      style={{ background: cellColor(v) }}
                      tabIndex={0}
                      onMouseEnter={(e) => show(e.currentTarget, title, body)}
                      onFocus={(e) => show(e.currentTarget, title, body)}
                      onMouseLeave={() => setTip(null)}
                      onBlur={() => setTip(null)}
                    >
                      {v > 0 ? `+${v}` : v}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="heat-hint">
        Passe o mouse numa célula para ver a citação do plano que justifica a
        nota.
      </p>
      {tip && (
        <div
          className={`heat-tip${tip.below ? " below" : ""}`}
          role="tooltip"
          style={{ left: tip.x, top: tip.y }}
        >
          <strong>{tip.title}</strong>
          {tip.body}
        </div>
      )}
    </div>
  );
}
