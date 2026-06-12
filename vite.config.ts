import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

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
