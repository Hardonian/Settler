#!/usr/bin/env tsx

import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

const apiRoot = join(process.cwd(), "src", "app", "api");
const forbidden = ["status: 500", "res.status(500)", "NextResponse.json(.*500"];
const offenders: string[] = [];

function walk(dir: string): void {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full);
      continue;
    }
    if (!full.endsWith(".ts") && !full.endsWith(".tsx")) continue;
    const source = readFileSync(full, "utf8");
    for (const marker of forbidden) {
      if (source.includes(marker)) {
        offenders.push(`${full}: matched "${marker}"`);
      }
    }
  }
}

walk(apiRoot);

if (offenders.length > 0) {
  console.error(
    "❌ Public route boundary check failed: avoid hard-coded 500 responses in user routes."
  );
  for (const offender of offenders) console.error(` - ${offender}`);
  process.exit(1);
}

console.log("✅ Public route boundary check passed");
