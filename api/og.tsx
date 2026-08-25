/**
 * 1200×630 social card for a shared quiz result: /api/og?i=4&p=86&x=-42&y=-31
 *
 * Echoes the top of the in-app result card — the logo, the candidate
 * photo(s) with the affinity tag on the corner, and the political compass
 * with the user's dot. Malformed input renders the generic card instead of 500ing.
 */
// `vercel dev` compiles this file with the classic JSX transform, so React has
// to be in scope or every render throws "React is not defined" and quietly
// falls back to the static card. The build pipeline uses the automatic runtime
// instead, where the import is unused — hence the explicit reference below, so
// neither pipeline complains. Losing the import breaks local dev only, which
// is exactly the kind of thing that ships.
import React from "react";
import { ImageResponse } from "@vercel/og";
import { CANDIDATES } from "./_lib/data.js";
import { fonts } from "./_lib/fonts.js";
import {
  matched,
  originOf,
  parseQuery,
  SITE_TAGLINE,
  type ShareResult,
} from "./_lib/payload.js";

void React;

const PAPER = "#f6f1e7";
const PAPER_2 = "#fffdf6";
const INK = "#191512";
const MUTED = "#756a5c";
const FAINT = "#a2988a";
const PINK = "#fd3a6d";
const YELLOW = "#ffd23f";

const W = 1200;
const H = 630;
const BLACK = "Archivo Black";

/** Photos are fetched here rather than by satori so one 404 cannot fail the card. */
async function photo(origin: string, slug: string): Promise<string | null> {
  try {
    const res = await fetch(`${origin}/candidatos/${slug}.jpg`);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length) return null;
    return `data:image/jpeg;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

/** Same three-tongue mark as the site header. Solid fills: satori is picky
 *  about SVG gradients and this still reads as the logo from a phone screen. */
function FlameMark({ size = 52 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        d="M12 23.1c-4.5 0-8.1-3.5-8.1-8 0-3.4 2-5.8 4-7.6 1.8-1.8 3.4-3.5 3.7-6.2.1-.9 1.1-1.3 1.7-.7 1 1 1.4 2.5 2 3.7 1.2 2.3 5 4.8 5 9.8-.1 4.6-3.7 8.1-8.3 8z"
        fill="#199c56"
        stroke={INK}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M12 23.1c-4.5 0-8.1-3.5-8.1-8 0-3.4 2-5.8 4-7.6 1.8-1.8 3.4-3.5 3.7-6.2.1-.9 1.1-1.3 1.7-.7 1 1 1.4 2.5 2 3.7 1.2 2.3 5 4.8 5 9.8-.1 4.6-3.7 8.1-8.3 8z"
        fill="#fd3a6d"
        stroke={INK}
        strokeWidth="1.9"
        strokeLinejoin="round"
        transform="translate(12 23) scale(0.72) translate(-12 -23)"
      />
      <path
        d="M12 20.9c-2.1 0-3.8-1.6-3.8-3.7 0-1.6 1.1-2.7 2.1-3.7.7-.7 1.3-1.4 1.6-2.3.6 1.1 1.2 1.8 1.9 2.6.9.9 2 2 2 3.4 0 2.1-1.7 3.7-3.8 3.7z"
        fill={YELLOW}
        stroke={INK}
        strokeWidth="1.5"
        strokeLinejoin="round"
        transform="translate(12 23) scale(0.72) translate(-12 -23)"
      />
    </svg>
  );
}

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div
        style={{
          display: "flex",
          background: INK,
          color: PAPER_2,
          fontFamily: BLACK,
          fontSize: 34,
          letterSpacing: 0.4,
          padding: "7px 18px 10px",
          borderRadius: 12,
          boxShadow: `4px 4px 0 ${INK}`,
          transform: "rotate(-1.2deg)",
        }}
      >
        Presiden
        <span style={{ color: "#ffc9b0" }}>Tinder</span>
      </div>
      <div style={{ display: "flex", transform: "rotate(4deg)" }}>
        <FlameMark size={48} />
      </div>
      <div
        style={{
          display: "flex",
          background: PINK,
          color: "#fff",
          fontFamily: BLACK,
          fontSize: 18,
          padding: "4px 12px 6px",
          borderRadius: 9,
          boxShadow: `3px 3px 0 ${INK}`,
          transform: "rotate(2deg)",
        }}
      >
        2026
      </div>
    </div>
  );
}

function AffinityTag({ pct }: { pct: number }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        position: "absolute",
        top: -18,
        right: -20,
        background: PINK,
        color: "#fff",
        border: `3px solid ${INK}`,
        borderRadius: 14,
        padding: "8px 13px 9px",
        boxShadow: `4px 4px 0 ${INK}`,
        transform: "rotate(5deg)",
        lineHeight: 1,
      }}
    >
      <div style={{ display: "flex", fontFamily: BLACK, fontSize: 36 }}>{`${pct}%`}</div>
      <div
        style={{
          display: "flex",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1.3,
          marginTop: 4,
        }}
      >
        AFINIDADE
      </div>
    </div>
  );
}

function Photo({ src, color, name }: { src: string | null; color: string; name: string }) {
  const size = 148;
  const frame = {
    display: "flex",
    width: size,
    height: size,
    borderRadius: 24,
    border: `4px solid ${INK}`,
    boxShadow: `7px 7px 0 ${INK}`,
  } as const;
  if (src) return <img src={src} width={size} height={size} style={{ ...frame, objectFit: "cover" }} />;
  return (
    <div
      style={{
        ...frame,
        background: color,
        color: PAPER_2,
        fontFamily: BLACK,
        fontSize: 52,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {initials(name)}
    </div>
  );
}

/** −1…+1 → px inside the compass square, with the y axis flipped for the screen. */
function dotPos(x: number, y: number, box: number, pad: number, r: number) {
  const span = box - pad * 2;
  return {
    left: pad + ((x + 1) / 2) * span - r,
    top: pad + ((1 - y) / 2) * span - r,
  };
}

const AXIS_LABEL = {
  display: "flex",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: 1.5,
  color: FAINT,
} as const;

function Compass({ r }: { r: ShareResult }) {
  const BOX = 290;
  const PAD = 18;
  const others = CANDIDATES.filter((_, i) => !r.idxs.includes(i));
  const mine = matched(r);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ ...AXIS_LABEL, letterSpacing: 2 }}>CONSERVADOR</div>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ ...AXIS_LABEL, width: 62 }}>ESTADO</div>
        <div
          style={{
            display: "flex",
            position: "relative",
            width: BOX,
            height: BOX,
            background: PAPER_2,
            border: `4px solid ${INK}`,
            borderRadius: 18,
            boxShadow: `8px 8px 0 ${INK}`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 10,
              top: BOX / 2 - 6,
              width: BOX - 28,
              height: 0,
              borderTop: `2px dashed #d8cfbe`,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 10,
              left: BOX / 2 - 6,
              height: BOX - 28,
              width: 0,
              borderLeft: `2px dashed #d8cfbe`,
            }}
          />
          {others.map((c) => {
            const { left, top } = dotPos(c.x, c.y, BOX - 8, PAD, 7);
            return (
              <div
                key={c.slug}
                style={{
                  position: "absolute",
                  left,
                  top,
                  width: 14,
                  height: 14,
                  borderRadius: 999,
                  background: c.color,
                  opacity: 0.25,
                }}
              />
            );
          })}
          {mine.map((c) => {
            const { left, top } = dotPos(c.x, c.y, BOX - 8, PAD, 11);
            return (
              <div
                key={c.slug}
                style={{
                  position: "absolute",
                  left,
                  top,
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  background: c.color,
                  border: `3px solid ${INK}`,
                }}
              />
            );
          })}
          {r.ok ? (
            <div
              style={{
                position: "absolute",
                ...dotPos(r.x, r.y, BOX - 8, PAD, 13),
                width: 26,
                height: 26,
                borderRadius: 999,
                background: YELLOW,
                border: `4px solid ${INK}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Dark pip, as in the app. Without it the voter is
                  indistinguishable from a candidate whose party colour
                  happens to be yellow. */}
              <div
                style={{ display: "flex", width: 8, height: 8, borderRadius: 999, background: INK }}
              />
            </div>
          ) : null}
        </div>
        <div style={{ ...AXIS_LABEL, width: 62, justifyContent: "flex-end" }}>MERCADO</div>
      </div>
      <div style={{ ...AXIS_LABEL, letterSpacing: 2 }}>PROGRESSISTA</div>
      {r.ok ? (
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 8 }}>
          <Key color={YELLOW} label="você" pip />
          <Key color={mine[0].color} label="match" />
        </div>
      ) : null}
    </div>
  );
}

function Key({ color, label, pip }: { color: string; label: string; pip?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 14,
          height: 14,
          borderRadius: 999,
          background: color,
          border: `3px solid ${INK}`,
        }}
      >
        {pip ? (
          <div
            style={{ display: "flex", width: 5, height: 5, borderRadius: 999, background: INK }}
          />
        ) : null}
      </div>
      <div style={{ display: "flex", fontSize: 15, fontWeight: 700, color: MUTED }}>{label}</div>
    </div>
  );
}

function Card({ r, photos }: { r: ShareResult; photos: (string | null)[] }) {
  const cands = matched(r);
  const names = cands.map((c) => c.name).join(" e ");
  const nameSize = names.length > 26 ? 38 : names.length > 17 ? 44 : 68;
  return (
    <div
      style={{
        display: "flex",
        width: W,
        height: H,
        background: PAPER,
        padding: "48px 56px",
        fontFamily: "Archivo",
        color: INK,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", width: 600, justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <Logo />
          {cands.length ? (
            <div style={{ display: "flex", gap: 22, marginTop: 6 }}>
              {cands.map((c, i) => (
                <div key={c.slug} style={{ display: "flex", position: "relative" }}>
                  <Photo src={photos[i] ?? null} color={c.color} name={c.name} />
                  {r.ok && i === cands.length - 1 ? (
                    <AffinityTag pct={Math.round(r.pct)} />
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
          {cands.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", fontFamily: BLACK, fontSize: nameSize, lineHeight: 1.05 }}>
                {names}
              </div>
              <div style={{ display: "flex", fontSize: 25, fontWeight: 700, color: MUTED }}>
                {cands.map((c) => `${c.party} · ${c.number}`).join("   ·   ")}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", fontFamily: BLACK, fontSize: 64, lineHeight: 1.05, width: 560 }}>
              Qual plano de governo é seu “match”?
            </div>
          )}
        </div>
        {r.ok ? null : (
          <div style={{ display: "flex", fontSize: 22, fontWeight: 600, color: MUTED }}>
            {SITE_TAGLINE} · presi-tinder.vercel.app
          </div>
        )}
      </div>
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Compass r={r} />
      </div>
    </div>
  );
}

export async function render(req: Request): Promise<Response> {
  const origin = originOf(req);
  // Unusable params degrade to the generic card rather than to an error.
  const result = parseQuery(new URL(req.url).searchParams);
  try {
    const [faces, photos] = await Promise.all([
      fonts(),
      Promise.all(matched(result).map((c) => photo(origin, c.slug))),
    ]);
    return new ImageResponse(<Card r={result} photos={photos} />, {
      width: W,
      height: H,
      fonts: faces,
      headers: {
        "content-type": "image/png",
        "cache-control":
          "public, max-age=3600, s-maxage=31536000, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    // Fonts or the renderer itself gave out: the static card still beats a 500.
    console.error("og: render failed, serving the static card", err);
    return Response.redirect(`${origin}/og.png`, 302);
  }
}

export default { fetch: render };
