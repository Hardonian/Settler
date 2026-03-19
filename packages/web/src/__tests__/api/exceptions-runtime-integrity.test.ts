/** @jest-environment node */

import { GET as getExceptions } from "@/app/api/exceptions/route";
import { GET as getExceptionDetail } from "@/app/api/exceptions/[exceptionId]/route";

const resolveTenantMembershipScopeMock = jest.fn();
const resolveTenantForMutationMock = jest.fn();
const getTraceIdMock = jest.fn();
const driftEventFindManyMock = jest.fn();
const driftEventCountMock = jest.fn();
const driftEventFindFirstMock = jest.fn();

jest.mock("@/lib/middleware/api-security", () => ({
  withSecurity: (handler: unknown) => handler,
}));

jest.mock("@/middleware/billing-gate-universal", () => ({
  withUniversalBillingGate: (handler: unknown) => handler,
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

jest.mock("@/lib/observability/trace", () => ({
  getTraceId: (...args: unknown[]) => getTraceIdMock(...args),
}));

jest.mock("@/shared/db/prismaClient", () => ({
  prisma: {
    driftEvent: {
      findMany: (...args: unknown[]) => driftEventFindManyMock(...args),
      count: (...args: unknown[]) => driftEventCountMock(...args),
      findFirst: (...args: unknown[]) => driftEventFindFirstMock(...args),
    },
  },
}));

function req(url: string) {
  return {
    url,
    nextUrl: new URL(url),
  } as any;
}

describe("exceptions runtime integrity", () => {
  beforeEach(() => {
    resolveTenantMembershipScopeMock.mockReset();
    resolveTenantForMutationMock.mockReset();
    getTraceIdMock.mockReset();
    driftEventFindManyMock.mockReset();
    driftEventCountMock.mockReset();
    driftEventFindFirstMock.mockReset();

    resolveTenantMembershipScopeMock.mockResolvedValue({
      tenantIds: ["tenant-a"],
      userId: "user-a",
      supabase: {},
    });
    resolveTenantForMutationMock.mockReturnValue("tenant-a");
    getTraceIdMock.mockResolvedValue("trace-test");
  });

  test("lists run-scoped exceptions with tenant-scoped filtering", async () => {
    const runId = "11111111-1111-4111-8111-111111111111";

    driftEventFindManyMock.mockResolvedValue([
      {
        id: "22222222-2222-4222-8222-222222222222",
        driftType: "amount_mismatch",
        severity: "high",
        acknowledged: true,
        acknowledgedBy: "user-a",
        acknowledgedAt: new Date("2026-01-01T00:00:00.000Z"),
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        reconJobId: runId,
        fieldPath: "amount",
        expectedValue: "10.00",
        actualValue: "11.00",
        metadata: {
          resolution: { status: "ignored" },
        },
      },
    ]);
    driftEventCountMock.mockResolvedValue(1);

    const response = await getExceptions(
      req(`http://localhost/api/exceptions?runId=${runId}&tenant_id=tenant-a`)
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.items).toHaveLength(1);
    expect(payload.data).toEqual(payload.items);
    expect(payload.items[0].status).toBe("ignored");
    expect(payload.items[0].id).toBe("22222222-2222-4222-8222-222222222222");

    expect(driftEventFindManyMock).toHaveBeenCalled();
    const call = driftEventFindManyMock.mock.calls[0]?.[0];
    expect(call.where.tenantId).toBe("tenant-a");
    expect(call.where.reconJobId).toBe(runId);
  });

  test("returns flattened and nested exception detail payload with ignored status", async () => {
    driftEventFindFirstMock.mockResolvedValue({
      id: "22222222-2222-4222-8222-222222222222",
      tenantId: "tenant-a",
      driftType: "amount_mismatch",
      severity: "high",
      acknowledged: true,
      acknowledgedBy: "user-a",
      acknowledgedAt: new Date("2026-01-01T00:00:00.000Z"),
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      reconJobId: "11111111-1111-4111-8111-111111111111",
      fieldPath: "amount",
      expectedValue: "10.00",
      actualValue: "11.00",
      metadata: {
        resolution: { status: "ignored" },
        sourceTransactionId: "src-1",
      },
    });

    const response = await getExceptionDetail(req("http://localhost/api/exceptions/id"), {
      params: Promise.resolve({ exceptionId: "22222222-2222-4222-8222-222222222222" }),
    } as any);

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.status).toBe("ignored");
    expect(payload.exception.status).toBe("ignored");
    expect(payload.exception.id).toBe("22222222-2222-4222-8222-222222222222");
    expect(payload.exception.auditTrail).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "Detected", user: "system" }),
        expect.objectContaining({ action: "Ignored", user: "user-a" }),
      ])
    );
    expect(payload.trace_id).toBe("trace-test");
  });

  test("maps acknowledged exceptions without a resolution record to investigating", async () => {
    driftEventFindManyMock.mockResolvedValue([
      {
        id: "33333333-3333-4333-8333-333333333333",
        driftType: "missing_transaction",
        severity: "medium",
        acknowledged: true,
        acknowledgedBy: "user-b",
        acknowledgedAt: new Date("2026-01-02T00:00:00.000Z"),
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        reconJobId: "11111111-1111-4111-8111-111111111111",
        fieldPath: "external_id",
        expectedValue: "txn_1",
        actualValue: null,
        metadata: {},
      },
    ]);
    driftEventCountMock.mockResolvedValue(1);

    const response = await getExceptions(req("http://localhost/api/exceptions?tenant_id=tenant-a"));

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.items[0].status).toBe("investigating");
    expect(payload.items[0].statusDetail).toContain("Resolution is still pending");
  });
});
