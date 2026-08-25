/**
 * HTML for /r/<payload> (rewritten here by vercel.json).
 *
 * Crawlers get OpenGraph/Twitter tags naming the matched candidate(s) and the
 * affinity, pointing at the matching /api/og card. Real browsers are bounced
 * on to /?r=<payload> so they land in the app with the result loaded.
 */
import {
  describe,
  encodePayload,
  ogQuery,
  originOf,
  parsePayload,
  SITE_NAME,
  SITE_TAGLINE,
} from "./_lib/payload";

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** The payload comes from the rewrite's `p`, or from the /r/<payload> path. */
function payloadOf(url: URL): string {
  const q = url.searchParams.get("p") ?? url.searchParams.get("r");
  if (q) return q;
  const m = url.pathname.match(/\/r\/([^/]+)/);
  return m ? m[1] : "";
}

export async function share(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const origin = originOf(req);
  const result = parsePayload(payloadOf(url));
  const { headline, description } = describe(result);

  const title = result.ok ? `${headline} | ${SITE_NAME}` : `${SITE_NAME} — ${SITE_TAGLINE}`;
  const q = ogQuery(result);
  const image = q ? `${origin}/api/og?${q}` : `${origin}/og.png`;
  const canonical = result.ok ? `${origin}/r/${encodePayload(result)}` : `${origin}/`;
  const app = result.ok ? `/?r=${encodePayload(result)}` : "/";

  const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <meta name="theme-color" content="#f6f1e7" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="canonical" href="${esc(canonical)}" />

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${esc(canonical)}" />
    <meta property="og:image" content="${esc(image)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${esc(headline)}" />
    <meta property="og:locale" content="pt_BR" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${esc(image)}" />

    <noscript><meta http-equiv="refresh" content="0; url=${esc(app)}" /></noscript>
    <style>
      body { margin: 0; background: #f6f1e7; color: #191512; font-family: Archivo, system-ui, sans-serif;
             display: flex; min-height: 100vh; align-items: center; justify-content: center; text-align: center; }
      a { color: #fd3a6d; }
    </style>
  </head>
  <body>
    <main>
      <h1>${esc(headline)}</h1>
      <p><a href="${esc(app)}">Abrir o ${SITE_NAME}</a></p>
    </main>
    <script>location.replace(${JSON.stringify(app)});</script>
  </body>
</html>
`;

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}

export default { fetch: share };
