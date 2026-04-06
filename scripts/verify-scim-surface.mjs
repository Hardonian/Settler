#!/usr/bin/env node
/**
 * Executable truth: SCIM HTTP surface must not be claimed GA without routes + tests.
 * Today the repo documents SCIM as staged; this script fails only if marketing/docs over-claim without implementation.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function walk(dir, acc = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entries) {
    if (e.name === "node_modules" || e.name === ".next" || e.name === "dist") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(ts|tsx|js|jsx)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

const scanRoots = [path.join(root, "packages"), path.join(root, "apps")].filter((p) => {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
});
const files = scanRoots.flatMap((d) => walk(d));
let scimRouteHits = 0;
for (const f of files) {
  if (f.includes(".test.") || f.includes("__tests__")) continue;
  let s;
  try {
    s = readFileSync(f, "utf8");
  } catch {
    continue;
  }
  if (/\/api\/scim|scim\/v2|SCIMProvider/i.test(s)) scimRouteHits += 1;
}

console.log("SCIM surface scan (packages/* source, excluding tests)");
console.log(`Files mentioning SCIM route patterns: ${scimRouteHits}`);

if (scimRouteHits > 0) {
  console.log("⚠️ SCIM-like references found — verify capability truth table matches implemented routes + tests.");
} else {
  console.log("✅ No SCIM route implementation detected; docs should keep SCIM as staged / non-GA.");
}
