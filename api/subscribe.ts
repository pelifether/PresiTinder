/**
 * POST /api/subscribe  {"email": "..."}  →  200 {"ok": true}
 *
 * Write-only on purpose: there is deliberately no endpoint that lists, reads
 * or exports what was collected. Storage is Upstash Redis over its REST API
 * (encrypted at rest, free tier, nothing of it exposed to the web).
 *
 * The store is optional. Until the owner provisions it the credentials are
 * absent, and then this still answers 200 — the results page unlocks either
 * way — while warning in the server logs. The response body is identical in
 * both cases, so it never reveals whether storage is configured.
 */

/** Anything longer than this is not an email address. */
const MAX_BODY = 1024;
const MAX_EMAIL = 254;

/** Deliberately conservative: one @, a dotted domain, no whitespace. */
const EMAIL = /^[^\s@,;:<>()[\]\\"]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 8;
/** Bounds the memory a single warm instance can be made to hold. */
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

function credentials(): { url: string; token: string } | null {
  const env = process.env;
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/+$/, ""), token } : null;
}

let warned = false;

/** Best effort: a storage failure must never fail the request. */
async function store(email: string): Promise<void> {
  const creds = credentials();
  if (!creds) {
    if (!warned) {
      warned = true;
      console.warn(
        "subscribe: no KV_REST_API_URL/KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_*) set — emails are being accepted and discarded",
      );
    }
    return;
  }
  const now = new Date().toISOString();
  const res = await fetch(`${creds.url}/pipeline`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${creds.token}`,
      "content-type": "application/json",
    },
    // SADD dedupes the address; HSETNX keeps the first time we saw it.
    body: JSON.stringify([
      ["SADD", "subscribers", email],
      ["HSETNX", "subscribers:first_seen", email, now],
    ]),
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) throw new Error(`upstash HTTP ${res.status}`);
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

export async function subscribe(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return json(405, { ok: false, error: "method_not_allowed" });
  }
  if (Number(req.headers.get("content-length") || 0) > MAX_BODY) {
    return json(413, { ok: false, error: "too_large" });
  }
  if (rateLimited(clientIp(req))) {
    return json(429, { ok: false, error: "rate_limited" });
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY) return json(413, { ok: false, error: "too_large" });

  let email: unknown;
  try {
    email = (JSON.parse(raw) as { email?: unknown }).email;
  } catch {
    return json(400, { ok: false, error: "invalid_json" });
  }
  if (typeof email !== "string") return json(400, { ok: false, error: "invalid_email" });

  const normalized = email.trim().toLowerCase();
  if (normalized.length > MAX_EMAIL || !EMAIL.test(normalized)) {
    return json(400, { ok: false, error: "invalid_email" });
  }

  try {
    await store(normalized);
  } catch (err) {
    // The visitor's unlock does not depend on our storage working.
    console.error("subscribe: could not persist address", err);
  }
  return json(200, { ok: true });
}

export default { fetch: subscribe };
