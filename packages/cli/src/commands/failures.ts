/**
 * settler failures — Failure Intelligence CLI
 *
 * Phase 7: Structured failure classification and inspection.
 *
 * Failures are persisted as JSON files under `recon_failures/` by default.
 * Each failure record carries a category, timestamps, and relevant context.
 *
 * Categories:
 *   policy_rejection   — governance rule blocked the run
 *   dependency_failure — external adapter/connector unavailable
 *   timeout            — run exceeded deadline
 *   nondeterminism     — replay hash diverged from original
 *   internal_error     — unexpected internal exception
 */

import fs from "node:fs/promises";
import path from "node:path";
import { Command } from "commander";
import chalk from "chalk";
import { resolveWithinCwd } from "../lib/safety";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FailureCategory =
  | "policy_rejection"
  | "dependency_failure"
  | "timeout"
  | "nondeterminism"
  | "internal_error";

export interface FailureRecord {
  id: string;
  runId: string;
  tenantRef: string;
  category: FailureCategory;
  message: string;
  context: Record<string, unknown>;
  occurredAt: string;
  resolvedAt: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_CATEGORIES = new Set<FailureCategory>([
  "policy_rejection",
  "dependency_failure",
  "timeout",
  "nondeterminism",
  "internal_error",
]);

function isValidCategory(value: unknown): value is FailureCategory {
  return typeof value === "string" && VALID_CATEGORIES.has(value as FailureCategory);
}

function isFailureRecord(value: unknown): value is FailureRecord {
  if (!value || typeof value !== "object") return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.runId === "string" &&
    typeof r.category === "string" &&
    isValidCategory(r.category) &&
    typeof r.message === "string" &&
    typeof r.occurredAt === "string"
  );
}

async function loadFailures(dir: string): Promise<FailureRecord[]> {
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return [];
  }

  const records: FailureRecord[] = [];
  for (const entry of entries) {
    if (!entry.endsWith(".json")) continue;
    try {
      const raw = await fs.readFile(path.join(dir, entry), "utf8");
      const parsed: unknown = JSON.parse(raw);
      if (isFailureRecord(parsed)) {
        records.push(parsed);
      }
    } catch {
      // Skip malformed files
    }
  }
  return records;
}

// ---------------------------------------------------------------------------
// Command
// ---------------------------------------------------------------------------

export const failuresCommand = new Command("failures").description(
  "Inspect structured failure records from reconciliation runs"
);

failuresCommand
  .command("inspect")
  .description("List and filter failure records")
  .option("--dir <dir>", "Directory containing failure JSON files", "recon_failures")
  .option("--category <category>", "Filter by category (policy_rejection|dependency_failure|timeout|nondeterminism|internal_error)")
  .option("--run-id <runId>", "Filter by run ID")
  .option("--limit <n>", "Maximum records to display", "20")
  .option("--json", "Output raw JSON array")
  .action(async (options: { dir: string; category?: string; runId?: string; limit: string; json?: boolean }) => {
    const dir = resolveWithinCwd(options.dir);
    let records = await loadFailures(dir);

    if (records.length === 0) {
      console.log(chalk.yellow(`No failure records found in ${dir}`));
      console.log(chalk.gray("Failure files are written to this directory when runs fail."));
      return;
    }

    if (options.category) {
      if (!isValidCategory(options.category)) {
        console.error(chalk.red(`Invalid category: ${options.category}`));
        console.error(`Valid categories: ${Array.from(VALID_CATEGORIES).join(", ")}`);
        process.exit(1);
      }
      records = records.filter((r) => r.category === options.category);
    }

    if (options.runId) {
      records = records.filter((r) => r.runId === options.runId);
    }

    // Sort newest first
    records.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

    const limit = Math.max(1, parseInt(options.limit, 10) || 20);
    records = records.slice(0, limit);

    if (options.json) {
      process.stdout.write(`${JSON.stringify(records, null, 2)}\n`);
      return;
    }

    // Summary header
    const categoryCounts = records.reduce<Record<string, number>>((acc, r) => {
      acc[r.category] = (acc[r.category] ?? 0) + 1;
      return acc;
    }, {});

    console.log(chalk.bold(`\nFailure Intelligence Report`));
    console.log(`Total displayed: ${records.length}`);
    console.log("By category:");
    for (const [cat, count] of Object.entries(categoryCounts)) {
      const color =
        cat === "nondeterminism" || cat === "internal_error"
          ? chalk.red
          : cat === "policy_rejection"
          ? chalk.yellow
          : chalk.cyan;
      console.log(`  ${color(cat)}: ${count}`);
    }
    console.log();

    for (const record of records) {
      const resolved = record.resolvedAt ? chalk.green(`resolved=${record.resolvedAt}`) : chalk.red("unresolved");
      console.log(
        `${chalk.bold(record.id)} [${chalk.yellow(record.category)}] run=${record.runId} ${resolved}`
      );
      console.log(`  ${record.message}`);
      if (Object.keys(record.context).length > 0) {
        console.log(`  context=${JSON.stringify(record.context)}`);
      }
      console.log(`  occurred=${record.occurredAt}`);
      console.log();
    }
  });

failuresCommand
  .command("record")
  .description("Manually record a failure (for testing and integration)")
  .requiredOption("--run-id <runId>", "Run ID that failed")
  .requiredOption("--category <category>", "Failure category")
  .requiredOption("--message <message>", "Human-readable failure message")
  .option("--tenant-ref <ref>", "Redacted tenant reference", "unknown")
  .option("--dir <dir>", "Failure output directory", "recon_failures")
  .option("--context <json>", "Additional context as JSON string", "{}")
  .action(async (options: { runId: string; category: string; message: string; tenantRef: string; dir: string; context: string }) => {
    if (!isValidCategory(options.category)) {
      console.error(chalk.red(`Invalid category: ${options.category}`));
      process.exit(1);
    }

    let context: Record<string, unknown>;
    try {
      context = JSON.parse(options.context) as Record<string, unknown>;
    } catch {
      console.error(chalk.red("--context must be valid JSON"));
      process.exit(1);
    }

    const record: FailureRecord = {
      id: `fail-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      runId: options.runId,
      tenantRef: options.tenantRef,
      category: options.category as FailureCategory,
      message: options.message,
      context,
      occurredAt: new Date().toISOString(),
      resolvedAt: null,
    };

    const dir = resolveWithinCwd(options.dir);
    await fs.mkdir(dir, { recursive: true });
    const outPath = path.join(dir, `${record.id}.json`);
    await fs.writeFile(outPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
    console.log(chalk.green(`Failure recorded: ${record.id}`));
    console.log(`category=${record.category} run=${record.runId}`);
  });

failuresCommand
  .command("summary")
  .description("Print category breakdown across all failure records")
  .option("--dir <dir>", "Directory containing failure JSON files", "recon_failures")
  .action(async (options: { dir: string }) => {
    const dir = resolveWithinCwd(options.dir);
    const records = await loadFailures(dir);
    if (records.length === 0) {
      console.log(chalk.yellow("No failure records found."));
      return;
    }

    const counts: Record<FailureCategory, number> = {
      policy_rejection: 0,
      dependency_failure: 0,
      timeout: 0,
      nondeterminism: 0,
      internal_error: 0,
    };
    for (const r of records) counts[r.category]++;

    const unresolved = records.filter((r) => !r.resolvedAt).length;
    console.log(chalk.bold("Failure Summary"));
    console.log(`Total: ${records.length}  Unresolved: ${unresolved}`);
    for (const [cat, count] of Object.entries(counts) as [FailureCategory, number][]) {
      if (count > 0) console.log(`  ${cat}: ${count}`);
    }
  });
