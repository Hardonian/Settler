/** @jest-environment node */

import {
  GET as getUsageExport,
  POST as postUsageExport,
} from "@/app/api/console/usage/export/route";

const createClientMock = jest.fn();
const resolveUsageExportActorMock = jest.fn();
const countUsageRowsForWindowMock = jest.fn();
const buildSynchronousUsageExportMock = jest.fn();
const createUsageExportJobMock = jest.fn();
const cleanupExpiredUsageExportArtifactsMock = jest.fn();
const getUsageExportJobForActorMock = jest.fn();
const resetUsageExportJobForRetryMock = jest.fn();
const advanceUsageExportJobMock = jest.fn();
const formatUsageExportJobResponseMock = jest.fn();
const isUsageExportSigningConfiguredMock = jest.fn();
const signExportPayloadMock = jest.fn();

jest.mock("@/lib/middleware/api-security", () => ({
  withSecurity: (handler: unknown) => handler,
}));

jest.mock("@/middleware/billing-gate-universal", () => ({
  withUniversalBillingGate: (handler: unknown) => handler,
}));

jest.mock("@/lib/supabase/server", () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}));

jest.mock("@/lib/security/export-signature", () => ({
  signExportPayload: (...args: unknown[]) => signExportPayloadMock(...args),
}));

jest.mock("@/lib/console/usage-export-jobs", () => ({
  USAGE_EXPORT_SYNC_ROW_LIMIT: 1000,
  USAGE_EXPORT_MAX_ROWS: 250000,
  resolveUsageExportActor: (...args: unknown[]) => resolveUsageExportActorMock(...args),
  countUsageRowsForWindow: (...args: unknown[]) => countUsageRowsForWindowMock(...args),
  buildSynchronousUsageExport: (...args: unknown[]) => buildSynchronousUsageExportMock(...args),
  createUsageExportJob: (...args: unknown[]) => createUsageExportJobMock(...args),
  cleanupExpiredUsageExportArtifacts: (...args: unknown[]) =>
    cleanupExpiredUsageExportArtifactsMock(...args),
  getUsageExportJobForActor: (...args: unknown[]) => getUsageExportJobForActorMock(...args),
  resetUsageExportJobForRetry: (...args: unknown[]) => resetUsageExportJobForRetryMock(...args),
  advanceUsageExportJob: (...args: unknown[]) => advanceUsageExportJobMock(...args),
  formatUsageExportJobResponse: (...args: unknown[]) => formatUsageExportJobResponseMock(...args),
  isUsageExportSigningConfigured: (...args: unknown[]) =>
    isUsageExportSigningConfiguredMock(...args),
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

describe("/api/console/usage/export contract", () => {
  beforeEach(() => {
    createClientMock.mockReset();
    resolveUsageExportActorMock.mockReset();
    countUsageRowsForWindowMock.mockReset();
    buildSynchronousUsageExportMock.mockReset();
    createUsageExportJobMock.mockReset();
    cleanupExpiredUsageExportArtifactsMock.mockReset();
    getUsageExportJobForActorMock.mockReset();
    resetUsageExportJobForRetryMock.mockReset();
    advanceUsageExportJobMock.mockReset();
    formatUsageExportJobResponseMock.mockReset();
    isUsageExportSigningConfiguredMock.mockReset();
    signExportPayloadMock.mockReset();

    createClientMock.mockResolvedValue({
      auth: {
        getUser: jest.fn(async () => ({ data: { user: { id: "user-a" } }, error: null })),
      },
    });

    resolveUsageExportActorMock.mockResolvedValue({
      billingAccountId: "billing-a",
      tenantScopeId: "tenant-a",
    });
    isUsageExportSigningConfiguredMock.mockReturnValue(true);

    signExportPayloadMock.mockReturnValue({
      signature: "sig",
      keyId: "kid",
      algorithm: "sha256",
    });

    buildSynchronousUsageExportMock.mockResolvedValue({
      content: "Timestamp,Service,Operation,Quantity,Status",
      rowCount: 12,
      fileName: "usage.csv",
      payloadBytes: 39,
    });

    createUsageExportJobMock.mockResolvedValue({
      id: "exp-1",
      status: "processing",
      type: "csv",
      format: "usage_events",
      signedUrl: null,
      signedUrlExpiresAt: null,
      expiresAt: null,
      rowCount: 12000,
      errorMessage: null,
      metadata: {
        kind: "usage-export-v1",
      },
    });

    formatUsageExportJobResponseMock.mockReturnValue({
      exportId: "exp-1",
      format: "csv",
      status: "processing",
      totalRows: 12000,
      processedRows: 2000,
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

  it("returns bounded sync export for low-row GET requests", async () => {
    countUsageRowsForWindowMock.mockResolvedValueOnce(100);

    const response = await getUsageExport(
      req("http://localhost/api/console/usage/export?format=csv&days=30")
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Settler-Export-Mode")).toBe("sync");
    expect(response.headers.get("X-Settler-Export-Signed")).toBe("true");
    expect(createUsageExportJobMock).not.toHaveBeenCalled();
  });

  it("returns async job payload for high-row GET requests", async () => {
    countUsageRowsForWindowMock.mockResolvedValueOnce(10000);

    const response = await getUsageExport(
      req("http://localhost/api/console/usage/export?format=json&days=30")
    );
    const payload = await response.json();

    expect(response.status).toBe(202);
    expect(payload.exportId).toBe("exp-1");
    expect(payload.mode).toBe("async");
    expect(createUsageExportJobMock).toHaveBeenCalledTimes(1);
  });

  it("returns 413 when export row cap is exceeded", async () => {
    countUsageRowsForWindowMock.mockResolvedValueOnce(300000);

    const response = await getUsageExport(
      req("http://localhost/api/console/usage/export?format=json&days=365")
    );
    const payload = await response.json();

    expect(response.status).toBe(413);
    expect(payload.error).toBe("Export row limit exceeded");
  });

  it("returns 503 when export signing is not configured", async () => {
    isUsageExportSigningConfiguredMock.mockReturnValueOnce(false);

    const response = await getUsageExport(
      req("http://localhost/api/console/usage/export?format=json&days=30")
    );
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.code).toBe("EXPORT_SIGNING_KEY_MISSING");
  });

  it("retries an existing export job via POST", async () => {
    getUsageExportJobForActorMock.mockResolvedValueOnce({
      id: "exp-1",
      status: "failed",
      type: "csv",
      format: "usage_events",
      signedUrl: null,
      signedUrlExpiresAt: null,
      expiresAt: null,
      rowCount: 12000,
      errorMessage: "boom",
      metadata: {
        kind: "usage-export-v1",
      },
    });

    resetUsageExportJobForRetryMock.mockResolvedValueOnce({
      id: "exp-1",
      status: "pending",
      type: "csv",
      format: "usage_events",
      signedUrl: null,
      signedUrlExpiresAt: null,
      expiresAt: null,
      rowCount: 12000,
      errorMessage: null,
      metadata: {
        kind: "usage-export-v1",
      },
    });

    advanceUsageExportJobMock.mockResolvedValueOnce({
      id: "exp-1",
      status: "processing",
      type: "csv",
      format: "usage_events",
      signedUrl: null,
      signedUrlExpiresAt: null,
      expiresAt: null,
      rowCount: 12000,
      errorMessage: null,
      metadata: {
        kind: "usage-export-v1",
      },
    });

    formatUsageExportJobResponseMock.mockReturnValueOnce({
      exportId: "exp-1",
      format: "csv",
      status: "processing",
      totalRows: 12000,
      processedRows: 0,
      chunkCount: 0,
      batchCount: 0,
      days: 30,
      pollUrl: "/api/console/usage/export/exp-1",
      downloadUrl: null,
      expiresAt: null,
      signedUrlExpiresAt: null,
      errorMessage: null,
      mode: "async",
    });

    const response = await postUsageExport(
      req("http://localhost/api/console/usage/export", "POST", {
        retryExportId: "exp-1",
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(202);
    expect(payload.exportId).toBe("exp-1");
    expect(resetUsageExportJobForRetryMock).toHaveBeenCalledTimes(1);
  });

  it("returns a stable export id for duplicate queued requests when deduped upstream", async () => {
    countUsageRowsForWindowMock.mockResolvedValue(10000);

    const first = await postUsageExport(
      req("http://localhost/api/console/usage/export", "POST", {
        format: "csv",
        days: 30,
      })
    );
    const firstPayload = await first.json();

    const second = await postUsageExport(
      req("http://localhost/api/console/usage/export", "POST", {
        format: "csv",
        days: 30,
      })
    );
    const secondPayload = await second.json();

    expect(first.status).toBe(202);
    expect(second.status).toBe(202);
    expect(firstPayload.exportId).toBe("exp-1");
    expect(secondPayload.exportId).toBe("exp-1");
  });
});
