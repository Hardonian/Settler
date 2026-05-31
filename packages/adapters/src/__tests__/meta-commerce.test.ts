import { MetaCommerceAdapter } from "../meta-commerce";
import { FetchOptions } from "../base";

describe("MetaCommerceAdapter", () => {
  let adapter: MetaCommerceAdapter;
  let originalFetch: typeof global.fetch;
  let originalConsoleError: typeof console.error;

  beforeEach(() => {
    adapter = new MetaCommerceAdapter();
    originalFetch = global.fetch;
    originalConsoleError = console.error;

    global.fetch = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    console.error = originalConsoleError;
  });

  it("should handle errors when fetching Meta Ads spend", async () => {
    const options: FetchOptions = {
      config: {
        accessToken: "test-token",
        businessId: "test-biz-id",
      },
    };

    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("commerce_orders")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        });
      }
      if (url.includes("insights")) {
        return Promise.reject(new Error("Network failure"));
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: [] }) });
    });

    const results = await adapter.fetch(options);

    expect(results).toEqual([]);
    expect(console.error).toHaveBeenCalledWith("Error fetching Meta Ads spend:", expect.any(Error));
  });

  it("should handle errors when fetching Meta Commerce orders", async () => {
    const options: FetchOptions = {
      config: {
        accessToken: "test-token",
        businessId: "test-biz-id",
      },
    };

    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("commerce_orders")) {
        return Promise.reject(new Error("Network failure commerce"));
      }
      if (url.includes("insights")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: [] }) });
    });

    const results = await adapter.fetch(options);

    expect(results).toEqual([]);
    expect(console.error).toHaveBeenCalledWith(
      "Error fetching Meta Commerce orders:",
      expect.any(Error)
    );
  });
});
