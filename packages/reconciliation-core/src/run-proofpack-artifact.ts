/**
 * Deterministic run proofpack artifact structure + content hash for audit-grade exports.
 */

import { createHash } from "node:crypto";

import {
  canonicalMissingProofpackReasonForRunKind,
  resolveRunCompactProofSummary,
  unavailableRunProofpackIndex,
  type RunProofpackIndex,
} from "./run-proofpack-index.js";
import type { OperatorRunDetail } from "./operator-run-detail.js";

export type RunProofpackArtifactV1 = {
  schemaVersion: "proofpack.run.v1";
  generatedAt: string;
  contentHash: string;
  run: {
    id: string;
    runKind: OperatorRunDetail["runKind"];
    status: string;
    startedAt: string;
    completedAt: string | null;
    detailHref: string;
  };
  proofpackIndex: RunProofpackIndex;
  compactProofSummary: OperatorRunDetail["compactProofSummary"];
  /** Same blocks as operator GET /api/runs/[id] — proofpack is an export of operator truth */
  institutionalMemory?: OperatorRunDetail["institutionalMemory"];
  intelligence?: OperatorRunDetail["intelligence"];
  inputs: {
    summary: OperatorRunDetail["summary"];
    summarySemantics: OperatorRunDetail["summarySemantics"];
    configDrift: OperatorRunDetail["configDrift"];
    config: Pick<
      OperatorRunDetail["config"],
      | "snapshotId"
      | "inputHash"
      | "sourceAdapter"
      | "targetAdapter"
      | "reconStrategy"
      | "templateId"
    >;
  };
  outputs: {
    summaryState: string;
    exceptions: OperatorRunDetail["exceptions"];
    resultContext: OperatorRunDetail["resultContext"];
  };
  deltas: {
    runDelta: OperatorRunDetail["runDelta"];
  };
  adjudications: NonNullable<OperatorRunDetail["institutionalMemory"]>["adjudications"];
  operatorSummary: OperatorRunDetail["compactProofSummary"]["operatorSummary"];
  provenance: OperatorRunDetail["provenance"];
  supportability: {
    shareable: boolean;
    notes: readonly string[];
  };
};

function stableNormalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => stableNormalize(entry));
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort()) {
      out[key] = stableNormalize(obj[key]);
    }
    return out;
  }
  return value;
}

function stableJsonStringify(value: unknown): string {
  return JSON.stringify(stableNormalize(value));
}

export function computeProofpackContentHash(
  payload: Omit<RunProofpackArtifactV1, "generatedAt" | "contentHash">
): string {
  const canonical = stableJsonStringify(payload);
  return createHash("sha256").update(canonical).digest("hex");
}

/**
 * Builds the same semantic document as GET /api/runs/:id/proofpack, with deterministic
 * {@link contentHash} (excludes generatedAt from the hashed payload).
 */
export function buildDeterministicRunProofpackArtifact(input: {
  detail: OperatorRunDetail;
  generatedAtIso?: string;
}): RunProofpackArtifactV1 {
  const { detail } = input;
  const generatedAt = input.generatedAtIso ?? "1970-01-01T00:00:00.000Z";

  const proofpackIndex =
    detail.proofpackIndex ??
    unavailableRunProofpackIndex(canonicalMissingProofpackReasonForRunKind(detail.runKind));

  const compactProofSummary = resolveRunCompactProofSummary({
    runKind: detail.runKind,
    compactProofSummary: detail.compactProofSummary,
    proofpackIndex,
  }).compactProofSummary;

  const base: Omit<RunProofpackArtifactV1, "contentHash"> = {
    schemaVersion: "proofpack.run.v1",
    generatedAt,
    run: {
      id: detail.id,
      runKind: detail.runKind,
      status: detail.status,
      startedAt: detail.startedAt,
      completedAt: detail.completedAt,
      detailHref: detail.detailHref,
    },
    proofpackIndex,
    compactProofSummary,
    institutionalMemory: detail.institutionalMemory,
    intelligence: detail.intelligence,
    inputs: {
      summary: detail.summary,
      summarySemantics: detail.summarySemantics,
      configDrift: detail.configDrift,
      config: {
        snapshotId: detail.config.snapshotId,
        inputHash: detail.config.inputHash,
        sourceAdapter: detail.config.sourceAdapter,
        targetAdapter: detail.config.targetAdapter,
        reconStrategy: detail.config.reconStrategy,
        templateId: detail.config.templateId,
      },
    },
    outputs: {
      summaryState: detail.summaryState,
      exceptions: detail.exceptions,
      resultContext: detail.resultContext,
    },
    deltas: { runDelta: detail.runDelta ?? null },
    adjudications: detail.institutionalMemory?.adjudications ?? [],
    operatorSummary: compactProofSummary.operatorSummary,
    provenance: detail.provenance,
    supportability: {
      shareable: Boolean(
        proofpackIndex.proofPackages.state === "ready" &&
        proofpackIndex.comparison.state === "available"
      ),
      notes: compactProofSummary.operatorSummary.primaryReasonCodes,
    },
  };

  const contentHash = computeProofpackContentHash(base);

  return {
    ...base,
    contentHash,
  };
}
