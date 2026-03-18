/** @jest-environment node */

import { GET as getJobExceptions } from "@/app/api/jobs/[id]/exceptions/route";
import { PATCH as patchJobException } from "@/app/api/jobs/[id]/exceptions/[exceptionId]/route";

const authenticateApiKeyMock = jest.fn();
const resolveTenantMembershipScopeMock = jest.fn();

const reconJobFindFirstMock = jest.fn();
const reconciliationRunFindManyMock = jest.fn();
const reconciliationRunFindFirstMock = jest.fn();
const reconciliationMatchCountMock = jest.fn();
const reconciliationMatchFindManyMock = jest.fn();
const reconciliationMatchFindFirstMock = jest.fn();
const reconciliationMatchUpdateMock = jest.fn();
const normalizedTransactionFindManyMock = jest.fn();
const normalizedTransactionFindFirstMock = jest.fn();

const logAuditEventMock = jest.fn();
const emitExceptionResolvedEventMock = jest.fn();

jest.mock("@/lib/middleware/api-security", () => ({
  withSecurity: (handler: unknown) => handler,
}));

jest.mock("@/middleware/billing-gate-universal", () => ({
  withUniversalBillingGate: (handler: unknown) => handler,
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
    TenantMembershipError,
  };
});

jest.mock("@/lib/audit/logger", () => ({
  logAuditEvent: (...args: unknown[]) => logAuditEventMock(...args),
}));

jest.mock("@/lib/ops/exception-events", () => ({
  emitExceptionResolvedEvent: (...args: unknown[]) => emitExceptionResolvedEventMock(...args),
}));

jest.mock("@/lib/utils/logger", () => ({
  appLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("@/shared/db/prismaClient", () => ({
  prisma: {
    reconJob: {
      findFirst: (...args: unknown[]) => reconJobFindFirstMock(...args),
    },
    reconciliationRun: {
      findMany: (...args: unknown[]) => reconciliationRunFindManyMock(...args),
      findFirst: (...args: unknown[]) => reconciliationRunFindFirstMock(...args),
    },
    reconciliationMatch: {
      count: (...args: unknown[]) => reconciliationMatchCountMock(...args),
      findMany: (...args: unknown[]) => reconciliationMatchFindManyMock(...args),
      findFirst: (...args: unknown[]) => reconciliationMatchFindFirstMock(...args),
      update: (...args: unknown[]) => reconciliationMatchUpdateMock(...args),
    },
    normalizedTransaction: {
      findMany: (...args: unknown[]) => normalizedTransactionFindManyMock(...args),
      findFirst: (...args: unknown[]) => normalizedTransactionFindFirstMock(...args),
    },
  },
}));

const JOB_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_JOB_ID = "99999999-9999-4999-8999-999999999999";
const EXCEPTION_ID = "22222222-2222-4222-8222-222222222222";

function req(url: string, init: { method?: string; body?: unknown } = {}) {
  return {
    url,
    method: init.method || "GET",
    nextUrl: new URL(url),
    headers: new Headers(),
    json: async () => init.body ?? {},
  } as any;
}

describe("job exceptions ownership boundaries", () => {
  beforeEach(() => {
    authenticateApiKeyMock.mockReset();
    resolveTenantMembershipScopeMock.mockReset();
    reconJobFindFirstMock.mockReset();
    reconciliationRunFindManyMock.mockReset();
    reconciliationRunFindFirstMock.mockReset();
    reconciliationMatchCountMock.mockReset();
    reconciliationMatchFindManyMock.mockReset();
    reconciliationMatchFindFirstMock.mockReset();
    reconciliationMatchUpdateMock.mockReset();
    normalizedTransactionFindManyMock.mockReset();
    normalizedTransactionFindFirstMock.mockReset();
    logAuditEventMock.mockReset();
    emitExceptionResolvedEventMock.mockReset();

    authenticateApiKeyMock.mockResolvedValue({
      tenantId: "tenant-a",
      userId: "user-a",
    });
    resolveTenantMembershipScopeMock.mockResolvedValue({
      tenantIds: ["tenant-a"],
      userId: "user-a",
      supabase: {},
    });
    reconJobFindFirstMock.mockResolvedValue({
      id: JOB_ID,
      tenantId: "tenant-a",
    });
  });

  test("GET fails closed when reconciliation runs are not linked to requested job", async () => {
    reconciliationRunFindManyMock.mockResolvedValue([
      { id: "run-unlinked", metadata: { jobId: OTHER_JOB_ID } },
    ]);

    const response = await getJobExceptions(req(`http://localhost/api/jobs/${JOB_ID}/exceptions`), {
      params: Promise.resolve({ id: JOB_ID }),
    } as any);

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.exceptions).toEqual([]);
    expect(payload.summary).toEqual({
      totalUnmatched: 0,
      totalConflicts: 0,
      totalReviewed: 0,
      totalUnreviewed: 0,
    });
    expect(reconciliationMatchCountMock).not.toHaveBeenCalled();
  });

  test("GET only queries exceptions for runs linked to the requested job", async () => {
    reconciliationRunFindManyMock.mockResolvedValue([
      { id: "run-linked", metadata: { jobId: JOB_ID } },
      { id: "run-unlinked", metadata: { jobId: OTHER_JOB_ID } },
    ]);

    reconciliationMatchCountMock
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0);

    reconciliationMatchFindManyMock.mockResolvedValue([
      {
        id: EXCEPTION_ID,
        runId: "run-linked",
        sourceTransactionId: "src-1",
        targetTransactionId: "tgt-1",
        matchType: "conflict",
        confidence: 0.7,
        matchReason: "amount mismatch",
        amountDiff: 1.25,
        dateDiff: 0,
        reviewed: false,
        reviewedBy: null,
        reviewedAt: null,
        metadata: {},
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        sourceTransaction: {
          id: "src-1",
          amount: 10,
          currency: "USD",
          date: new Date("2026-01-01T00:00:00.000Z"),
          description: "Source",
          externalId: null,
        },
      },
    ]);

    normalizedTransactionFindManyMock.mockResolvedValue([
      {
        id: "tgt-1",
        amount: 11.25,
        currency: "USD",
        date: new Date("2026-01-01T00:00:00.000Z"),
        description: "Target",
        externalId: null,
      },
    ]);

    const response = await getJobExceptions(req(`http://localhost/api/jobs/${JOB_ID}/exceptions`), {
      params: Promise.resolve({ id: JOB_ID }),
    } as any);

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.exceptions).toHaveLength(1);
    expect(payload.exceptions[0].runId).toBe("run-linked");

    const whereClause = reconciliationMatchCountMock.mock.calls[0]?.[0]?.where;
    expect(whereClause.runId.in).toEqual(["run-linked"]);
  });

  test("PATCH returns 404 when exception run is not linked to requested job", async () => {
    reconciliationMatchFindFirstMock.mockResolvedValue({
      id: EXCEPTION_ID,
      runId: "run-unlinked",
      tenantId: "tenant-a",
      reviewed: false,
      matchType: "unmatched",
      targetTransactionId: null,
      metadata: {},
      run: { id: "run-unlinked" },
    });
    reconciliationRunFindFirstMock.mockResolvedValue({
      id: "run-unlinked",
      metadata: { jobId: OTHER_JOB_ID },
    });

    const response = await patchJobException(
      req(`http://localhost/api/jobs/${JOB_ID}/exceptions/${EXCEPTION_ID}`, {
        method: "PATCH",
        body: { action: "review" },
      }),
      { params: Promise.resolve({ id: JOB_ID, exceptionId: EXCEPTION_ID }) } as any
    );

    expect(response.status).toBe(404);
    const payload = await response.json();
    expect(payload.error).toBe("Not found");
    expect(reconciliationMatchUpdateMock).not.toHaveBeenCalled();
  });
});

