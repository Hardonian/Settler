import express from "express";
import request from "supertest";

const checkLiveMock = jest.fn();
const checkAllMock = jest.fn();
const checkReadyMock = jest.fn();
const checkDatabaseMock = jest.fn();

jest.mock("../../infrastructure/observability/health", () => ({
  HealthCheckService: jest.fn().mockImplementation(() => ({
    checkLive: (...args: unknown[]) => checkLiveMock(...args),
    checkAll: (...args: unknown[]) => checkAllMock(...args),
    checkReady: (...args: unknown[]) => checkReadyMock(...args),
    checkDatabase: (...args: unknown[]) => checkDatabaseMock(...args),
  })),
}));

const router = require("../health").healthRouter;

describe("health route degraded-state semantics", () => {
  function createApp() {
    const app = express();
    app.use("/health", router);
    return app;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    checkLiveMock.mockResolvedValue({ status: "ok" });
    checkAllMock.mockResolvedValue({
      status: "healthy",
      checks: {
        database: { status: "healthy", latency: 3, timestamp: "2026-04-01T00:00:00.000Z" },
      },
      blocking: [],
      degraded: [],
      timestamp: "2026-04-01T00:00:00.000Z",
    });
    checkReadyMock.mockResolvedValue({
      status: "ready",
      blocking: [],
      degraded: [],
      timestamp: "2026-04-01T00:00:00.000Z",
    });
    checkDatabaseMock.mockResolvedValue({
      status: "healthy",
      latency: 3,
      timestamp: "2026-04-01T00:00:00.000Z",
    });
  });

  it("returns 200 for degraded detailed health when only optional services are affected", async () => {
    checkAllMock.mockResolvedValue({
      status: "degraded",
      checks: {
        database: { status: "healthy", latency: 4, timestamp: "2026-04-01T00:00:00.000Z" },
        redis: {
          status: "unhealthy",
          error: "Redis unavailable",
          timestamp: "2026-04-01T00:00:00.000Z",
        },
      },
      blocking: [],
      degraded: ["redis"],
      timestamp: "2026-04-01T00:00:00.000Z",
    });

    const response = await request(createApp()).get("/health/detailed");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("degraded");
    expect(response.body.blocking).toEqual([]);
    expect(response.body.degraded).toEqual(["redis"]);
  });

  it("returns 503 for unhealthy detailed health when a critical dependency is blocking", async () => {
    checkAllMock.mockResolvedValue({
      status: "unhealthy",
      checks: {
        database: {
          status: "unhealthy",
          error: "connection refused",
          timestamp: "2026-04-01T00:00:00.000Z",
        },
      },
      blocking: ["database"],
      degraded: [],
      timestamp: "2026-04-01T00:00:00.000Z",
    });

    const response = await request(createApp()).get("/health/detailed");

    expect(response.status).toBe(503);
    expect(response.body.blocking).toEqual(["database"]);
    expect(response.body.degraded).toEqual([]);
  });

  it("keeps readiness green while optional services are explicitly degraded", async () => {
    checkReadyMock.mockResolvedValue({
      status: "ready",
      blocking: [],
      degraded: ["redis", "sentry"],
      timestamp: "2026-04-01T00:00:00.000Z",
    });

    const response = await request(createApp()).get("/health/ready");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ready");
    expect(response.body.degraded).toEqual(["redis", "sentry"]);
  });

  it("fails readiness closed when a blocking dependency is unavailable", async () => {
    checkReadyMock.mockResolvedValue({
      status: "not_ready",
      blocking: ["database"],
      degraded: ["redis"],
      timestamp: "2026-04-01T00:00:00.000Z",
    });

    const response = await request(createApp()).get("/health/ready");

    expect(response.status).toBe(503);
    expect(response.body.status).toBe("not_ready");
    expect(response.body.blocking).toEqual(["database"]);
    expect(response.body.degraded).toEqual(["redis"]);
  });
});
