import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL("./package.json", import.meta.url)), "utf-8"),
) as { version: string };

function safeGit(command: string, fallback: string) {
  try {
    return execSync(command, { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] }).trim() || fallback;
  } catch {
    return fallback;
  }
}

const gitSha = process.env.GITHUB_SHA || safeGit("git rev-parse --short=12 HEAD", "local");
const gitBranch = process.env.GITHUB_REF_NAME || safeGit("git branch --show-current", "local");
const buildTime = process.env.VITE_BUILD_TIME || new Date().toISOString();

export default defineConfig({
  base: "/KushCloud/",
  plugins: [react(), tailwindcss()],
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(pkg.version),
    "import.meta.env.VITE_GIT_SHA": JSON.stringify(gitSha),
    "import.meta.env.VITE_GIT_BRANCH": JSON.stringify(gitBranch),
    "import.meta.env.VITE_BUILD_TIME": JSON.stringify(buildTime),
  },
  build: {
    target: "es2018",
    cssMinify: "lightningcss",
    sourcemap: false,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        format: "esm",
        entryFileNames: "assets/index.js",
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
  },
});
