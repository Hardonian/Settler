import { canonicalJson, stableSha256 } from "@/lib/determinism/core";

export interface RunInput {
  tenantId: string;
  pipeline: string;
  config: Record<string, unknown>;
}

export interface RunRecord {
  runId: string;
  canonicalInput: string;
  evidenceManifest: {
    canonicalConfigPointer: string;
    summaryPointer: string;
  };
}

export function createDeterministicRun(input: RunInput): RunRecord {
  const canonicalInput = canonicalJson(input);
  const digest = stableSha256(canonicalInput);
  const runId = `run_${digest.slice(0, 24)}`;

  return {
    runId,
    canonicalInput,
    evidenceManifest: {
      canonicalConfigPointer: `evidence://${runId}/canonical-config.json`,
      summaryPointer: `evidence://${runId}/summary.json`,
    },
  };
}

