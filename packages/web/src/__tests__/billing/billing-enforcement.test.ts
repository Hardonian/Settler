/** @jest-environment node */

import { NextRequest, NextResponse } from "next/server";
import { withBillingEnforcement } from "@/lib/security/billing-enforcement";

const authenticateRequestMock = jest.fn();
const createClientMock = jest.fn();
const checkUserEntitlementsMock = jest.fn();

jest.mock("@/lib/api/unified-auth", () => ({
  authenticateRequest: (...args: unknown[]) => authenticateRequestMock(...args),
}));

jest.mock("@/lib/supabase/server", () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}));

jest.mock("@/lib/observability/logger", () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock("@/lib/security/entitlement-checks", () => ({
  checkUserEntitlements: (...args: unknown[]) => checkUserEntitlementsMock(...args),
}));

describe("withBillingEnforcement", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    checkUserEntitlementsMock.mockResolvedValue({
      allowed: true,
      entitlements: {
        message: "ok",
      },
    });
  });

  it("passes API-key user context into subscription enforcement", async () => {
    authenticateRequestMock.mockResolvedValue({
      type: "api_key",
      userId: "user-api",
      tenantId: "tenant-api",
    });

    const billingAccountQuery = {
      select: jest.fn(),
      eq: jest.fn(),
      is: jest.fn(),
      single: jest.fn(),
    };

    billingAccountQuery.select.mockReturnValue(billingAccountQuery);
    billingAccountQuery.eq.mockReturnValue(billingAccountQuery);
    billingAccountQuery.is.mockReturnValue(billingAccountQuery);
    billingAccountQuery.single.mockResolvedValue({
      data: {
        id: "billing-account-1",
        status: "active",
        tenant_id: "tenant-api",
      },
      error: null,
    });

    const subscriptionQuery = {
      select: jest.fn(),
      eq: jest.fn(),
      in: jest.fn(),
      order: jest.fn(),
      limit: jest.fn(),
      single: jest.fn(),
    };

    subscriptionQuery.select.mockReturnValue(subscriptionQuery);
    subscriptionQuery.eq.mockReturnValue(subscriptionQuery);
    subscriptionQuery.in.mockReturnValue(subscriptionQuery);
    subscriptionQuery.order.mockReturnValue(subscriptionQuery);
    subscriptionQuery.limit.mockReturnValue(subscriptionQuery);
    subscriptionQuery.single.mockResolvedValue({
      data: {
        id: "sub-1",
        status: "active",
        plan_id: "scale",
      },
      error: null,
    });

    createClientMock.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: new Error("session missing"),
        }),
      },
      from: jest.fn((table: string) => {
        if (table === "billing_accounts") {
          return billingAccountQuery;
        }

        if (table === "subscriptions") {
          return subscriptionQuery;
        }

        throw new Error(`Unexpected table ${table}`);
      }),
    });

    const handler = withBillingEnforcement(
      async () => NextResponse.json({ ok: true }, { status: 200 }),
      { requireSubscription: true }
    );

    const response = await handler(new NextRequest("http://localhost/api/v1/recon/jobs"));

    expect(response.status).toBe(200);
    expect(authenticateRequestMock).toHaveBeenCalled();
    expect(billingAccountQuery.eq).toHaveBeenCalledWith("user_id", "user-api");
  });
});
