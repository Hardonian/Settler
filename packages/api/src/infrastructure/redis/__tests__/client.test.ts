describe("Redis client initialization", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    // Clear Upstash vars so it attempts to use ioredis fallback
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.REDIS_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.REDIS_TOKEN;
    // Set REDIS_HOST so it passes the early return
    process.env.REDIS_HOST = "localhost";
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it("should log a warning when ioredis client throws an error on initialization", async () => {
    // Mock ioredis constructor to throw using doMock to avoid hoisting issues
    jest.doMock("ioredis", () => {
      return jest.fn().mockImplementation(() => {
        throw new Error("Mock initialization error");
      });
    });

    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    // Import the client. The initializeIoredis function is called at module load.
    await import("../client");

    // Wait a tick to allow the async initializeIoredis function to run
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Failed to initialize Redis client:",
      new Error("Mock initialization error")
    );
  });
});
