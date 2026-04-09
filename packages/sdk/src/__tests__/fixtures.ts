import {
  ReconciliationJob,
  CreateJobRequest,
  ReconciliationReport,
  Webhook,
  CreateWebhookRequest,
  Adapter,
} from "../types";

/**
 * Test fixtures for SDK testing
 */

export const mockJob: ReconciliationJob = {
  id: "job_1234567890",
  userId: "user_123",
  name: "Shopify-Stripe Reconciliation",
  source: {
    adapter: "shopify",
    config: {
      apiKey: "shopify_api_key",
      shopDomain: "test-shop.myshopify.com",
    },
  },
  target: {
    adapter: "stripe",
    config: {
      apiKey: "sk_test_stripe_key",
    },
  },
  rules: {
    matching: [
      { field: "order_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
      { field: "date", type: "range", days: 1 },
    ],
    conflictResolution: "last-wins",
  },
  schedule: "0 2 * * *",
  status: "active",
  createdAt: "2026-01-15T10:00:00Z",
  updatedAt: "2026-01-15T10:00:00Z",
};

export const mockCreateJobRequest: CreateJobRequest = {
  name: "Shopify-Stripe Reconciliation",
  source: {
    adapter: "shopify",
    config: {
      apiKey: "shopify_api_key",
      shopDomain: "test-shop.myshopify.com",
    },
  },
  target: {
    adapter: "stripe",
    config: {
      apiKey: "sk_test_stripe_key",
    },
  },
  rules: {
    matching: [
      { field: "order_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
      { field: "date", type: "range", days: 1 },
    ],
    conflictResolution: "last-wins",
  },
  schedule: "0 2 * * *",
};

export const mockReport: ReconciliationReport = {
  jobId: "job_1234567890",
  dateRange: {
    start: "2026-01-01T00:00:00Z",
    end: "2026-01-31T23:59:59Z",
  },
  summary: {
    matched: 145,
    unmatched: 3,
    errors: 1,
    accuracy: 98.7,
    totalTransactions: 149,
  },
  matches: [
    {
      id: "match_1",
      sourceId: "order_123",
      targetId: "payment_456",
      amount: 99.99,
      currency: "USD",
      matchedAt: "2026-01-15T10:00:00Z",
      confidence: 1.0,
    },
  ],
  unmatched: [
    {
      id: "unmatch_1",
      sourceId: "order_789",
      amount: 49.99,
      currency: "USD",
      reason: "No matching payment found",
    },
  ],
  errors: [
    {
      id: "error_1",
      message: "Webhook timeout",
      occurredAt: "2026-01-15T10:00:00Z",
    },
  ],
  generatedAt: "2026-01-15T10:00:00Z",
};

export const mockWebhook: Webhook = {
  id: "wh_1234567890",
  userId: "user_123",
  url: "https://example.com/webhooks/reconcile",
  events: ["reconciliation.matched", "reconciliation.mismatch"],
  secret: "whsec_abc123",
  status: "active",
  createdAt: "2026-01-15T10:00:00Z",
};

export const mockCreateWebhookRequest: CreateWebhookRequest = {
  url: "https://example.com/webhooks/reconcile",
  events: ["reconciliation.matched", "reconciliation.mismatch"],
  secret: "optional_webhook_secret",
};

export const mockStripeAdapter: Adapter = {
  id: "stripe",
  name: "Stripe",
  description: "Reconcile Stripe payments and charges",
  version: "1.0.0",
  config: {
    required: ["apiKey"],
    optional: ["webhookSecret"],
  },
  supportedEvents: ["payment.succeeded", "charge.refunded"],
};

export const mockShopifyAdapter: Adapter = {
  id: "shopify",
  name: "Shopify",
  description: "Reconcile Shopify orders and transactions",
  version: "1.0.0",
  config: {
    required: ["apiKey", "shopDomain"],
    optional: ["webhookSecret"],
  },
  supportedEvents: ["order.created", "order.updated"],
};

export const mockWebhookPayload = {
  event: "reconciliation.matched",
  data: {
    jobId: "job_123",
    matchId: "match_456",
    sourceId: "order_123",
    targetId: "payment_456",
    amount: 99.99,
    currency: "USD",
    matchedAt: "2026-01-15T10:00:00Z",
  },
};

export const mockWebhookSignature = (payload: string, secret: string): string => {
  const crypto = require("crypto");
  const timestamp = Math.floor(Date.now() / 1000);
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload);
  const signature = hmac.digest("hex");
  return `t=${timestamp},v1=${signature}`;
};
