/** @jest-environment node */

import { GET as getRunDetail } from "@/app/api/runs/[id]/route";
import { POST as createRun } from "@/app/api/runs/create/route";
import { POST as runReconciliation } from "@/app/api/console/reconciliation/route";
import { POST as postExceptionAction } from "@/app/api/exceptions/[exceptionId]/route";
import { GET as getJobProgress } from "@/app/api/jobs/[id]/progress/route";

const resolveTenantMembershipScopeMock = jest.fn();
const resolveTenantForMutationMock = jest.fn();
const assertTenantMembershipMock = jest.fn();
const triggerInternalReconciliationRunMock = jest.fn();
const requireAuthMock = jest.fn();
const authenticateApiKeyMock = jest.fn();
const reconJobFindFirstMock = jest.fn();
const reconResultFindFirstMock = jest.fn();
const reconResultFindManyMock = jest.fn();
const reconResultCountMock = jest.fn();
const runDeltaFindFirstMock = jest.fn();
const runSnapshotFindFirstMock = jest.fn();
const reconAuditFindManyMock = jest.fn();
const reconciliationRunFindFirstMock = jest.fn();
const reconciliationRunFindManyMock = jest.fn();
const reconciliationMatchCountMock = jest.fn();
const prismaQueryRawMock = jest.fn();
const resolveOperatorRunDetailForTenantsMock = jest.fn();

jest.mock("@/lib/middleware/api-security", () => ({
  withSecurity: (handler: unknown) => handler,
}));

jest.mock("@/middleware/billing-gate-universal", () => ({
  withUniversalBillingGate: (handler: unknown) => handler,
}));

jest.mock("@settler/reconciliation-core", () => {
  const actual = jest.requireActual("@settler/reconciliation-core") as Record<string, unknown>;
  return {
    ...actual,
    resolveOperatorRunDetailForTenants: (...args: unknown[]) =>
      resolveOperatorRunDetailForTenantsMock(...args),
  };
});
jest.mock("@/lib/logger", () => ({
  createLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
  generateCorrelationId: jest.fn(() => "corr-test"),
}));

jest.mock("@/lib/ingest/manifest", () => ({
  validateInputManifest: jest.fn(() => ({ valid: true })),
}));

jest.mock("@/lib/ops/lifecycle-events", () => ({
  emitLifecycleEventSafe: jest.fn(async () => undefined),
  LifecycleEventType: { RECON_FIRST_RUN: "RECON_FIRST_RUN" },
}));

jest.mock("@/shared/db/prismaClient", () => ({
  prisma: {
    $queryRaw: (...args: unknown[]) => prismaQueryRawMock(...args),
    reconciliationRun: {
      count: jest.fn(async () => 0),
      findMany: (...args: unknown[]) => reconciliationRunFindManyMock(...args),
      findFirst: (...args: unknown[]) => reconciliationRunFindFirstMock(...args),
    },
    reconciliationMatch: {
      count: (...args: unknown[]) => reconciliationMatchCountMock(...args),
    },
    reconJob: {
      findFirst: (...args: unknown[]) => reconJobFindFirstMock(...args),
    },
    reconResult: {
      findFirst: (...args: unknown[]) => reconResultFindFirstMock(...args),
      findMany: (...args: unknown[]) => reconResultFindManyMock(...args),
      count: (...args: unknown[]) => reconResultCountMock(...args),
    },
    runDelta: {
      findFirst: (...args: unknown[]) => runDeltaFindFirstMock(...args),
    },
    runSnapshot: {
      findFirst: (...args: unknown[]) => runSnapshotFindFirstMock(...args),
    },
    reconAudit: {
      findMany: (...args: unknown[]) => reconAuditFindManyMock(...args),
    },
  },
}));

jest.mock("@/shared/auth/apiKey", () => ({
  authenticateApiKey: (...args: unknown[]) => authenticateApiKeyMock(...args),
}));

jest.mock("@/lib/supabase/tenant-membership", () => {
  class TenantMembershipError extends Error {
    status: number;
    code: string;

    constructor(status: number, code: string, message: string) {
      super(message);
      this.status = status;
      this.code = code;
    }
  }

  return {
    resolveTenantMembershipScope: (...args: unknown[]) => resolveTenantMembershipScopeMock(...args),
    resolveTenantForMutation: (...args: unknown[]) => resolveTenantForMutationMock(...args),
    assertTenantMembership: (...args: unknown[]) => assertTenantMembershipMock(...args),
    TenantMembershipError,
  };
});

jest.mock("@/lib/api/unified-auth", () => ({
  requireAuth: (...args: unknown[]) => requireAuthMock(...args),
}));

jest.mock("@/lib/server/internal-api", () => ({
  triggerInternalReconciliationRun: (...args: unknown[]) =>
    triggerInternalReconciliationRunMock(...args),
}));

jest.mock("@/lib/server/settler/reconciliation", () => ({
  getReconciliationSummary: jest.fn(async () => null),
  listReconciliationItems: jest.fn(async () => []),
}));

jest.mock("@/lib/observability/trace", () => ({
  getTraceId: jest.fn(async () => "trace-test"),
}));

function req(url: string, init: { method?: string; body?: unknown } = {}) {
  return {
    url,
    method: init.method || "GET",
    headers: new Headers(),
    nextUrl: new URL(url),
    json: async () => init.body ?? {},
  } as any;
}

describe("run domain trust invariants", () => {
  beforeEach(() => {
    resolveTenantMembershipScopeMock.mockReset();
    resolveTenantForMutationMock.mockReset();
    assertTenantMembershipMock.mockReset();
    triggerInternalReconciliationRunMock.mockReset();
    requireAuthMock.mockReset();
    authenticateApiKeyMock.mockReset();
    reconJobFindFirstMock.mockReset();
    reconResultFindFirstMock.mockReset();
    reconResultFindManyMock.mockReset();
    reconResultCountMock.mockReset();
    runDeltaFindFirstMock.mockReset();
    runSnapshotFindFirstMock.mockReset();
    reconAuditFindManyMock.mockReset();
    reconciliationRunFindFirstMock.mockReset();
    reconciliationRunFindManyMock.mockReset();
    reconciliationMatchCountMock.mockReset();
    prismaQueryRawMock.mockReset();
    resolveOperatorRunDetailForTenantsMock.mockReset();
  });

  test("run detail read blocks cross-tenant access", async () => {
    resolveOperatorRunDetailForTenantsMock.mockResolvedValue({ kind: "not_found" });

    resolveTenantMembershipScopeMock.mockResolvedValue({
      supabase: { from: jest.fn() },
      userId: "user-a",
      tenantIds: ["tenant-a"],
    });

    const response = await getRunDetail(req("http://localhost/api/runs/run-b-1"), {
      params: { id: "run-b-1" },
    } as any);

    expect(response.status).toBe(404);
    const payload = await response.json();
    expect(payload.error).toBe("Run not found");
  });

  test("run detail exposes effective configuration truth for operators", async () => {
    resolveOperatorRunDetailForTenantsMock.mockResolvedValue({
      kind: "ok",
      detail: {
        id: "run-a-1",
        runKind: "recon_job",
        sourceModel: "recon_jobs",
        detailHref: "/console/runs/run-a-1",
        traceId: null,
        status: "completed",
        startedAt: "2026-01-01T00:10:00.000Z",
        completedAt: "2026-01-01T00:12:00.000Z",
        summarySemantics: { processed: 10, exceptioned: 2, unresolved: 0 },
        resultContext: { latestResultId: "result-a-1" },
        exceptions: { reviewRequired: 0 },
        kindDetail: { kind: "recon_job" },
        config: {
          sourceAdapter: "stripe",
          targetAdapter: "netsuite",
          reconStrategy: "deterministic",
          templateId: "tpl-1",
          validationRuleCount: 2,
          validationRuleLabels: ["amount • ±0.01", "date • 24h"],
        },
      },
    });

    resolveTenantMembershipScopeMock.mockResolvedValue({
      supabase: { from: jest.fn() },
      userId: "user-a",
      tenantIds: ["tenant-a"],
    });

    const response = await getRunDetail(req("http://localhost/api/runs/run-a-1"), {
      params: { id: "run-a-1" },
    } as any);

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.data).toBeDefined();
    expect(payload.data.runKind).toBe("recon_job");
    expect(payload.data.sourceModel).toBe("recon_jobs");
    expect(payload.data.detailHref).toBe("/console/runs/run-a-1");
    expect(payload.data.traceId).toBeNull();
    expect(payload.data.config).toEqual(
      expect.objectContaining({
        sourceAdapter: "stripe",
        targetAdapter: "netsuite",
        reconStrategy: "deterministic",
        templateId: "tpl-1",
        validationRuleCount: 2,
      })
    );
    expect(payload.data.config.validationRuleLabels).toEqual(
      expect.arrayContaining(["amount • ±0.01", "date • 24h"])
    );
    expect(payload.data.kindDetail?.kind).toBe("recon_job");
    expect(payload.response_meta.apiSchemaVersion).toBe("operator.v1");
    expect(payload.response_meta.route).toBe("GET /api/runs/:id");
  });

  test("run detail uses canonical serializer boundary for ingestion_run responses", async () => {
    resolveOperatorRunDetailForTenantsMock.mockResolvedValue({
      kind: "ok",
      detail: {
        id: "ing-run-1",
        runKind: "ingestion_run",
        sourceModel: "reconciliation_runs",
        detailHref: "/console/runs/ing-run-1",
        traceId: "trace-ing-1",
        status: "running",
        startedAt: "2026-01-01T00:00:00.000Z",
        completedAt: null,
        summarySemantics: { processed: 24, exceptioned: 0, unresolved: 0 },
        resultContext: { latestResultId: null },
        exceptions: { reviewRequired: 0 },
        kindDetail: { kind: "ingestion_run" },
        config: { inputHash: null },
      },
    });

    reconciliationRunFindFirstMock.mockResolvedValue({
      id: "ing-run-1",
      tenantId: "tenant-a",
      userId: "user-a",
      ingestionId: "ing-1",
      name: "Ingestion Tenant A",
      status: "running",
      startedAt: new Date("2026-01-01T00:00:00.000Z"),
      completedAt: null,
      sourceCount: 25,
      targetCount: 24,
      matchedCount: 20,
      unmatchedSourceCount: 3,
      unmatchedTargetCount: 1,
      confidenceAvg: null,
      errorMessage: null,
      traceId: "trace-ing-1",
      metadata: { sourceAdapter: "csv" },
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:01:00.000Z"),
    });

    resolveTenantMembershipScopeMock.mockResolvedValue({
      supabase: { from: jest.fn() },
      userId: "user-a",
      tenantIds: ["tenant-a"],
    });

    const response = await getRunDetail(req("http://localhost/api/runs/ing-run-1"), {
      params: { id: "ing-run-1" },
    } as any);

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.data.runKind).toBe("ingestion_run");
    expect(payload.data.sourceModel).toBe("reconciliation_runs");
    expect(payload.data.kindDetail?.kind).toBe("ingestion_run");
    expect(payload.data.traceId).toBe("trace-ing-1");
    expect(payload.data.config.inputHash).toBeNull();
    expect(payload.data.summarySemantics).toEqual(
      expect.objectContaining({
        processed: 24,
        exceptioned: 0,
        unresolved: 0,
      })
    );
    expect(payload.data.resultContext.latestResultId).toBeNull();
    expect(payload.data.exceptions.reviewRequired).toBe(0);
  });

  test("run create mutation denies tenant outside authenticated membership", async () => {
    const { TenantMembershipError } = jest.requireMock("@/lib/supabase/tenant-membership");
    resolveTenantMembershipScopeMock.mockResolvedValue({
      supabase: {},
      userId: "user-a",
      tenantIds: ["tenant-a"],
    });
    resolveTenantForMutationMock.mockImplementation(() => {
      throw new TenantMembershipError(403, "FORBIDDEN", "Tenant access denied");
    });

    const response = await createRun(
      req("http://localhost/api/runs/create", {
        method: "POST",
        body: {
          workspace_id: "11111111-1111-4111-8111-111111111111",
          idempotency_key: "idem-1",
          input_manifest: {},
        },
      })
    );

    expect(response.status).toBe(403);
    const payload = await response.json();
    expect(payload.code).toBe("FORBIDDEN");
  });

  test("run create internal failure returns non-200 status", async () => {
    const supabase = {
      from: jest.fn((table: string) => {
        if (table !== "recon_runs") {
          throw new Error(`Unexpected table ${table}`);
        }

        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(async () => ({ data: null, error: { message: "missing" } })),
              })),
            })),
          })),
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(async () => ({ data: null, error: { message: "insert failed" } })),
            })),
          })),
        };
      }),
    };

    resolveTenantMembershipScopeMock.mockResolvedValue({
      supabase,
      userId: "user-a",
      tenantIds: ["tenant-a"],
    });
    resolveTenantForMutationMock.mockReturnValue("tenant-a");

    const response = await createRun(
      req("http://localhost/api/runs/create", {
        method: "POST",
        body: {
          workspace_id: "11111111-1111-4111-8111-111111111111",
          idempotency_key: "idem-2",
          input_manifest: {},
        },
      })
    );

    expect(response.status).toBe(500);
    const payload = await response.json();
    expect(payload.error).toBe("Failed to create run");
  });

  test("console reconciliation POST reports server failures with 500", async () => {
    requireAuthMock.mockResolvedValue({
      type: "session",
      userId: "user-a",
      tenantId: "tenant-a",
    });
    resolveTenantMembershipScopeMock.mockResolvedValue({
      supabase: {},
      userId: "user-a",
      tenantIds: ["tenant-a"],
    });
    assertTenantMembershipMock.mockReturnValue(undefined);
    triggerInternalReconciliationRunMock.mockRejectedValue(new Error("downstream unavailable"));

    const response = await runReconciliation(
      req("http://localhost/api/console/reconciliation", {
        method: "POST",
        body: {
          sourceId: "source-a",
        },
      })
    );

    expect(response.status).toBe(500);
    const payload = await response.json();
    expect(payload.success).toBe(false);
  });

  test("dead retry action is rejected by exception action API", async () => {
    const response = await postExceptionAction(
      req("http://localhost/api/exceptions/11111111-1111-4111-8111-111111111111?action=retry", {
        method: "POST",
      }),
      { params: Promise.resolve({ exceptionId: "11111111-1111-4111-8111-111111111111" }) }
    );

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toBe("Invalid action");
  });

  test("job progress route returns 500 for server failures (not false-success 200)", async () => {
    authenticateApiKeyMock.mockResolvedValue({
      tenantId: "tenant-a",
      userId: "user-a",
    });
    reconJobFindFirstMock.mockRejectedValue(new Error("database offline"));

    const response = await getJobProgress(
      req("http://localhost/api/jobs/11111111-1111-4111-8111-111111111111/progress"),
      { params: Promise.resolve({ id: "11111111-1111-4111-8111-111111111111" }) }
    );

    expect(response.status).toBe(500);
    const payload = await response.json();
    expect(payload.error).toBe("Failed to fetch job progress");
  });
});
