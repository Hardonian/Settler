import fs from "node:fs";
import path from "node:path";
import {
  exportReconciliationSuite,
  generateReconciliationSuite,
  runSyntheticEngineValidation,
} from "../lib/reconciliation-foundry";

const seed = Number(process.env.RECON_SEED ?? 42);
const profile =
  (process.env.RECON_PROFILE as "smoke" | "integration" | "load" | "chaos") ?? "smoke";
const output = process.env.RECON_OUTPUT ?? `test-data/exports/${profile}-seed${seed}`;

const suite = generateReconciliationSuite({ seed, profile });
exportReconciliationSuite(suite, output);
const runtimeStart = process.hrtime.bigint();
const report = runSyntheticEngineValidation(suite);
const runtimeMs = Number(process.hrtime.bigint() - runtimeStart) / 1_000_000;

const summary = {
  dataset: `${profile}-seed${seed}`,
  records_processed: report.processed_records,
  matches: report.matched,
  exceptions: report.unmatched,
  variances: report.variances,
  duplicates: report.duplicates,
  runtime_ms: Number(runtimeMs.toFixed(2)),
};

fs.writeFileSync(
  path.join(output, "engine_validation_report.json"),
  JSON.stringify(summary, null, 2)
);
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
