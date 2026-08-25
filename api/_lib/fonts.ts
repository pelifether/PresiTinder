/**
 * Font binaries for satori. It cannot use the webfont CSS the site loads, so
 * the same Archivo family is committed under api/_fonts and read from disk
 * (see the `includeFiles` entry for api/og.tsx in vercel.json). Reading from
 * disk is best-effort — bundlers move things around — so each face falls back
 * to the immutable Google Fonts binary it was downloaded from.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

export interface Face {
  name: string;
  data: ArrayBuffer | Buffer;
  weight: 400 | 700;
  style: "normal";
}

interface Source {
  name: string;
  file: string;
  url: string;
  weight: 400 | 700;
}

const SOURCES: Source[] = [
  {
    name: "Archivo",
    file: "Archivo-Regular.ttf",
    weight: 400,
    url: "https://fonts.gstatic.com/s/archivo/v25/k3k6o8UDI-1M0wlSV9XAw6lQkqWY8Q82sJaRE-NWIDdgffTTNDNp8A.ttf",
  },
  {
    name: "Archivo",
    file: "Archivo-Bold.ttf",
    weight: 700,
    url: "https://fonts.gstatic.com/s/archivo/v25/k3k6o8UDI-1M0wlSV9XAw6lQkqWY8Q82sJaRE-NWIDdgffTT0zRp8A.ttf",
  },
  {
    name: "Archivo Black",
    file: "ArchivoBlack-Regular.ttf",
    weight: 400,
    url: "https://fonts.gstatic.com/s/archivoblack/v23/HTxqL289NzCGg4MzN6KJ7eW6OYs.ttf",
  },
];

function candidatePaths(file: string): string[] {
  const cwd = process.cwd();
  const here = path.join("api", "_fonts", file);
  const paths = [
    path.join(cwd, here),
    path.join(cwd, "_fonts", file),
    path.join("/var/task", here),
  ];
  try {
    paths.unshift(new URL(`../_fonts/${file}`, import.meta.url).pathname);
  } catch {
    /* not ESM; the cwd-relative paths below still apply */
  }
  return paths;
}

async function load(src: Source): Promise<Face> {
  for (const p of candidatePaths(src.file)) {
    try {
      return { name: src.name, data: await readFile(p), weight: src.weight, style: "normal" };
    } catch {
      /* try the next location */
    }
  }
  const res = await fetch(src.url);
  if (!res.ok) throw new Error(`font ${src.file}: HTTP ${res.status}`);
  return {
    name: src.name,
    data: await res.arrayBuffer(),
    weight: src.weight,
    style: "normal",
  };
}

let cached: Promise<Face[]> | null = null;

/** Cached across warm invocations; a failure is not cached. */
export function fonts(): Promise<Face[]> {
  if (!cached) {
    cached = Promise.all(SOURCES.map(load)).catch((err) => {
      cached = null;
      throw err;
    });
  }
  return cached;
}
