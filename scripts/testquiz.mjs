/**
 * Validates the quiz engine after the 8-dimension rescore.
 *
 *   node scripts/testquiz.mjs
 *
 * Checks: bank hygiene, self-recovery (a plan's own positions should return
 * that plan), tie rate across many random sessions, and that the far-left
 * cluster is now separable.
 */
import { build } from "esbuild";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const dir = await mkdtemp(path.join(tmpdir(), "quiztest-"));
const out = path.join(dir, "quiz.mjs");
await build({
  entryPoints: ["src/data/quiz.ts"],
  outfile: out,
  bundle: true,
  format: "esm",
  platform: "node",
  logLevel: "warning",
});

const { BANK, PER_SESSION, SEMANTIC, SCALE, buildSession, stance, ranking } =
  await import(path.toNamespacedPath(out));

const SLUGS = Object.keys(SEMANTIC);
let failures = 0;
const fail = (msg) => {
  console.log("  FAIL " + msg);
  failures++;
};

// ---------- 1. bank hygiene ----------
console.log("1. bank");
const ids = new Set(BANK.map((q) => q.id));
if (ids.size !== BANK.length) fail("duplicate question ids");
const right = BANK.filter((q) => q.dir === 1).length;
const left = BANK.length - right;
console.log(`   ${BANK.length} questions · SIM=direita ${right} / SIM=esquerda ${left}`);
if (Math.abs(right - left) > 1) fail(`bank is skewed: ${right}/${left}`);
for (const q of BANK) {
  if (q.pivot < 0 || q.pivot > SCALE) fail(`${q.id} pivot out of range`);
}
const dims = [...new Set(BANK.map((q) => q.dim))];
for (const d of dims) {
  const n = BANK.filter((q) => q.dim === d).length;
  if (n < 2) fail(`dimension ${d} has only ${n} question(s)`);
}

// ---------- 2. session shape ----------
console.log("2. sessions");
for (let i = 0; i < 500; i++) {
  const s = buildSession();
  if (s.length !== PER_SESSION) fail(`session length ${s.length}`);
  if (new Set(s.map((q) => q.id)).size !== s.length) fail("repeated card");
  const served = new Set(s.map((q) => q.dim));
  if (served.size !== dims.length) fail(`session missed dims: ${dims.filter(d=>!served.has(d))}`);
}
console.log(`   500 sessions, all ${PER_SESSION} cards, all 8 dimensions served`);

/** Answer a session the way a given plan would. */
const answerAs = (session, slug) => {
  const a = {};
  for (const q of session) {
    const s = stance(slug, q);
    a[q.id] = s === 0 ? 0 : s > 0 ? 1 : -1;
  }
  return a;
};

// ---------- 3. self-recovery ----------
console.log("3. self-recovery (plan answers its own positions)");
const RUNS = 300;
for (const slug of SLUGS) {
  let top1 = 0;
  let top3 = 0;
  for (let i = 0; i < RUNS; i++) {
    const session = buildSession();
    const r = ranking(session, answerAs(session, slug), SLUGS);
    if (r[0].slug === slug) top1++;
    if (r.slice(0, 3).some((x) => x.slug === slug)) top3++;
  }
  const p1 = ((100 * top1) / RUNS).toFixed(0);
  const p3 = ((100 * top3) / RUNS).toFixed(0);
  const flag = top3 / RUNS < 0.9 ? "  <-- weak" : "";
  console.log(`   ${slug.padEnd(20)} top1 ${p1.padStart(3)}%  top3 ${p3.padStart(3)}%${flag}`);
  // Ten binary cards cannot fully separate five near-identical right-wing
  // plans; Zema and Caiado sit behind whoever holds the field maximum on the
  // dimensions they share. 60% is the floor we accept for that.
  if (top3 / RUNS < 0.6) fail(`${slug} not recovered in top 3`);
}

// ---------- 4. tie rate ----------
console.log("4. ties at the top (random voters)");
let ties = 0;
const TIE_RUNS = 4000;
for (let i = 0; i < TIE_RUNS; i++) {
  const session = buildSession();
  const answers = {};
  for (const q of session) {
    answers[q.id] = [-1, 1, 1, -1, 0][Math.floor(Math.random() * 5)];
  }
  const r = ranking(session, answers, SLUGS);
  if (r.length > 1 && Math.abs(r[0].pct - r[1].pct) < 0.05) ties++;
}
console.log(`   ${ties}/${TIE_RUNS} sessions had a tied winner (${((100 * ties) / TIE_RUNS).toFixed(2)}%)`);
if (ties / TIE_RUNS > 0.02) fail(`tie rate too high: ${ties}/${TIE_RUNS}`);

// ---------- 5. far-left separability ----------
console.log("5. far-left cluster separability");
const LEFT = ["edmilson-costa", "hertz-dias", "samara", "rui-costa-pimenta"];
for (const a of LEFT) {
  const vecA = SEMANTIC[a].scores;
  for (const b of LEFT) {
    if (a >= b) continue;
    const vecB = SEMANTIC[b].scores;
    const d = Object.keys(vecA).reduce(
      (acc, k) => acc + Math.abs(vecA[k] - vecB[k]),
      0,
    );
    console.log(`   ${a} vs ${b}: L1 distance ${d.toFixed(1)}`);
    if (d === 0) fail(`${a} and ${b} are identical`);
  }
}
// and do they actually beat each other when answering as themselves?
for (const slug of LEFT) {
  let top2 = 0;
  for (let i = 0; i < RUNS; i++) {
    const session = buildSession();
    const r = ranking(session, answerAs(session, slug), LEFT);
    if (r.slice(0, 2).some((x) => x.slug === slug)) top2++;
  }
  const pct = (100 * top2) / RUNS;
  console.log(`   ${slug.padEnd(20)} top2 within its own cluster: ${pct.toFixed(0)}%`);
  if (pct < 60) fail(`${slug} not separable inside the far-left cluster`);
}

// ---------- 6. archetypes ----------
console.log("6. archetypes");
const ARCHETYPES = {
  "libertarian right": { econ: 1, welfare: 1, social: 1, seguranca: 1, ambiente: 1, instituicoes: 1, soberania: 1, metodo: 1 },
  "socialist left": { econ: -1, welfare: -1, social: -1, seguranca: -1, ambiente: -1, instituicoes: -1, soberania: -1, metodo: -1 },
};
for (const [name, lean] of Object.entries(ARCHETYPES)) {
  const counts = {};
  for (let i = 0; i < RUNS; i++) {
    const session = buildSession();
    const answers = {};
    for (const q of session) answers[q.id] = lean[q.dim] * q.dir > 0 ? 1 : -1;
    const winner = ranking(session, answers, SLUGS)[0].slug;
    counts[winner] = (counts[winner] ?? 0) + 1;
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  console.log(`   ${name}: ${top.map(([s, n]) => `${s} ${((100 * n) / RUNS).toFixed(0)}%`).join(", ")}`);
}

console.log(failures ? `\n${failures} FAILURE(S)` : "\nall checks passed");
process.exit(failures ? 1 : 0);
