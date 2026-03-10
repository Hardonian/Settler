import assert from "node:assert/strict";
import {
  generateReconciliationSuite,
  runSyntheticEngineValidationRuntime,
} from "../lib/reconciliation-foundry";

const seed = Number(process.env.RECON_SEED ?? 42);
const profile =
  (process.env.RECON_PROFILE as "smoke" | "integration" | "load" | "chaos") ?? "smoke";

(async () => {
  const suite = generateReconciliationSuite({ seed, profile });
  const report = await runSyntheticEngineValidationRuntime(suite);

  assert.equal(report.engine, "recon_core.performReconciliation");
  assert.ok(report.matched > 0, "expected at least one runtime match");

  const labels = new Set<import("../lib/reconciliation-foundry").MatchClass>(
    Object.values(report.per_transaction)
  );
  for (const label of [
    "exact_match",
    "grouped_match",
    "duplicate_detected",
    "manual_review",
    "dispute_related",
    "reversal_related",
  ] as import("../lib/reconciliation-foundry").MatchClass[]) {
    assert.ok(labels.has(label), `expected runtime classification coverage for ${label}`);
  }
  assert.ok(
    (
      [
        "timing_variance",
        "fx_variance",
        "fee_variance",
        "status_conflict",
      ] as import("../lib/reconciliation-foundry").MatchClass[]
    ).some((label) => labels.has(label)),
    "expected at least one variance/status classification"
  );

  process.stdout.write(
    `${JSON.stringify({
      engine: report.engine,
      matched: report.matched,
      unmatched: report.unmatched,
      classifications: Array.from(labels).sort(),
    })}\n`
  );
})();
