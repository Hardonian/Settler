import express from "express";
import request from "supertest";
import { idempotencyMiddleware } from "../../middleware/idempotency";
import { checkRateLimit } from "../../utils/rate-limiter";
import { MAX_PAGE_LIMIT, parseCursorPaginationParams, encodeCursor } from "../../utils/pagination";
import webhookReceiveRouter from "../../routes/v1/webhooks/receive";
import { WebhookIngestionService } from "../../application/webhooks/WebhookIngestionService";

jest.mock("../../db", () => ({
  query: jest.fn(),
}));

jest.mock("../../utils/cache", () => ({
  getRedisClient: jest.fn(() => null),
}));

const { query } = jest.requireMock("../../db") as { query: jest.Mock };

describe("API resilience primitives", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
  });

  it("enforces tenant-scoped rate limiting and isolation", async () => {
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
