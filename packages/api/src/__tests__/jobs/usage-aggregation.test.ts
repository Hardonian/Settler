import { syncUsageToStripe } from "../../jobs/usage-aggregation";

jest.mock("../../infrastructure/supabase/client", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock("../../middleware/governance", () => ({
  checkTenantFrozen: jest.fn(),
}));

const mockedFetch = jest.fn();
global.fetch = mockedFetch as unknown as typeof fetch;

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

  it("retries 429 responses and succeeds when a later attempt is accepted", async () => {
    const { supabase } = await import("../../infrastructure/supabase/client");
    const { checkTenantFrozen } = await import("../../middleware/governance");

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

    mockedFetch
      .mockResolvedValueOnce(
        new Response("rate limited", {
          status: 429,
          headers: {
            "retry-after": "0",
          },
        })
      )
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));

    await syncUsageToStripe(new Date("2026-03-29T00:00:00.000Z"));

    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });

  it("fails fast when SUPABASE_URL is not https", async () => {
    const { supabase } = await import("../../infrastructure/supabase/client");
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
    expect(mockedFetch).not.toHaveBeenCalled();
  });
});
