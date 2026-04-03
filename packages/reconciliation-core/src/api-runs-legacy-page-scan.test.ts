import type { CanonicalReconciliationListItem } from "./canonical-reconciliation.js";
import { MergedRunsCursorError } from "./merged-list-pagination";
import { scanMergedRunsForLegacyPage } from "./api-runs-list-adapter";
import type { ReconciliationCorePrismaClient } from "./prisma-client-like.js";

function buildCanonicalListItem(overrides: Partial<CanonicalReconciliationListItem> = {}) {
  return {
    runKind: "recon_job" as const,
    id: "run-1",
    tenantId: "tenant-123",
    name: "Daily Reconciliation",
    reconResultId: null,
    configDrift: {
      status: "none" as const,
      strategyChanged: false,
      templateChanged: false,
      validationRulesChanged: false,
      adapter: {
        status: "none" as const,
        comparisonMode: "unavailable" as const,
        sourceChanged: null,
        targetChanged: null,
        sourceHashPresent: false,
        targetHashPresent: false,
      },
      notes: [],
    },
    lifecycle: {
      status: "completed",
      statusLabel: "Completed",
      isTerminal: true,
      progressPercent: 100,
      progressState: "completed",
    },
    summaryState: "success",
    summary: {
      total: 100,
      sourceCount: 50,
      targetCount: 50,
      processed: 100,
      matched: 95,
      matchedWithTolerance: 0,
      unmatched: 5,
      unmatchedSourceCount: 2,
      unmatchedTargetCount: 3,
      conflicts: 0,
      exceptioned: 0,
      unresolved: 0,
      ignored: 0,
      resolved: 0,
    },
    provenance: {
      sourceModel: "recon_jobs" as const,
      runKind: "recon_job" as const,
      ingestionId: null,
      reconJobId: "job-1",
    },
    adapters: {
      sourceAdapter: "source-a",
      targetAdapter: "target-b",
    },
    timestamps: {
      createdAt: "2026-03-17T09:59:00.000Z",
      startedAt: "2026-03-17T10:00:00.000Z",
      completedAt: "2026-03-17T10:05:00.000Z",
      updatedAt: "2026-03-17T10:05:00.000Z",
    },
    ...overrides,
  };
}

describe("scanMergedRunsForLegacyPage", () => {
  const prisma = {} as ReconciliationCorePrismaClient;

  it("applies legacy status and search filtering before counting and paging", async () => {
    const fetchPage = jest.fn().mockResolvedValue({
      runs: [
        buildCanonicalListItem({ id: "run-1", name: "Daily Reconciliation" }),
        buildCanonicalListItem({
          id: "run-2",
          name: "Nightly Close",
          lifecycle: {
            status: "running",
            statusLabel: "Running",
            isTerminal: false,
            progressPercent: 40,
            progressState: "in_progress",
          },
          summaryState: "in_progress",
        }),
        buildCanonicalListItem({
          id: "special-run",
          name: "Monthly Close",
          lifecycle: {
            status: "running",
            statusLabel: "Running",
            isTerminal: false,
            progressPercent: 10,
            progressState: "in_progress",
          },
          summaryState: "in_progress",
        }),
      ],
      next_cursor: null,
      pagination: {
        limit: 100,
        returned: 3,
        has_more: false,
        job_stream_has_more: false,
        ingestion_stream_has_more: false,
        job_stream_exhausted: true,
        ingestion_stream_exhausted: true,
      },
      response_meta: {
        contract_version: 1 as const,
        included_run_kinds: ["recon_job", "ingestion_run"] as const,
        ordering: "test-ordering",
        consistency: "read_committed" as const,
      },
    });

    const result = await scanMergedRunsForLegacyPage({
      prisma,
      tenantId: "tenant-123",
      page: 1,
      limit: 50,
      filters: {
        status: " Running ",
        search: " special ",
      },
      fetchPage,
    });

    expect(result.filters).toEqual({
      status: "running",
      search: "special",
    });
    expect(result.pagination).toMatchObject({
      page: 1,
      limit: 50,
      total: 1,
      totalPages: 1,
    });
    expect(result.data.map((row) => row.id)).toEqual(["special-run"]);
  });

  it("continues scanning merged pages to satisfy legacy page offsets", async () => {
    const fetchPage = jest
      .fn()
      .mockResolvedValueOnce({
        runs: Array.from({ length: 100 }, (_, index) =>
          buildCanonicalListItem({
            id: `run-${index + 1}`,
            name: `Run ${index + 1}`,
          })
        ),
        next_cursor: "cursor-1",
        pagination: {
          limit: 100,
          returned: 100,
          has_more: true,
          job_stream_has_more: true,
          ingestion_stream_has_more: false,
          job_stream_exhausted: false,
          ingestion_stream_exhausted: true,
        },
        response_meta: {
          contract_version: 1 as const,
          included_run_kinds: ["recon_job", "ingestion_run"] as const,
          ordering: "test-ordering",
          consistency: "read_committed" as const,
        },
      })
      .mockResolvedValueOnce({
        runs: Array.from({ length: 40 }, (_, index) =>
          buildCanonicalListItem({
            id: `run-${index + 101}`,
            name: `Run ${index + 101}`,
          })
        ),
        next_cursor: null,
        pagination: {
          limit: 100,
          returned: 40,
          has_more: false,
          job_stream_has_more: false,
          ingestion_stream_has_more: false,
          job_stream_exhausted: true,
          ingestion_stream_exhausted: true,
        },
        response_meta: {
          contract_version: 1 as const,
          included_run_kinds: ["recon_job", "ingestion_run"] as const,
          ordering: "test-ordering",
          consistency: "read_committed" as const,
        },
      });
    const decodeCursor = jest.fn().mockReturnValue({
      v: 1,
      ij: { t: "2026-03-17T10:05:00.000Z", id: "7740a5eb-8d69-47ca-903f-96d4c4aa0001" },
      ir: null,
    });

    const result = await scanMergedRunsForLegacyPage({
      prisma,
      tenantId: "tenant-123",
      page: 3,
      limit: 50,
      fetchPage,
      decodeCursor,
    });

    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(decodeCursor).toHaveBeenCalledWith("cursor-1");
    expect(result.pagesScanned).toBe(2);
    expect(result.pagination).toMatchObject({
      page: 3,
      limit: 50,
      total: 140,
      totalPages: 3,
    });
    expect(result.data).toHaveLength(40);
    expect(result.data[0]?.id).toBe("run-101");
  });

  it("surfaces cursor decode drift as a merged cursor error", async () => {
    const fetchPage = jest.fn().mockResolvedValue({
      runs: [buildCanonicalListItem()],
      next_cursor: "bad-cursor",
      pagination: {
        limit: 100,
        returned: 1,
        has_more: true,
        job_stream_has_more: true,
        ingestion_stream_has_more: false,
        job_stream_exhausted: false,
        ingestion_stream_exhausted: true,
      },
      response_meta: {
        contract_version: 1 as const,
        included_run_kinds: ["recon_job", "ingestion_run"] as const,
        ordering: "test-ordering",
        consistency: "read_committed" as const,
      },
    });
    const decodeCursor = jest.fn(() => {
      throw new Error("bad cursor");
    });

    await expect(
      scanMergedRunsForLegacyPage({
        prisma,
        tenantId: "tenant-123",
        page: 1,
        limit: 50,
        fetchPage,
        decodeCursor,
      })
    ).rejects.toThrow(new MergedRunsCursorError("bad cursor"));
  });
});
