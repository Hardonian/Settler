import fs from "node:fs";
import path from "node:path";

export interface OperatorReplayStatus {
  replay_status: "matched" | "diverged" | "failed" | "not_found";
  divergence: unknown;
  execution_time: number | null;
  hash_match: boolean;
}

interface StoredReplayReport {
  run_id: string;
  tenant_id: string | null;
  replay_status: "matched" | "diverged" | "failed";
  divergence: unknown;
  execution_time_ms: number;
  hash_match: boolean;
}

export function getOperatorReplayStatus(runId: string, tenantId?: string): OperatorReplayStatus {
  const candidatePaths = [
    path.resolve("artifacts", "replay-verification", `${runId}.json`),
    path.resolve("packages", "cli", "artifacts", "replay-verification", `${runId}.json`),
  ];
  const filePath = candidatePaths.find((candidate) => fs.existsSync(candidate));

  if (!filePath) {
    return {
      replay_status: "not_found",
      divergence: null,
      execution_time: null,
      hash_match: false,
    };
  }

  const report = JSON.parse(fs.readFileSync(filePath, "utf8")) as StoredReplayReport;
  if (report.tenant_id && tenantId && report.tenant_id !== tenantId) {
    return {
      replay_status: "not_found",
      divergence: null,
      execution_time: null,
      hash_match: false,
    };
  }

  return {
    replay_status: report.replay_status,
    divergence: report.divergence,
    execution_time: report.execution_time_ms,
    hash_match: report.hash_match,
  };
}
