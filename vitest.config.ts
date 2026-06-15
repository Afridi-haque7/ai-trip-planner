import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    // Mirror the app's "@/*" → project-root path alias.
    alias: { "@": root },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.{ts,js}"],
    // Skip the boot-time env validation so importing modules that pull in
    // lib/env.ts doesn't require real secrets in the test environment.
    env: { SKIP_ENV_VALIDATION: "1" },
  },
});
