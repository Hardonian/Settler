/** @jest-environment node */

import { NextRequest } from "next/server";
import { requireConsoleApiAccess } from "@/lib/api/console-auth";

const getUserMock = jest.fn();
const getSubscriptionStatusMock = jest.fn();

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(async () => ({
    auth: {
      getUser: (...args: unknown[]) => getUserMock(...args),
    },
  })),
}));

jest.mock("@/lib/get-subscription-status", () => ({
  getSubscriptionStatus: (...args: unknown[]) => getSubscriptionStatusMock(...args),
}));

describe("requireConsoleApiAccess", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fails closed with degraded capability when subscription lookup errors", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    getSubscriptionStatusMock.mockRejectedValue(new Error("subscription store offline"));

    const response = await requireConsoleApiAccess(
      new NextRequest("http://localhost/api/console/api-logs")
    );
    const body = await response?.json();

    expect(response?.status).toBe(503);
    expect(body).toMatchObject({
      error: "Subscription status unavailable",
      code: "SUBSCRIPTION_CHECK_UNAVAILABLE",
      capability: {
        state: "degraded",
        reason: "subscription_status_unavailable",
      },
    });
  });

  it("allows access when the current user has a subscription", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    getSubscriptionStatusMock.mockResolvedValue({
      tier: "subscribed_paid",
      hasSubscription: true,
      isPaid: true,
      isEnterprise: false,
    });

    const response = await requireConsoleApiAccess(
      new NextRequest("http://localhost/api/console/api-logs")
    );

    expect(response).toBeNull();
  });
});
