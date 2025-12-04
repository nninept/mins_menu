// vite.config.js
import { defineConfig } from "vite";
import { vitePlugin as remix } from "@remix-run/dev";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// ESM 환경에서 __dirname 만들기
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [remix()],
  resolve: {
    alias: {
      "~": resolve(__dirname, "app"), // ~/ → app/ 으로 매핑
    },
  },
});