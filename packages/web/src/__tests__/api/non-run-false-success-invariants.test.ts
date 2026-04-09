/** @jest-environment node */

import { POST as postBulkJobs } from "@/app/api/jobs/bulk/route";
import { GET as getJobExceptions } from "@/app/api/jobs/[id]/exceptions/route";
import { PATCH as patchJobException } from "@/app/api/jobs/[id]/exceptions/[exceptionId]/route";
import { GET as getExceptions } from "@/app/api/exceptions/route";
import {
  GET as getOperatorControlPlane,
  POST as postOperatorControlPlane,
} from "@/app/api/console/operator/control-plane/route";
import { GET as getIntegrationsHealth } from "@/app/api/integrations/health/route";
import { POST as postDataImport } from "@/app/api/data/import/route";
import { POST as postConnectorConnect } from "@/app/api/connectors/connect/[providerId]/route";
import { POST as postIntegrationTest } from "@/app/api/integrations/[integrationId]/test/route";

const authenticateApiKeyMock = jest.fn();
const requireAuthMock = jest.fn();
const requireAdminMock = jest.fn();
const resolveTenantMembershipScopeMock = jest.fn();
const resolveTenantForMutationMock = jest.fn();
const createClientMock = jest.fn();
const getTraceIdMock = jest.fn();
const logAuditEventMock = jest.fn();

const billingAccountFindFirstMock = jest.fn();
const reconJobFindManyMock = jest.fn();
const reconJobFindFirstMock = jest.fn();
const reconciliationMatchFindFirstMock = jest.fn();
const reconciliationRunFindManyMock = jest.fn();
const reconMatchFindManyMock = jest.fn();
const reconMatchCountMock = jest.fn();
const driftEventFindManyMock = jest.fn();
const driftEventCountMock = jest.fn();

const prismaQueryRawMock = jest.fn();
const prismaExecuteRawMock = jest.fn();
const prismaExecuteRawUnsafeMock = jest.fn();

jest.mock("@/lib/middleware/api-security", () => ({
  withSecurity: (handler: unknown) => handler,
}));

jest.mock("@/middleware/billing-gate-universal", () => ({
  withUniversalBillingGate: (handler: unknown) => handler,
  publicRoute: (handler: unknown) => handler,
}));

jest.mock("@/shared/auth/apiKey", () => ({
  authenticateApiKey: (...args: unknown[]) => authenticateApiKeyMock(...args),
}));

jest.mock("@/lib/api/unified-auth", () => ({
  requireAuth: (...args: unknown[]) => requireAuthMock(...args),
}));

jest.mock("@/lib/api/auth-gate", () => ({
  requireAdmin: (...args: unknown[]) => requireAdminMock(...args),
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
    TenantMembershipError,
  };
});

jest.mock("@/lib/supabase/server", () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}));

jest.mock("@/lib/observability/trace", () => ({
  getTraceId: (...args: unknown[]) => getTraceIdMock(...args),
}));

jest.mock("@/lib/audit/logger", () => ({
  logAuditEvent: (...args: unknown[]) => logAuditEventMock(...args),
}));

jest.mock("@/shared/db/prismaClient", () => ({
  prisma: {
    billingAccount: {
      findFirst: (...args: unknown[]) => billingAccountFindFirstMock(...args),
    },
    reconJob: {
      findMany: (...args: unknown[]) => reconJobFindManyMock(...args),
      findFirst: (...args: unknown[]) => reconJobFindFirstMock(...args),
    },
    reconciliationMatch: {
      findFirst: (...args: unknown[]) => reconciliationMatchFindFirstMock(...args),
    },
    reconciliationRun: {
      findMany: (...args: unknown[]) => reconciliationRunFindManyMock(...args),
    },
    reconMatch: {
      findMany: (...args: unknown[]) => reconMatchFindManyMock(...args),
      count: (...args: unknown[]) => reconMatchCountMock(...args),
    },
    driftEvent: {
      findMany: (...args: unknown[]) => driftEventFindManyMock(...args),
      count: (...args: unknown[]) => driftEventCountMock(...args),
    },
    $queryRaw: (...args: unknown[]) => prismaQueryRawMock(...args),
    $executeRaw: (...args: unknown[]) => prismaExecuteRawMock(...args),
    $executeRawUnsafe: (...args: unknown[]) => prismaExecuteRawUnsafeMock(...args),
  },
}));

function req(url: string, init: { method?: string; body?: unknown; jsonError?: boolean } = {}) {
  return {
    url,
    method: init.method || "GET",
    headers: new Headers(),
    nextUrl: new URL(url),
    json: async () => {
      if (init.jsonError) {
        throw new Error("invalid json");
      }
      return init.body ?? {};
    },
  } as any;
}

describe("non-run false-success invariants", () => {
  beforeEach(() => {
    authenticateApiKeyMock.mockReset();
    requireAuthMock.mockReset();
    requireAdminMock.mockReset();
    resolveTenantMembershipScopeMock.mockReset();
    resolveTenantForMutationMock.mockReset();
    createClientMock.mockReset();
    getTraceIdMock.mockReset();
    logAuditEventMock.mockReset();

    billingAccountFindFirstMock.mockReset();
    reconJobFindManyMock.mockReset();
    reconJobFindFirstMock.mockReset();
    reconciliationMatchFindFirstMock.mockReset();
    reconciliationRunFindManyMock.mockReset();
    reconMatchFindManyMock.mockReset();
    reconMatchCountMock.mockReset();
    driftEventFindManyMock.mockReset();
    driftEventCountMock.mockReset();

    prismaQueryRawMock.mockReset();
    prismaExecuteRawMock.mockReset();
    prismaExecuteRawUnsafeMock.mockReset();

    authenticateApiKeyMock.mockResolvedValue(null);
    requireAuthMock.mockResolvedValue({ userId: "user-a", tenantId: "tenant-a" });
    requireAdminMock.mockResolvedValue({ isAdmin: true, user: { id: "admin-a" } });
    resolveTenantMembershipScopeMock.mockResolvedValue({
      tenantIds: ["tenant-a"],
      userId: "user-a",
      supabase: {},
    });
    resolveTenantForMutationMock.mockReturnValue("tenant-a");
    getTraceIdMock.mockResolvedValue("trace-test");
    logAuditEventMock.mockResolvedValue(undefined);

    createClientMock.mockResolvedValue({
      auth: {
        getUser: jest.fn(async () => ({ data: { user: { id: "user-a" } } })),
      },
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(async () => ({ data: null })),
            })),
            single: jest.fn(async () => ({ data: null })),
          })),
        })),
      })),
    });

    billingAccountFindFirstMock.mockResolvedValue({ tenantId: "tenant-a" });
    reconJobFindManyMock.mockResolvedValue([]);
    reconJobFindFirstMock.mockResolvedValue({ id: "11111111-1111-4111-8111-111111111111" });
    reconciliationMatchFindFirstMock.mockResolvedValue({
      id: "22222222-2222-4222-8222-222222222222",
      runId: "33333333-3333-4333-8333-333333333333",
      tenantId: "tenant-a",
    });
    reconciliationRunFindManyMock.mockResolvedValue([]);
    reconMatchFindManyMock.mockResolvedValue([]);
    reconMatchCountMock.mockResolvedValue(0);
    driftEventFindManyMock.mockResolvedValue([]);
    driftEventCountMock.mockResolvedValue(0);

    prismaQueryRawMock.mockResolvedValue([]);
    prismaExecuteRawMock.mockResolvedValue(1);
    prismaExecuteRawUnsafeMock.mockResolvedValue(undefined);
  });

  test("jobs bulk route returns 500 for unhandled server failures", async () => {
    authenticateApiKeyMock.mockResolvedValue({
      tenantId: "tenant-a",
      userId: "user-a",
    });

    const response = await postBulkJobs(req("http://localhost/api/jobs/bulk", { jsonError: true }));

    expect(response.status).toBe(500);
    const payload = await response.json();
    expect(payload.success).toBe(false);
    expect(payload.error).toBe("Failed to perform bulk action");
  });

  test("job exceptions route returns 500 instead of false-success 200 on backend failure", async () => {
    authenticateApiKeyMock.mockResolvedValue({
      tenantId: "tenant-a",
      userId: "user-a",
    });
    reconJobFindFirstMock.mockRejectedValue(new Error("database offline"));

    const response = await getJobExceptions(
      req("http://localhost/api/jobs/11111111-1111-4111-8111-111111111111/exceptions"),
      { params: Promise.resolve({ id: "11111111-1111-4111-8111-111111111111" }) } as any
    );

    expect(response.status).toBe(500);
    const payload = await response.json();
    expect(payload.error).toBe("Failed to fetch exceptions");
  });

  test("exceptions list route returns 500 for backend query failures", async () => {
    driftEventFindManyMock.mockRejectedValue(new Error("database offline"));

    const response = await getExceptions(req("http://localhost/api/exceptions"));

    expect(response.status).toBe(500);
    const payload = await response.json();
    expect(payload.error).toBe("Failed to fetch exceptions");
    expect(payload.trace_id).toBe("trace-test");
  });

  test("job exception review route returns 500 on backend failures", async () => {
    authenticateApiKeyMock.mockResolvedValue({
      tenantId: "tenant-a",
      userId: "user-a",
    });
    reconJobFindFirstMock.mockRejectedValue(new Error("database offline"));

    const response = await patchJobException(
      req(
        "http://localhost/api/jobs/11111111-1111-4111-8111-111111111111/exceptions/22222222-2222-4222-8222-222222222222",
        {
          method: "PATCH",
          body: { action: "review" },
        }
      ),
      {
        params: Promise.resolve({
          id: "11111111-1111-4111-8111-111111111111",
          exceptionId: "22222222-2222-4222-8222-222222222222",
        }),
      } as any
    );

    expect(response.status).toBe(500);
    const payload = await response.json();
    expect(payload.success).toBe(false);
    expect(payload.error).toBe("Failed to update exception");
  });

  test("integrations health route reports degraded dependency failures via 503", async () => {
    createClientMock.mockRejectedValue(new Error("supabase unavailable"));

    const response = await getIntegrationsHealth(req("http://localhost/api/integrations/health"));

    expect(response.status).toBe(503);
    const payload = await response.json();
    expect(payload.degraded).toBe(true);
    expect(payload.integrations).toEqual([]);
  });

  test("data import route returns 500 on unhandled import failures", async () => {
    createClientMock.mockRejectedValue(new Error("supabase unavailable"));

    const response = await postDataImport(
      req("http://localhost/api/data/import", { method: "POST" })
    );

    expect(response.status).toBe(500);
    const payload = await response.json();
    expect(payload.success).toBe(false);
  });

  test("connector connect route returns 500 when dependency setup fails", async () => {
    createClientMock.mockRejectedValue(new Error("supabase unavailable"));

    const response = await postConnectorConnect(
      req("http://localhost/api/connectors/connect/stripe", { method: "POST" }),
      { params: { providerId: "stripe" } } as any
    );

    expect(response.status).toBe(500);
    const payload = await response.json();
    expect(payload.success).toBe(false);
    expect(payload.error).toBe("Failed to connect integration");
  });

  test("integration test route returns 500 on unexpected server errors", async () => {
    createClientMock.mockRejectedValue(new Error("supabase unavailable"));

    const response = await postIntegrationTest(
      req("http://localhost/api/integrations/stripe/test", { method: "POST" }),
      { params: { integrationId: "stripe" } } as any
    );

    expect(response.status).toBe(500);
    const payload = await response.json();
    expect(payload.success).toBe(false);
  });

  test("operator control-plane GET returns 503 with degraded payload on failure", async () => {
    prismaQueryRawMock.mockRejectedValueOnce(new Error("warehouse unavailable"));

    const response = await getOperatorControlPlane(
      req("http://localhost/api/console/operator/control-plane?days=7")
    );

    expect(response.status).toBe(503);
    const payload = await response.json();
    expect(payload.degraded).toBe(true);
    expect(payload.data).toBeNull();
  });

  test("operator control-plane POST returns 400 for invalid payload", async () => {
    const response = await postOperatorControlPlane(
      req("http://localhost/api/console/operator/control-plane", {
        method: "POST",
        body: { subject: "x" },
      })
    );

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.success).toBe(false);
    expect(payload.error).toBe("Invalid payload");
  });
});
