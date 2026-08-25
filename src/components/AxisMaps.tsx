import { useEffect, useMemo, useRef, useState } from "react";
import { CANDIDATES } from "../data/candidates";
import {
  AXIS_PAIRS,
  SCALE,
  SEMANTIC,
  userProfile,
  type Answer,
  type AxisPair,
  type Dim,
  type Question,
} from "../data/quiz";

const SIZE = 320;
const PAD = 40;
const INSET = 16;
const SPAN = SIZE - 2 * PAD - 2 * INSET;
const toPx = (v: number) => PAD + INSET + ((v + 1) / 2) * SPAN;
const clamp1 = (v: number) => Math.max(-1, Math.min(1, v));

interface Dot {
  slug: string;
  name: string;
  color: string;
  px: number;
  py: number;
}

/**
 * Plans are scored in half-point steps on a −4…+4 scale, so on any single
 * pair of dimensions several of them land on the exact same coordinate. Fan
 * co-located dots around a small ring instead of stacking them: the position
 * stays honest to within a few pixels and nobody disappears under a
 * neighbour. Order comes from CANDIDATES, so the fan never reshuffles.
 */
function fanOut(dots: Dot[]): Dot[] {
  const groups = new Map<string, Dot[]>();
  for (const d of dots) {
    const key = `${Math.round(d.px / 7)}|${Math.round(d.py / 7)}`;
    const bucket = groups.get(key) ?? [];
    bucket.push(d);
    groups.set(key, bucket);
  }
  const out: Dot[] = [];
  for (const group of groups.values()) {
    if (group.length === 1) {
      out.push(group[0]);
      continue;
    }
    const r = 6 + group.length;
    group.forEach((d, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / group.length;
      out.push({ ...d, px: d.px + r * Math.cos(a), py: d.py + r * Math.sin(a) });
    });
  }
  return out;
}

function positions(pair: AxisPair): Dot[] {
  return fanOut(
    CANDIDATES.map((c) => {
      const s = SEMANTIC[c.slug].scores;
      return {
        slug: c.slug,
        name: c.name,
        color: c.color,
        px: toPx(clamp1(s[pair.x.dim] / SCALE)),
        // SVG y grows downward and the positive pole belongs on top.
        py: toPx(-clamp1(s[pair.y.dim] / SCALE)),
      };
    }),
  );
}

const DOTS = new Map(AXIS_PAIRS.map((p) => [p.id, positions(p)]));

function Panel({
  pair,
  user,
  highlight,
}: {
  pair: AxisPair;
  user: Partial<Record<Dim, number>>;
  highlight: string[];
}) {
  const dots = DOTS.get(pair.id)!;
  const ux = user[pair.x.dim];
  const uy = user[pair.y.dim];
  const q = (SIZE - 2 * PAD) / 2;

  return (
    <figure className="axis-panel">
      <figcaption>{pair.title}</figcaption>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={pair.title}>
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
          strokeWidth="2.2"
          rx="8"
        />
        <line x1={SIZE / 2} y1={PAD} x2={SIZE / 2} y2={SIZE - PAD} stroke="#191512" strokeWidth="1.2" strokeDasharray="4 5" opacity="0.5" />
        <line x1={PAD} y1={SIZE / 2} x2={SIZE - PAD} y2={SIZE / 2} stroke="#191512" strokeWidth="1.2" strokeDasharray="4 5" opacity="0.5" />

        <text x={SIZE / 2} y={PAD - 14} textAnchor="middle" className="axm-label">
          {pair.y.pos}
        </text>
        <text x={SIZE / 2} y={SIZE - PAD + 24} textAnchor="middle" className="axm-label">
          {pair.y.neg}
        </text>
        <text x={PAD - 14} y={SIZE / 2} textAnchor="middle" className="axm-label" transform={`rotate(-90 ${PAD - 14} ${SIZE / 2})`}>
          {pair.x.neg}
        </text>
        <text x={SIZE - PAD + 14} y={SIZE / 2} textAnchor="middle" className="axm-label" transform={`rotate(90 ${SIZE - PAD + 14} ${SIZE / 2})`}>
          {pair.x.pos}
        </text>

        {dots.map((d) => {
          const rank = highlight.indexOf(d.slug);
          const hl = rank >= 0;
          // A tie puts the winners within a few pixels of each other, so
          // alternate their labels above and below the dot.
          const dy = rank % 2 === 0 ? -13 : 21;
          return (
            <g key={d.slug} opacity={hl ? 1 : 0.3}>
              <circle cx={d.px} cy={d.py} r={hl ? 8.5 : 5.5} fill={d.color} stroke="#191512" strokeWidth="1.8" />
              {hl && (
                <text x={d.px} y={d.py + dy} textAnchor="middle" className="axm-name">
                  {d.name}
                </text>
              )}
            </g>
          );
        })}

        {ux !== undefined && uy !== undefined && (
          <g transform={`translate(${toPx(clamp1(ux / SCALE))} ${toPx(-clamp1(uy / SCALE))})`}>
            <circle r="9" fill="#ffd23f" stroke="#191512" strokeWidth="2.4" />
            <circle r="3" fill="#191512" />
            <text y={22} textAnchor="middle" className="axm-you">
              VOCÊ
            </text>
          </g>
        )}
      </svg>
    </figure>
  );
}

/** px per second — slow enough to read, fast enough to notice */
const SPEED = 22;

interface Props {
  session: Question[];
  answers: Record<string, Answer>;
  highlight: string[];
}

export default function AxisMaps({ session, answers, highlight }: Props) {
  const user = useMemo(() => userProfile(session, answers), [session, answers]);
  const track = useRef<HTMLDivElement>(null);
  const [manual, setManual] = useState(false);

  // Bounces between the ends rather than jumping back to zero: a wrap needs
  // duplicated panels to look seamless, and duplicates would leave a manual
  // scroller staring at the same four maps twice.
  useEffect(() => {
    if (manual) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let last = performance.now();
    let dir = 1;
    let pos = track.current?.scrollLeft ?? 0;
    const step = (t: number) => {
      const el = track.current;
      if (el) {
        const max = el.scrollWidth - el.clientWidth;
        if (max > 1) {
          pos += (dir * SPEED * (t - last)) / 1000;
          if (pos >= max) {
            pos = max;
            dir = -1;
          } else if (pos <= 0) {
            pos = 0;
            dir = 1;
          }
          el.scrollLeft = pos;
        }
      }
      last = t;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [manual]);

  return (
    <div className="axis-maps">
          <div className="axis-maps-top">
        {manual ? (
          <button className="axis-maps-btn" onClick={() => setManual(false)}>
            retomar
          </button>
        ) : (
          <span className="axis-maps-hint">toque para navegar</span>
        )}
      </div>
      <div
        className={`axis-track${manual ? " manual" : ""}`}
        ref={track}
        onPointerDown={() => setManual(true)}
        onWheel={() => setManual(true)}
      >
        {AXIS_PAIRS.map((p) => (
          <Panel key={p.id} pair={p} user={user} highlight={highlight} />
        ))}
      </div>
    </div>
  );
}
