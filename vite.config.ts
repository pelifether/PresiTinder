import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Served from the domain root on Vercel: https://presi-tinder.vercel.app/
  base: "/",
  plugins: [react()],
});
