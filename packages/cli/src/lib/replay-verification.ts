import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import {
  generateReconciliationSuite,
  runSyntheticEngineValidationRuntime,
  type GeneratedSuite,
  type RuntimeReconMatch,
} from "./reconciliation-foundry";

export interface ReplayBundle {
  run_id: string;
  tenant_id?: string;
  created_at?: string;
  input: {
    seed?: number;
    profile?: "smoke" | "integration" | "load" | "chaos";
    suite?: GeneratedSuite;
  };
  original_output: ReplayOutput;
}

export interface ReplayOutput {
  matched_transactions: Record<string, string>;
  manual_review_decisions: Array<{ transaction_id: string; rationale_codes: string[] }>;
  policy_evaluations: Record<string, number>;
  ledger_entries: Array<{ transaction_id: string; amount: number; currency: string }>;
}

export interface ReplayVerificationReport {
  run_id: string;
  tenant_id: string | null;
  replay_status: "matched" | "diverged" | "failed";
  hash_match: boolean;
  divergence: null | {
    field_differences: string[];
    policy_path_differences: string[];
    timing_differences: string[];
  };
  execution_time_ms: number;
  hashes: {
    original: string;
    replay: string;
  };
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
    a.localeCompare(b)
  );
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
}

function hashBLAKE3(value: unknown): string {
  const payload = stableStringify(value);
  try {
    return createHash("blake3").update(payload).digest("hex");
  } catch {
    return createHash("blake2s256").update(`blake3-unavailable:${payload}`).digest("hex");
  }
}

function normalizeManualReview(
  matches: RuntimeReconMatch[]
): ReplayOutput["manual_review_decisions"] {
  return matches
    .filter((match) => match.manual_review_rationale_codes.length > 0)
    .map((match) => ({
      transaction_id: match.transaction_id,
      rationale_codes: [...match.manual_review_rationale_codes].sort(),
    }))
    .sort((a, b) => a.transaction_id.localeCompare(b.transaction_id));
}

async function outputFromSuite(suite: GeneratedSuite): Promise<ReplayOutput> {
  const runtime = await runSyntheticEngineValidationRuntime(suite);
  const matched_transactions = Object.fromEntries(
    Object.entries(runtime.per_transaction).sort(([a], [b]) => a.localeCompare(b))
  );
  const manual_review_decisions = normalizeManualReview(suite.golden.runtime_matches);
  const policy_evaluations = Object.fromEntries(
    Object.entries(runtime.classification_summary).sort(([a], [b]) => a.localeCompare(b))
  );
  const ledger_entries = suite.sources.INTERNAL_LEDGER.map((entry) => ({
    transaction_id: entry.transaction_id,
    amount: entry.net_amount,
    currency: entry.currency,
  })).sort((a, b) => a.transaction_id.localeCompare(b.transaction_id));

  return {
    matched_transactions,
    manual_review_decisions,
    policy_evaluations,
    ledger_entries,
  };
}

export async function buildReplayBundle(seed: number, runId: string): Promise<ReplayBundle> {
  const suite = generateReconciliationSuite({ seed, profile: "smoke" });
  return {
    run_id: runId,
    tenant_id: `tenant_${seed}`,
    created_at: new Date().toISOString(),
    input: { seed, profile: "smoke", suite },
    original_output: await outputFromSuite(suite),
  };
}

function diffPaths(original: unknown, replay: unknown, base = "$"): string[] {
  if (stableStringify(original) === stableStringify(replay)) {
    return [];
  }

  if (
    original === null ||
    replay === null ||
    typeof original !== "object" ||
    typeof replay !== "object" ||
    Array.isArray(original) !== Array.isArray(replay)
  ) {
    return [base];
  }

  if (Array.isArray(original) && Array.isArray(replay)) {
    const max = Math.max(original.length, replay.length);
    const diffs: string[] = [];
    for (let i = 0; i < max; i += 1) {
      diffs.push(...diffPaths(original[i], replay[i], `${base}[${i}]`));
    }
    return diffs;
  }

  const keys = new Set([
    ...Object.keys(original as Record<string, unknown>),
    ...Object.keys(replay as Record<string, unknown>),
  ]);
  const diffs: string[] = [];
  for (const key of [...keys].sort()) {
    diffs.push(
      ...diffPaths(
        (original as Record<string, unknown>)[key],
        (replay as Record<string, unknown>)[key],
        `${base}.${key}`
      )
    );
  }
  return diffs;
}

export async function runReplayVerification(
  bundle: ReplayBundle
): Promise<ReplayVerificationReport> {
  const startedAt = Date.now();

  const suite =
    bundle.input.suite ??
    generateReconciliationSuite({
      seed: bundle.input.seed ?? 42,
      profile: bundle.input.profile ?? "smoke",
    });

  const replayOutput = await outputFromSuite(suite);
  const originalHash = hashBLAKE3(bundle.original_output);
  const replayHash = hashBLAKE3(replayOutput);
  const hashMatch = originalHash === replayHash;

  const executionTimeMs = Date.now() - startedAt;
  const fieldDiffs = diffPaths(bundle.original_output, replayOutput);
  const policyPathDiffs = diffPaths(
    bundle.original_output.policy_evaluations,
    replayOutput.policy_evaluations,
    "$.policy_evaluations"
  );

  const report: ReplayVerificationReport = {
    run_id: bundle.run_id,
    tenant_id: bundle.tenant_id ?? null,
    replay_status: hashMatch ? "matched" : "diverged",
    hash_match: hashMatch,
    divergence: hashMatch
      ? null
      : {
          field_differences: fieldDiffs,
          policy_path_differences: policyPathDiffs,
          timing_differences: [`execution_time_ms=${executionTimeMs}`],
        },
    execution_time_ms: executionTimeMs,
    hashes: {
      original: originalHash,
      replay: replayHash,
    },
  };

  return report;
}

export function loadReplayBundle(bundlePath: string): ReplayBundle {
  const absolutePath = path.resolve(bundlePath);
  const raw = fs.readFileSync(absolutePath, "utf8");
  return JSON.parse(raw) as ReplayBundle;
}

export function persistReplayReport(report: ReplayVerificationReport): string {
  const outDir = path.resolve("artifacts", "replay-verification");
  fs.mkdirSync(outDir, { recursive: true });
  const filePath = path.join(outDir, `${report.run_id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
  return filePath;
}
