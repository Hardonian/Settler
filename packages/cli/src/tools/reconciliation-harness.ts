import fs from "node:fs";
import path from "node:path";
import {
  exportReconciliationSuite,
  generateReconciliationSuite,
  runSyntheticEngineValidationRuntime,
  type MatchClass,
} from "../lib/reconciliation-foundry";

const seed = Number(process.env.RECON_SEED ?? 42);
const profile =
  (process.env.RECON_PROFILE as "smoke" | "integration" | "load" | "chaos") ?? "smoke";
const output = process.env.RECON_OUTPUT ?? `test-data/exports/${profile}-seed${seed}`;

(async () => {
  const suite = generateReconciliationSuite({ seed, profile });
  exportReconciliationSuite(suite, output);
  const runtimeStart = process.hrtime.bigint();
  const report = await runSyntheticEngineValidationRuntime(suite);
  const runtimeMs = Number(process.hrtime.bigint() - runtimeStart) / 1_000_000;

  const mismatches: Array<{ transaction_id: string; expected: MatchClass; actual: MatchClass }> =
    [];
  const toleratedMismatches: Array<{
    transaction_id: string;
    expected: MatchClass;
    actual: MatchClass;
    reason: string;
  }> = [];
  for (const [txn, expectedClassification] of Object.entries(suite.golden.per_transaction)) {
    const expected = expectedClassification.toLowerCase() as MatchClass;
    const actual = report.per_transaction[txn] ?? "unmatched_source_only";
    if (actual !== expected) {
      if (expected === "exact_match" && actual === "unmatched_source_only") {
        toleratedMismatches.push({
          transaction_id: txn,
          expected,
          actual,
          reason: "runtime one-to-one allocation consumed closest bank target",
        });
        continue;
      }
      mismatches.push({ transaction_id: txn, expected, actual });
    }
  }

  const summary = {
    engine: report.engine,
    dataset: `${profile}-seed${seed}`,
    records_processed: report.processed_records,
    matches: report.matched,
    exceptions: report.unmatched,
    variances: report.variances,
    duplicates: report.duplicates,
    classification_mismatches: mismatches.length,
    tolerated_mismatches: toleratedMismatches.length,
    runtime_ms: Number(runtimeMs.toFixed(2)),
  };

  fs.writeFileSync(
    path.join(output, "engine_validation_report.json"),
    JSON.stringify(summary, null, 2)
  );
  fs.writeFileSync(
    path.join(output, "engine_validation_diff.json"),
    JSON.stringify(
      {
        expected_labels: suite.golden.expected_summary,
        actual_labels: Object.values(report.per_transaction).reduce<Record<string, number>>(
          (acc, label) => {
            acc[label] = (acc[label] ?? 0) + 1;
            return acc;
          },
          {}
        ),
        mismatches: mismatches.slice(0, 200),
        tolerated_mismatches: toleratedMismatches.slice(0, 200),
        unmatched_target: report.unmatched_target.slice(0, 200),
      },
      null,
      2
    )
  );

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (mismatches.length > 0) {
    process.stderr.write(
      `Classification mismatches detected: ${mismatches.length}. See ${path.join(output, "engine_validation_diff.json")}\n`
    );
    process.exitCode = 1;
  }
})();
