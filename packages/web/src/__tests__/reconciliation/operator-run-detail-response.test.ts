import type { OperatorRunDetail } from "@/types/operator-run-detail";
import {
  getOperatorRunDetailProvenanceSignals,
  parseOperatorRunDetailResponse,
} from "@/lib/runs/operator-run-detail";

const detail: OperatorRunDetail = {
  runKind: "recon_job",
  sourceModel: "recon_jobs",
  id: "run-1",
  detailHref: "/console/runs/run-1",
  name: "Run 1",
  status: "completed",
  statusLabel: "Completed",
  isTerminal: true,
  progress: 100,
  progressState: "completed",
  startedAt: "2026-01-01T00:00:00.000Z",
  completedAt: "2026-01-01T00:01:00.000Z",
  summary: {
    total: 10,
    sourceCount: 5,
    targetCount: 5,
    matched: 8,
    unmatched: 2,
    unmatchedSourceCount: 1,
    unmatchedTargetCount: 1,
    conflicts: 0,
  },
  summarySemantics: {
    processed: 10,
    matchedWithTolerance: 0,
    exceptioned: 1,
    unresolved: 1,
    ignored: 0,
    resolved: 0,
  },
  summaryState: "success",
  summaryMath: {
    sourceCount: 5,
    targetCount: 5,
    matchedCount: 8,
    unmatchedSourceCount: 1,
    unmatchedTargetCount: 1,
    conflictCount: 0,
    note: "math",
  },
  provenance: {
    sourceModel: "recon_jobs",
    runKind: "recon_job",
    ingestionId: null,
    reconJobId: "run-1",
    executedAt: "2026-01-01T00:00:00.000Z",
    completedAt: "2026-01-01T00:01:00.000Z",
    sourceAdapter: "stripe",
    targetAdapter: "netsuite",
  },
  resultContext: {
    latestResultId: "result-1",
    latestResultStatus: "completed",
    latestResultStartedAt: "2026-01-01T00:00:00.000Z",
    latestResultCompletedAt: "2026-01-01T00:01:00.000Z",
    persistedResultCount: 1,
    comparison: null,
  },
  config: {
    sourceAdapter: "stripe",
    targetAdapter: "netsuite",
    reconStrategy: "deterministic",
    templateId: "tpl-1",
    validationRuleCount: 1,
    validationRuleLabels: ["amount"],
    ruleVersionCount: 1,
    ruleVersionLabels: ["rule v1"],
    snapshotId: "snap-1",
    inputHash: "hash-1",
    configSource: "snapshot",
    configCapturedAt: "2026-01-01T00:00:00.000Z",
    definitionDriftDetected: false,
    definitionDriftNotes: [],
    summaryBasis: "snapshot",
  },
  configDrift: {
    status: "none",
    adapter: "none",
  },
  exceptions: {
    total: 1,
    pending: 1,
    investigating: 0,
    resolved: 0,
    ignored: 0,
    reviewRequired: 1,
  },
  rowRationale: {
    available: false,
    rowCount: 0,
    codes: [],
  },
  rowResultsPreview: [],
  stages: [],
  metadata: { userId: "user-1", traceId: "stale-metadata-trace", inputHash: "stale-metadata-hash" },
  traceId: "trace-1",
  kindDetail: {
    kind: "recon_job",
    reconJob: {
      rowRationale: {
        available: false,
        rowCount: 0,
        codes: [],
      },
    },
  },
};

describe("operator run detail response helpers", () => {
  it("accepts the canonical raw Next route payload", () => {
    expect(parseOperatorRunDetailResponse(detail)).toEqual(detail);
  });

  it("accepts the wrapped Express compatibility envelope", () => {
    expect(parseOperatorRunDetailResponse({ data: detail })).toEqual(detail);
  });

  it("reads provenance signals from canonical fields instead of stale metadata mirrors", () => {
    expect(getOperatorRunDetailProvenanceSignals(detail)).toEqual({
      traceId: "trace-1",
      inputHash: "hash-1",
    });
  });

  it("throws for non-detail payloads", () => {
    expect(() => parseOperatorRunDetailResponse({ nope: true })).toThrow(
      "Invalid operator run detail payload"
    );
  });
});
