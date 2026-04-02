/** @jest-environment node */

import { getSubscriptionStatus } from "@/lib/get-subscription-status";

const authGetUserMock = jest.fn();
const fromMock = jest.fn();

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(async () => ({
    auth: {
      getUser: (...args: unknown[]) => authGetUserMock(...args),
    },
    from: (...args: unknown[]) => fromMock(...args),
  })),
}));

function membershipsQuery() {
  return {
    select: () => ({
      eq: jest.fn(() =>
        Promise.resolve({
          data: [{ tenant_id: "tenant-a" }],
        })
      ),
    }),
  };
}

function billingAccountsQuery() {
  return {
    select: () => {
      const chain = {
        eq: jest.fn((column: string) => {
          if (column === "user_id") {
            return chain;
          }
          if (column === "status") {
            return chain;
          }
          throw new Error(`Unexpected eq column ${column}`);
        }),
        is: jest.fn(() => chain),
        order: jest.fn(() => chain),
        limit: jest.fn(() =>
          Promise.resolve({
            data: [{ id: "ba-1", status: "active", tenant_id: "tenant-a" }],
          })
        ),
        in: jest.fn(() => chain),
      };
      return chain;
    },
  };
}

function subscriptionsQuery() {
  return {
    select: () => {
      let firstInColumn: string | null = null;
      const chain = {
        in: jest.fn((column: string) => {
          if (!firstInColumn) {
            firstInColumn = column;
          }
          return chain;
        }),
        order: jest.fn(() => chain),
        limit: jest.fn(() => ({
          maybeSingle: jest.fn(async () => {
            if (firstInColumn !== "billing_account_id") {
              throw new Error(`Unscoped subscriptions query: ${firstInColumn}`);
            }

            return {
              data: {
                id: "sub-1",
                status: "active",
                plan_name: "Settler Enterprise",
                billing_account_id: "ba-1",
              },
            };
          }),
        })),
      };
      return chain;
    },
  };
}

describe("getSubscriptionStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authGetUserMock.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    fromMock.mockImplementation((table: string) => {
      if (table === "tenant_users") return membershipsQuery();
      if (table === "billing_accounts") return billingAccountsQuery();
      if (table === "subscriptions") return subscriptionsQuery();
      throw new Error(`Unexpected table ${table}`);
    });
  });

  it("keeps subscription lookup scoped to billing accounts visible to the caller", async () => {
    const status = await getSubscriptionStatus();

    expect(status).toMatchObject({
      tier: "enterprise",
      hasSubscription: true,
      isEnterprise: true,
      subscriptionId: "sub-1",
    });
  });
});
