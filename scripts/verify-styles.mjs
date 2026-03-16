#!/usr/bin/env node
import { readFileSync } from "node:fs";

const guardedFiles = [
  "packages/web/src/components/shared/OperationalRouteNotice.tsx",
  "packages/web/src/components/shared/route-state.tsx",
  "packages/web/src/components/console/ConsoleLayout.tsx",
  "packages/web/src/app/console/error.tsx",
  "packages/web/src/app/dashboard/not-found.tsx",
  "packages/web/src/app/console/not-found.tsx",
];

const bannedPattern = /\b(?:text|bg|border|ring)-(?:slate|gray)-[\w/[\].:-]+/g;
const violations = [];

for (const file of guardedFiles) {
  const source = readFileSync(file, "utf8");
  const lines = source.split(/\r?\n/);

  lines.forEach((line, index) => {
    const matches = line.match(bannedPattern);
    if (!matches) return;
    for (const match of matches) {
      violations.push(`${file}:${index + 1} uses banned utility '${match}'`);
    }
  });
}

if (violations.length > 0) {
  console.error("❌ Style verification failed for guarded route-truth surfaces.");
  for (const violation of violations) {
    console.error(`  - ${violation}`);
  }
  process.exit(1);
}

console.log(`✅ Style verification passed (${guardedFiles.length} guarded files checked)`);
