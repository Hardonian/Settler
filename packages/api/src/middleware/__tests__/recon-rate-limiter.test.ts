import { ReconRateLimiter } from "../recon-rate-limiter";
import { TenantRequest } from "../tenant";
import { Response, NextFunction } from "express";

describe("ReconRateLimiter Token Bucket Engine", () => {
  let mockPrisma: any;
  let rateLimiter: ReconRateLimiter;

  beforeEach(() => {
    mockPrisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ tier: "starter" }]),
      reconResult: {
        count: jest.fn().mockResolvedValue(0),
      },
    };
    rateLimiter = new ReconRateLimiter(mockPrisma);
  });

  it("permits requests within token bucket burst capacity", async () => {
    const middleware = rateLimiter.middleware();
    const req = {
      tenantId: "550e8400-e29b-41d4-a716-446655440000",
      path: "/api/v1/reconcile",
    } as unknown as TenantRequest;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    const next = jest.fn() as unknown as NextFunction;

    await middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("enforces 429 when token capacity is exhausted", async () => {
    const middleware = rateLimiter.middleware();
    // Simulate free tier with very small bucket
    mockPrisma.$queryRaw.mockResolvedValueOnce([{ tier: "free" }]);

    const req = {
      tenantId: "550e8400-e29b-41d4-a716-446655440001",
      path: "/api/v1/reconcile",
    } as unknown as TenantRequest;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    const next = jest.fn() as unknown as NextFunction;

    // Drain all 100 tokens of free tier
    for (let i = 0; i < 100; i++) {
      await middleware(req, res, next);
    }
    expect(next).toHaveBeenCalledTimes(100);

    // The 101st request should be throttled
    await middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Rate limit exceeded",
      })
    );
  });

  it("enforces concurrent execution limits on /execute routes", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([{ tier: "starter" }]);
    mockPrisma.reconResult.count.mockResolvedValueOnce(5); // Starter tier limit is 5 concurrent jobs

    const middleware = rateLimiter.middleware();
    const req = {
      tenantId: "550e8400-e29b-41d4-a716-446655440002",
      path: "/api/v1/recon/execute",
    } as unknown as TenantRequest;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    const next = jest.fn() as unknown as NextFunction;

    await middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Concurrent job limit exceeded",
      })
    );
  });
});
