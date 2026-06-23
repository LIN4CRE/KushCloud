#!/usr/bin/env node
/* global console, process */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync, copyFileSync } from "node:fs";
import { join, relative } from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const dist = join(root, "dist");
const indexPath = join(dist, "index.html");
const base = "/KushCloud/";

function fail(message) {
  console.error(`❌ ${message}`);
  process.exitCode = 1;
}

function ok(message) {
  console.log(`✅ ${message}`);
}

function safeGit(command, fallback) {
  try {
    return execSync(command, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() || fallback;
  } catch {
    return fallback;
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

if (!existsSync(dist)) fail("dist/ does not exist. Run npm run build first.");
if (!existsSync(indexPath)) fail("dist/index.html missing.");

if (process.exitCode) process.exit(process.exitCode);

const html = readFileSync(indexPath, "utf8");
if (!html.includes(base)) fail(`index.html does not include expected GitHub Pages base ${base}`);
else ok(`GitHub Pages base detected: ${base}`);

const assetRefs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((ref) => ref.startsWith(base) || ref.startsWith("./") || ref.startsWith("assets/"));

for (const ref of assetRefs) {
  const normalized = ref.startsWith(base) ? ref.slice(base.length) : ref.replace(/^\.\//, "");
  const target = join(dist, normalized);
  if (!existsSync(target)) fail(`Referenced asset missing: ${ref}`);
}
if (assetRefs.length > 0) ok(`${assetRefs.length} HTML asset references verified`);

const assetsDir = join(dist, "assets");
if (!existsSync(assetsDir)) fail("dist/assets/ missing.");
else {
  const js = readdirSync(assetsDir).filter((name) => name.endsWith(".js"));
  const css = readdirSync(assetsDir).filter((name) => name.endsWith(".css"));
  if (js.length === 0) fail("No JavaScript bundle emitted.");
  else ok(`${js.length} JavaScript bundle(s) emitted`);
  if (css.length === 0) fail("No CSS bundle emitted.");
  else ok(`${css.length} CSS bundle(s) emitted`);
}

const fallbackPath = join(dist, "404.html");
if (!existsSync(fallbackPath)) {
  copyFileSync(indexPath, fallbackPath);
  ok("Created 404.html SPA fallback");
} else {
  ok("404.html SPA fallback present");
}

const files = existsSync(dist) ? walk(dist) : [];
const totalBytes = files.reduce((sum, file) => sum + statSync(file).size, 0);
const manifest = {
  app: "KushCloud",
  version: process.env.npm_package_version || JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version,
  commit: process.env.GITHUB_SHA || safeGit("git rev-parse --short=12 HEAD", "local"),
  branch: process.env.GITHUB_REF_NAME || safeGit("git branch --show-current", "local"),
  builtAt: process.env.VITE_BUILD_TIME || new Date().toISOString(),
  base,
  files: files.map((file) => ({
    path: relative(dist, file).replaceAll("\\", "/"),
    bytes: statSync(file).size,
  })).sort((a, b) => a.path.localeCompare(b.path)),
  totalBytes,
};

mkdirSync(dist, { recursive: true });
writeFileSync(join(dist, "debug.json"), `${JSON.stringify(manifest, null, 2)}\n`);
ok(`Wrote debug.json (${files.length} files, ${formatBytes(totalBytes)})`);

if (process.exitCode) process.exit(process.exitCode);
