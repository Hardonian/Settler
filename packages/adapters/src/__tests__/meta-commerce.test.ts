import { MetaCommerceAdapter } from "../meta-commerce";

describe("MetaCommerceAdapter", () => {
  let adapter: MetaCommerceAdapter;
  let originalFetch: typeof global.fetch;
  let originalConsoleError: typeof console.error;

  beforeEach(() => {
    adapter = new MetaCommerceAdapter();
    originalFetch = global.fetch;
    originalConsoleError = console.error;

    // Mock console.error to avoid spamming the console during tests
    console.error = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    console.error = originalConsoleError;
  });

  describe("error handling", () => {
    it("should handle and log errors when fetching commerce orders fails", async () => {
      // Mock fetch to throw when fetching commerce orders, but succeed for ads spend
      global.fetch = jest.fn().mockImplementation((_url: string) => {
        if (url.includes("commerce_orders")) {
          return Promise.reject(new Error("Network error"));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        });
      }) as any;

      const results = await adapter.fetch({
        config: { accessToken: "test_token", businessId: "test_business" },
      });

      expect(console.error).toHaveBeenCalledWith(
        "Error fetching Meta Commerce orders:",
        expect.any(Error)
      );
      // It should still return an array (potentially empty, or containing ads data)
      expect(results).toEqual([]);
    });

    it("should handle and log errors when fetching ads spend fails", async () => {
      // Mock fetch to succeed for commerce orders, but throw for ads spend
      global.fetch = jest.fn().mockImplementation((_url: string) => {
        if (url.includes("commerce_orders")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: [] }),
          });
        }
        if (url.includes("insights")) {
          return Promise.reject(new Error("Network error"));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        });
      }) as any;

      const results = await adapter.fetch({
        config: { accessToken: "test_token", businessId: "test_business" },
      });

      expect(console.error).toHaveBeenCalledWith(
        "Error fetching Meta Ads spend:",
        expect.any(Error)
      );
      // It should still return an array (potentially empty, or containing commerce data)
      expect(results).toEqual([]);
    });

    it("should handle fetch responses that are not ok", async () => {
      global.fetch = jest.fn().mockImplementation((_url: string) => {
        return Promise.resolve({
          ok: false,
          status: 400,
          statusText: "Bad Request",
        });
      }) as any;

      const results = await adapter.fetch({
        config: { accessToken: "test_token", businessId: "test_business" },
      });

      // In the current implementation, it doesn't log on !ok, just silently ignores it and returns empty
      expect(results).toEqual([]);
    });
  });

  describe("happy path", () => {
    it("should fetch both commerce orders and ads spend successfully", async () => {
      global.fetch = jest.fn().mockImplementation((_url: string) => {
        if (url.includes("commerce_orders")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                data: [
                  {
                    id: "order_1",
                    created_time: "2023-01-01T00:00:00Z",
                    order_status: "COMPLETED",
                    order_details: {
                      total_amount: { value: 100, currency: "USD" },
                    },
                  },
                ],
              }),
          });
        }
        if (url.includes("insights")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                data: [
                  {
                    campaign_id: "camp_1",
                    date_start: "2023-01-01",
                    spend: "50.50",
                  },
                ],
              }),
          });
        }
        return Promise.resolve({
          ok: false,
        });
      }) as any;

      const results = await adapter.fetch({
        config: { accessToken: "test_token", businessId: "test_business" },
      });

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe("meta_commerce_order_1");
      expect(results[1].id).toBe("meta_ads_camp_1_2023-01-01");
    });
  });
});
