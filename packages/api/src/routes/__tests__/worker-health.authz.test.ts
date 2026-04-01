import express from "express";
import request from "supertest";

const requirePermissionMock = jest.fn(
  (_permission?: unknown) => (_req: unknown, res: express.Response) => {
    res.status(403).json({ error: "forbidden" });
  }
);

const queryMock = jest.fn();
const poolQueryMock = jest.fn();

jest.mock("../../middleware/authorization", () => ({
  requirePermission: (permission: unknown) => requirePermissionMock(permission),
}));

jest.mock("../../db", () => ({
  query: (...args: unknown[]) => queryMock(...args),
  pool: {
    query: (...args: unknown[]) => poolQueryMock(...args),
  },
}));

jest.mock("../../utils/logger", () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
}));

const router = require("../worker-health").workerHealthRouter;

describe("worker health authz", () => {
  function createApp() {
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      (req as any).tenantId = "tenant-1";
      (req as any).userId = "user-1";
      next();
    });
    app.use("/api/v1/worker", router);
    return app;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("protects worker health read endpoints", async () => {
    const response = await request(createApp()).get("/api/v1/worker/health");

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("forbidden");
    expect(queryMock).not.toHaveBeenCalled();
    expect(poolQueryMock).not.toHaveBeenCalled();
  });

  it("protects stale-lock release as an admin-write operation", async () => {
    const response = await request(createApp()).post("/api/v1/worker/release-stale-locks");

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("forbidden");
    expect(queryMock).not.toHaveBeenCalled();
    expect(poolQueryMock).not.toHaveBeenCalled();
  });
});
