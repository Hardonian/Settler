import { WooCommerceAdapter, WooCommerceConfig } from "../woocommerce";

// We need to mock the global fetch function
const originalFetch = global.fetch;

describe("WooCommerceAdapter", () => {
  let adapter: WooCommerceAdapter;
  const config: WooCommerceConfig = {
    storeUrl: "https://example.com",
    consumerKey: "test_key",
    consumerSecret: "test_secret",
  };

  beforeEach(() => {
    adapter = new WooCommerceAdapter(config);
    // Suppress console.error for expected circuit breaker error logs
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it("should exist", () => {
    expect(adapter).toBeDefined();
    expect(adapter.name).toBe("woocommerce");
  });

  describe("fetch error paths (circuit breaker)", () => {
    it("should throw error and log via circuit breaker when fetch fails", async () => {
      // Mock fetch to simulate a network error / rejection
      global.fetch = jest.fn().mockRejectedValue(new Error("Network connection failed"));

      const options = {
        dateRange: {
          start: new Date("2023-01-01T00:00:00Z"),
          end: new Date("2023-01-31T23:59:59Z"),
        },
      };

      await expect(adapter.fetch(options)).rejects.toThrow("Network connection failed");
      expect(console.error).toHaveBeenCalledWith(
        "[CircuitBreaker] woocommerce-api failed:",
        expect.any(Error)
      );
    });

    it("should throw error if API returns non-ok response", async () => {
      // Mock fetch to simulate a successful network request but failed API status
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      });

      const options = {
        dateRange: {
          start: new Date("2023-01-01T00:00:00Z"),
          end: new Date("2023-01-31T23:59:59Z"),
        },
      };

      await expect(adapter.fetch(options)).rejects.toThrow(
        "WooCommerce API error: 401 Unauthorized"
      );
      // It should NOT call the circuit breaker console.error because the catch block
      // inside withCircuitBreaker only catches exceptions thrown during the execution of fn().
      // The non-ok response throwing happens *after* withCircuitBreaker resolves successfully
      // with a Response object.
      expect(console.error).not.toHaveBeenCalled();
    });
  });
});
