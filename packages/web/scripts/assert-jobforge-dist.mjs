#!/usr/bin/env node
/**
 * Verify the JobForge workspace packages emit the entry points their package
 * exports and the Next.js webpack aliases consume. Vercel starts from a clean
 * checkout, so stale local dist files must never mask a bad TypeScript layout.
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(__dirname, "..");

function newestMtimeMs(dir, extension) {
  let newest = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const filePath = join(dir, entry.name);
    if (entry.isDirectory()) {
      newest = Math.max(newest, newestMtimeMs(filePath, extension));
    } else if (entry.name.endsWith(extension)) {
      newest = Math.max(newest, statSync(filePath).mtimeMs);
    }
  }
  return newest;
}

const packages = ["jobforge-shared", "jobforge-sdk-ts"];
for (const packageName of packages) {
  const packageRoot = resolve(webRoot, "..", packageName);
  const srcDir = join(packageRoot, "src");
  const distDir = join(packageRoot, "dist");
  const runtimeEntry = join(distDir, "index.js");
  const typeEntry = join(distDir, "index.d.ts");

  if (!existsSync(runtimeEntry) || !existsSync(typeEntry)) {
    console.error(
      `❌ @jobforge/${packageName.replace("jobforge-", "")} is missing its dist entry point. ` +
        `Run: pnpm --filter @jobforge/${packageName.replace("jobforge-", "")} run build`
    );
    process.exit(1);
  }

  if (newestMtimeMs(srcDir, ".ts") > newestMtimeMs(distDir, ".js")) {
    console.error(
      `❌ @jobforge/${packageName.replace("jobforge-", "")} dist/ is older than src/. ` +
        `Run: pnpm --filter @jobforge/${packageName.replace("jobforge-", "")} run build`
    );
    process.exit(1);
  }
}

console.log("✅ JobForge dist entry points are present and current.");
