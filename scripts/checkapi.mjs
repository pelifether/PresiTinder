/**
 * Exercises the Vercel functions without deploying them.
 *
 *   node scripts/checkapi.mjs
 *
 * Each handler is a web handler (`export default { fetch }`), so it can be
 * called with a plain Request. The functions are bundled with esbuild the way
 * Vercel compiles them, but with node_modules left external — @vercel/og loads
 * a wasm renderer at runtime and does not survive being inlined. The output
 * therefore has to live inside the repo for resolution to work.
 *
 * The point of this is the PNG: font loading is what silently breaks, and the
 * only proof it works is a real image coming out the other end.
 */
import { build } from "esbuild";
import { mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "node_modules", ".cache", "checkapi");
const SAMPLES = "/tmp";
const HOST = "presi-tinder.vercel.app";

let failures = 0;
const ok = (msg) => console.log(`  ok   ${msg}`);
const fail = (msg) => {
  console.log(`  FAIL ${msg}`);
  failures++;
};
const check = (cond, msg) => (cond ? ok(msg) : fail(msg));

await mkdir(OUT, { recursive: true });
await build({
  entryPoints: ["api/og.tsx", "api/share.ts", "api/subscribe.ts"],
  outdir: OUT,
  outExtension: { ".js": ".mjs" },
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  packages: "external",
  logLevel: "warning",
});

const load = async (name) => (await import(path.join(OUT, `${name}.mjs`))).default;
const [og, share, subscribe] = await Promise.all([
  load("og"),
  load("share"),
  load("subscribe"),
]);

/** Requests carry the live host so the card can fetch the candidate photos. */
const req = (url, init = {}) =>
  new Request(`https://${HOST}${url}`, {
    ...init,
    headers: { host: HOST, "x-forwarded-proto": "https", ...(init.headers ?? {}) },
  });

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

async function png(name, query) {
  const res = await og.fetch(req(`/api/og${query}`));
  if (res.status !== 200) return fail(`${name}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const file = path.join(SAMPLES, `presidentinder-og-${name}.png`);
  await writeFile(file, buf);
  const [w, h] = [buf.readUInt32BE(16), buf.readUInt32BE(20)];
  check(buf.subarray(0, 8).equals(PNG_MAGIC), `${name}: PNG magic bytes`);
  check(buf.length > 20_000, `${name}: ${(buf.length / 1024).toFixed(0)} KB of image data`);
  check(w === 1200 && h === 630, `${name}: ${w}x${h}`);
  console.log(`       → ${file}`);
}

console.log("1. api/og");
await png("single", "?i=4&p=86&x=-42&y=-31");
await png("tie", "?i=0.6&p=91&x=-77&y=-40");
await png("generic", "?i=nope&p=999");

console.log("2. api/share");
{
  const res = await share.fetch(req("/r/4_86_-42_-31", { headers: { "x-forwarded-host": HOST } }));
  const html = await res.text();
  check(res.status === 200, `HTTP ${res.status}`);
  check(
    (res.headers.get("content-type") ?? "").startsWith("text/html"),
    `content-type ${res.headers.get("content-type")}`,
  );
  check(
    html.includes(`<meta property="og:image" content="https://${HOST}/api/og?i=4&amp;p=86&amp;x=-42&amp;y=-31" />`),
    "og:image points at the matching card",
  );
  check(html.includes("Deu match: Renan Santos (MISSÃO) — 86% de afinidade"), "title names the match");
  check(html.includes('location.replace("/?r=4_86_-42_-31")'), "browsers are sent into the app");
  check(html.includes('http-equiv="refresh"'), "noscript refresh fallback");
  check((res.headers.get("cache-control") ?? "").includes("s-maxage"), "cache-control set");

  const bad = await share.fetch(req("/r/%%%_"));
  const badHtml = await bad.text();
  check(bad.status === 200 && badHtml.includes("/og.png"), "malformed payload falls back to the generic card");

  const tie = await share.fetch(req("/r/0.6_91_-77_-40"));
  check((await tie.text()).includes("Lula e Edmilson Costa"), "ties name both candidates");
}

console.log("3. api/subscribe");
{
  const post = (body, headers) =>
    subscribe.fetch(
      req("/api/subscribe", {
        method: "POST",
        body: typeof body === "string" ? body : JSON.stringify(body),
        headers: { "content-type": "application/json", ...headers },
      }),
    );

  const good = await post({ email: " Voter@Example.COM " }, { "x-forwarded-for": "1.1.1.1" });
  check(good.status === 200, `valid address → HTTP ${good.status}`);
  check(JSON.stringify(await good.json()) === '{"ok":true}', "returns {ok:true} with no storage configured");

  const bad = await post({ email: "not-an-email" }, { "x-forwarded-for": "2.2.2.2" });
  check(bad.status === 400, `invalid address → HTTP ${bad.status}`);

  const nonPost = await subscribe.fetch(req("/api/subscribe"));
  check(nonPost.status === 405, `GET → HTTP ${nonPost.status}`);

  const big = await post(JSON.stringify({ email: "a".repeat(5000) }), {
    "x-forwarded-for": "3.3.3.3",
    "content-length": "5000",
  });
  check(big.status === 413, `oversized body → HTTP ${big.status}`);

  let limited = 0;
  for (let i = 0; i < 12; i++) {
    const res = await post({ email: `flood${i}@example.com` }, { "x-forwarded-for": "4.4.4.4" });
    if (res.status === 429) limited++;
  }
  check(limited > 0, `rate limit kicks in (${limited}/12 rejected)`);

  // Stand in for Upstash to see what would actually be written.
  const seen = [];
  const server = createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      seen.push({ url: req.url, auth: req.headers.authorization, body: JSON.parse(body) });
      res.writeHead(200, { "content-type": "application/json" });
      res.end("[]");
    });
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  process.env.KV_REST_API_URL = `http://127.0.0.1:${server.address().port}/`;
  process.env.KV_REST_API_TOKEN = "test-token";

  const stored = await post({ email: "Reader@Example.com" }, { "x-forwarded-for": "5.5.5.5" });
  check(stored.status === 200, `with storage configured → HTTP ${stored.status}`);
  check(JSON.stringify(await stored.json()) === '{"ok":true}', "response is identical either way");
  const call = seen[0];
  check(call?.url === "/pipeline", `posts to ${call?.url}`);
  check(call?.auth === "Bearer test-token", "sends the bearer token");
  check(
    JSON.stringify(call?.body?.[0]) === '["SADD","subscribers","reader@example.com"]',
    "SADDs the normalised address",
  );
  check(call?.body?.[1]?.[0] === "HSETNX", "records first-seen timestamp with HSETNX");

  server.close();
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
}

console.log(failures ? `\n${failures} failure(s)` : "\nall checks passed");
process.exit(failures ? 1 : 0);
