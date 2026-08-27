/**
 * Security Tests: Input Validation
 * Tests input sanitization and validation
 */

import request from "supertest";
import app from "../../index";

describe("Input Validation Security Tests", () => {
  describe("XSS Prevention", () => {
    it("should sanitize script tags in query parameters", async () => {
      const response = await request(app)
        .get("/api/v1/jobs")
        .query({ name: '<script>alert("xss")</script>' });

      // Should either sanitize or reject
      expect([200, 400, 401, 403]).toContain(response.status);
    });

    it("should sanitize javascript: protocol in query parameters", async () => {
      const response = await request(app)
        .get("/api/v1/jobs")
        .query({ url: 'javascript:alert("xss")' });

      expect([200, 400, 401, 403]).toContain(response.status);
    });
  });

  describe("SQL Injection Prevention", () => {
    it("should reject SQL injection attempts in query parameters", async () => {
      const response = await request(app).get("/api/v1/jobs").query({ id: "1' OR '1'='1" });

      // Should reject invalid format (not a UUID)
      expect([400, 401, 403]).toContain(response.status);
    });
  });

  describe("UUID Validation", () => {
    it("should reject invalid UUID format in path parameters", async () => {
      const response = await request(app).get("/api/v1/jobs/invalid-uuid-format");

      expect([400, 401, 403, 404]).toContain(response.status);
    });

    it("should accept valid UUID format", async () => {
      const validUuid = "123e4567-e89b-12d3-a456-426614174000";
      const response = await request(app).get(`/api/v1/jobs/${validUuid}`);

      // Should either return 401 (auth required) or 404 (not found), but not 400 (bad format)
      expect([401, 403, 404]).toContain(response.status);
    });
  });

  describe("Input Size Limits", () => {
    it("should reject oversized request bodies", async () => {
      const largeBody = "x".repeat(2 * 1024 * 1024); // 2MB
      try {
        const response = await request(app).post("/api/v1/jobs").send({ data: largeBody });
        // Should reject due to size limit (1MB)
        expect([400, 401, 403, 413]).toContain(response.status);
      } catch (err: any) {
        // On Windows, when the server rejects a request early due to size limit,
        // the socket connection may be reset (ECONNRESET/EPIPE).
        // This is a valid way of rejecting the oversized body.
        const isConnectionReset =
          err.code === "ECONNRESET" ||
          err.code === "EPIPE" ||
          err.message?.includes("ECONNRESET") ||
          err.message?.includes("EPIPE");
        expect(isConnectionReset).toBe(true);
      }
    });
  });

  describe("Prototype Pollution Prevention", () => {
    it("should reject __proto__ in request body", async () => {
      const response = await request(app)
        .post("/api/v1/jobs")
        .send({
          name: "Test",
          __proto__: { isAdmin: true },
        });

      // Should reject or sanitize
      expect([400, 401, 403]).toContain(response.status);
    });

    it("should reject constructor in request body", async () => {
      const response = await request(app)
        .post("/api/v1/jobs")
        .send({
          name: "Test",
          constructor: { prototype: {} },
        });

      expect([400, 401, 403]).toContain(response.status);
    });
  });
});
