// Standalone static SPA build config for deploying to Hostinger / any static host.
// This is INDEPENDENT of vite.config.ts (which targets Cloudflare Workers SSR via the Lovable preset).
// Run with: npm run build:static
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "node:path";

export default defineConfig({
  configFile: false,
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  publicDir: path.resolve(process.cwd(), "public"),
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    outDir: "dist-static",
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: path.resolve(process.cwd(), "index.html"),
    },
  },
});