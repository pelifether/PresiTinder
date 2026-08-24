/**
 * The silent theme experiment. Full protocol in EXPERIMENT.md (linked from
 * the footer — it was never meant to be a secret, just quiet).
 *
 * Each visitor is randomly assigned one of six color bundles, each in the
 * palette of a major party, and keeps it across visits. If the theme nudges
 * answers, the between-arm differences will show it.
 *
 * There is no server. Finished runs are appended to localStorage and encoded
 * into the URL hash, so every shared result link carries its own datum.
 */

export interface Bundle {
  id: string;
  party: string;
  emoji: string;
}

export const BUNDLES: Bundle[] = [
  { id: "pt", party: "PT", emoji: "⭐" },
  { id: "pl", party: "PL", emoji: "🇧🇷" },
  { id: "psd", party: "PSD", emoji: "🤝" },
  { id: "novo", party: "NOVO", emoji: "🍊" },
  { id: "missao", party: "MISSÃO", emoji: "🚀" },
  { id: "pco", party: "PCO", emoji: "✊" },
];

const BUNDLE_KEY = "pt_bundle";
const RUNS_KEY = "pt_runs";

function assign(): Bundle {
  const pick = BUNDLES[Math.floor(Math.random() * BUNDLES.length)];
  try {
    const saved = localStorage.getItem(BUNDLE_KEY);
    const found = BUNDLES.find((b) => b.id === saved);
    if (found) return found;
    localStorage.setItem(BUNDLE_KEY, pick.id);
  } catch {
    // storage blocked: the visitor still gets an arm, just not a sticky one
  }
  return pick;
}

/** Assigned once per page load, stable across visits via localStorage. */
export const BUNDLE: Bundle = assign();

export interface RunRecord {
  v: 1;
  /** epoch seconds */
  t: number;
  /** bundle id */
  b: string;
  /** served question ids, in order */
  q: string[];
  /** answers aligned with q: -1 não, 0 pulou, 1 sim */
  a: number[];
  /** slug of the matched plan */
  m: string;
  /** affinity of the match, 0-100 */
  p: number;
}

export function logRun(rec: RunRecord): void {
  try {
    const runs = JSON.parse(localStorage.getItem(RUNS_KEY) ?? "[]");
    runs.push(rec);
    localStorage.setItem(RUNS_KEY, JSON.stringify(runs));
  } catch {
    /* storage blocked */
  }
  try {
    const b64 = btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(rec))))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    history.replaceState(null, "", `#r=${b64}`);
  } catch {
    /* non-browser env */
  }
}
