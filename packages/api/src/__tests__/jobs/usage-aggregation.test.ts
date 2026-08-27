import { syncUsageToStripe } from "../../jobs/usage-aggregation";

jest.mock("../../infrastructure/supabase/client", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock("../../middleware/governance", () => ({
  checkTenantFrozen: jest.fn(),
}));

jest.mock("../../jobs/queue/UsageSyncOutboxQueue", () => ({
  usageSyncOutboxQueue: {
    add: jest.fn(),
  },
}));

describe("syncUsageToStripe", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("enqueues jobs to usageSyncOutboxQueue for eligible tenants", async () => {
    const { supabase } = await import("../../infrastructure/supabase/client");
    const { checkTenantFrozen } = await import("../../middleware/governance");
    const { usageSyncOutboxQueue } = await import("../../jobs/queue/UsageSyncOutboxQueue");

    (supabase.from as jest.Mock).mockReturnValue({
      select: () => ({
        eq: () => ({
          not: () => ({
            data: [{ id: "acct-1", tenant_id: "tenant-1", stripe_customer_id: "cus_123" }],
            error: null,
          }),
        }),
      }),
    });

    (checkTenantFrozen as jest.Mock).mockResolvedValue({ frozen: false });

    await syncUsageToStripe(new Date("2026-03-29T00:00:00.000Z"));

    expect(usageSyncOutboxQueue.add).toHaveBeenCalledTimes(1);
    expect(usageSyncOutboxQueue.add).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant-1",
        billingAccountId: "acct-1",
      }),
      expect.any(Number)
    );
  });

  it("fails fast when SUPABASE_URL is not https", async () => {
    const { supabase } = await import("../../infrastructure/supabase/client");
    const { usageSyncOutboxQueue } = await import("../../jobs/queue/UsageSyncOutboxQueue");
    process.env.SUPABASE_URL = "http://example.supabase.co";

    (supabase.from as jest.Mock).mockReturnValue({
      select: () => ({
        eq: () => ({
          not: () => ({
            data: [{ id: "acct-1", tenant_id: null, stripe_customer_id: "cus_123" }],
            error: null,
          }),
        }),
      }),
    });

    await expect(syncUsageToStripe(new Date("2026-03-29T00:00:00.000Z"))).rejects.toThrow(
      "SUPABASE_URL must use https:// for secure service-role transit"
    );
    expect(usageSyncOutboxQueue.add).not.toHaveBeenCalled();
  });
});
