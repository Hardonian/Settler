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

jest.mock("@/lib/middleware/api-security", () => ({
  withSecurity: (handler: unknown) => handler,
}));

jest.mock("@/middleware/billing-gate-universal", () => ({
  withUniversalBillingGate: (handler: unknown) => handler,
}));

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
  });

  test("run detail read blocks cross-tenant access", async () => {
    reconJobFindFirstMock.mockResolvedValue(null);
    reconciliationRunFindFirstMock.mockResolvedValue(null);

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
    const runRow = {
      id: "run-a-1",
      name: "Tenant A Run",
      status: "completed",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T01:00:00.000Z",
      tenant_id: "tenant-a",
      template_id: "tpl-1",
      source_adapter: "stripe",
      target_adapter: "netsuite",
      validation_rules: [
        { field: "amount", tolerance: 0.01 },
        { field: "date", window: "24h" },
      ],
      recon_strategy: "deterministic",
    };

    const prismaJob = {
      id: runRow.id,
      tenantId: "tenant-a",
      name: runRow.name,
      status: runRow.status,
      createdAt: new Date(runRow.created_at),
      updatedAt: new Date(runRow.updated_at),
      sourceAdapter: "stripe",
      targetAdapter: "netsuite",
      reconStrategy: "deterministic",
      templateId: "tpl-1",
      validationRules: runRow.validation_rules,
      sourceConfigEncrypted: "enc-src",
      targetConfigEncrypted: "enc-tgt",
      metadata: {},
    };

    reconJobFindFirstMock.mockResolvedValue(prismaJob);
    reconciliationRunFindFirstMock.mockResolvedValue(null);

    const latestResult = {
      id: "result-a-1",
      recon_job_id: runRow.id,
      status: "completed",
      started_at: "2026-01-01T00:10:00.000Z",
      completed_at: "2026-01-01T00:12:00.000Z",
      source_count: 10,
      target_count: 10,
      matched_count: 8,
      unmatched_source_count: 1,
      unmatched_target_count: 1,
      conflict_count: 0,
      error_message: null,
      metadata: { fingerprint: "fp-1" },
      input_hash: "hash-1",
      snapshot_id: "snapshot-1",
    };

    const latestResultPrisma = {
      id: latestResult.id,
      reconJobId: runRow.id,
      tenantId: "tenant-a",
      status: latestResult.status,
      startedAt: new Date(latestResult.started_at),
      completedAt: new Date(latestResult.completed_at),
      sourceCount: latestResult.source_count,
      targetCount: latestResult.target_count,
      matchedCount: latestResult.matched_count,
      unmatchedSourceCount: latestResult.unmatched_source_count,
      unmatchedTargetCount: latestResult.unmatched_target_count,
      conflictCount: latestResult.conflict_count,
      errorMessage: null,
      inputHash: latestResult.input_hash,
      snapshotId: latestResult.snapshot_id,
      summary: null,
      metadata: latestResult.metadata,
    };

    reconResultFindFirstMock.mockResolvedValue(latestResultPrisma);
    reconResultFindManyMock.mockResolvedValue([latestResultPrisma]);
    reconResultCountMock.mockResolvedValue(1);
    runDeltaFindFirstMock.mockResolvedValue(null);
    runSnapshotFindFirstMock.mockResolvedValue({
      id: "snapshot-1",
      inputHash: "hash-1",
      adapterConfigHashes: {},
      jobConfig: {
        reconStrategy: "deterministic",
        validationRules: [
          { field: "amount", tolerance: 0.01 },
          { field: "date", window: "24h" },
        ],
        templateId: "tpl-1",
      },
      ruleVersions: [{ ruleId: "rule-amount", version: 2 }],
      createdAt: new Date("2026-01-01T00:09:00.000Z"),
    });
    reconAuditFindManyMock.mockResolvedValue([]);
    reconciliationRunFindManyMock.mockResolvedValue([{ id: "ing-1" }]);
    reconciliationMatchCountMock
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

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
    expect(payload.data).toBeUndefined();
    expect(payload.runKind).toBe("recon_job");
    expect(payload.sourceModel).toBe("recon_jobs");
    expect(payload.detailHref).toBe("/console/runs/run-a-1");
    expect(payload.traceId).toBeNull();
    expect(payload.config).toEqual(
      expect.objectContaining({
        sourceAdapter: "stripe",
        targetAdapter: "netsuite",
        reconStrategy: "deterministic",
        templateId: "tpl-1",
        validationRuleCount: 2,
      })
    );
    expect(payload.config.validationRuleLabels).toEqual(
      expect.arrayContaining(["amount • ±0.01", "date • 24h"])
    );
    expect(payload.kindDetail?.kind).toBe("recon_job");
  });

  test("run detail uses canonical serializer boundary for ingestion_run responses", async () => {
    reconJobFindFirstMock.mockResolvedValue(null);
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
    expect(payload.runKind).toBe("ingestion_run");
    expect(payload.sourceModel).toBe("reconciliation_runs");
    expect(payload.kindDetail?.kind).toBe("ingestion_run");
    expect(payload.traceId).toBe("trace-ing-1");
    expect(payload.config.inputHash).toBeNull();
    expect(payload.summarySemantics).toEqual(
      expect.objectContaining({
        processed: 24,
        exceptioned: 0,
        unresolved: 0,
      })
    );
    expect(payload.resultContext.latestResultId).toBeNull();
    expect(payload.exceptions.reviewRequired).toBe(0);
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
