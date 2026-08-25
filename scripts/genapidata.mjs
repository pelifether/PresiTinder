/**
 * Generates api/_lib/data.ts from src/data/.
 *
 * The serverless functions cannot import the app's modules directly. They run
 * as ESM (package.json says "type": "module"), and tsc emits import specifiers
 * verbatim — so `from "../src/data/candidates"` becomes an extensionless ESM
 * specifier that Node refuses to resolve, and `src/data/quiz.ts` additionally
 * imports semantic.json, which ESM only accepts with an import attribute.
 * Both of those are the app bundler's problems to solve, not Node's.
 *
 * So the twelve rows the functions actually need, with the compass position
 * already computed, are generated into a module with no imports at all.
 * scripts/checkapi.mjs re-runs this and fails if the checked-in file has
 * drifted from src/data/.
 *
 *   node scripts/genapidata.mjs          # write api/_lib/data.ts
 *   node scripts/genapidata.mjs --print  # print it instead
 */
import { build } from "esbuild";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "api", "_lib", "data.ts");

/** Bundle the app's data modules so this script can call into them. */
async function loadAppData() {
  const dir = await mkdtemp(path.join(tmpdir(), "presidentinder-"));
  const entry = path.join(dir, "entry.ts");
  const outfile = path.join(dir, "bundle.mjs");
  await writeFile(
    entry,
    [
      `export { CANDIDATES } from ${JSON.stringify(path.join(ROOT, "src/data/candidates.ts"))};`,
      `export { candidateCompass } from ${JSON.stringify(path.join(ROOT, "src/data/quiz.ts"))};`,
    ].join("\n"),
  );
  await build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    format: "esm",
    platform: "node",
    logLevel: "silent",
  });
  const mod = await import(outfile);
  await rm(dir, { recursive: true, force: true });
  return mod;
}

export async function render() {
  const { CANDIDATES, candidateCompass } = await loadAppData();
  const rows = CANDIDATES.map((c) => {
    const { x, y } = candidateCompass(c.slug);
    const round = (v) => Math.round(v * 1e6) / 1e6;
    return (
      `  { slug: ${JSON.stringify(c.slug)}, name: ${JSON.stringify(c.name)}, ` +
      `party: ${JSON.stringify(c.party)}, number: ${c.number}, ` +
      `color: ${JSON.stringify(c.color)}, x: ${round(x)}, y: ${round(y)} },`
    );
  });
  return `/**
 * GENERATED FILE — do not edit by hand.
 *
 * Written by scripts/genapidata.mjs from src/data/candidates.ts and
 * src/data/quiz.ts. Regenerate with \`npm run gen:api\`; \`npm run check:api\`
 * fails if this has drifted from the app's own data.
 *
 * \`x\` and \`y\` are the plan's position on the political compass, −1…+1, with
 * +y meaning conservative. Deliberately precomputed: the functions need the
 * coordinates, not the eight-dimension scoring model that produces them.
 */
export interface ApiCandidate {
  slug: string;
  name: string;
  party: string;
  number: number;
  color: string;
  x: number;
  y: number;
}

export const CANDIDATES: ApiCandidate[] = [
${rows.join("\n")}
];
`;
}

// Importable: checkapi.mjs calls render() to detect drift, and must not write.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const source = await render();
  if (process.argv.includes("--print")) {
    process.stdout.write(source);
  } else {
    const before = await readFile(OUT, "utf8").catch(() => null);
    if (before === source) {
      console.log("api/_lib/data.ts already up to date");
    } else {
      await writeFile(OUT, source);
      console.log(`wrote api/_lib/data.ts (${source.split("\n").length} lines)`);
    }
  }
}
