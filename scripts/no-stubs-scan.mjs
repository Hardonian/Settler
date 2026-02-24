#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { globSync } from "glob";

const terms = [
  /\bTODO\b/i,
  /\bFIXME\b/i,
  /\bHACK\b/i,
  /not implemented/i,
  /placeholder/i,
  /\bdummy\b/i,
  /\bfake\b/i,
];
const targets = [
  ...globSync("packages/web/src/app/(marketing)/**/*.{ts,tsx,js,jsx}", { nodir: true }),
  ...globSync("packages/web/src/app/enterprise/**/*.{ts,tsx,js,jsx}", { nodir: true }),
  ...globSync("packages/web/src/env/**/*.{ts,tsx,js,jsx}", { nodir: true }),
  "packages/web/src/lib/site-mode.ts",
];
const violations = [];

for (const file of targets) {
  if (!fs.existsSync(path.join(process.cwd(), file))) continue;
  const lines = fs.readFileSync(path.join(process.cwd(), file), "utf8").split("\n");
  lines.forEach((line, i) => {
    if (terms.some((re) => re.test(line)))
      violations.push(`${file}:${i + 1} suspicious stub language`);
    if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(line) || /^\s*catch\s*\{\s*\}\s*$/.test(line))
      violations.push(`${file}:${i + 1} empty catch block`);
  });
}

if (violations.length) {
  console.error("❌ Production-path stub scan failed");
  violations.forEach((v) => console.error(` - ${v}`));
  process.exit(1);
}
console.log("✅ No production-path stubs detected");
