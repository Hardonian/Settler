#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";
import { globSync } from "glob";

const allowList = new Set([
  path.resolve("scripts/moat/engine.ts"),
  path.resolve("evidence/hash.ts"),
  path.resolve("scripts/verify-tenant-isolation.mjs"),
]);
const importRegex = /from\s+["']([^"']+)["']|import\(["']([^"']+)["']\)/g;

const files = globSync("{scripts,packages,runner,evidence}/**/*.{ts,tsx,js,mjs}", {
  ignore: ["**/dist/**", "**/node_modules/**"],
  absolute: true,
});

const violations: string[] = [];
for (const file of files) {
  if (file.endsWith("verify-policy.ts")) continue;
  const content = fs.readFileSync(file, "utf8");
  let match: RegExpExecArray | null;
  while ((match = importRegex.exec(content)) !== null) {
    const spec = match[1] ?? match[2];
    if (spec?.includes("reconciliation-control-plane") && !allowList.has(file)) {
      violations.push(path.relative(process.cwd(), file));
      break;
    }
  }
}

if (violations.length) {
  console.error("Direct deterministic engine imports found outside executeWithPolicy boundary:");
  for (const violation of violations) console.error(` - ${violation}`);
  process.exit(1);
}

console.log("Policy boundary verified: engine access only via executeWithPolicy funnel.");
