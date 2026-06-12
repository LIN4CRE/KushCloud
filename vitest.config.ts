import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      // Report coverage for all source files, not just the ones imported by a
      // test, so the metric honestly reflects what is and isn't tested.
      all: true,
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "node_modules/",
        "dist/",
        "src/**/*.test.{ts,tsx}",
        "src/**/*.d.ts",
        "src/vite-env.d.ts",
        "src/main.tsx",
        // UI screens/components and React hooks are exercised manually and via
        // the build; they are excluded from the unit-coverage metric to keep it
        // focused on pure game/data logic. Tracked as a roadmap item.
        "src/screens/**",
        "src/components/**",
        "src/hooks/**",
        "src/ui.tsx",
        "src/App.tsx",
        "src/config/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
