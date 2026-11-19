import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    {
      name: "copy-public-assets-without-legacy-cra-template",
      apply: "build",
      closeBundle() {
        const source = path.join(projectRoot, "public");
        const destination = path.join(projectRoot, "dist");
        if (!fs.existsSync(source)) return;
        for (const entry of fs.readdirSync(source)) {
          if (entry === "index.html") continue;
          fs.cpSync(path.join(source, entry), path.join(destination, entry), { recursive: true });
        }
      }
    }
  ],
  publicDir: "public",
  build: {
    copyPublicDir: false,
    outDir: "dist",
    emptyOutDir: true
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/setupTests.js",
    globals: true,
    restoreMocks: true
  }
});
