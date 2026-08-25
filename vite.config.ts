import { copyFileSync, createReadStream, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const root = fileURLToPath(new URL(".", import.meta.url));
const PDFS = join(root, "data/pdfs");

/** Serves the TSE-filed PDFs at /planos/:slug.pdf without duplicating them in public/. */
function planos(): Plugin {
  return {
    name: "planos",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const m = req.url?.match(/^\/planos\/([a-z0-9-]+)\.pdf(?:\?.*)?$/);
        if (!m) return next();
        const file = join(PDFS, `${m[1]}.pdf`);
        if (!existsSync(file)) {
          res.statusCode = 404;
          res.end("plano não encontrado");
          return;
        }
        res.setHeader("Content-Type", "application/pdf");
        createReadStream(file).pipe(res);
      });
    },
    closeBundle() {
      const dest = join(root, "dist/planos");
      mkdirSync(dest, { recursive: true });
      for (const f of readdirSync(PDFS)) {
        if (f.endsWith(".pdf")) copyFileSync(join(PDFS, f), join(dest, f));
      }
    },
  };
}

export default defineConfig({
  // Served from the domain root on Vercel: https://presi-tinder.vercel.app/
  base: "/",
  plugins: [react(), planos()],
});
