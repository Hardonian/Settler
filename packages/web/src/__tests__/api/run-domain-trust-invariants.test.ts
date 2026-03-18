/** @jest-environment node */

import { GET as getRunDetail } from "@/app/api/runs/[runId]/route";
import { POST as createRun } from "@/app/api/runs/create/route";
import { POST as runReconciliation } from "@/app/api/console/reconciliation/route";
import { POST as postExceptionAction } from "@/app/api/exceptions/[exceptionId]/route";

const resolveTenantMembershipScopeMock = jest.fn();
const resolveTenantForMutationMock = jest.fn();
const assertTenantMembershipMock = jest.fn();
const triggerInternalReconciliationRunMock = jest.fn();
const requireAuthMock = jest.fn();

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
    reconciliationRun: {
      count: jest.fn(async () => 0),
    },
  },
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
  });

  test("run detail read blocks cross-tenant access", async () => {
    const runRow = {
      id: "run-b-1",
      name: "Tenant B Run",
      status: "completed",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
      tenant_id: "tenant-b",
    };

    const supabase = {
      from: jest.fn((table: string) => {
        if (table === "recon_jobs") {
          return {
            select: jest.fn(() => ({
              eq: jest.fn((column: string, value: string) => ({
                in: jest.fn((_tenantColumn: string, tenantIds: string[]) => ({
                  single: jest.fn(async () => {
                    if (
                      column === "id" &&
                      value === runRow.id &&
                      tenantIds.includes(runRow.tenant_id)
                    ) {
                      return { data: runRow, error: null };
                    }
                    return { data: null, error: { message: "Not found" } };
                  }),
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

    const response = await getRunDetail(req("http://localhost/api/runs/run-b-1"), {
      params: { runId: "run-b-1" },
    } as any);

    expect(response.status).toBe(404);
    const payload = await response.json();
    expect(payload.error).toBe("Run not found");
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
});
