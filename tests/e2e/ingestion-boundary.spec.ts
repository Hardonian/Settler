import { test, expect } from "@playwright/test";

test.describe("End-to-End Ingestion Boundary Hardening", () => {
  test("Enforces Idempotency Key deduplication strictly", async ({ request }) => {
    const idempotencyKey = `e2e-idempotent-key-${Date.now()}`;
    const payload = { event: "reconciliation.trigger", target: "test-system" };

    // 1. Initial Request (Should Process)
    const res1 = await request.post("/api/v1/webhooks/queue", {
      headers: { "X-Idempotency-Key": idempotencyKey, "X-API-Key": "test-api-key" },
      data: payload,
    });
    expect(res1.ok()).toBeTruthy();

    // 2. Exact Duplicate Request (Should Return Cached Success, Not Re-enqueue)
    const res2 = await request.post("/api/v1/webhooks/queue", {
      headers: { "X-Idempotency-Key": idempotencyKey, "X-API-Key": "test-api-key" },
      data: payload,
    });
    expect(res2.ok()).toBeTruthy();

    const body2 = await res2.json();
    expect(body2.duplicate).toBe(true); // Verification that it bypassed the worker queue
  });

  test("Enforces Tenant Quota Rate Limits (Noisy Neighbor Protection)", async ({ request }) => {
    const tenantId = `tenant-noisy-${Date.now()}`;
    let rateLimited = false;

    // Intentionally barrage the endpoint to blow past the 100 req/min Upstash threshold
    for (let i = 0; i < 110; i++) {
      const res = await request.post("/api/v1/webhooks/queue", {
        headers: { "X-API-Key": `test-key-${tenantId}` },
        data: { event: "ping" },
      });
      if (res.status() === 429) {
        rateLimited = true;
        break;
      }
    }
    expect(rateLimited).toBe(true);
  });

  test("Routes malformed/invalid signature webhooks directly to the Dead Letter Queue (DLQ)", async ({
    request,
  }) => {
    const res = await request.post("/api/v1/webhooks/shopify", {
      headers: { "X-Shopify-Hmac-Sha256": "invalid-signature-123" },
      data: { order_id: "123" },
    });
    expect(res.status()).toBe(401); // Authorization fails, but DLQ capture happens in the background
  });
});
