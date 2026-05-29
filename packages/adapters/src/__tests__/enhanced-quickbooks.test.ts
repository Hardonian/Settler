import { EnhancedQuickBooksAdapter } from "../enhanced-quickbooks";

// We need to mock global.fetch
const originalFetch = global.fetch;

describe("EnhancedQuickBooksAdapter", () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore global fetch
    global.fetch = originalFetch;
  });

  it("should trigger circuit breaker error path and log correctly on fetch failure", async () => {
    // Mock fetch to throw a network error
    const mockError = new Error("Network connection failed");
    global.fetch = jest.fn().mockRejectedValue(mockError);

    // Spy on console.error
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const adapter = new EnhancedQuickBooksAdapter({
      clientId: "test-client-id",
      clientSecret: "test-client-secret",
      refreshToken: "test-refresh-token",
      realmId: "test-realm-id",
    });

    // Try to fetch, which should call getAccessToken and use fetch wrapped in withCircuitBreaker
    await expect(
      adapter.fetch({
        dateRange: { start: new Date("2023-01-01"), end: new Date("2023-01-31") },
      })
    ).rejects.toThrow("Network connection failed");

    // Verify console.error was called with the circuit breaker message
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[CircuitBreaker] quickbooks-auth failed:",
      mockError
    );

    // Restore console.error
    consoleErrorSpy.mockRestore();
  });
});
