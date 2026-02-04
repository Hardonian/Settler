/**
 * Integration Tests: Idempotency
 * Validates idempotency cache behavior for authenticated POST requests.
 */

import request from "supertest";
import crypto from "crypto";
import app from "../../index";
import { query } from "../../db";
import { generateApiKey, hashApiKey } from "../../utils/hash";

const shouldRunDbTests = process.env.RUN_DB_TESTS === "true";
const describeIdempotency = shouldRunDbTests ? describe : describe.skip;

describeIdempotency("Idempotency Integration", () => {
  const idempotencyKey = "idem-test-key";
  const testEmail = "idempotency-test@example.com";
  let testUserId: string;
  let apiKeyId: string;
  let apiKey: string;

  beforeAll(async () => {
    const users = await query<{ id: string }>(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [testEmail, "$2b$10$test", "developer"]
    );
    testUserId = users[0]?.id || "";

    const { key, prefix } = generateApiKey();
    apiKey = key;
    const keyHash = await hashApiKey(apiKey);
    apiKeyId = crypto.randomUUID();

    await query(
      `INSERT INTO api_keys (id, user_id, key_prefix, key_hash, name, scopes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [apiKeyId, testUserId, prefix, keyHash, "idempotency-test", []]
    );
  });

  afterAll(async () => {
    if (apiKeyId) {
      await query("DELETE FROM api_keys WHERE id = $1", [apiKeyId]);
    }
    if (testUserId) {
      await query("DELETE FROM idempotency_keys WHERE user_id = $1", [testUserId]);
      await query("DELETE FROM users WHERE id = $1", [testUserId]);
    }
  });

  it("should return cached response for repeated idempotency key", async () => {
    const firstResponse = await request(app)
      .post("/api/v1/batch/jobs")
      .set("X-API-Key", apiKey)
      .set("Idempotency-Key", idempotencyKey)
      .send({ jobs: [{ type: "reconcile" }] });

    expect(firstResponse.status).toBe(200);
    expect(firstResponse.body.batchId).toBeDefined();

    const cachedEntries = await query<{ total: string }>(
      `SELECT COUNT(*)::text as total
       FROM idempotency_keys
       WHERE user_id = $1 AND key = $2`,
      [testUserId, idempotencyKey]
    );

    expect(Number(cachedEntries[0]?.total || "0")).toBe(1);

    const secondResponse = await request(app)
      .post("/api/v1/batch/jobs")
      .set("X-API-Key", apiKey)
      .set("Idempotency-Key", idempotencyKey)
      .send({ jobs: [{ type: "reconcile" }] });

    expect(secondResponse.status).toBe(200);
    expect(secondResponse.body.batchId).toBe(firstResponse.body.batchId);
  });
});
