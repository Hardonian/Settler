import { HealthCheckService } from "../health";

const getDistributedGuaranteesMock = jest.fn();

jest.mock("../../../services/distributed-guards", () => ({
  getDistributedGuarantees: (...args: unknown[]) => getDistributedGuaranteesMock(...args),
}));

jest.mock("../../../db", () => ({
  query: jest.fn(() => Promise.resolve([])),
}));

jest.mock("../../../utils/cache", () => ({
  getRedisClient: jest.fn(() => null),
}));

jest.mock("../../../domain/services/LedgerService", () => ({
  getLedgerService: () => ({
    isEnabled: () => false,
  }),
}));

jest.mock("../../../services/authz/openfga-authorization-service", () => ({
  getOpenFgaAuthorizationService: () => ({
    status: async () => ({ state: "disabled", reason: "test" }),
  }),
}));

jest.mock("../../../infrastructure/supabase/client", () => ({
  checkSupabaseHealth: async () => ({ healthy: true, latency: 1 }),
}));

describe("HealthCheckService distributed guard visibility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("surfaces healthy guarantees when Redis-backed distributed_shared", async () => {
    getDistributedGuaranteesMock.mockResolvedValue({
      rateLimiting: "distributed_shared",
      webhookReplayDedup: "distributed_shared",
    });

    const svc = new HealthCheckService();
    const health = await svc.checkAll();

    expect(health.checks.rate_limit_guarantee?.status).toBe("healthy");
    expect(health.checks.webhook_replay_guarantee?.status).toBe("healthy");
    expect(health.degraded).not.toContain("rate_limit_guarantee");
  });

  it("marks guarantee checks degraded when not distributed_shared", async () => {
    getDistributedGuaranteesMock.mockResolvedValue({
      rateLimiting: "degraded",
      webhookReplayDedup: "degraded",
    });

    const svc = new HealthCheckService();
    const health = await svc.checkAll();

    expect(health.checks.rate_limit_guarantee?.status).toBe("degraded");
    expect(health.checks.webhook_replay_guarantee?.status).toBe("degraded");
    expect(health.degraded).toContain("rate_limit_guarantee");
    expect(health.degraded).toContain("webhook_replay_guarantee");
  });
});
