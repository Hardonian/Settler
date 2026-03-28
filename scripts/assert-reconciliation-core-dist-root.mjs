#!/usr/bin/env node
/**
 * Repo-root variant of `packages/web/scripts/assert-reconciliation-core-dist.mjs`.
 * Used by `verify:fast` so CI catches stale `@settler/reconciliation-core` output without a web build.
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const coreRoot = join(repoRoot, "packages", "reconciliation-core");
const distDir = join(coreRoot, "dist");
const srcDir = join(coreRoot, "src");

if (!existsSync(distDir)) {
  console.error(
    "❌ @settler/reconciliation-core dist/ is missing. Run: pnpm --filter @settler/reconciliation-core run build"
  );
  process.exit(1);
}

function newestMtimeMs(dir, exts) {
  let max = 0;
  const walk = (d) => {
    for (const name of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, name.name);
      if (name.isDirectory()) {
        walk(p);
      } else if (exts.some((e) => name.name.endsWith(e))) {
        const t = statSync(p).mtimeMs;
        if (t > max) max = t;
      }
    }
  };
  walk(dir);
  return max;
}

const distNewest = newestMtimeMs(distDir, [".js", ".d.ts"]);
const srcNewest = newestMtimeMs(srcDir, [".ts"]);

if (srcNewest > distNewest) {
  console.error(
    "❌ @settler/reconciliation-core dist/ is older than src/. Rebuild: pnpm --filter @settler/reconciliation-core run build"
  );
  process.exit(1);
}

console.log("✅ reconciliation-core dist is present and not older than sources.");
