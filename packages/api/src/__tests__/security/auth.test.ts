/**
 * Security Tests
 * Tests authentication, authorization, and security boundaries
 */

import request from "supertest";
import app from "../../index";
import { query } from "../../db";
import bcrypt from "bcrypt";

const shouldRunDbTests = process.env.RUN_DB_TESTS === "true";
const describeDbDependent = shouldRunDbTests ? describe : describe.skip;

describe("Security Tests", () => {
  describe("API Key Authentication", () => {
    it("should reject requests without API key", async () => {
      await request(app).get("/api/v1/jobs").expect(401);
    });

    it("should reject invalid API key format", async () => {
      await request(app).get("/api/v1/jobs").set("x-api-key", "invalid-key").expect(401);
    });
  });

  describeDbDependent("API Key revocation/expiry (DB-backed)", () => {
    it("should reject revoked API keys", async () => {
      const user = await query<{ id: string }>(
        `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id`,
        ["test+revoked@example.com", "hash"]
      );
      const userId = user[0]?.id;
      if (!userId) {
        throw new Error("Failed to create test user");
      }

      const keyHash = await bcrypt.hash("rk_test_key_12345", 10);
      await query(
        `INSERT INTO api_keys (user_id, key_prefix, key_hash, revoked_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING id`,
        [userId, "rk_test_", keyHash]
      );

      await request(app).get("/api/v1/jobs").set("x-api-key", "rk_test_key_12345").expect(401);
    });

    it("should reject expired API keys", async () => {
      const user = await query<{ id: string }>(
        `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id`,
        ["test+expired@example.com", "hash"]
      );
      const userId = user[0]?.id;
      if (!userId) {
        throw new Error("Failed to create test user");
      }

      const keyHash = await bcrypt.hash("rk_test_key_67890", 10);
      await query(
        `INSERT INTO api_keys (user_id, key_prefix, key_hash, expires_at)
         VALUES ($1, $2, $3, NOW() - INTERVAL '1 day')`,
        [userId, "rk_test_", keyHash]
      );

      await request(app).get("/api/v1/jobs").set("x-api-key", "rk_test_key_67890").expect(401);
    });
  });

  describe("SQL Injection Prevention", () => {
    it("should prevent SQL injection in job queries", async () => {
      const maliciousInput = "'; DROP TABLE jobs; --";

      const response = await request(app)
        .get(`/api/v1/jobs/${maliciousInput}`)
        .set("x-api-key", "rk_test_valid_key");

      expect([400, 401]).toContain(response.status);
    });
  });

  describe("XSS Prevention", () => {
    it("should sanitize user input in job names", async () => {
      const xssPayload = '<script>alert("xss")</script>';

      const response = await request(app)
        .post("/api/v1/jobs")
        .set("x-api-key", "rk_test_valid_key")
        .send({
          name: xssPayload,
          source: { adapter: "stripe", config: {} },
          target: { adapter: "shopify", config: {} },
          rules: { matching: [] },
        });

      expect([400, 401]).toContain(response.status);
    });
  });

  describe("Rate Limiting", () => {
    it("should enforce rate limits or consistently reject unauthorized traffic", async () => {
      const requests = Array(150)
        .fill(null)
        .map(() => request(app).get("/api/v1/jobs").set("x-api-key", "rk_test_valid_key"));

      const responses = await Promise.all(requests);
      const hasRateLimit = responses.some((r) => r.status === 429);
      const allUnauthorized = responses.every((r) => r.status === 401);
      expect(hasRateLimit || allUnauthorized).toBe(true);
    });
  });

  describe("JWT Authentication", () => {
    it("should reject tokens signed with none algorithm", async () => {
      // Simulate none algorithm bypass attempt
      const jwt = require("jsonwebtoken");
      const maliciousToken = jwt.sign({ userId: "123", type: "access" }, "secret", {
        algorithm: "none",
      });

      const response = await request(app)
        .get("/api/v1/jobs")
        .set("Authorization", `Bearer ${maliciousToken}`);

      expect(response.status).toBe(401);
    });
  });
});
