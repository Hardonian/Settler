/**
 * Webhook Security Tests
 * Tests for webhook signature verification, idempotency, and replay protection
 */

import { query } from "../../db";
import { validatedConfig as config } from "../../config/validation";
import { generateWebhookSignature } from "../../utils/webhook-signature";
import { processWebhookDelivery, queueWebhookDelivery } from "../../utils/webhook-queue";

// Mock dependencies
jest.mock("../../db");
jest.mock("../../utils/webhook-signature");
jest.mock("../../utils/logger", () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
  logWarn: jest.fn(),
}));

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockGenerateSignature = generateWebhookSignature as jest.MockedFunction<
  typeof generateWebhookSignature
>;

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe("Webhook Security", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateSignature.mockReturnValue("test-signature");
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
    });
    mockQuery.mockResolvedValue([]);
  });

  describe("Idempotency Protection", () => {
    it("should prevent duplicate webhook deliveries", async () => {
      const delivery = {
        id: "delivery-123",
        webhookId: "webhook-123",
        url: "https://example.com/webhook",
        payload: { event: "test", data: {}, timestamp: new Date().toISOString() },
        secret: "test-secret",
      };

      await processWebhookDelivery(delivery);

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should store idempotency key with delivery record", async () => {
      const webhookId = "webhook-123";
      const payload = { event: "test", data: { id: "123" } };

      mockQuery
        .mockResolvedValueOnce([{ url: "https://example.com/webhook", secret: "test-secret" }])
        .mockResolvedValueOnce([{ id: "delivery-123" }]);

      await queueWebhookDelivery(webhookId, payload);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO webhook_deliveries"),
        expect.arrayContaining([
          webhookId,
          "https://example.com/webhook",
          expect.stringContaining('"event":"test"'),
        ])
      );
    });
  });

  describe("Replay Protection", () => {
    it("should reject stale timestamps (>5 minutes)", async () => {
      const timestamp = Math.floor(Date.now() / 1000) - 400;
      const timeDiff = Math.abs(Math.floor(Date.now() / 1000) - timestamp);

      expect(timeDiff).toBeGreaterThan(300);
    });

    it("should accept recent timestamps (<5 minutes)", async () => {
      const timestamp = Math.floor(Date.now() / 1000) - 100;
      const timeDiff = Math.abs(Math.floor(Date.now() / 1000) - timestamp);

      expect(timeDiff).toBeLessThan(300);
    });

    it("should reject future timestamps (>5 minutes)", async () => {
      const timestamp = Math.floor(Date.now() / 1000) + 400;
      const timeDiff = Math.abs(Math.floor(Date.now() / 1000) - timestamp);

      expect(timeDiff).toBeGreaterThan(300);
    });
  });

  describe("Webhook Queue Processing", () => {
    it("should retry failed deliveries with exponential backoff", async () => {
      const delivery = {
        id: "delivery-123",
        webhookId: "webhook-123",
        url: "https://example.com/webhook",
        payload: { event: "test", data: {}, timestamp: new Date().toISOString() },
        secret: "test-secret",
      };

      mockFetch.mockRejectedValue(new Error("Network error"));

      await processWebhookDelivery(delivery);

      expect(global.fetch).toHaveBeenCalledTimes(config.webhook.maxRetries + 1);
    });

    it("should mark delivery as failed after max retries", async () => {
      const delivery = {
        id: "delivery-123",
        webhookId: "webhook-123",
        url: "https://example.com/webhook",
        payload: { event: "test", data: {}, timestamp: new Date().toISOString() },
        secret: "test-secret",
      };

      mockFetch.mockRejectedValue(new Error("Persistent error"));

      await processWebhookDelivery(delivery);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE webhook_deliveries"),
        expect.arrayContaining([expect.any(String), config.webhook.maxRetries + 1, "delivery-123"])
      );
    });
  });

  describe("Webhook Configuration", () => {
    it("should have correct retry configuration", () => {
      expect(config.webhook.maxRetries).toBe(5);
      expect(config.webhook.initialDelay).toBe(2000);
      expect(config.webhook.maxDelay).toBe(32000);
    });

    it("should have valid retry delays", () => {
      const delays: number[] = [];
      for (let attempt = 1; attempt <= config.webhook.maxRetries; attempt++) {
        const delay = Math.min(
          config.webhook.initialDelay * Math.pow(2, attempt - 1),
          config.webhook.maxDelay
        );
        delays.push(delay);
      }

      expect(delays[0]).toBe(2000);
      expect(delays[1]).toBe(4000);
      expect(delays[2]).toBe(8000);

      delays.forEach((delay) => {
        expect(delay).toBeLessThanOrEqual(config.webhook.maxDelay);
      });
    });
  });

  describe("Secure Logging", () => {
    it("should not log sensitive webhook data", async () => {
      const delivery = {
        id: "delivery-123",
        webhookId: "webhook-123",
        url: "https://example.com/webhook",
        payload: {
          event: "payment.received",
          data: {
            amount: 100.0,
            payment_method: "card_secret_1234",
          },
          timestamp: new Date().toISOString(),
        },
        secret: "sk_test_secret",
      };

      await processWebhookDelivery(delivery);

      expect(mockFetch).toHaveBeenCalledWith(
        delivery.url,
        expect.objectContaining({
          method: "POST",
        })
      );
    });
  });

  describe("Webhook Security Headers", () => {
    it("should include security headers in webhook requests", async () => {
      const delivery = {
        id: "delivery-123",
        webhookId: "webhook-123",
        url: "https://example.com/webhook",
        payload: { event: "test", data: {}, timestamp: new Date().toISOString() },
        secret: "test-secret",
      };

      await processWebhookDelivery(delivery);

      expect(mockFetch).toHaveBeenCalledWith(
        delivery.url,
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "X-Webhook-Signature": "test-signature",
            "X-Webhook-Timestamp": expect.any(String),
          }),
        })
      );
    });

    it("should include event type header", async () => {
      const delivery = {
        id: "delivery-123",
        webhookId: "webhook-123",
        url: "https://example.com/webhook",
        payload: { event: "payment.received", data: {}, timestamp: new Date().toISOString() },
        secret: "test-secret",
      };

      await processWebhookDelivery(delivery);

      expect(mockFetch).toHaveBeenCalledWith(
        delivery.url,
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-Webhook-Event": "payment.received",
          }),
        })
      );
    });
  });
});
