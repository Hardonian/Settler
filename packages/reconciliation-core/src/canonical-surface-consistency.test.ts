import { mapCanonicalListItemToApiRunsLegacyRow } from "./api-runs-list-adapter.js";
import { assertCanonicalConsistency } from "./canonical-consistency.js";
import type { CanonicalReconciliationListItem, CanonicalReconciliationRunDetail } from "./canonical-reconciliation.js";
import {
  buildOperatorReconRunDetailJson,
  operatorRunDetailToApiRunsLegacyRow,
} from "./operator-run-detail.js";
import { buildDeterministicRunProofpackArtifact } from "./run-proofpack-artifact.js";

const baseDetail: CanonicalReconciliationRunDetail = {
  runKind: "recon_job",
  id: "run-consistency-1",
  tenantId: "tenant-1",
  name: "Consistency run",
  reconResultId: "res-1",
  lifecycle: {
    status: "completed",
    statusLabel: "Completed",
    isTerminal: true,
    progressPercent: 100,
    progressState: "completed",
  },
  summaryState: "success",
  summary: {
    total: 10,
    sourceCount: 5,
    targetCount: 5,
    processed: 10,
    matched: 8,
    matchedWithTolerance: 1,
    unmatched: 2,
    unmatchedSourceCount: 1,
    unmatchedTargetCount: 1,
    conflicts: 0,
    exceptioned: 0,
    unresolved: 0,
    ignored: 0,
    resolved: 0,
  },
  provenance: {
    sourceModel: "recon_jobs",
    runKind: "recon_job",
    ingestionId: null,
    reconJobId: "run-consistency-1",
  },
  adapters: { sourceAdapter: "stripe", targetAdapter: "netsuite" },
  timestamps: {
    createdAt: "2026-01-01T00:00:00.000Z",
    startedAt: "2026-01-01T00:01:00.000Z",
    completedAt: "2026-01-01T00:02:00.000Z",
    updatedAt: "2026-01-01T00:02:00.000Z",
  },
  configDrift: {
    status: "none",
    strategyChanged: false,
    templateChanged: false,
    validationRulesChanged: false,
    adapter: {
      status: "none",
      comparisonMode: "unavailable",
      sourceChanged: null,
      targetChanged: null,
      sourceHashPresent: false,
      targetHashPresent: false,
    },
    notes: [],
  },
  errorMessage: null,
  traceId: null,
  metadata: {},
  latestResultId: "res-1",
};

describe("canonical surface consistency", () => {
  it("aligns list API legacy row with operator detail legacy overlap", () => {
    const listItem: CanonicalReconciliationListItem = {
      runKind: baseDetail.runKind,
      id: baseDetail.id,
      tenantId: baseDetail.tenantId,
      name: baseDetail.name,
      reconResultId: baseDetail.reconResultId,
      lifecycle: baseDetail.lifecycle,
      summaryState: baseDetail.summaryState,
      summary: baseDetail.summary,
      provenance: baseDetail.provenance,
      adapters: baseDetail.adapters,
      timestamps: baseDetail.timestamps,
      configDrift: baseDetail.configDrift,
    };

    const listRow = mapCanonicalListItemToApiRunsLegacyRow(listItem);

    const detail = buildOperatorReconRunDetailJson({
      detail: baseDetail,
      status: "completed",
      startedAt: "2026-01-01T00:01:00.000Z",
      completedAt: "2026-01-01T00:02:00.000Z",
      errorMessage: null,
      summaryMathNote: "note",
      resultContext: {
        latestResultId: "res-1",
        latestResultStatus: "completed",
        latestResultStartedAt: "2026-01-01T00:01:00.000Z",
        latestResultCompletedAt: "2026-01-01T00:02:00.000Z",
        persistedResultCount: 1,
        comparison: null,
      },
      config: {
        sourceAdapter: "stripe",
        targetAdapter: "netsuite",
        reconStrategy: "deterministic",
        templateId: "tpl-1",
        validationRuleCount: 0,
        validationRuleLabels: [],
        ruleVersionCount: 0,
        ruleVersionLabels: [],
        snapshotId: null,
        inputHash: null,
        configSource: "job_definition",
        configCapturedAt: null,
        definitionDriftDetected: false,
        definitionDriftNotes: [],
        summaryBasis: "results",
      },
      exceptions: {
        total: 0,
        pending: 0,
        investigating: 0,
        resolved: 0,
        ignored: 0,
        reviewRequired: 0,
      },
      rowRationaleCodes: [],
      rowResultsPreview: [],
      stages: [],
    });

    const detailRow = operatorRunDetailToApiRunsLegacyRow(detail);

    expect(() =>
      assertCanonicalConsistency({
        runId: baseDetail.id,
        listRow,
        detailRow,
      })
    ).not.toThrow();
  });

  it("snapshots deterministic proofpack artifact shape for export parity", () => {
    const detail = buildOperatorReconRunDetailJson({
      detail: baseDetail,
      status: "completed",
      startedAt: "2026-01-01T00:01:00.000Z",
      completedAt: "2026-01-01T00:02:00.000Z",
      errorMessage: null,
      summaryMathNote: "note",
      resultContext: {
        latestResultId: "res-1",
        latestResultStatus: "completed",
        latestResultStartedAt: "2026-01-01T00:01:00.000Z",
        latestResultCompletedAt: "2026-01-01T00:02:00.000Z",
        persistedResultCount: 1,
        comparison: null,
      },
      config: {
        sourceAdapter: "stripe",
        targetAdapter: "netsuite",
        reconStrategy: "deterministic",
        templateId: "tpl-1",
        validationRuleCount: 0,
        validationRuleLabels: [],
        ruleVersionCount: 0,
        ruleVersionLabels: [],
        snapshotId: null,
        inputHash: null,
        configSource: "job_definition",
        configCapturedAt: null,
        definitionDriftDetected: false,
        definitionDriftNotes: [],
        summaryBasis: "results",
      },
      exceptions: {
        total: 0,
        pending: 0,
        investigating: 0,
        resolved: 0,
        ignored: 0,
        reviewRequired: 0,
      },
      rowRationaleCodes: [],
      rowResultsPreview: [],
      stages: [],
    });

    const artifact = buildDeterministicRunProofpackArtifact({
      detail,
      generatedAtIso: "2026-01-15T12:00:00.000Z",
    });

    const { generatedAt: _g, ...rest } = artifact;
    expect(rest).toMatchSnapshot();
  });
});
