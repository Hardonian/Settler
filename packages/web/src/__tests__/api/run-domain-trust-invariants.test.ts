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
const reconciliationRunFindFirstMock = jest.fn();
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
      findFirst: (...args: unknown[]) => reconciliationRunFindFirstMock(...args),
    },
    reconJob: {
      findFirst: (...args: unknown[]) => reconJobFindFirstMock(...args),
    },
    reconResult: {
      findFirst: (...args: unknown[]) => reconResultFindFirstMock(...args),
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
    reconciliationRunFindFirstMock.mockReset();
    prismaQueryRawMock.mockReset();
    prismaQueryRawMock.mockResolvedValue([
      {
        total: 0,
        pending: 0,
        investigating: 0,
        resolved: 0,
        ignored: 0,
      },
    ]);
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

    reconJobFindFirstMock.mockResolvedValue({
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
    });
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

    reconResultFindFirstMock.mockResolvedValue({
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
    });

    const supabase = {
      from: jest.fn((table: string) => {
        if (table === "recon_jobs") {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn(async () => ({ data: runRow, error: null })),
                })),
              })),
            })),
          };
        }

        if (table === "recon_results") {
          return {
            select: jest.fn((_fields: string, options?: { count?: string; head?: boolean }) => {
              if (options?.head) {
                return {
                  eq: jest.fn(() => ({
                    eq: jest.fn(async () => ({ count: 1, error: null })),
                  })),
                };
              }

              return {
                eq: jest.fn(() => ({
                  eq: jest.fn(() => ({
                    order: jest.fn(() => ({
                      limit: jest.fn(async () => ({ data: [latestResult], error: null })),
                    })),
                  })),
                })),
              };
            }),
          };
        }

        if (table === "run_snapshots") {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  maybeSingle: jest.fn(async () => ({
                    data: {
                      id: "snapshot-1",
                      input_hash: "hash-1",
                      job_config: {
                        reconStrategy: "deterministic",
                        validationRules: [
                          { field: "amount", tolerance: 0.01 },
                          { field: "date", window: "24h" },
                        ],
                        templateId: "tpl-1",
                      },
                      rule_versions: [{ ruleId: "rule-amount", version: 2 }],
                      created_at: "2026-01-01T00:09:00.000Z",
                    },
                    error: null,
                  })),
                })),
              })),
            })),
          };
        }

        if (table === "recon_audits") {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  order: jest.fn(() => ({
                    limit: jest.fn(async () => ({ data: [], error: null })),
                  })),
                })),
              })),
            })),
          };
        }

        throw new Error(`Unexpected table access: ${table}`);
      }),
    };

    resolveTenantMembershipScopeMock.mockResolvedValue({
      supabase,
      userId: "user-a",
      tenantIds: ["tenant-a"],
    });

    const response = await getRunDetail(req("http://localhost/api/runs/run-a-1"), {
      params: { id: "run-a-1" },
    } as any);

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.runKind).toBe("recon_job");
    expect(payload.sourceModel).toBe("recon_jobs");
    expect(payload.detailHref).toBe("/console/runs/run-a-1");
    expect(payload.config).toEqual(
      expect.objectContaining({
        sourceAdapter: "stripe",
        targetAdapter: "netsuite",
        reconStrategy: "deterministic",
        templateId: "tpl-1",
        validationRuleCount: 2,
        ruleVersionCount: 1,
        snapshotId: "snapshot-1",
        inputHash: "hash-1",
        configSource: "snapshot",
      })
    );
    expect(payload.config.validationRuleLabels).toEqual(
      expect.arrayContaining(["amount • ±0.01", "date • 24h"])
    );
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
    expect(payload.error).toContain("resolve|ignore|reopen");
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
