/** @jest-environment node */

import {
  GET as getUsageExportStatus,
  POST as postUsageExportStatus,
} from "@/app/api/console/usage/export/[exportId]/route";

const createClientMock = jest.fn();
const resolveUsageExportActorMock = jest.fn();
const getUsageExportJobForActorMock = jest.fn();
const advanceUsageExportJobMock = jest.fn();
const formatUsageExportJobResponseMock = jest.fn();
const resetUsageExportJobForRetryMock = jest.fn();

jest.mock("@/lib/middleware/api-security", () => ({
  withSecurity: (handler: unknown) => handler,
}));

jest.mock("@/middleware/billing-gate-universal", () => ({
  withUniversalBillingGate: (handler: unknown) => handler,
}));

jest.mock("@/lib/supabase/server", () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}));

jest.mock("@/lib/console/usage-export-jobs", () => ({
  resolveUsageExportActor: (...args: unknown[]) => resolveUsageExportActorMock(...args),
  getUsageExportJobForActor: (...args: unknown[]) => getUsageExportJobForActorMock(...args),
  advanceUsageExportJob: (...args: unknown[]) => advanceUsageExportJobMock(...args),
  formatUsageExportJobResponse: (...args: unknown[]) => formatUsageExportJobResponseMock(...args),
  resetUsageExportJobForRetry: (...args: unknown[]) => resetUsageExportJobForRetryMock(...args),
}));

function req(url: string, method: "GET" | "POST" = "GET", body?: Record<string, unknown>) {
  return {
    url,
    method,
    headers: new Headers({ "Content-Type": "application/json" }),
    nextUrl: new URL(url),
    json: async () => body || {},
  } as any;
}

describe("/api/console/usage/export/[exportId] contract", () => {
  beforeEach(() => {
    createClientMock.mockReset();
    resolveUsageExportActorMock.mockReset();
    getUsageExportJobForActorMock.mockReset();
    advanceUsageExportJobMock.mockReset();
    formatUsageExportJobResponseMock.mockReset();
    resetUsageExportJobForRetryMock.mockReset();

    createClientMock.mockResolvedValue({
      auth: {
        getUser: jest.fn(async () => ({ data: { user: { id: "user-a" } }, error: null })),
      },
    });

    resolveUsageExportActorMock.mockResolvedValue({
      billingAccountId: "billing-a",
      tenantScopeId: "tenant-a",
    });

    getUsageExportJobForActorMock.mockResolvedValue({
      id: "exp-1",
      status: "pending",
      type: "csv",
      format: "usage_events",
      signedUrl: null,
      signedUrlExpiresAt: null,
      expiresAt: null,
      rowCount: 2000,
      fileSizeBytes: null,
      errorMessage: null,
      metadata: {
        kind: "usage-export-v1",
      },
      createdAt: new Date(),
      tenantId: "tenant-a",
      userId: "user-a",
    });

    advanceUsageExportJobMock.mockResolvedValue({
      id: "exp-1",
      status: "processing",
      type: "csv",
      format: "usage_events",
      signedUrl: null,
      signedUrlExpiresAt: null,
      expiresAt: null,
      rowCount: 2000,
      fileSizeBytes: 1024,
      errorMessage: null,
      metadata: {
        kind: "usage-export-v1",
      },
      createdAt: new Date(),
      tenantId: "tenant-a",
      userId: "user-a",
    });

    formatUsageExportJobResponseMock.mockReturnValue({
      exportId: "exp-1",
      format: "csv",
      status: "processing",
      totalRows: 2000,
      processedRows: 1000,
      chunkCount: 1,
      batchCount: 1,
      days: 30,
      pollUrl: "/api/console/usage/export/exp-1",
      downloadUrl: null,
      expiresAt: null,
      signedUrlExpiresAt: null,
      errorMessage: null,
      mode: "async",
    });
  });

  it("ticks pending export jobs on GET by default", async () => {
    const response = await getUsageExportStatus(
      req("http://localhost/api/console/usage/export/exp-1"),
      {
        params: Promise.resolve({ exportId: "exp-1" }),
      }
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.exportId).toBe("exp-1");
    expect(advanceUsageExportJobMock).toHaveBeenCalledTimes(1);
  });

  it("retries failed exports on POST action=retry", async () => {
    resetUsageExportJobForRetryMock.mockResolvedValueOnce({
      id: "exp-1",
      status: "pending",
      type: "csv",
      format: "usage_events",
      signedUrl: null,
      signedUrlExpiresAt: null,
      expiresAt: null,
      rowCount: 2000,
      fileSizeBytes: 0,
      errorMessage: null,
      metadata: { kind: "usage-export-v1" },
      createdAt: new Date(),
      tenantId: "tenant-a",
      userId: "user-a",
    });

    const response = await postUsageExportStatus(
      req("http://localhost/api/console/usage/export/exp-1", "POST", { action: "retry" }),
      { params: Promise.resolve({ exportId: "exp-1" }) }
    );
    const payload = await response.json();

    expect(response.status).toBe(202);
    expect(payload.exportId).toBe("exp-1");
    expect(resetUsageExportJobForRetryMock).toHaveBeenCalledTimes(1);
    expect(advanceUsageExportJobMock).toHaveBeenCalledTimes(1);
  });
});
