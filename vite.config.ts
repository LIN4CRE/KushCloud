import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Single source of truth for the app version: package.json. This is injected
// at build time so the displayed version can never drift from the release.
const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL("./package.json", import.meta.url)), "utf-8"),
) as { version: string };

function classicScript(): Plugin {
  return {
    name: "classic-script",
    enforce: "post",
    transformIndexHtml(html) {
      let result = html.replace(/ type="module"/g, "");
      const scriptMatch = result.match(/<script[^>]*>[\s\S]*?<\/script>/);
      if (scriptMatch) {
        const scriptTag = scriptMatch[0];
        result = result.replace(scriptTag, "").replace("</body>", `${scriptTag}\n  </body>`);
      }
      return result;
    },
  };
}

export default defineConfig({
  base: "/KushCloud/",
  plugins: [react(), tailwindcss(), viteSingleFile(), classicScript()],
  define: {
    // Expose package.json version to the app via import.meta.env.
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(pkg.version),
  },
  build: {
    target: "es2018",
    cssMinify: "lightningcss",
    sourcemap: false,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        format: "iife",
        name: "KushCloud",
        entryFileNames: "assets/index.js",
      },
      // The IIFE output format (required for legacy Android WebView 7+ support)
      // does not support `import.meta`. Vite statically replaces the
      // `import.meta.env.*` flags we use at build time, so the leftover empty
      // `import.meta` reference is harmless. Suppress the cosmetic
      // EMPTY_IMPORT_META warning so genuine build warnings stay visible.
      onwarn(warning, warn) {
        if (warning.code === "EMPTY_IMPORT_META") return;
        warn(warning);
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
  },
});
