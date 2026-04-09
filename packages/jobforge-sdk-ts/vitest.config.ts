import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    alias: {
      "@jobforge/shared": path.resolve(__dirname, "../jobforge-shared/src"),
    },
  },
});
