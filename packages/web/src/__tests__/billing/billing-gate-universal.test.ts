/** @jest-environment node */

import { NextRequest, NextResponse } from "next/server";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";

const authenticateRequestMock = jest.fn();
const requireActiveSubscriptionMock = jest.fn();

jest.mock("@/lib/api/unified-auth", () => ({
  authenticateRequest: (...args: unknown[]) => authenticateRequestMock(...args),
}));

jest.mock("@/lib/security/billing-enforcement", () => ({
  requireActiveSubscription: (...args: unknown[]) => requireActiveSubscriptionMock(...args),
}));

describe("withUniversalBillingGate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("passes API-key user context into subscription enforcement", async () => {
    authenticateRequestMock.mockResolvedValue({
      type: "api_key",
      userId: "user-api",
      tenantId: "tenant-api",
    });
    requireActiveSubscriptionMock.mockResolvedValue({ allowed: true });

    const handler = withUniversalBillingGate(async () =>
      NextResponse.json({ ok: true }, { status: 200 })
    );

    const response = await handler(new NextRequest("http://localhost/api/exports"));

    expect(response.status).toBe(200);
    expect(requireActiveSubscriptionMock).toHaveBeenCalledWith(expect.any(NextRequest), "user-api");
  });
});
