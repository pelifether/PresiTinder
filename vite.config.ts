import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Project site on GitHub Pages: https://pelifether.github.io/PresiTinder/
  base: "/PresiTinder/",
  plugins: [react()],
});
