/** @jest-environment node */

import { GET as getUsageExportDownload } from "@/app/api/console/usage/export/[exportId]/download/route";

const createClientMock = jest.fn();
const resolveUsageExportActorMock = jest.fn();
const getUsageExportJobForActorMock = jest.fn();
const verifyUsageExportDownloadAccessMock = jest.fn();
const listUsageExportChunkPageMock = jest.fn();
const getUsageExportFileNameMock = jest.fn();

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
  verifyUsageExportDownloadAccess: (...args: unknown[]) =>
    verifyUsageExportDownloadAccessMock(...args),
  listUsageExportChunkPage: (...args: unknown[]) => listUsageExportChunkPageMock(...args),
  getUsageExportFileName: (...args: unknown[]) => getUsageExportFileNameMock(...args),
}));

function req(url: string) {
  return {
    url,
    method: "GET",
    headers: new Headers(),
    nextUrl: new URL(url),
  } as any;
}

describe("/api/console/usage/export/[exportId]/download contract", () => {
  beforeEach(() => {
    createClientMock.mockReset();
    resolveUsageExportActorMock.mockReset();
    getUsageExportJobForActorMock.mockReset();
    verifyUsageExportDownloadAccessMock.mockReset();
    listUsageExportChunkPageMock.mockReset();
    getUsageExportFileNameMock.mockReset();

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
      status: "completed",
      type: "csv",
      format: "usage_events",
      signedUrl: "/api/console/usage/export/exp-1/download?token=abc",
      signedUrlExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      rowCount: 1,
      fileSizeBytes: 128,
      errorMessage: null,
      metadata: { kind: "usage-export-v1" },
      createdAt: new Date(),
      tenantId: "tenant-a",
      userId: "user-a",
    });

    verifyUsageExportDownloadAccessMock.mockResolvedValue(true);
    getUsageExportFileNameMock.mockReturnValue("usage.csv");
    listUsageExportChunkPageMock.mockResolvedValueOnce([
      {
        chunk_index: 0,
        row_count: 1,
        content: '"2026-03-01T00:00:00.000Z","reconcile","run",1,"success"',
      },
    ]);
    listUsageExportChunkPageMock.mockResolvedValueOnce([]);
  });

  it("rejects missing token", async () => {
    const response = await getUsageExportDownload(
      req("http://localhost/api/console/usage/export/exp-1/download"),
      { params: Promise.resolve({ exportId: "exp-1" }) }
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Missing download token");
  });

  it("rejects invalid token", async () => {
    verifyUsageExportDownloadAccessMock.mockResolvedValueOnce(false);

    const response = await getUsageExportDownload(
      req("http://localhost/api/console/usage/export/exp-1/download?token=bad"),
      { params: Promise.resolve({ exportId: "exp-1" }) }
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error).toBe("Invalid or expired download token");
  });

  it("streams completed CSV export artifacts", async () => {
    const response = await getUsageExportDownload(
      req("http://localhost/api/console/usage/export/exp-1/download?token=abc"),
      { params: Promise.resolve({ exportId: "exp-1" }) }
    );

    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/csv");
    expect(response.headers.get("Content-Disposition")).toContain("usage.csv");
    expect(body).toContain("Timestamp,Service,Operation,Quantity,Status");
    expect(body).toContain('"reconcile","run",1,"success"');
  });
});
