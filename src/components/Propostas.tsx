import { CANDIDATES } from "../data/candidates";
import wordfreq from "../data/wordfreq.json";
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

const withPlan = CANDIDATES.filter((c) => c.hasPlan);
const ORDERED = [...withPlan].sort(
  (a, b) => SEMANTIC[a.slug].scores.econ - SEMANTIC[b.slug].scores.econ,
);

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
        <h2>O que cada plano repete</h2>
        <p>
          Palavras mais frequentes em cada plano de governo protocolado no
          TSE, tirando conectivos, chavões genéricos e nomes.
        </p>
      </div>

      <div className="prop-grid">
        {CANDIDATES.map((c) => (
          <article className="card cand-card" key={c.slug}>
            <div className="cand-head">
              <img
                className="cand-photo"
                src={`/candidatos/${c.slug}.jpg`}
                alt={c.name}
              />
              <div>
                <div className="cand-name">{c.name}</div>
                <div className="cand-party">{c.party}</div>
              </div>
              <div className="cand-number">{c.number}</div>
            </div>
            {c.hasPlan && stats[c.slug] ? (
              <WordBars words={stats[c.slug].top.slice(0, 10)} color={c.color} />
            ) : (
              <p className="no-plan-note">
                Não protocolou plano de governo no TSE até o registro da
                candidatura. Sem documento, sem análise.
              </p>
            )}
          </article>
        ))}
      </div>

      <div className="section-divider">
        <h3>A matriz semântica</h3>
        <p>
          Cada plano, lido por inteiro e pontuado nas mesmas 6 dimensões.
          Vermelho puxa para um lado, azul para o outro — a intensidade é a
          convicção do texto.
        </p>
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
                  <img src={`/candidatos/${c.slug}.jpg`} alt="" />
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
        <h3>O que só este plano fala</h3>
        <p>
          Termos estatisticamente distintivos de cada documento (TF-IDF): o
          vocabulário que um candidato usa e os outros não.
        </p>
      </div>
      <div className="prop-grid">
        {withPlan.map((c) => (
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
        <h3>Tamanho do plano</h3>
        <p>
          Palavras de conteúdo em cada documento. Detalhe não é garantia de
          qualidade — mas diz quanto o candidato se dispôs a pôr no papel.
        </p>
      </div>
      <div className="card" style={{ padding: "22px 26px" }}>
        <div className="wordbars">
          {[...withPlan]
            .sort((a, b) => stats[b.slug].totalWords - stats[a.slug].totalWords)
            .map((c) => {
              const max = Math.max(
                ...withPlan.map((x) => stats[x.slug].totalWords),
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
