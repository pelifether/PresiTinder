import { motion } from "framer-motion";
import { CANDIDATES } from "../data/candidates";
import { candidateCompass } from "../data/quiz";

const SIZE = 560;
const PAD = 64;
// Extra inset so a plan at the extreme (−1) lands inside the frame instead of
// sitting on the border line.
const INSET = 30;
const SPAN = SIZE - 2 * PAD - 2 * INSET;

const toPx = (v: number) => PAD + INSET + ((v + 1) / 2) * SPAN;

// Some plans land on the exact same coordinates (the three far-left programmes
// score identically) or within a dot's width of each other. Deterministic
// nudges keep every candidate visible; label offsets are hand-placed so no two
// names collide.
// The three identical far-left plans are dealt as a tight vertical stack: it
// reads as one cluster rather than pretending they hold different positions.
// The three rupture-left plans land within ~10px of each other in the
// bottom-left corner; fan them out vertically so the labels stay readable.
const NUDGE: Record<string, [number, number]> = {
  "edmilson-costa": [0, -22],
  samara: [0, 0],
  "hertz-dias": [0, 22],
  "ronaldo-caiado": [8, 7],
  "augusto-cury": [-6, -8],
};

const LABEL: Record<
  string,
  { dx: number; dy: number; anchor?: "start" | "middle" | "end" }
> = {
  "edmilson-costa": { dx: 13, dy: 4, anchor: "start" },
  "hertz-dias": { dx: 13, dy: 4, anchor: "start" },
  samara: { dx: 13, dy: 4, anchor: "start" },
  "rui-costa-pimenta": { dx: 13, dy: 8, anchor: "start" },
  lula: { dx: 0, dy: -14 },
  "clariana-barao": { dx: 0, dy: 22 },
  "wilson-grassi": { dx: 0, dy: -14 },
  "augusto-cury": { dx: 14, dy: 4, anchor: "start" },
  "ronaldo-caiado": { dx: 14, dy: 16, anchor: "start" },
  "flavio-bolsonaro": { dx: -14, dy: 2, anchor: "end" },
  "renan-santos": { dx: 10, dy: -12, anchor: "start" },
  zema: { dx: 0, dy: 24 },
};

// SVG y grows downward; conservative is up, so invert y.
const CAND_POS = CANDIDATES.map((c) => {
  const p = candidateCompass(c.slug);
  const [nx, ny] = NUDGE[c.slug] ?? [0, 0];
  return { ...c, px: toPx(p.x) + nx, py: toPx(-p.y) + ny };
});

interface Props {
  user: { x: number; y: number } | null;
  /** bump key: changes on every answer to trigger the squish */
  pulse: number;
  /** candidates stay hidden until the result is revealed */
  showCandidates?: boolean;
  /** slugs shown at full opacity; everyone else dims */
  highlight?: string[];
  /**
   * Thumbnail beside the matched photo. Candidate names are dropped: at a
   * fifth of the width the matched pair's labels overlap each other and the
   * VOCÊ marker, and the names are already set in 38px type right below it.
   */
  compact?: boolean;
}

export default function Compass({
  user,
  pulse,
  showCandidates = false,
  highlight,
  compact = false,
}: Props) {
  const q = (SIZE - 2 * PAD) / 2;
  const hasFocus = !!highlight?.length;
  return (
    <div className={`compass-wrap${compact ? " compact" : ""}`}>
      <svg
        className="compass-svg"
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label="Mapa político bidimensional"
      >
        {/* quadrant tints */}
        <rect x={PAD} y={PAD} width={q} height={q} fill="#d6352c" opacity="0.05" />
        <rect x={SIZE / 2} y={PAD} width={q} height={q} fill="#1b3f8f" opacity="0.05" />
        <rect x={PAD} y={SIZE / 2} width={q} height={q} fill="#0e7a4e" opacity="0.05" />
        <rect x={SIZE / 2} y={SIZE / 2} width={q} height={q} fill="#f26522" opacity="0.05" />

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

        {/* axis labels — dropped on the result thumbnail, the names are already
            under the photo and the poles just crowd a fifth-scale map. */}
        {!compact && (
          <>
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
          </>
        )}

        {/* candidates — only after the reveal */}
        {showCandidates &&
          CAND_POS.map((c, i) => {
            const hl = !!highlight?.includes(c.slug);
            const lb = LABEL[c.slug] ?? { dx: 0, dy: -12 };
            return (
              // Fade lives on the outer group so the reveal animation cannot
              // fight the inline dimming of the non-matched candidates.
              <g
                key={c.slug}
                className="cand-pop"
                style={{ animationDelay: `${i * 55}ms` }}
              >
                <g opacity={hasFocus ? (hl ? 1 : 0.3) : 0.85}>
                  <circle cx={c.px} cy={c.py} r={hl ? 11 : 7} fill={c.color} stroke="#191512" strokeWidth="2" />
                  {!compact && (
                    <text
                      x={c.px + lb.dx}
                      y={c.py + lb.dy}
                      textAnchor={lb.anchor ?? "middle"}
                      className={`cand-label ${hl ? "hl" : ""}`}
                    >
                      {c.name}
                    </text>
                  )}
                </g>
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
            {/* idle float: suggests the dot is alive and can move anytime.
                CSS keyframes, because framer-motion keyframes silently no-op
                on SVG <g> elements. Squish replays on remount via key. */}
            <g className="you-float">
              <g className="you-squish" key={pulse}>
                <circle r="13" fill="#ffd23f" stroke="#191512" strokeWidth="3" />
                <circle r="4.5" fill="#191512" />
              </g>
            </g>
            <text y={30} textAnchor="middle" className="you-label">
              VOCÊ
            </text>
          </motion.g>
        )}
      </svg>
    </div>
  );
}
