/**
 * Console Client
 *
 * Client for managing Console resources (API keys, usage, activities)
 */

import { SettlerClient } from "../client";
import { PaginatedResponse } from "../utils/pagination";

export interface ApiKey {
  id: string;
  name?: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt?: string;
  revokedAt?: string;
  expiresAt?: string;
  scopes: string[];
}

export interface CreateApiKeyRequest {
  name?: string;
  scopes?: string[];
  expiresAt?: string;
}

export interface CreateApiKeyResponse {
  id: string;
  key: string; // Only shown once
  name?: string;
  createdAt: string;
}

export interface UsageSummary {
  totalCalls: number;
  byService: Record<string, number>;
  byOperation: Record<string, number>;
  errorRate: number;
  period: {
    start: string;
    end: string;
  };
}

export interface UsageEvent {
  id: string;
  timestamp: string;
  service: string;
  operation: string;
  quantity: number;
  unit?: string;
  status?: string;
  metadata?: Record<string, unknown>;
}

export interface UsageResponse {
  summary: UsageSummary;
  events: UsageEvent[];
}

export interface Activity {
  id: string;
  activityType: string;
  action: string;
  title: string;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ReceiptListItem {
  id: string;
  vendor: string | null;
  date: string | null;
  currency: string | null;
  total: number | null;
  confidenceScore: number | null;
  itemCount: number;
  createdAt: string;
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  type: string;
  isGlobal: boolean;
  defaultValue: unknown;
  environments: Array<{
    environment: string;
    enabled: boolean;
    variant?: unknown;
  }>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Console Client for managing Console resources
 */
export class ConsoleClient {
  constructor(private readonly client: SettlerClient) {}

  /**
   * List all API keys
   */
  async listApiKeys(): Promise<PaginatedResponse<ApiKey>> {
    const data = await this.client.request<{ keys: ApiKey[] }>("GET", "/api/console/api-keys");
    return {
      data: data.keys || [],
      count: data.keys?.length || 0,
    };
  }

  /**
   * Create a new API key
   */
  async createApiKey(request: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
    return this.client.request<CreateApiKeyResponse>("POST", "/api/console/api-keys", {
      body: request,
    });
  }

  /**
   * Revoke an API key
   */
  async revokeApiKey(keyId: string): Promise<void> {
    await this.client.request("DELETE", `/api/console/api-keys/${keyId}`);
  }

  /**
   * Get usage statistics
   */
  async getUsage(days: number = 7): Promise<UsageResponse> {
    return this.client.request<UsageResponse>("GET", "/api/console/usage", {
      query: { days: days.toString() },
    });
  }

  /**
   * List receipts
   * @param limit - Maximum number of receipts to return (currently not used by API)
   */
  async listReceipts(_limit: number = 50): Promise<PaginatedResponse<ReceiptListItem>> {
    const data = await this.client.request<{ receipts: ReceiptListItem[] }>(
      "GET",
      "/api/console/receipts"
    );
    return {
      data: data.receipts || [],
      count: data.receipts?.length || 0,
    };
  }

  /**
   * Get receipt detail
   */
  async getReceipt(receiptId: string): Promise<ReceiptListItem> {
    const data = await this.client.request<{ receipt: ReceiptListItem }>(
      "GET",
      `/api/console/receipts/${receiptId}`
    );
    return data.receipt;
  }

  /**
   * List feature flags
   */
  async listFeatureFlags(): Promise<PaginatedResponse<FeatureFlag>> {
    const data = await this.client.request<{ flags: FeatureFlag[] }>(
      "GET",
      "/api/console/feature-flags"
    );
    return {
      data: data.flags || [],
      count: data.flags?.length || 0,
    };
  }

  /**
   * Get recent activities
   * @param limit - Maximum number of activities to return (currently not used by API)
   */
  async getActivities(_limit: number = 10): Promise<Activity[]> {
    const data = await this.client.request<{ activities: Activity[] }>(
      "GET",
      "/api/console/activities"
    );
    return data.activities || [];
  }

  /**
   * Check Console health
   */
  async health(): Promise<{
    status: string;
    checks: {
      env: { status: string };
      supabase: { status: string };
      auth: { status: string };
    };
  }> {
    return this.client.request("GET", "/api/health/console");
  }
}
