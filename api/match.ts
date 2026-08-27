/**
 * POST /api/match  {"slugs":["lula"],"nonce":"<uuid>"}  →  200 {"ok": true}
 *
 * Write-only tally of quiz matches. There is no GET, no list, no export.
 * Counts live in Upstash (`matches` hash, `matches:total`) and are read
 * in the Upstash console — same rule as the email list.
 *
 * A nonce is claimed with SET NX so a refresh or React Strict Mode remount
 * cannot increment twice. Unknown slugs are dropped, not stored. The
 * response never includes counts, and is identical with or without a store.
 */
import { CANDIDATES } from "./_lib/data.js";
import { redisCredentials, redisPipeline } from "./_lib/redis.js";

const MAX_BODY = 1024;
const KNOWN = new Set(CANDIDATES.map((c) => c.slug));
const MAX_WINNERS = 3;
const NONCE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 8;
const RATE_MAX_KEYS = 5000;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  if (hits.size > RATE_MAX_KEYS) hits.clear();
  hits.set(ip, recent);
  return recent.length > RATE_MAX;
}

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0] : req.headers.get("x-real-ip") || "").trim() || "unknown";
}

/** Same-origin POSTs only. Blocks browser CSRF; Origin is required. */
function originAllowed(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  let originHost: string;
  try {
    originHost = new URL(origin).hostname.toLowerCase();
  } catch {
    return false;
  }
  const reqHost = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "")
    .split(",")[0]
    .trim()
    .replace(/:\d+$/, "")
    .toLowerCase();
  return Boolean(reqHost) && originHost === reqHost;
}

function parseSlugs(raw: unknown): string[] | null {
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > MAX_WINNERS) return null;
  const slugs: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (typeof item !== "string" || !KNOWN.has(item) || seen.has(item)) return null;
    seen.add(item);
    slugs.push(item);
  }
  return slugs;
}

let warned = false;

async function store(slugs: string[], nonce: string): Promise<void> {
  if (!redisCredentials()) {
    if (!warned) {
      warned = true;
      console.warn(
        "match: no KV_REST_API_URL/KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_*) set — counts are being discarded",
      );
    }
    return;
  }

  // Claim the nonce first. Pipeline is not conditional: INCR in the same
  // batch would still fire on a replay.
  const claimed = await redisPipeline([
    ["SET", `matches:nonce:${nonce}`, "1", "NX", "EX", 86400],
  ]);
  if (!claimed || claimed[0]?.result !== "OK") return;

  await redisPipeline([
    ["INCR", "matches:total"],
    ...slugs.map((slug) => ["HINCRBY", "matches", slug, 1] as (string | number)[]),
  ]);
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

export async function recordMatch(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return json(405, { ok: false, error: "method_not_allowed" });
  }
  if (Number(req.headers.get("content-length") || 0) > MAX_BODY) {
    return json(413, { ok: false, error: "too_large" });
  }
  if (!originAllowed(req)) {
    return json(403, { ok: false, error: "forbidden" });
  }
  const ctype = (req.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (ctype !== "application/json") {
    return json(400, { ok: false, error: "invalid" });
  }
  if (rateLimited(clientIp(req))) {
    return json(429, { ok: false, error: "rate_limited" });
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY) return json(413, { ok: false, error: "too_large" });

  let body: { slugs?: unknown; nonce?: unknown };
  try {
    body = JSON.parse(raw) as { slugs?: unknown; nonce?: unknown };
  } catch {
    return json(400, { ok: false, error: "invalid_json" });
  }

  const slugs = parseSlugs(body.slugs);
  const nonce = typeof body.nonce === "string" ? body.nonce : "";
  if (!slugs || !NONCE.test(nonce)) {
    return json(400, { ok: false, error: "invalid" });
  }

  try {
    await store(slugs, nonce);
  } catch (err) {
    console.error("match: could not persist count", err);
  }
  return json(200, { ok: true });
}

export default { fetch: recordMatch };
