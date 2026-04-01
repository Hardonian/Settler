/**
 * Pre-go-live simulation coverage for operator runs APIs.
 *
 * These scenarios intentionally exercise concurrent reads, degraded detail fetches,
 * and retry-duplication pressure with tenant-safe assertions.
 */

import request from "supertest";
import express from "express";
import { runsRouter } from "../runs";
import { AuthRequest } from "../../middleware/auth";

jest.mock("../../infrastructure/db/prisma", () => {
  const reconResult = {
    findMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  };
  return {
    prisma: {
      reconResult,
      $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) => fn({ reconResult })),
    },
  };
});

jest.mock(
  "@settler/reconciliation-core",
  () => ({
    decodeMergedRunsCursor: jest.fn(),
    encodeMergedRunsCursor: jest.fn((cursor: unknown) => JSON.stringify(cursor)),
    fetchMergedReconciliationRunsPage: jest.fn(),
    mapCanonicalListItemToApiRunsLegacyRow: jest.fn((row: any) => ({
      runKind: row.runKind,
      sourceModel: row.provenance.sourceModel,
      id: row.id,
      detailHref: `/console/runs/${row.id}`,
      name: row.name,
      status: row.lifecycle.status,
      statusLabel: row.lifecycle.statusLabel,
      startedAt: row.timestamps.startedAt ?? row.timestamps.createdAt,
      completedAt: row.timestamps.completedAt,
      summary: {
        total: row.summary.total,
        sourceCount: row.summary.sourceCount,
        targetCount: row.summary.targetCount,
        matched: row.summary.matched,
        unmatched: row.summary.unmatched,
        unmatchedSourceCount: row.summary.unmatchedSourceCount,
        unmatchedTargetCount: row.summary.unmatchedTargetCount,
        conflicts: row.summary.conflicts,
      },
      summarySemantics: {
        processed: row.summary.processed,
        matchedWithTolerance: row.summary.matchedWithTolerance,
        exceptioned: row.summary.exceptioned,
        unresolved: row.summary.unresolved,
        ignored: row.summary.ignored,
        resolved: row.summary.resolved,
      },
      summaryState: row.summaryState,
      progress: row.lifecycle.progressPercent,
      progressState: row.lifecycle.progressState,
      isTerminal: row.lifecycle.isTerminal,
      provenance: row.provenance,
      configDrift: {
        status: row.configDrift.status,
        adapter: "none",
      },
      ingestionId: row.provenance.ingestionId,
      sourceAdapter: row.adapters.sourceAdapter,
      targetAdapter: row.adapters.targetAdapter,
    })),
    MergedRunsCursorError: class MergedRunsCursorError extends Error {},
    resolveOperatorRunDetailForTenants: jest.fn(),
  }),
  { virtual: true }
);

const { prisma: mockedPrisma } = require("../../infrastructure/db/prisma");
const mockReconResult = mockedPrisma.reconResult;
const {
  decodeMergedRunsCursor: mockDecodeMergedRunsCursor,
  fetchMergedReconciliationRunsPage: mockFetchMergedReconciliationRunsPage,
  resolveOperatorRunDetailForTenants: mockResolveOperatorRunDetail,
} = require("@settler/reconciliation-core");

jest.mock("../../middleware/governance", () => ({
  enforceFreezeState: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  bypassFreeze: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock("../../middleware/authorization", () => ({
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock("../../middleware/validation", () => ({
  validateRequest: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock("../../utils/event-tracker", () => ({
  trackEventAsync: jest.fn(),
}));

jest.mock("../../utils/logger", () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
  logWarn: jest.fn(),
}));

function buildApp(tenantId: string, userId = "operator-sim"): express.Express {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as AuthRequest).tenantId = tenantId;
    (req as AuthRequest).userId = userId;
    next();
  });
  app.use("/api/runs", runsRouter);
  return app;
}

describe("Runs pre-go-live simulation", () => {
  const buildCanonicalListItem = (tenantId: string, id: string, status = "running") => ({
    runKind: "recon_job",
    id,
    tenantId,
    name: `Run ${id}`,
    reconResultId: null,
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
    lifecycle: {
      status,
      statusLabel: status.charAt(0).toUpperCase() + status.slice(1),
      isTerminal: status === "completed" || status === "failed",
      progressPercent: status === "running" ? 50 : 100,
      progressState: status === "running" ? "in_progress" : "completed",
    },
    summaryState: status === "running" ? "in_progress" : "success",
    summary: {
      total: 10,
      sourceCount: 5,
      targetCount: 5,
      processed: 10,
      matched: 8,
      matchedWithTolerance: 0,
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
      reconJobId: `${tenantId}-job-1`,
    },
    adapters: {
      sourceAdapter: "source-a",
      targetAdapter: "target-b",
    },
    timestamps: {
      createdAt: "2026-03-28T09:59:00.000Z",
      startedAt: "2026-03-28T10:00:00.000Z",
      completedAt: status === "running" ? null : "2026-03-28T10:05:00.000Z",
      updatedAt: "2026-03-28T10:05:00.000Z",
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchMergedReconciliationRunsPage.mockReset();
    mockDecodeMergedRunsCursor.mockReset();
    mockResolveOperatorRunDetail.mockReset();
  });

  it("sustains bursty multi-tenant list/detail polling without tenant scope drift", async () => {
    const appA = buildApp("tenant-A");
    const appB = buildApp("tenant-B");

    mockFetchMergedReconciliationRunsPage.mockImplementation(({ tenantId }: { tenantId: string }) =>
      Promise.resolve({
        runs: [buildCanonicalListItem(tenantId, `${tenantId}-run-1`)],
        next_cursor: null,
        pagination: {
          limit: 100,
          returned: 1,
          has_more: false,
          job_stream_has_more: false,
          ingestion_stream_has_more: false,
          job_stream_exhausted: true,
          ingestion_stream_exhausted: true,
        },
        response_meta: {
          contract_version: 1,
          included_run_kinds: ["recon_job", "ingestion_run"],
          ordering: "test-ordering",
          consistency: "read_committed",
        },
      })
    );

    mockResolveOperatorRunDetail.mockImplementation(
      async (_prisma: unknown, tenantScope: string[], runId: string) => ({
        kind: "ok",
        detail: {
          runKind: "recon_job" as const,
          id: runId,
          name: `Run ${runId}`,
          status: "running",
          progress: 50,
          stages: [],
          tenantScope,
        },
      })
    );

    const requests = Array.from({ length: 20 }).flatMap((_, idx) => [
      request(appA).get(`/api/runs?page=${(idx % 3) + 1}&limit=10`),
      request(appA).get(`/api/runs/tenant-A-run-${idx}`),
      request(appB).get(`/api/runs?page=${(idx % 3) + 1}&limit=10`),
      request(appB).get(`/api/runs/tenant-B-run-${idx}`),
    ]);

    const responses = await Promise.all(requests);
    expect(responses.every((res) => res.status === 200)).toBe(true);

    const listTenantIds = mockFetchMergedReconciliationRunsPage.mock.calls.map(
      (call: [{ tenantId: string }]) => call[0].tenantId
    );
    expect(listTenantIds).toContain("tenant-A");
    expect(listTenantIds).toContain("tenant-B");

    const detailTenantScopes = mockResolveOperatorRunDetail.mock.calls.map(
      (call: [unknown, string[], string]) => call[1][0]
    );
    expect(detailTenantScopes).toContain("tenant-A");
    expect(detailTenantScopes).toContain("tenant-B");
  });

  it("keeps operator-visible truth explicit across mixed success/not-found/degraded detail responses", async () => {
    const app = buildApp("tenant-sim");

    mockResolveOperatorRunDetail
      .mockResolvedValueOnce({
        kind: "ok",
        detail: { id: "run-ok", name: "ok", status: "running" },
      })
      .mockResolvedValueOnce({ kind: "not_found" })
      .mockResolvedValueOnce({ kind: "recon_enrichment_failed", message: "snapshot timeout" });

    const [ok, missing, degraded] = await Promise.all([
      request(app).get("/api/runs/run-ok"),
      request(app).get("/api/runs/run-missing"),
      request(app).get("/api/runs/run-degraded"),
    ]);

    expect(ok.status).toBe(200);
    expect(ok.body.data.status).toBe("running");

    expect(missing.status).toBe(404);
    expect(missing.body.error).toBe("NOT_FOUND");

    expect(degraded.status).toBe(500);
    expect(degraded.body.error).toBe("INTERNAL_SERVER_ERROR");
  });

  it("prevents duplicate retries during concurrent retry pressure on the same failed run", async () => {
    const app = buildApp("tenant-retry", "operator-1");
    let retryRunId: string | null = null;

    mockReconResult.findFirst.mockImplementation(
      async ({
        where,
      }: {
        where: { id?: string; metadata?: { path: string[]; equals: string } };
      }) => {
        if (where.id) {
          return {
            id: where.id,
            reconJobId: "job-1",
            reconJob: { id: "job-1", name: "Daily Reconciliation" },
            status: "failed",
            tenantId: "tenant-retry",
            startedAt: new Date(),
            completedAt: new Date(),
            summary: null,
            errorMessage: "synthetic failure",
          };
        }

        if (where.metadata?.equals && retryRunId) {
          return { id: retryRunId };
        }

        return null;
      }
    );

    mockReconResult.create.mockImplementation(async () => {
      retryRunId = "retry-1";
      return {
        id: "retry-1",
        reconJobId: "job-1",
        status: "running",
        startedAt: new Date(),
      };
    });

    const [first, second] = await Promise.all([
      request(app).post("/api/runs/run-failed/retry"),
      request(app).post("/api/runs/run-failed/retry"),
    ]);

    const statuses = [first.status, second.status].sort((a, b) => a - b);
    expect(statuses).toEqual([201, 409]);
    expect(mockReconResult.create).toHaveBeenCalledTimes(1);
  });

  it("uses Serializable transaction isolation for retry to prevent DB-level TOCTOU", async () => {
    const { prisma: mockedPrisma } = require("../../infrastructure/db/prisma");
    const app = buildApp("tenant-txn");

    mockReconResult.findFirst
      .mockResolvedValueOnce({
        id: "run-txn",
        reconJobId: "job-txn",
        reconJob: { id: "job-txn", name: "Txn Job" },
        status: "failed",
        tenantId: "tenant-txn",
        startedAt: new Date(),
        completedAt: new Date(),
        summary: null,
        errorMessage: "failed",
      })
      .mockResolvedValueOnce(null);
    mockReconResult.create.mockResolvedValueOnce({
      id: "retry-txn",
      reconJobId: "job-txn",
      status: "running",
      startedAt: new Date(),
    });

    const res = await request(app).post("/api/runs/run-txn/retry");
    expect(res.status).toBe(201);
    expect(mockedPrisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: "Serializable",
    });
  });
});
