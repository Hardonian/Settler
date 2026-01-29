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
    key: string;
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
export declare class ConsoleClient {
    private readonly client;
    constructor(client: SettlerClient);
    /**
     * List all API keys
     */
    listApiKeys(): Promise<PaginatedResponse<ApiKey>>;
    /**
     * Create a new API key
     */
    createApiKey(request: CreateApiKeyRequest): Promise<CreateApiKeyResponse>;
    /**
     * Revoke an API key
     */
    revokeApiKey(keyId: string): Promise<void>;
    /**
     * Get usage statistics
     */
    getUsage(days?: number): Promise<UsageResponse>;
    /**
     * List receipts
     * @param limit - Maximum number of receipts to return (currently not used by API)
     */
    listReceipts(_limit?: number): Promise<PaginatedResponse<ReceiptListItem>>;
    /**
     * Get receipt detail
     */
    getReceipt(receiptId: string): Promise<ReceiptListItem>;
    /**
     * List feature flags
     */
    listFeatureFlags(): Promise<PaginatedResponse<FeatureFlag>>;
    /**
     * Get recent activities
     * @param limit - Maximum number of activities to return (currently not used by API)
     */
    getActivities(_limit?: number): Promise<Activity[]>;
    /**
     * Check Console health
     */
    health(): Promise<{
        status: string;
        checks: {
            env: {
                status: string;
            };
            supabase: {
                status: string;
            };
            auth: {
                status: string;
            };
        };
    }>;
}
//# sourceMappingURL=console.d.ts.map