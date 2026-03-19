/** @jest-environment node */

import { GET as getUsageExport } from "@/app/api/console/usage/export/route";

const createClientMock = jest.fn();
const billingAccountFindFirstMock = jest.fn();
const usageEventFindManyMock = jest.fn();

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
    billingAccount: {
      findFirst: (...args: unknown[]) => billingAccountFindFirstMock(...args),
    },
    usageEvent: {
      findMany: (...args: unknown[]) => usageEventFindManyMock(...args),
    },
  },
}));

jest.mock("@/lib/security/export-signature", () => ({
  signExportPayload: () => ({
    signature: "sig",
    keyId: "kid",
    algorithm: "sha256",
  }),
}));

function req(url: string) {
  return {
    url,
    method: "GET",
    headers: new Headers(),
    nextUrl: new URL(url),
  } as any;
}

describe("GET /api/console/usage/export", () => {
  beforeEach(() => {
    createClientMock.mockReset();
    billingAccountFindFirstMock.mockReset();
    usageEventFindManyMock.mockReset();

    createClientMock.mockResolvedValue({
      auth: {
        getUser: jest.fn(async () => ({ data: { user: { id: "user-a" } }, error: null })),
      },
    });

    billingAccountFindFirstMock.mockResolvedValue({ id: "billing-a" });
    usageEventFindManyMock.mockResolvedValue([]);
  });

  it("queries only required usage columns", async () => {
    const response = await getUsageExport(
      req("http://localhost/api/console/usage/export?format=json")
    );
    expect(response.status).toBe(200);

    const args = usageEventFindManyMock.mock.calls[0]?.[0] as { select: Record<string, boolean> };
    expect(args.select).toEqual({
      timestamp: true,
      eventType: true,
      quantity: true,
      metadata: true,
    });
  });

  it("returns 500 when export generation fails", async () => {
    usageEventFindManyMock.mockRejectedValueOnce(new Error("database unavailable"));

    const response = await getUsageExport(req("http://localhost/api/console/usage/export"));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe("Failed to export data");
  });
});
