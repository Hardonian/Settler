jest.mock("ioredis", () => require("ioredis-mock"));

import express from "express";
import request from "supertest";
import { apiGatewayCache } from "../../middleware/api-gateway-cache";
import { idempotencyMiddleware } from "../../middleware/idempotency";
import { checkRateLimit, rateLimiter } from "../../utils/rate-limiter";
import { MAX_PAGE_LIMIT, parseCursorPaginationParams, encodeCursor } from "../../utils/pagination";
import webhookReceiveRouter from "../../routes/v1/webhooks/receive";
import { WebhookIngestionService } from "../../application/webhooks/WebhookIngestionService";

const mockCacheGet = jest.fn();
const mockCacheSet = jest.fn();
const mockCacheDel = jest.fn();

jest.mock("../../db", () => ({
  query: jest.fn(),
}));

jest.mock("../../utils/cache", () => ({
  getRedisClient: jest.fn(() => null),
  get: (...args: unknown[]) => mockCacheGet(...args),
  set: (...args: unknown[]) => mockCacheSet(...args),
  del: (...args: unknown[]) => mockCacheDel(...args),
}));

const { query } = jest.requireMock("../../db") as { query: jest.Mock };

describe("API resilience primitives", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCacheGet.mockReset();
    mockCacheSet.mockReset();
    mockCacheDel.mockReset();
  });

  it("returns cached response for duplicated idempotency key", async () => {
    query.mockResolvedValueOnce([
      {
        response: {
          statusCode: 201,
          data: { jobId: "j_1", ok: true },
          requestHash: "",
        },
      },
    ]);

    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      (req as { userId?: string }).userId = "user-1";
      (req as { tenantId?: string }).tenantId = "tenant-1";
      next();
    });
    app.use(idempotencyMiddleware());
    app.post("/jobs", (_req, res) => {
      res.status(201).json({ jobId: "new" });
    });

    const response = await request(app)
      .post("/jobs")
      .set("idempotency-key", "idem-1")
      .send({ amount: 10 });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ jobId: "j_1", ok: true });
    expect(response.headers["x-idempotent-replay"]).toBe("true");
    expect(query).toHaveBeenCalledWith(expect.stringContaining("tenant_id = $2"), [
      "user-1",
      "tenant-1",
      "idem-1",
    ]);
  });

  it("fails closed when idempotent mutation lacks tenant context", async () => {
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      (req as { userId?: string }).userId = "user-1";
      next();
    });
    app.use(idempotencyMiddleware());
    app.post("/jobs", (_req, res) => {
      res.status(201).json({ jobId: "new" });
    });

    const response = await request(app)
      .post("/jobs")
      .set("idempotency-key", "idem-1")
      .send({ amount: 10 });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("TENANT_CONTEXT_REQUIRED");
    expect(query).not.toHaveBeenCalled();
  });

  it("partitions API gateway cache keys by tenant by default", async () => {
    mockCacheGet.mockResolvedValueOnce({ tenant: "tenant-a" }).mockResolvedValueOnce({
      tenant: "tenant-b",
    });

    const app = express();
    app.use((req, _res, next) => {
      (req as { userId?: string }).userId = "user-1";
      (req as { tenantId?: string }).tenantId = req.get("x-tenant-id") || undefined;
      next();
    });
    app.use(
      apiGatewayCache({
        includeUserId: true,
        includeQueryParams: true,
      })
    );
    app.get("/reports", (_req, res) => {
      res.json({ tenant: "handler" });
    });

    const tenantA = await request(app).get("/reports?status=open").set("x-tenant-id", "tenant-a");
    const tenantB = await request(app).get("/reports?status=open").set("x-tenant-id", "tenant-b");

    expect(tenantA.body).toEqual({ tenant: "tenant-a" });
    expect(tenantB.body).toEqual({ tenant: "tenant-b" });
    expect(mockCacheGet).toHaveBeenNthCalledWith(1, expect.stringContaining("tenant:tenant-a"));
    expect(mockCacheGet).toHaveBeenNthCalledWith(2, expect.stringContaining("tenant:tenant-b"));
  });

  it("enforces tenant-scoped rate limiting and isolation", async () => {
    jest.spyOn(rateLimiter, "getLimitForRequest").mockReturnValue({ limit: 2, windowSeconds: 60 });

    const baseReq = {
      method: "GET",
      path: "/v1/jobs",
      headers: {},
      ip: "10.0.0.1",
      userId: "u-1",
    };

    const counterByKey = new Map<string, number>();
    query.mockImplementation((sql: string, params: unknown[]) => {
      if (sql.includes("SELECT rate_limit FROM api_keys")) {
        return Promise.resolve([{ rate_limit: 2 }]);
      }
      if (sql.includes("INSERT INTO rate_limit_counters")) {
        const key = String(params[0]);
        const next = (counterByKey.get(key) || 0) + 1;
        counterByKey.set(key, next);
        return Promise.resolve([{ count: next }]);
      }
      return Promise.resolve([]);
    });

    const tenantA1 = await checkRateLimit({
      ...baseReq,
      tenantId: "tenant-a",
      apiKeyId: "k-a",
    } as never);
    const tenantA2 = await checkRateLimit({
      ...baseReq,
      tenantId: "tenant-a",
      apiKeyId: "k-a",
    } as never);
    const tenantA3 = await checkRateLimit({
      ...baseReq,
      tenantId: "tenant-a",
      apiKeyId: "k-a",
    } as never);

    const tenantB = await checkRateLimit({
      ...baseReq,
      ip: "10.0.0.2",
      tenantId: "tenant-b",
      apiKeyId: "k-b",
    } as never);

    expect(tenantA1.allowed).toBe(true);
    expect(tenantA2.allowed).toBe(true);
    expect(tenantA3.allowed).toBe(false);
    expect(tenantA3.scope).toBe("tenant");
    expect(tenantB.allowed).toBe(true);
  });

  it("normalizes pagination limits and rejects invalid cursors", () => {
    const parsed = parseCursorPaginationParams({ query: { limit: "9999", direction: "prev" } });
    expect(parsed.limit).toBe(MAX_PAGE_LIMIT);
    expect(parsed.direction).toBe("prev");

    expect(() => parseCursorPaginationParams({ query: { cursor: "bad-cursor" } })).toThrow(
      "INVALID_CURSOR"
    );

    const validCursor = encodeCursor(new Date("2026-01-01T00:00:00.000Z"), "id-1");
    expect(() => parseCursorPaginationParams({ query: { cursor: validCursor } })).not.toThrow();
  });

  it("deduplicates replayed webhooks", async () => {
    jest.spyOn(WebhookIngestionService.prototype, "processWebhook").mockResolvedValue({
      success: true,
      events: [{ id: "evt-1", type: "payment.succeeded" } as never],
    });

    let replayInsertCount = 0;
    query.mockImplementation((sql: string) => {
      if (sql.includes("INSERT INTO webhook_replay_keys")) {
        replayInsertCount += 1;
        return Promise.resolve(replayInsertCount === 1 ? [{ inserted: true }] : []);
      }
      if (sql.includes("DELETE FROM webhook_replay_keys")) {
        return Promise.resolve([]);
      }
      if (sql.includes("FROM webhook_configs") && sql.includes("tenant_id")) {
        return Promise.resolve([{ secret: "whsec_test", signature_algorithm: "hmac-sha256" }]);
      }
      return Promise.resolve([]);
    });

    const app = express();
    app.use(express.json());
    app.use("/receive", webhookReceiveRouter);

    const payload = {
      id: "evt_1",
      tenant_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    };

    const first = await request(app)
      .post("/receive/stripe")
      .set("x-signature", "sig_1")
      .send(payload);

    const second = await request(app)
      .post("/receive/stripe")
      .set("x-signature", "sig_1")
      .send(payload);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body.data.deduplicated).toBe(true);
    expect(WebhookIngestionService.prototype.processWebhook).toHaveBeenCalledTimes(1);
  });
});
