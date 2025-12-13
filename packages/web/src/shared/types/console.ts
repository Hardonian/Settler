/**
 * Shared Console Types
 * 
 * Types shared across SDK, CLI, and Console UI
 */

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
