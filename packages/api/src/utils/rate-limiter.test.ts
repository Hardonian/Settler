import RedisMock from "ioredis-mock";
import { RedisRateLimiter } from "./rate-limiter";

describe("RedisRateLimiter Unit Tests", () => {
  let rateLimiter: RedisRateLimiter;
  let redisMock: any;

  beforeEach(() => {
    redisMock = new RedisMock();
    rateLimiter = new RedisRateLimiter(redisMock);
  });

  it("should allow requests under the limit", async () => {
    const key = "test-user-1";
    const result = await rateLimiter.checkLimit(key, 5, 60);

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
    expect(result.limit).toBe(5);
  });

  it("should block requests exceeding the limit", async () => {
    const key = "test-user-2";
    const limit = 2;

    // Exhaust the limit
    await rateLimiter.checkLimit(key, limit, 60);
    await rateLimiter.checkLimit(key, limit, 60);

    // Third request should fail
    const blockedResult = await rateLimiter.checkLimit(key, limit, 60);

    expect(blockedResult.success).toBe(false);
    expect(blockedResult.remaining).toBe(0);
  });

  it("should reset the limit in a new window", async () => {
    const key = "test-user-3";

    await rateLimiter.checkLimit(key, 1, 60);

    // Mocking time forward is complex with ioredis-mock,
    // but we can verify the key used includes a timestamp segment
    const keys = await redisMock.keys("*");
    expect(keys[0]).toMatch(/ratelimit:test-user-3:\d+/);
  });

  it("should reset the limit when the time window passes (using fake timers)", async () => {
    jest.useFakeTimers();
    // Set a fixed start time (aligned to a minute boundary)
    const startTime = new Date("2025-01-01T10:00:00Z").getTime();
    jest.setSystemTime(startTime);

    const key = "test-timer-user";
    const limit = 1;
    const window = 60;

    // 1. Consume the limit in the current window
    const first = await rateLimiter.checkLimit(key, limit, window);
    expect(first.success).toBe(true);

    // 2. Advance time by 61 seconds to enter the next window
    jest.advanceTimersByTime(61000);

    // 3. Request should be allowed again as it generates a new window key
    const second = await rateLimiter.checkLimit(key, limit, window);
    expect(second.success).toBe(true);
    expect(second.remaining).toBe(0);

    jest.useRealTimers();
  });

  it("should resolve correct tiers for roles and endpoints", () => {
    // Test Role resolution
    const adminLimit = rateLimiter.getLimitForRequest("admin", "/any");
    expect(adminLimit.limit).toBe(1000);

    const anonLimit = rateLimiter.getLimitForRequest("anonymous", "/any");
    expect(anonLimit.limit).toBe(20);

    // Test Endpoint override
    const override = rateLimiter.getLimitForRequest("admin", "/api/v1/heavy-op");
    expect(override.limit).toBe(10); // Endpoint override takes precedence over role
  });

  it("should block all traffic when the global kill switch is active", async () => {
    const key = "test-user";

    // Activate kill switch
    await rateLimiter.setGlobalKillSwitch(true);

    const result = await rateLimiter.checkLimit(key, 100, 60);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("should report correctly via isKillSwitchActive for UI consumption", async () => {
    await rateLimiter.setGlobalKillSwitch(true);
    expect(await rateLimiter.isKillSwitchActive()).toBe(true);

    await rateLimiter.setGlobalKillSwitch(false);
    expect(await rateLimiter.isKillSwitchActive()).toBe(false);
  });
});
