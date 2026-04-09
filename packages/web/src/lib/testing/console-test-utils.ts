/**
 * Console API Testing Utilities
 *
 * Test helpers for console API routes:
 * - Mock auth context
 * - Test data factories
 * - Request builders
 * - Assertion helpers
 */

import { NextRequest } from "next/server";
import { UnifiedAuthContext } from "@/lib/api/unified-auth";

/**
 * Create mock auth context for testing
 */
export function createMockAuthContext(
  overrides: Partial<UnifiedAuthContext> = {}
): UnifiedAuthContext {
  return {
    type: "session",
    userId: "test-user-id",
    billingAccountId: "test-billing-account-id",
    tenantId: "test-tenant-id",
    ...overrides,
  };
}

/**
 * Create mock API key auth context
 */
export function createMockApiKeyContext(
  overrides: Partial<UnifiedAuthContext> = {}
): UnifiedAuthContext {
  return {
    type: "api_key",
    userId: "test-user-id",
    billingAccountId: "test-billing-account-id",
    tenantId: "test-tenant-id",
    apiKeyId: "test-api-key-id",
    scopes: ["*"],
    ...overrides,
  };
}

/**
 * Create mock NextRequest for testing
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
  } = {}
): NextRequest {
  const { method = "GET", headers = {}, body } = options;

  const request = new NextRequest(url, {
    method,
    headers: new Headers(headers),
  });

  if (body) {
    // Note: NextRequest doesn't support body in constructor, would need to mock
    // For actual tests, use a testing framework like Jest with proper mocks
  }

  return request;
}

/**
 * Assert API response structure
 */
export function assertApiResponse<T>(
  response: Response,
  expectedStatus: number,
  expectedData?: T
): void {
  if (response.status !== expectedStatus) {
    throw new Error(`Expected status ${expectedStatus}, got ${response.status}`);
  }

  if (expectedData !== undefined) {
    // Would need to parse JSON in actual test
    // This is a helper structure
  }
}

/**
 * Test data factories
 */
export const TestData = {
  apiKey: () => ({
    id: "test-api-key-id",
    name: "Test API Key",
    keyPrefix: "rk_test",
    createdAt: new Date(),
    scopes: ["*"],
  }),

  receipt: () => ({
    id: "test-receipt-id",
    uploadId: "test-upload-id",
    vendor: "Test Vendor",
    date: new Date(),
    currency: "USD",
    total: 100.0,
    confidenceScore: 0.95,
    itemCount: 5,
    createdAt: new Date(),
  }),

  featureFlag: () => ({
    id: "test-flag-id",
    key: "test-flag",
    name: "Test Flag",
    description: "Test description",
    type: "boolean",
    isGlobal: false,
    defaultValue: false,
    environments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }),

  billingAccount: () => ({
    id: "test-billing-account-id",
    userId: "test-user-id",
    email: "test@example.com",
    status: "active",
    tenantId: "test-tenant-id",
  }),
};
