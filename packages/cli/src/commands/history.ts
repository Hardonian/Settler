import { Command } from "commander";
import chalk from "chalk";
import fs from "node:fs/promises";
import path from "node:path";
import {
  diffLedgerEntries,
  getLedgerDir,
  getLedgerEntry,
  listLedgerEntries,
  verifyLedgerEntry,
} from "../lib/execution-ledger";
import { createCliLogger, resolveJsonFallbackFromEnv } from "../lib/cli-logger";

export const historyCommand = new Command("history")
  .description("Show execution ledger history")
  .option("--tenant <tenantId>", "Filter by tenant")
  .action(async (options: { tenant?: string }) => {
    const json = resolveJsonFallbackFromEnv();
    const log = createCliLogger({ isJSONFallback: json });
    const entries = await listLedgerEntries(options.tenant);
    if (entries.length === 0) {
      log.warning("No execution ledger entries found.");
      return;
    }

    log.section("Execution ledger");
    for (const entry of entries) {
      const line1 = `${entry.execution_hash.slice(0, 12)} ${entry.status} ${entry.execution_id} (${entry.tenant_id}) ${entry.timestamp}`;
      const line2 = `  trace=${entry.trace_id} policy=${entry.policy_version} duration=${entry.duration}ms`;
      if (json) {
        log.detail(line1);
        log.detail(line2);
      } else {
        log.rawLine(`${chalk.yellow(entry.execution_hash.slice(0, 12))} ${entry.status} ${entry.execution_id} (${entry.tenant_id}) ${entry.timestamp}`);
        log.rawLine(line2);
      }
    }
  });

export const showCommand = new Command("show")
  .description("Show a single execution receipt from the ledger")
  .argument("<execution_id>")
  .action(async (executionId: string) => {
    const entry = await getLedgerEntry(executionId);
    if (!entry) {
      console.error(chalk.red(`Execution ${executionId} not found in ${getLedgerDir()}`));
      process.exit(1);
    }

    console.log(JSON.stringify(entry, null, 2));
  });

export const diffCommand = new Command("diff")
  .description("Diff two execution receipts")
  .argument("<execution_a>")
  .argument("<execution_b>")
  .action(async (executionA: string, executionB: string) => {
    const json = resolveJsonFallbackFromEnv();
    const log = createCliLogger({ isJSONFallback: json });
    const [a, b] = await Promise.all([getLedgerEntry(executionA), getLedgerEntry(executionB)]);
    if (!a || !b) {
      log.error("Both execution IDs must exist in ledger.");
      process.exit(1);
    }

    const diff = diffLedgerEntries(a, b);
    const keys = Object.keys(diff);
    if (keys.length === 0) {
      log.success("No differences across tracked fields.");
      return;
    }

    log.section("Diff");
    for (const key of keys) {
      if (json) {
        log.detail(`${key}:`);
        log.detail(`  a: ${JSON.stringify(diff[key]?.a)}`);
        log.detail(`  b: ${JSON.stringify(diff[key]?.b)}`);
      } else {
        log.rawLine(chalk.cyan(`${key}:`));
        log.rawLine(`  a: ${JSON.stringify(diff[key]?.a)}`);
        log.rawLine(`  b: ${JSON.stringify(diff[key]?.b)}`);
      }
    }
  });

export const verifyExecutionCommand = new Command("verify-execution")
  .description("Verify deterministic receipt integrity for an execution")
  .argument("<execution_id>")
  .action(async (executionId: string) => {
    const json = resolveJsonFallbackFromEnv();
    const log = createCliLogger({ isJSONFallback: json });
    const report = await verifyLedgerEntry(executionId);
    if (!report) {
      log.error(`Execution ${executionId} not found in ledger.`);
      process.exit(1);
    }

    const lines = [
      `execution=${report.executionId}`,
      `receipt_integrity=${report.receiptIntegrity}`,
      `hash_correct=${report.hashMatches}`,
      `replay_compatible=${report.replayCompatible}`,
      `expected_hash=${report.expectedHash}`,
      `computed_hash=${report.computedHash}`,
    ];
    if (json) {
      lines.forEach((line) => log.detail(line));
    } else {
      lines.forEach((line) => log.rawLine(line));
    }

    if (!report.receiptIntegrity || !report.hashMatches || !report.replayCompatible) {
      process.exit(1);
    }
  });

export const exportLedgerCommand = new Command("export-ledger")
  .description("Export execution ledger for audit workflows")
  .option("--tenant <tenantId>", "Tenant scope")
  .option("--format <format>", "json|csv|signed", "json")
  .option("--out <path>", "Output file path", "ledger-export.json")
  .action(async (options: { tenant?: string; format: string; out: string }) => {
    const entries = await listLedgerEntries(options.tenant);
    const outPath = path.resolve(process.cwd(), options.out);

    if (options.format === "json") {
      await fs.writeFile(outPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
    } else if (options.format === "csv") {
      const header =
        "execution_id,tenant_id,timestamp,status,execution_hash,previous_execution_hash,policy_version,duration,initiator";
      const rows = entries.map((entry) =>
        [
          entry.execution_id,
          entry.tenant_id,
          entry.timestamp,
          entry.status,
          entry.execution_hash,
          entry.previous_execution_hash,
          entry.policy_version,
          String(entry.duration),
          entry.initiator,
        ].join(",")
      );
      await fs.writeFile(outPath, `${header}\n${rows.join("\n")}\n`, "utf8");
    } else if (options.format === "signed") {
      const report = {
        generated_at: new Date().toISOString(),
        tenant: options.tenant ?? "all",
        count: entries.length,
        receipts: entries,
      };
      await fs.writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    } else {
      const log = createCliLogger({ isJSONFallback: resolveJsonFallbackFromEnv() });
      log.error("Unsupported format. Use json|csv|signed.");
      process.exit(1);
    }

    const log = createCliLogger({ isJSONFallback: resolveJsonFallbackFromEnv() });
    log.success(`Wrote ${entries.length} receipts to ${outPath}`);
  });
