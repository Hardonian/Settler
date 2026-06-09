import type { CanonicalReconciliationListItem } from "./canonical-reconciliation.js";
import { buildConsoleReconciliationListBody } from "./console-reconciliation-list";
import type { MergedReconciliationListResponse } from "./merged-runs-query.js";

function mockPage(runs: CanonicalReconciliationListItem[]): MergedReconciliationListResponse {
  return {
    runs,
    next_cursor: null,
    pagination: {
      limit: 50,
      returned: runs.length,
      has_more: false,
      job_stream_has_more: false,
      ingestion_stream_has_more: false,
      job_stream_exhausted: true,
      ingestion_stream_exhausted: true,
    },
    response_meta: {
      contract_version: 1,
      included_run_kinds: ["recon_job", "ingestion_run"],
      ordering: "test",
      consistency: "read_committed",
    },
  };
}

describe("buildConsoleReconciliationListBody", () => {
  const job: CanonicalReconciliationListItem = {
    runKind: "recon_job",
    id: "j1",
    tenantId: "t",
    name: "Job",
    reconResultId: null,
    lifecycle: {
      status: "completed",
      statusLabel: "Completed",
      isTerminal: true,
      progressPercent: 100,
      progressState: "completed",
    },
    summaryState: "success",
    summary: {
      total: 0,
      sourceCount: 1,
      targetCount: 1,
      processed: 0,
      matched: 0,
      matchedWithTolerance: 0,
      unmatched: 0,
      unmatchedSourceCount: 0,
      unmatchedTargetCount: 0,
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
      reconJobId: "j1",
    },
    adapters: { sourceAdapter: "a", targetAdapter: "b" },
    timestamps: {
      createdAt: "2024-01-01T00:00:00.000Z",
      startedAt: null,
      completedAt: null,
      updatedAt: "2024-01-01T00:00:00.000Z",
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
  };

  const ing: CanonicalReconciliationListItem = {
    ...job,
    runKind: "ingestion_run",
    id: "i1",
    provenance: {
      sourceModel: "recon_results",
      runKind: "ingestion_run",
      ingestionId: null,
      reconJobId: null,
    },
  };

  it("run_kind=all includes runs and job-shaped reconciliations", () => {
    const body = buildConsoleReconciliationListBody(mockPage([job, ing]), "all");
    expect(body.runs).toEqual([
      expect.objectContaining({
        id: "j1",
        runKind: "recon_job",
        sourceModel: "recon_jobs",
        detailHref: "/console/runs/j1",
      }),
      expect.objectContaining({
        id: "i1",
        runKind: "ingestion_run",
        sourceModel: "recon_results",
        detailHref: "/console/runs/i1",
      }),
    ]);
    expect(Array.isArray(body.reconciliations)).toBe(true);
    expect((body.reconciliations as unknown[]).length).toBe(1);
    const recs = body.reconciliations as { id: string }[];
    expect(recs[0]?.id).toBe("j1");
    expect(body.response_meta).toMatchObject({
      requested_run_kind: "all",
      default_run_kind: "all",
      legacy_reconciliations_field_scope: "recon_job_only",
    });
  });

  it("run_kind=recon_job still returns canonical runs list", () => {
    const body = buildConsoleReconciliationListBody(mockPage([job, ing]), "recon_job");
    expect((body.runs as unknown[]).length).toBe(2);
    expect((body.reconciliations as unknown[]).length).toBe(1);
  });

  it("run_kind=ingestion_run keeps runs while reconciliations remains legacy-empty", () => {
    const body = buildConsoleReconciliationListBody(mockPage([ing]), "ingestion_run");
    expect((body.runs as unknown[]).length).toBe(1);
    expect(body.reconciliations).toEqual([]);
  });
});
