/** @jest-environment node */

import { GET as getRunsList } from "@/app/api/runs/route";
import type { CanonicalReconciliationListItem } from "@settler/reconciliation-core";

const requireAuthMock = jest.fn();
const resolveTenantMembershipScopeMock = jest.fn();
const fetchMergedReconciliationRunsPageMock = jest.fn();
const decodeMergedRunsCursorMock = jest.fn();
const mapCanonicalListItemToApiRunsLegacyRowMock = jest.fn();

jest.mock("@/lib/middleware/api-security", () => ({
  withSecurity: (handler: unknown) => handler,
}));

jest.mock("@/middleware/billing-gate-universal", () => ({
  withUniversalBillingGate: (handler: unknown) => handler,
}));

jest.mock("@/lib/api/unified-auth", () => ({
  requireAuth: (...args: unknown[]) => requireAuthMock(...args),
}));

jest.mock("@/lib/supabase/tenant-membership", () => ({
  resolveTenantMembershipScope: (...args: unknown[]) =>
    resolveTenantMembershipScopeMock(...args),
  assertTenantMembership: jest.fn(),
  resolveTenantForMutation: jest.fn(() => "tenant-1"),
}));

jest.mock("@settler/reconciliation-core", () => {
  const actual = jest.requireActual("@settler/reconciliation-core") as Record<string, unknown>;
  return {
    ...actual,
    fetchMergedReconciliationRunsPage: (...args: unknown[]) =>
      fetchMergedReconciliationRunsPageMock(...args),
    decodeMergedRunsCursor: (...args: unknown[]) => decodeMergedRunsCursorMock(...args),
    mapCanonicalListItemToApiRunsLegacyRow: (...args: unknown[]) =>
      mapCanonicalListItemToApiRunsLegacyRowMock(...args),
  };
});

jest.mock("@/lib/logger", () => ({
  createLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

jest.mock("@/shared/db/prismaClient", () => ({
  prisma: {},
}));

function req(url: string) {
  return {
    url,
    method: "GET",
    headers: new Headers(),
    nextUrl: new URL(url),
  } as any;
}

const baseListItem: CanonicalReconciliationListItem = {
  runKind: "recon_job",
  id: "job-1",
  tenantId: "tenant-1",
  name: "Test job",
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
    status: "completed",
    statusLabel: "Completed",
    isTerminal: true,
    progressPercent: 100,
    progressState: "completed",
  },
  summaryState: "success",
  summary: {
    total: 2,
    sourceCount: 1,
    targetCount: 1,
    processed: 2,
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
    createdAt: "2024-01-01T00:00:00.000Z",
    startedAt: "2024-01-01T00:00:01.000Z",
    completedAt: "2024-01-01T00:00:02.000Z",
    updatedAt: "2024-01-01T00:00:02.000Z",
  },
};

describe("GET /api/runs", () => {
  beforeEach(() => {
    requireAuthMock.mockReset();
    resolveTenantMembershipScopeMock.mockReset();
    fetchMergedReconciliationRunsPageMock.mockReset();
    decodeMergedRunsCursorMock.mockReset();
    mapCanonicalListItemToApiRunsLegacyRowMock.mockReset();

    requireAuthMock.mockResolvedValue({ tenantId: "tenant-1", userId: "u1", type: "session" });
    resolveTenantMembershipScopeMock.mockResolvedValue({
      tenantIds: ["tenant-1"],
      userId: "u1",
    });

    fetchMergedReconciliationRunsPageMock.mockResolvedValue({
      runs: [baseListItem],
      next_cursor: "next",
      pagination: {
        limit: 50,
        returned: 1,
        has_more: true,
        job_stream_has_more: true,
        ingestion_stream_has_more: false,
        job_stream_exhausted: false,
        ingestion_stream_exhausted: true,
      },
      response_meta: {
        contract_version: 1,
        included_run_kinds: ["recon_job", "ingestion_run"],
        ordering: "test-ordering",
        consistency: "read_committed",
      },
    });

    mapCanonicalListItemToApiRunsLegacyRowMock.mockImplementation((row: CanonicalReconciliationListItem) => ({
      runKind: row.runKind,
      id: row.id,
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
      provenance: {},
      configDrift: { status: "none", adapter: "none" },
      ingestionId: row.provenance.ingestionId,
      sourceAdapter: row.adapters.sourceAdapter,
      targetAdapter: row.adapters.targetAdapter,
    }));
  });

  it("returns 400 for invalid run_kind", async () => {
    const res = await getRunsList(req("http://localhost/api/runs?run_kind=nope"), {} as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("RUNS_INVALID_RUN_KIND");
  });

  it("returns 400 for invalid cursor", async () => {
    decodeMergedRunsCursorMock.mockImplementation(() => {
      const { MergedRunsCursorError } = jest.requireActual(
        "@settler/reconciliation-core"
      ) as typeof import("@settler/reconciliation-core");
      throw new MergedRunsCursorError("bad");
    });
    const res = await getRunsList(req("http://localhost/api/runs?cursor=xx"), {} as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("RUNS_CURSOR_INVALID");
  });

  it("returns merged list envelope with next_cursor when no filters", async () => {
    decodeMergedRunsCursorMock.mockReturnValue(null);
    const res = await getRunsList(req("http://localhost/api/runs?run_kind=all"), {} as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toHaveLength(1);
    expect(body.items[0].id).toBe("job-1");
    expect(body.next_cursor).toBe("next");
    expect(body.response_meta.pagination_mode).toBe("merged_cursor");
    expect(fetchMergedReconciliationRunsPageMock).toHaveBeenCalled();
  });

  it("rejects cursor together with status filter", async () => {
    const res = await getRunsList(
      req("http://localhost/api/runs?cursor=abc&status=completed"),
      {} as any
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("RUNS_CURSOR_WITH_FILTERS_UNSUPPORTED");
  });
});
