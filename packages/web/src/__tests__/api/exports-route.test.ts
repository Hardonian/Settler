/** @jest-environment node */

import { POST, GET } from "@/app/api/exports/route";

jest.mock("@/middleware/billing-gate-universal", () => ({
  withUniversalBillingGate: (handler: unknown) => handler,
}));

jest.mock("@/lib/middleware/api-security", () => ({
  withSecurity: (handler: unknown) => handler,
}));

const requireTenantRequestContextMock = jest.fn();
const getTraceIdMock = jest.fn();
const exportCreateMock = jest.fn();
const exportFindManyMock = jest.fn();
const reconciliationRunFindFirstMock = jest.fn();
const reconJobFindFirstMock = jest.fn();
const ingestionFindFirstMock = jest.fn();

jest.mock("@/lib/api/tenant-context", () => ({
  requireTenantRequestContext: (...args: unknown[]) => requireTenantRequestContextMock(...args),
  buildTenantContextErrorResponse: (error: {
    status: number;
    code: string;
    message: string;
    capability: unknown;
  }) =>
    Response.json(
      { error: error.message, code: error.code, capability: error.capability },
      { status: error.status }
    ),
}));

jest.mock("@/lib/observability/trace", () => ({
  getTraceId: (...args: unknown[]) => getTraceIdMock(...args),
}));

jest.mock("@/lib/utils/logger", () => ({
  appLogger: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock("@/shared/db/prismaClient", () => ({
  prisma: {
    export: {
      create: (...args: unknown[]) => exportCreateMock(...args),
      update: jest.fn(async () => null),
      findMany: (...args: unknown[]) => exportFindManyMock(...args),
    },
    reconciliationRun: {
      findFirst: (...args: unknown[]) => reconciliationRunFindFirstMock(...args),
    },
    reconJob: {
      findFirst: (...args: unknown[]) => reconJobFindFirstMock(...args),
    },
    ingestion: {
      findFirst: (...args: unknown[]) => ingestionFindFirstMock(...args),
    },
    reconciliationMatch: {
      findMany: jest.fn(async () => []),
    },
    reconResult: {
      findMany: jest.fn(async () => []),
    },
  },
}));

function req(method: "POST" | "GET", body?: unknown) {
  return {
    method,
    nextUrl: new URL("http://localhost/api/exports"),
    json: async () => body ?? {},
  } as any;
}

describe("/api/exports route hardening", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireTenantRequestContextMock.mockResolvedValue({
      userId: "user-1",
      tenantId: "tenant-1",
      auth: { type: "api_key" },
    });
    getTraceIdMock.mockResolvedValue("trace-export");
    reconciliationRunFindFirstMock.mockResolvedValue({ id: "run-1" });
    reconJobFindFirstMock.mockResolvedValue(null);
    ingestionFindFirstMock.mockResolvedValue(null);
    exportCreateMock.mockResolvedValue({
      id: "exp-1",
      status: "pending",
      type: "csv",
      format: "all",
      traceId: "trace-export",
      reconciliationRunId: "run-1",
      ingestionId: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    exportFindManyMock.mockResolvedValue([]);
  });

  it("rejects unsupported excel exports instead of silently producing JSON", async () => {
    const response = await POST(
      req("POST", {
        type: "excel",
        format: "all",
        reconciliationRunId: "11111111-1111-4111-8111-111111111111",
      })
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.code).toBe("EXPORT_TYPE_UNAVAILABLE");
    expect(exportCreateMock).not.toHaveBeenCalled();
  });

  it("rejects export creation when the requested run is outside tenant scope", async () => {
    reconciliationRunFindFirstMock.mockResolvedValue(null);

    const response = await POST(
      req("POST", {
        type: "csv",
        format: "all",
        reconciliationRunId: "11111111-1111-4111-8111-111111111111",
      })
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.code).toBe("EXPORT_RUN_NOT_FOUND");
    expect(exportCreateMock).not.toHaveBeenCalled();
  });

  it("returns export lineage fields from the canonical record", async () => {
    exportFindManyMock.mockResolvedValue([
      {
        id: "exp-1",
        type: "csv",
        format: "all",
        status: "completed",
        reconciliationRunId: "run-1",
        ingestionId: null,
        traceId: "trace-export",
        metadata: { jobId: "job-1" },
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        signedUrl: "https://example.test/export",
        signedUrlExpiresAt: new Date("2026-01-02T00:00:00.000Z"),
        fileSizeBytes: 10,
        rowCount: 2,
      },
    ]);

    const response = await GET(req("GET"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data[0]).toMatchObject({
      id: "exp-1",
      reconciliationRunId: "run-1",
      jobId: "job-1",
      traceId: "trace-export",
    });
  });
});
