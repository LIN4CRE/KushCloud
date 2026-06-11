import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function removeModuleScript(): Plugin {
  return {
    name: "classic-script",
    enforce: "post",
    transformIndexHtml(html) {
      return html.replace(/ type="module"/g, "");
    },
  };
}

export default defineConfig({
  base: "/KushCloud/",
  plugins: [react({ jsxRuntime: "automatic" }), tailwindcss(), viteSingleFile(), removeModuleScript()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
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
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
  },
});
