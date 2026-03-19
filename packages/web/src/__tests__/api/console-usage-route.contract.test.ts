/** @jest-environment node */

import { GET as getConsoleUsage } from "@/app/api/console/usage/route";

const createClientMock = jest.fn();
const usageEventFindManyMock = jest.fn();
const getCurrentUsageMock = jest.fn();
const getCorrelationIdMock = jest.fn();
const addCorrelationHeadersMock = jest.fn();
const createLoggerMock = jest.fn();
const getBillingAccountOptimizedMock = jest.fn();
const executeWithRetryMock = jest.fn();

jest.mock("@/lib/middleware/api-security", () => ({
  withSecurity: (handler: unknown) => handler,
}));

jest.mock("@/middleware/billing-gate-universal", () => ({
  withUniversalBillingGate: (handler: unknown) => handler,
}));

jest.mock("@/lib/supabase/server", () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}));

jest.mock("@/shared/db/prismaClient", () => ({
  prisma: {
    usageEvent: {
      findMany: (...args: unknown[]) => usageEventFindManyMock(...args),
    },
  },
}));

jest.mock("@/lib/usage/tracking", () => ({
  getCurrentUsage: (...args: unknown[]) => getCurrentUsageMock(...args),
}));

jest.mock("@/lib/monitoring/correlation", () => ({
  getCorrelationId: (...args: unknown[]) => getCorrelationIdMock(...args),
  addCorrelationHeaders: (...args: unknown[]) => addCorrelationHeadersMock(...args),
  createLogger: (...args: unknown[]) => createLoggerMock(...args),
}));

jest.mock("@/lib/db/query-optimizer", () => ({
  getBillingAccountOptimized: (...args: unknown[]) => getBillingAccountOptimizedMock(...args),
}));

jest.mock("@/lib/db/connection-pool", () => ({
  executeWithRetry: (...args: unknown[]) => executeWithRetryMock(...args),
}));

function req(url: string) {
  return {
    url,
    method: "GET",
    headers: new Headers(),
    nextUrl: new URL(url),
  } as any;
}

describe("GET /api/console/usage", () => {
  beforeEach(() => {
    createClientMock.mockReset();
    usageEventFindManyMock.mockReset();
    getCurrentUsageMock.mockReset();
    getCorrelationIdMock.mockReset();
    addCorrelationHeadersMock.mockReset();
    createLoggerMock.mockReset();
    getBillingAccountOptimizedMock.mockReset();
    executeWithRetryMock.mockReset();

    createClientMock.mockResolvedValue({
      auth: {
        getUser: jest.fn(async () => ({ data: { user: { id: "user-a" } } })),
      },
    });

    usageEventFindManyMock.mockResolvedValue([
      { eventType: "reconcile-run", quantity: 2, metadata: {} },
      { eventType: "receipts-upload", quantity: 1, metadata: { error: true } },
    ]);

    getCurrentUsageMock.mockResolvedValue({
      current: 10,
      limit: 100,
      remaining: 90,
    });

    getCorrelationIdMock.mockResolvedValue("corr-test");
    addCorrelationHeadersMock.mockImplementation((response) => response);
    createLoggerMock.mockResolvedValue({
      info: jest.fn(),
      error: jest.fn(),
    });

    getBillingAccountOptimizedMock.mockResolvedValue({ id: "billing-a" });
    executeWithRetryMock.mockImplementation(async (fn: () => Promise<unknown>) => fn());
  });

  it("returns 401 when user is unauthenticated", async () => {
    createClientMock.mockResolvedValueOnce({
      auth: {
        getUser: jest.fn(async () => ({ data: { user: null } })),
      },
    });

    const response = await getConsoleUsage(req("http://localhost/api/console/usage"));
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error).toBe("Unauthorized");
  });

  it("clamps days to 90 and responds with no-store headers", async () => {
    const response = await getConsoleUsage(req("http://localhost/api/console/usage?days=9999"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.totalCalls).toBe(3);
    expect(getCurrentUsageMock).toHaveBeenCalledTimes(4);

    const queryArgs = usageEventFindManyMock.mock.calls[0]?.[0] as {
      where: { timestamp: { gte: Date; lte: Date } };
    };
    const gte = queryArgs.where.timestamp.gte.getTime();
    const now = Date.now();
    const diffDays = Math.round((now - gte) / (24 * 60 * 60 * 1000));
    expect(diffDays).toBeGreaterThanOrEqual(89);
    expect(diffDays).toBeLessThanOrEqual(90);

    expect(response.headers.get("Cache-Control")).toBe("private, no-store, max-age=0");
  });

  it("returns 500 on internal failures", async () => {
    executeWithRetryMock.mockRejectedValueOnce(new Error("database unavailable"));

    const response = await getConsoleUsage(req("http://localhost/api/console/usage"));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe("Failed to retrieve usage summary");
  });
});
