import { HealthCheckService } from "../health";
import { getRedisClient } from "../../../utils/cache";

// Mock dependencies
jest.mock("../../../db", () => ({
  query: jest.fn(),
}));

jest.mock("../../../utils/cache", () => ({
  getRedisClient: jest.fn(),
}));

jest.mock("../../../domain/services/LedgerService", () => ({
  getLedgerService: jest.fn(),
}));

jest.mock("../../../services/authz/openfga-authorization-service", () => ({
  getOpenFgaAuthorizationService: jest.fn(),
}));

jest.mock("../../../infrastructure/supabase/client", () => ({
  checkSupabaseHealth: jest.fn(),
}));

describe("HealthCheckService", () => {
  let service: HealthCheckService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new HealthCheckService();
  });

  describe("checkRedis", () => {
    it("should return healthy when redis ping succeeds", async () => {
      const mockPing = jest.fn().mockResolvedValue("PONG");
      (getRedisClient as jest.Mock).mockReturnValue({ ping: mockPing });

      const result = await service.checkRedis();

      expect(result.status).toBe("healthy");
      expect(result.latency).toBeGreaterThanOrEqual(0);
      expect(result.error).toBeUndefined();
    });

    it("should return degraded when redis is not configured", async () => {
      (getRedisClient as jest.Mock).mockReturnValue(null);

      const result = await service.checkRedis();

      expect(result.status).toBe("degraded");
      expect(result.error).toBe("Redis not configured");
    });

    it("should return unhealthy when redis ping throws an error", async () => {
      const mockPing = jest.fn().mockRejectedValue(new Error("Redis connection failed"));
      (getRedisClient as jest.Mock).mockReturnValue({ ping: mockPing });

      const result = await service.checkRedis();

      expect(result.status).toBe("unhealthy");
      expect(result.error).toBe("Redis connection failed");
    });

    it("should handle non-Error objects thrown during ping", async () => {
      const mockPing = jest.fn().mockRejectedValue("Some string error");
      (getRedisClient as jest.Mock).mockReturnValue({ ping: mockPing });

      const result = await service.checkRedis();

      expect(result.status).toBe("unhealthy");
      expect(result.error).toBe("Unknown error");
    });
  });
});
