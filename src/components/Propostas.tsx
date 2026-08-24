import { CANDIDATES, bySlug } from "../data/candidates";
import wordfreq from "../data/wordfreq.json";
import aiscore from "../data/aiscore.json";
import { asset } from "../lib/asset";
import { SEMANTIC, type Dim } from "../data/quiz";

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
const ai = aiscore as Record<string, { score: number }>;

const DIMS: { key: Dim; label: string; left: string; right: string }[] = [
  { key: "econ", label: "Economia", left: "+ Estado", right: "+ Mercado" },
  { key: "welfare", label: "Dir. sociais", left: "Expandir", right: "Conter" },
  { key: "social", label: "Costumes", left: "Progressista", right: "Conservador" },
  { key: "seguranca", label: "Segurança", left: "Prevenção", right: "Punição" },
  { key: "ambiente", label: "Ambiente", left: "Clima 1º", right: "Agro 1º" },
  { key: "instituicoes", label: "Instituições", left: "Refundar", right: "Conter" },
];

/** diverging scale: red (left) → paper (0) → blue (right) */
function cellColor(v: number): string {
  const t = Math.max(-2, Math.min(2, v)) / 2;
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
  .map(([slug, v]) => ({ c: bySlug[slug], score: v.score }))
  .filter((e) => e.c)
  .sort((a, b) => b.score - a.score);

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
  return (
    <section>
      <div className="prop-header">
        <h2>Quanto a IA ajudou no plano?</h2>
        <p>
          Estimativa estilométrica aberta: frases-clichê típicas de IA,
          uniformidade das frases, travessões e aberturas repetidas.
        </p>
      </div>
      <div className="ai-grid">
        {AI_RANKED.map(({ c, score }) => (
          <article className="card ai-box" key={c.slug}>
            <img
              className="ai-avatar"
              src={asset(`candidatos/${c.slug}.jpg`)}
              alt={c.name}
            />
            <div className="ai-pct" style={{ color: aiColor(score) }}>
              {score}%
            </div>
            <div className="ai-name">{c.name}</div>
            <div
              className="ai-bar"
              style={{ width: `${score}%`, background: aiColor(score) }}
            />
          </article>
        ))}
      </div>
      <p className="heat-hint">
        Não é um detector treinado (como Pangram ou GPTZero) — trate como
        indício, não veredito. Nenhum plano tem cara de IA pura; o método está
        aberto em <code>pipeline/aidetect.py</code>.
      </p>

      <div className="section-divider">
        <h3>Palavra mais repetida em cada plano</h3>
      </div>

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
                <div className="cand-name">{c.name}</div>
                <div className="cand-party">{c.party}</div>
              </div>
              <div className="cand-word">{stats[c.slug].top[0].w}</div>
            </div>
            <WordBars words={stats[c.slug].top.slice(0, 10)} color={c.color} />
          </article>
        ))}
      </div>

      <div className="section-divider">
        <h3>A matriz semântica</h3>
      </div>
      <div className="card" style={{ overflowX: "auto", padding: 18 }}>
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
                  {c.name}
                </td>
                {DIMS.map((d) => {
                  const v = SEMANTIC[c.slug].scores[d.key];
                  return (
                    <td key={d.key}>
                      <div
                        className="heat-cell"
                        style={{ background: cellColor(v) }}
                        title={`${d.label}: ${v > 0 ? "+" : ""}${v} — "${SEMANTIC[c.slug].evidencia[d.key]}"`}
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
      </div>

      <div className="section-divider">
        <h3>O que é único de cada candidato</h3>
        <p>
          Termos estatisticamente distintivos de cada documento (TF-IDF): o
          vocabulário que um candidato usa e os outros não.
        </p>
      </div>
      <div className="prop-grid">
        {CANDIDATES.map((c) => (
          <article className="card chip-card" key={c.slug}>
            <div className="chip-owner">
              <span className="chip-dot" style={{ background: c.color }} />
              {c.name}
            </div>
            <div className="chips">
              {stats[c.slug].distinctive.slice(0, 6).map((e) => (
                <span className="chip" key={e.w}>
                  {e.w}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="section-divider">
        <h3>Quantas palavras tem o plano?</h3>
      </div>
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
                  <span className="wordbar-label">{c.name}</span>
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
    </section>
  );
}
