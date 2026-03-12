import path from "path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    css: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/components/**",
        "src/pages/**",
        "src/context/**",
        "src/main.tsx",
        "src/App.tsx",
        "src/vite-env.d.ts",
        "src/**/*.d.ts",
        "src/types/**",
      ],
    },
  },
});
