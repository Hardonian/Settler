/** @jest-environment node */

import { NextRequest } from "next/server";
import { GET } from "@/app/api/console/webhooks/route";

jest.mock("@/middleware/billing-gate-universal", () => ({
  withUniversalBillingGate: (handler: unknown) => handler,
}));

jest.mock("@/lib/middleware/api-security", () => ({
  withSecurity: (handler: unknown) => handler,
}));

const requireAuth = jest.fn();
const listWebhooks = jest.fn();

jest.mock("@/lib/api/unified-auth", () => ({
  requireAuth: (...args: unknown[]) => requireAuth(...args),
}));

jest.mock("@/lib/webhooks/manager", () => ({
  listWebhooks: (...args: unknown[]) => listWebhooks(...args),
  createWebhook: jest.fn(),
}));

const appLoggerError = jest.fn();

jest.mock("@/lib/utils/logger", () => ({
  appLogger: {
    error: (...args: unknown[]) => appLoggerError(...args),
  },
}));

function makeRequest() {
  return new NextRequest("http://localhost/api/console/webhooks");
}

describe("/api/console/webhooks GET truth semantics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns explicit available capability on success", async () => {
    requireAuth.mockResolvedValue({ userId: "user-1", tenantId: "tenant-1" });
    listWebhooks.mockResolvedValue([
      {
        id: "wh_1",
        url: "https://example.com/hook",
        events: ["reconciliation.completed"],
        secret: "abcdefghijklmnopqrst",
      },
    ]);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.capability).toEqual({ state: "available" });
    expect(body.webhooks).toHaveLength(1);
    expect(body.webhooks[0].secret).toBe("abcdefghijkl...");
  });

  it("returns explicit degraded capability and 503 when list lookup fails", async () => {
    requireAuth.mockResolvedValue({ userId: "user-1", tenantId: "tenant-1" });
    listWebhooks.mockRejectedValue(new Error("database timeout"));

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.webhooks).toEqual([]);
    expect(body.capability).toEqual({ state: "degraded", reason: "webhook_list_unavailable" });
    expect(appLoggerError).toHaveBeenCalled();
  });

  it("returns explicit unavailable capability when auth context is missing", async () => {
    requireAuth.mockResolvedValue({ userId: "" });

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.capability).toEqual({ state: "unavailable", reason: "auth_required" });
    expect(body.error).toBe("Unauthorized");
  });
});
