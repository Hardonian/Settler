#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { globSync } from "glob";

const rootDir = process.cwd();

const marketingRoots = ["packages/web/src/app/(marketing)", "packages/web/src/app"];
const ossRoots = ["packages/web/src/app/oss", "packages/web/src/app/api/oss"];
const deterministicRoots = ["packages/web/src/lib/determinism"];

const forbiddenMarketingImports = [
  "@/lib/auth",
  "@/lib/supabase",
  "@/providers/auth",
  "@/providers/supabase",
  "@/lib/env",
  "@/lib/config/env",
  "@/lib/typed-env",
  "@/lib/api/auth-gate",
  "@/lib/api/unified-auth",
  "@/lib/api/console-auth",
  "@/components/enterprise",
  "@/app/enterprise",
  "@/enterprise",
];

const forbiddenOssImports = ["@/components/enterprise", "@/app/enterprise", "@/enterprise"];

const forbiddenDeterminismPatterns = [
  /\blocaleCompare\s*\(/,
  /\bIntl\.Collator\b/,
  /\bMath\.random\s*\(/,
  /\bDate\.now\s*\(/,
  /\bnew\s+Date\s*\(/,
];

const importRegex =
  /(?:import\s+(?:type\s+)?(?:[^'";]+from\s+)?|export\s+[^'";]*from\s+|require\s*\()\s*['"]([^'"]+)['"]/g;

const violations = [];

for (const root of marketingRoots) {
  const files = globSync(`${root}/**/*.{ts,tsx,js,jsx,mjs,cjs}`, { cwd: rootDir, nodir: true });
  for (const file of files) {
    const source = readFileSync(resolve(rootDir, file), "utf-8");

    let match;
    while ((match = importRegex.exec(source)) !== null) {
      const specifier = match[1];
      const hit = forbiddenMarketingImports.find(
        (prefix) => specifier === prefix || specifier.startsWith(`${prefix}/`)
      );
      if (hit) {
        violations.push(
          `${file}: forbidden import \`${specifier}\` in marketing route group (matches ${hit}).`
        );
      }
    }
  }
}

for (const root of ossRoots) {
  const files = globSync(`${root}/**/*.{ts,tsx,js,jsx,mjs,cjs}`, { cwd: rootDir, nodir: true });
  for (const file of files) {
    const source = readFileSync(resolve(rootDir, file), "utf-8");

    let match;
    while ((match = importRegex.exec(source)) !== null) {
      const specifier = match[1];
      const hit = forbiddenOssImports.find(
        (prefix) => specifier === prefix || specifier.startsWith(`${prefix}/`)
      );
      if (hit) {
        violations.push(
          `${file}: forbidden enterprise import \`${specifier}\` in OSS route surface (matches ${hit}).`
        );
      }
    }
  }
}

for (const root of deterministicRoots) {
  const files = globSync(`${root}/**/*.{ts,tsx,js,jsx,mjs,cjs}`, { cwd: rootDir, nodir: true });
  for (const file of files) {
    const source = readFileSync(resolve(rootDir, file), "utf-8");
    for (const pattern of forbiddenDeterminismPatterns) {
      if (pattern.test(source)) {
        violations.push(`${file}: determinism boundary violation (${pattern})`);
      }
    }
  }
}

if (violations.length > 0) {
  console.error("❌ Boundary linter found violations:");
  for (const violation of violations) {
    console.error(` - ${violation}`);
  }
  process.exit(1);
}

console.log(
  "✅ Boundary linter passed (marketing/app boundaries + deterministic pipeline checks)."
);
