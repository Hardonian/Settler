#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

function usage() {
  console.log(`Usage:
  node scripts/reconciliation-run-tools.mjs summary <suiteDir>
  node scripts/reconciliation-run-tools.mjs compare <suiteDirA> <suiteDirB>

Commands:
  summary  Print expected reconciliation summary and top exception buckets from golden.json
  compare  Compare two golden.json summaries and print per-classification deltas
`);
}

function readGolden(dir) {
  const file = path.join(dir, "golden.json");
  if (!fs.existsSync(file)) {
    throw new Error(`golden.json not found at ${file}`);
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function summary(dir) {
  const golden = readGolden(dir);
  const entries = Object.entries(golden.expected_summary ?? {}).sort((a, b) =>
    String(a[0]).localeCompare(String(b[0]))
  );
  console.log(`Suite: ${dir}`);
  for (const [classification, count] of entries) {
    console.log(`  ${classification}: ${count}`);
  }
  const matrix = golden.expected_results ?? {};
  console.log("\nException-oriented buckets:");
  console.log(`  duplicates_detected: ${(matrix.duplicates_detected ?? []).length}`);
  console.log(`  variance_records: ${(matrix.variance_records ?? []).length}`);
  console.log(`  manual_review_records: ${(matrix.manual_review_records ?? []).length}`);
}

function compare(a, b) {
  const ga = readGolden(a);
  const gb = readGolden(b);
  const classes = new Set([
    ...Object.keys(ga.expected_summary ?? {}),
    ...Object.keys(gb.expected_summary ?? {}),
  ]);
  console.log(`Compare\n  A: ${a}\n  B: ${b}`);
  for (const cls of [...classes].sort()) {
    const left = Number(ga.expected_summary?.[cls] ?? 0);
    const right = Number(gb.expected_summary?.[cls] ?? 0);
    const delta = right - left;
    const sign = delta > 0 ? "+" : "";
    console.log(`  ${cls}: ${left} -> ${right} (${sign}${delta})`);
  }
}

const [cmd, ...args] = process.argv.slice(2);

try {
  if (!cmd || cmd === "--help" || cmd === "-h") {
    usage();
    process.exit(0);
  }

  if (cmd === "summary") {
    const dir = args[0];
    if (!dir) {
      usage();
      process.exit(1);
    }
    summary(dir);
    process.exit(0);
  }

  if (cmd === "compare") {
    const [a, b] = args;
    if (!a || !b) {
      usage();
      process.exit(1);
    }
    compare(a, b);
    process.exit(0);
  }

  usage();
  process.exit(1);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
