#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { globSync } from "glob";

const importRegex =
  /(?:import\s+(?:type\s+)?(?:[^'";]+from\s+)?|export\s+[^'";]*from\s+|require\s*\()\s*['"]([^'"]+)['"]/g;

const webFiles = globSync("packages/web/src/**/*.{ts,tsx,js,jsx,mjs,cjs}", { nodir: true });
const apiRouteFiles = globSync("packages/api/src/routes/**/*.{ts,tsx,js,mjs}", { nodir: true });
const violations = [];

for (const file of webFiles) {
  const source = fs.readFileSync(path.join(process.cwd(), file), "utf8");
  let m;
  while ((m = importRegex.exec(source)) !== null) {
    const spec = m[1];
    const isMarketing =
      file.includes("/app/(marketing)/") ||
      (/packages\/web\/src\/app\//.test(file) &&
        !file.includes("/app/app/") &&
        !file.includes("/app/console/") &&
        !file.includes("/app/admin/") &&
        !file.includes("/app/dashboard/") &&
        !file.includes("/app/api/") &&
        !file.includes("/app/demo/"));

    if (
      isMarketing &&
      (spec.startsWith("@/app/app") ||
        spec.startsWith("@/app/console") ||
        spec.startsWith("@/app/admin") ||
        spec.startsWith("@/env/server") ||
        spec.includes("/runner") ||
        spec.includes("/engine") ||
        spec.includes("server-only"))
    ) {
      violations.push(`${file}: forbidden marketing import ${spec}`);
    }

    if (
      (file.includes("/app/oss/") || file.includes("/app/open-source/")) &&
      spec.includes("/enterprise")
    ) {
      violations.push(`${file}: OSS importing enterprise module ${spec}`);
    }
  }
}

for (const file of apiRouteFiles) {
  const source = fs.readFileSync(path.join(process.cwd(), file), "utf8");
  if (
    source.includes("reconciliation-control-plane") ||
    source.includes("runDeterministicEngine(")
  ) {
    violations.push(`${file}: API route bypasses executeWithPolicy funnel`);
  }
}

if (violations.length) {
  console.error("❌ Site boundary enforcement failed");
  violations.forEach((v) => console.error(` - ${v}`));
  process.exit(1);
}

console.log("✅ Site boundary enforcement passed");
