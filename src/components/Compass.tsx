import { motion } from "framer-motion";
import { CANDIDATES } from "../data/candidates";
import { candidateAnswers, compassFromAnswers } from "../data/quiz";

const SIZE = 560;
const PAD = 64;

const toPx = (v: number) => PAD + ((v + 2) / 4) * (SIZE - 2 * PAD);

// Several plans score identically (the far-left cluster) or nearly so
// (the center-right pack). Deterministic pixel jitter keeps every dot
// visible; label anchors are hand-placed to avoid collisions.
const JITTER: Record<string, [number, number]> = {
  "edmilson-costa": [-12, -10],
  "hertz-dias": [12, -2],
  samara: [-2, 14],
  "augusto-cury": [8, -4],
  "ronaldo-caiado": [-6, 8],
};

const LABEL: Record<
  string,
  { dx: number; dy: number; anchor?: "start" | "middle" | "end" }
> = {
  "edmilson-costa": { dx: 14, dy: -14, anchor: "start" },
  "hertz-dias": { dx: 14, dy: 4, anchor: "start" },
  samara: { dx: 8, dy: 24, anchor: "start" },
  "rui-costa-pimenta": { dx: 12, dy: -12, anchor: "start" },
  lula: { dx: 0, dy: -14 },
  "clariana-barao": { dx: -12, dy: 4, anchor: "end" },
  "wilson-grassi": { dx: -12, dy: -12, anchor: "end" },
  "augusto-cury": { dx: 14, dy: 4, anchor: "start" },
  "ronaldo-caiado": { dx: -2, dy: 26 },
  "flavio-bolsonaro": { dx: -12, dy: 2, anchor: "end" },
  "renan-santos": { dx: 4, dy: -16, anchor: "start" },
  zema: { dx: 0, dy: -14 },
};

// SVG y grows downward; conservative is up, so invert y.
const CAND_POS = CANDIDATES.filter((c) => c.hasPlan).map((c) => {
  const p = compassFromAnswers(candidateAnswers(c.slug));
  const [jx, jy] = JITTER[c.slug] ?? [0, 0];
  return { ...c, px: toPx(p.x) + jx, py: toPx(-p.y) + jy };
});

interface Props {
  user: { x: number; y: number } | null;
  /** bump key: changes on every answer to trigger the squish */
  pulse: number;
  highlight?: string;
}

export default function Compass({ user, pulse, highlight }: Props) {
  return (
    <div className="compass-wrap">
      <div className="compass-title">Sua posição no mapa político</div>
      <svg
        className="compass-svg"
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label="Mapa político bidimensional"
      >
        {/* quadrant tints */}
        <rect x={PAD} y={PAD} width={(SIZE - 2 * PAD) / 2} height={(SIZE - 2 * PAD) / 2} fill="#d6352c" opacity="0.05" />
        <rect x={SIZE / 2} y={PAD} width={(SIZE - 2 * PAD) / 2} height={(SIZE - 2 * PAD) / 2} fill="#1b3f8f" opacity="0.05" />
        <rect x={PAD} y={SIZE / 2} width={(SIZE - 2 * PAD) / 2} height={(SIZE - 2 * PAD) / 2} fill="#0e7a4e" opacity="0.05" />
        <rect x={SIZE / 2} y={SIZE / 2} width={(SIZE - 2 * PAD) / 2} height={(SIZE - 2 * PAD) / 2} fill="#f26522" opacity="0.05" />

        <rect
          x={PAD}
          y={PAD}
          width={SIZE - 2 * PAD}
          height={SIZE - 2 * PAD}
          fill="none"
          stroke="#191512"
          strokeWidth="2.5"
          rx="10"
        />
        {/* axes */}
        <line x1={SIZE / 2} y1={PAD} x2={SIZE / 2} y2={SIZE - PAD} stroke="#191512" strokeWidth="1.4" strokeDasharray="5 6" opacity="0.5" />
        <line x1={PAD} y1={SIZE / 2} x2={SIZE - PAD} y2={SIZE / 2} stroke="#191512" strokeWidth="1.4" strokeDasharray="5 6" opacity="0.5" />

        {/* axis labels */}
        <text x={SIZE / 2} y={PAD - 34} textAnchor="middle" className="ax-label">
          CONSERVADOR
        </text>
        <text x={SIZE / 2} y={SIZE - PAD + 44} textAnchor="middle" className="ax-label">
          PROGRESSISTA
        </text>
        <text x={PAD - 34} y={SIZE / 2} textAnchor="middle" className="ax-label" transform={`rotate(-90 ${PAD - 34} ${SIZE / 2})`}>
          + ESTADO
        </text>
        <text x={SIZE - PAD + 34} y={SIZE / 2} textAnchor="middle" className="ax-label" transform={`rotate(90 ${SIZE - PAD + 34} ${SIZE / 2})`}>
          + MERCADO
        </text>

        {/* candidates */}
        {CAND_POS.map((c) => {
          const hl = highlight === c.slug;
          const lb = LABEL[c.slug] ?? { dx: 0, dy: -12 };
          return (
            <g key={c.slug} opacity={highlight ? (hl ? 1 : 0.35) : 0.85}>
              <circle cx={c.px} cy={c.py} r={hl ? 11 : 7} fill={c.color} stroke="#191512" strokeWidth="2" />
              <text
                x={c.px + lb.dx}
                y={c.py + lb.dy}
                textAnchor={lb.anchor ?? "middle"}
                className={`cand-label ${hl ? "hl" : ""}`}
              >
                {c.name}
              </text>
            </g>
          );
        })}

        {/* user dot */}
        {user && (
          <motion.g
            initial={false}
            animate={{ x: toPx(user.x), y: toPx(-user.y) }}
            transition={{ type: "spring", stiffness: 260, damping: 16, mass: 0.9 }}
          >
            <motion.g
              key={pulse}
              animate={{
                scaleX: [1, 1.45, 0.75, 1.15, 1],
                scaleY: [1, 0.65, 1.35, 0.9, 1],
              }}
              transition={{ duration: 0.55, ease: "easeOut" }}
            >
              <circle r="13" fill="#ffd23f" stroke="#191512" strokeWidth="3" />
              <circle r="4.5" fill="#191512" />
            </motion.g>
            <text y={30} textAnchor="middle" className="you-label">
              VOCÊ
            </text>
          </motion.g>
        )}
      </svg>
    </div>
  );
}
