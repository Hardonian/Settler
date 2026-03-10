import {
  cleanupExpiredDistributedGuardRecords,
  consumeRateLimitShared,
  consumeWebhookReplayKey,
  getDistributedGuarantees,
} from "../../services/distributed-guards";

jest.mock("../../utils/cache", () => ({
  getRedisClient: jest.fn(() => null),
}));

jest.mock("../../db", () => ({
  query: jest.fn(),
}));

const { query } = jest.requireMock("../../db") as { query: jest.Mock };

describe("distributed guards", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns degraded guarantees when redis is unavailable", async () => {
    const guarantees = await getDistributedGuarantees();
    expect(guarantees.rateLimiting).toBe("degraded");
    expect(guarantees.webhookReplayDedup).toBe("degraded");
  });

  it("uses DB fallback for rate limits when redis is unavailable", async () => {
    let count = 0;
    query.mockImplementation((sql: string) => {
      if (sql.includes("INSERT INTO rate_limit_counters")) {
        count += 1;
        return Promise.resolve([{ count }]);
      }
      return Promise.resolve([]);
    });

    const first = await consumeRateLimitShared({
      tenantScope: "tenant-a",
      routeScope: "get:/v1/jobs",
      limit: 2,
      windowMs: 60_000,
    });
    const second = await consumeRateLimitShared({
      tenantScope: "tenant-a",
      routeScope: "get:/v1/jobs",
      limit: 2,
      windowMs: 60_000,
    });
    const third = await consumeRateLimitShared({
      tenantScope: "tenant-a",
      routeScope: "get:/v1/jobs",
      limit: 2,
      windowMs: 60_000,
    });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
    expect(third.guarantee).toBe("degraded");
  });

  it("uses DB replay ledger fallback when redis is unavailable", async () => {
    query.mockImplementation((sql: string) => {
      if (sql.includes("INSERT INTO webhook_replay_keys")) {
        return Promise.resolve([{ inserted: true }]);
      }
      return Promise.resolve([]);
    });

    const result = await consumeWebhookReplayKey({
      adapter: "stripe",
      tenantId: "tenant-a",
      payload: { id: "evt_1" },
      signature: "sig",
    });

    expect(result.duplicate).toBe(false);
    expect(result.guarantee).toBe("degraded");
  });

  it("cleans up expired DB records", async () => {
    query.mockResolvedValue([]);
    await cleanupExpiredDistributedGuardRecords();
    const statements = query.mock.calls.map(([sql]) => String(sql));
    expect(statements.some((sql) => sql.includes("DELETE FROM webhook_replay_keys"))).toBe(true);
    expect(statements.some((sql) => sql.includes("DELETE FROM rate_limit_counters"))).toBe(true);
  });
});
