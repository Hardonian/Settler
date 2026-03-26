/** @jest-environment node */

import { GET as getConsoleReconciliationList } from "@/app/api/console/reconciliation/route";

const requireAuthMock = jest.fn();
const resolveTenantMembershipScopeMock = jest.fn();
const fetchMergedReconciliationRunsPageMock = jest.fn();
const decodeMergedRunsCursorMock = jest.fn();
const buildConsoleReconciliationListBodyMock = jest.fn();

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
  resolveTenantMembershipScope: (...args: unknown[]) => resolveTenantMembershipScopeMock(...args),
  assertTenantMembership: jest.fn(),
  resolveTenantForMutation: jest.fn(() => "tenant-1"),
  TenantMembershipError: class TenantMembershipError extends Error {},
}));

jest.mock("@settler/reconciliation-core", () => {
  const actual = jest.requireActual("@settler/reconciliation-core") as Record<string, unknown>;
  return {
    ...actual,
    fetchMergedReconciliationRunsPage: (...args: unknown[]) =>
      fetchMergedReconciliationRunsPageMock(...args),
    decodeMergedRunsCursor: (...args: unknown[]) => decodeMergedRunsCursorMock(...args),
    buildConsoleReconciliationListBody: (...args: unknown[]) =>
      buildConsoleReconciliationListBodyMock(...args),
  };
});

jest.mock("@/shared/db/prismaClient", () => ({
  prisma: {},
}));

jest.mock("@/lib/server/settler/reconciliation", () => ({
  getReconciliationSummary: jest.fn(),
  listReconciliationItems: jest.fn(),
}));

jest.mock("@/lib/server/internal-api", () => ({
  triggerInternalReconciliationRun: jest.fn(),
}));

jest.mock("@/lib/utils/logger", () => ({
  appLogger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

function req(url: string) {
  return {
    url,
    method: "GET",
    headers: new Headers(),
    nextUrl: new URL(url),
  } as any;
}

describe("GET /api/console/reconciliation", () => {
  beforeEach(() => {
    requireAuthMock.mockReset();
    resolveTenantMembershipScopeMock.mockReset();
    fetchMergedReconciliationRunsPageMock.mockReset();
    decodeMergedRunsCursorMock.mockReset();
    buildConsoleReconciliationListBodyMock.mockReset();

    requireAuthMock.mockResolvedValue({ tenantId: "tenant-1", userId: "u1", type: "session" });
    resolveTenantMembershipScopeMock.mockResolvedValue({ tenantIds: ["tenant-1"], userId: "u1" });

    fetchMergedReconciliationRunsPageMock.mockResolvedValue({
      runs: [],
      next_cursor: null,
      pagination: {
        limit: 50,
        returned: 0,
        has_more: false,
        job_stream_has_more: false,
        ingestion_stream_has_more: false,
        job_stream_exhausted: true,
        ingestion_stream_exhausted: true,
      },
      response_meta: {
        contract_version: 1,
        included_run_kinds: ["recon_job", "ingestion_run"],
        ordering: "test-order",
        consistency: "read_committed",
      },
    });
    buildConsoleReconciliationListBodyMock.mockReturnValue({ reconciliations: [] });
  });

  it("accepts runKind alias and case-insensitive value", async () => {
    const res = await getConsoleReconciliationList(
      req("http://localhost/api/console/reconciliation?runKind=INGESTION_RUN&limit=25"),
      {} as any
    );
    expect(res.status).toBe(200);
    expect(fetchMergedReconciliationRunsPageMock).toHaveBeenCalledWith(
      expect.objectContaining({ runKind: "ingestion_run", limit: 25 })
    );
  });

  it("returns 400 for invalid run_kind", async () => {
    const res = await getConsoleReconciliationList(
      req("http://localhost/api/console/reconciliation?run_kind=nope"),
      {} as any
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("RECONCILIATION_INVALID_RUN_KIND");
  });

  it("falls back to safe default limit when provided limit is invalid", async () => {
    const res = await getConsoleReconciliationList(
      req("http://localhost/api/console/reconciliation?limit=-10"),
      {} as any
    );
    expect(res.status).toBe(200);
    expect(fetchMergedReconciliationRunsPageMock).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 50 })
    );
  });
});
