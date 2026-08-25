/**
 * The share payload is a single URL path segment, so a result fits in a link
 * that survives being pasted anywhere:
 *
 *     https://presi-tinder.vercel.app/r/<idxs>_<pct>_<x100>_<y100>
 *     e.g. /r/4_86_-42_-31   → candidate 4, 86% affinity, user at (−0.42, −0.31)
 *
 * `idxs` is one or more indices into CANDIDATES joined by "." (more than one
 * when the quiz ended in a tie). Fields are separated by "_"; because negative
 * numbers use "-", splitting on "_" always yields exactly four fields.
 */
// Note the `.js` extension: these functions run as ESM, tsc emits import
// specifiers untouched, and Node's ESM resolver will not guess extensions.
import { CANDIDATES } from "./data.js";

export const SITE_NAME = "PresidenTinder";
export const SITE_TAGLINE = "dê match com um plano de governo";

/** A tie beyond three candidates is not worth rendering on a card. */
const MAX_MATCHES = 3;

export interface ShareResult {
  /** Indices into CANDIDATES; empty when the payload was unusable. */
  idxs: number[];
  /** Affinity, 0–100. */
  pct: number;
  /** User compass position, −1…+1 on each axis. */
  x: number;
  y: number;
  /** False when the input was missing or malformed and we fell back. */
  ok: boolean;
}

export const GENERIC: ShareResult = { idxs: [], pct: 0, x: 0, y: 0, ok: false };

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Strict integer parse: rejects "", "1e3", "1.5", "abc" and overlong input. */
function int(raw: string | undefined): number | null {
  if (!raw || raw.length > 6 || !/^-?\d+$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function parseIdxs(raw: string | undefined): number[] {
  if (!raw) return [];
  const seen = new Set<number>();
  for (const part of raw.split(".")) {
    const n = int(part);
    if (n === null || n < 0 || n >= CANDIDATES.length) continue;
    seen.add(n);
    if (seen.size >= MAX_MATCHES) break;
  }
  return [...seen];
}

function build(
  idxsRaw: string | undefined,
  pctRaw: string | undefined,
  xRaw: string | undefined,
  yRaw: string | undefined,
): ShareResult {
  const idxs = parseIdxs(idxsRaw);
  if (!idxs.length) return GENERIC;
  return {
    idxs,
    pct: clamp(int(pctRaw) ?? 0, 0, 100),
    x: clamp(int(xRaw) ?? 0, -100, 100) / 100,
    y: clamp(int(yRaw) ?? 0, -100, 100) / 100,
    ok: true,
  };
}

/** Parse `idxs_pct_x100_y100`. Never throws; falls back to a generic card. */
export function parsePayload(raw: string | null | undefined): ShareResult {
  if (!raw || raw.length > 64) return GENERIC;
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    /* a stray % is not worth a 500 */
  }
  const parts = decoded.split("_");
  if (parts.length !== 4) return GENERIC;
  return build(parts[0], parts[1], parts[2], parts[3]);
}

/** Parse the same fields spread across query params (`?i=&p=&x=&y=`). */
export function parseQuery(params: URLSearchParams): ShareResult {
  const packed = params.get("r");
  if (packed) return parsePayload(packed);
  return build(
    params.get("i") ?? undefined,
    params.get("p") ?? undefined,
    params.get("x") ?? undefined,
    params.get("y") ?? undefined,
  );
}

export function encodePayload(r: ShareResult): string {
  return [
    r.idxs.join("."),
    Math.round(r.pct),
    Math.round(r.x * 100),
    Math.round(r.y * 100),
  ].join("_");
}

/** The `/api/og` query string that renders this result. */
export function ogQuery(r: ShareResult): string {
  if (!r.ok) return "";
  const q = new URLSearchParams({
    i: r.idxs.join("."),
    p: String(Math.round(r.pct)),
    x: String(Math.round(r.x * 100)),
    y: String(Math.round(r.y * 100)),
  });
  return q.toString();
}

export function matched(r: ShareResult) {
  return r.idxs.map((i) => CANDIDATES[i]);
}

/** Human copy for the share page and the card, in pt-BR. */
export function describe(r: ShareResult) {
  const cands = matched(r);
  if (!cands.length) {
    return {
      names: "",
      headline: `${SITE_NAME} — ${SITE_TAGLINE}`,
      description:
        "10 perguntas pra descobrir qual plano de governo é o seu match.",
    };
  }
  const names = cands.map((c) => c.name).join(" e ");
  const parties = cands.map((c) => c.party).join("/");
  return {
    names,
    headline: `Deu match: ${names} (${parties}) — ${Math.round(r.pct)}% de afinidade`,
    description: `Respondi 10 cards sobre os planos de governo de 2026 e meu match foi ${names} (${parties}), com ${Math.round(r.pct)}% de afinidade. Faça o seu.`,
  };
}

/** Absolute origin of the current deployment, so previews work too. */
export function originOf(req: Request): string {
  const h = req.headers;
  const host = h.get("x-forwarded-host") || h.get("host");
  if (!host) return "https://presi-tinder.vercel.app";
  const proto =
    h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto.split(",")[0]}://${host.split(",")[0]}`;
}
