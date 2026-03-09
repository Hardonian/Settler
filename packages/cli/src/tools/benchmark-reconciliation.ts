import {
  generateReconciliationSuite,
  runSyntheticEngineValidation,
} from "../lib/reconciliation-foundry";

const profiles: Array<"smoke" | "integration" | "load" | "chaos"> = [
  "smoke",
  "integration",
  "load",
  "chaos",
];
const seed = Number(process.env.RECON_SEED ?? 42);

const results = profiles.map((profile) => {
  const suite = generateReconciliationSuite({ seed, profile });
  const start = process.hrtime.bigint();
  const report = runSyntheticEngineValidation(suite);
  const runtimeMs = Number(process.hrtime.bigint() - start) / 1_000_000;
  return {
    profile,
    source_records: suite.sources.PAYMENT_PROCESSOR.length,
    target_records: suite.sources.BANK_STATEMENT.length,
    runtime_ms: Number(runtimeMs.toFixed(2)),
    memory_mb: Number((process.memoryUsage().rss / (1024 * 1024)).toFixed(2)),
    match_rate: Number((report.matched / suite.sources.PAYMENT_PROCESSOR.length).toFixed(4)),
    exception_rate: Number((report.unmatched / suite.sources.PAYMENT_PROCESSOR.length).toFixed(4)),
  };
});

process.stdout.write(`${JSON.stringify({ seed, results }, null, 2)}\n`);
