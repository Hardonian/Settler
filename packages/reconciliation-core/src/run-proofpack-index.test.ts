import {
  buildRunProofpackIndexByRunId,
  toRunCompactProofSummary,
  unavailableRunProofpackIndex,
} from "./run-proofpack-index.js";
import type { CanonicalReconciliationListItem } from "./canonical-reconciliation.js";

const baseRun: CanonicalReconciliationListItem = {
  runKind: "recon_job",
  id: "job-1",
  tenantId: "tenant-1",
  name: "Run",
  reconResultId: "result-1",
  lifecycle: {
    status: "completed",
    statusLabel: "Completed",
    isTerminal: true,
    progressPercent: 100,
    progressState: "completed",
  },
  summaryState: "success",
  summary: {
    total: 1,
    sourceCount: 1,
    targetCount: 1,
    processed: 1,
    matched: 1,
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
    reconJobId: "job-1",
  },
  adapters: { sourceAdapter: "a", targetAdapter: "b" },
  timestamps: {
    createdAt: "2026-01-01T00:00:00.000Z",
    startedAt: "2026-01-01T00:00:00.000Z",
    completedAt: "2026-01-01T00:01:00.000Z",
    updatedAt: "2026-01-01T00:01:00.000Z",
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

describe("run proofpack index", () => {
  it("returns deterministic available comparison when latest+prior completed results exist", async () => {
    const prisma: any = {
      reconciliationMatch: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "exception-1",
            runId: "job-1",
            severity: "high",
            status: "open",
            resolutionReason: "bank_window",
          },
          {
            id: "exception-2",
            runId: "job-1",
            severity: "medium",
            status: "resolved",
            resolutionReason: "bank_window",
          },
        ]),
      },
      exceptionAdjudicationMemory: {
        findMany: jest.fn().mockResolvedValue([
          { exceptionId: "exception-1", resolutionReason: "bank_window" },
          { exceptionId: "exception-2", resolutionReason: "bank_window" },
          { exceptionId: "exception-1", resolutionReason: "bank_window" },
        ]),
      },
      proofPackage: { findMany: jest.fn().mockResolvedValue([]) },
      $queryRaw: jest.fn().mockResolvedValue([
        {
          recon_job_id: "job-1",
          rn: 1,
          id: "result-2",
          started_at: new Date("2026-01-02T00:00:00.000Z"),
          status: "completed",
          matched_count: 10,
          unmatched_source_count: 1,
          unmatched_target_count: 0,
          conflict_count: 1,
        },
        {
          recon_job_id: "job-1",
          rn: 2,
          id: "result-1",
          started_at: new Date("2026-01-01T00:00:00.000Z"),
          status: "completed",
          matched_count: 8,
          unmatched_source_count: 1,
          unmatched_target_count: 1,
          conflict_count: 0,
        },
      ]),
    };

    const byRun = await buildRunProofpackIndexByRunId({
      prisma,
      tenantId: "tenant-1",
      runs: [baseRun],
    });
    const index = byRun.get("job-1");
    expect(index?.comparison.state).toBe("available");
    expect(index?.comparison.changedSincePriorRun).toBe("changed");
    expect(index?.comparison.deltas.matched).toBe(2);
    expect(index?.comparison.baseline.priorResultId).toBe("result-1");
    expect(index?.comparison.history.trend).toBe("improving");
    expect(index?.recurrence.topRecurringFamilies[0]?.family).toBe("bank_window");
  });

  it("returns unavailable comparison when baseline is missing", async () => {
    const prisma: any = {
      reconciliationMatch: { findMany: jest.fn().mockResolvedValue([]) },
      exceptionAdjudicationMemory: { findMany: jest.fn().mockResolvedValue([]) },
      proofPackage: { findMany: jest.fn().mockResolvedValue([]) },
      $queryRaw: jest.fn().mockResolvedValue([
        {
          recon_job_id: "job-1",
          rn: 1,
          id: "result-2",
          started_at: new Date("2026-01-02T00:00:00.000Z"),
          status: "completed",
          matched_count: 10,
          unmatched_source_count: 1,
          unmatched_target_count: 0,
          conflict_count: 1,
        },
      ]),
    };

    const byRun = await buildRunProofpackIndexByRunId({
      prisma,
      tenantId: "tenant-1",
      runs: [baseRun],
    });
    expect(byRun.get("job-1")?.comparison.state).toBe("unavailable");
    expect(byRun.get("job-1")?.comparison.reasonCodes).toContain("baseline_missing");
    expect(byRun.get("job-1")?.comparison.history.trend).toBe("unavailable");
  });

  it("builds canonical compact proof summary from full index", async () => {
    const prisma: any = {
      reconciliationMatch: { findMany: jest.fn().mockResolvedValue([]) },
      exceptionAdjudicationMemory: { findMany: jest.fn().mockResolvedValue([]) },
      proofPackage: { findMany: jest.fn().mockResolvedValue([]) },
      $queryRaw: jest.fn().mockResolvedValue([]),
    };

    const byRun = await buildRunProofpackIndexByRunId({
      prisma,
      tenantId: "tenant-1",
      runs: [baseRun],
    });
    const index = byRun.get("job-1");
    expect(index).toBeDefined();
    const compact = toRunCompactProofSummary(index!);
    expect(compact.delta.changedSincePreviousRun).toBe("unavailable");
    expect(compact.recurrence.state).toBe("setup_required");
  });

  it("returns explicit unavailable index contract for unsupported run types", () => {
    const unavailable = unavailableRunProofpackIndex();
    expect(unavailable.proofPackages.state).toBe("unavailable");
    expect(unavailable.comparison.reasonCodes).toEqual(["proofpack_index_unavailable"]);
    expect(unavailable.comparison.history.reasonCodes).toEqual(["proofpack_index_unavailable"]);
  });
});
