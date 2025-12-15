/**
 * Enhanced QuickBooks Adapter
 *
 * Production-ready QuickBooks integration with:
 * - OAuth 2.0 authentication
 * - Circuit breaker protection
 * - Error handling and retries
 * - Rate limiting
 * - Comprehensive transaction fetching
 */
import { Adapter, NormalizedData, FetchOptions, ValidationResult } from "./base";
export interface QuickBooksConfig {
    clientId: string;
    clientSecret: string;
    accessToken?: string;
    refreshToken?: string;
    realmId: string;
    sandbox?: boolean;
}
export declare class EnhancedQuickBooksAdapter implements Adapter {
    name: string;
    version: string;
    private config;
    private baseUrl;
    constructor(config: QuickBooksConfig);
    /**
     * Get OAuth access token (refresh if needed)
     */
    private getAccessToken;
    /**
     * Check if token is expired (simplified - in production, decode JWT)
     */
    private isTokenExpired;
    /**
     * Fetch transactions from QuickBooks
     */
    fetch(options: FetchOptions): Promise<NormalizedData[]>;
    /**
     * Normalize QuickBooks transaction to common format
     */
    normalize(data: unknown): NormalizedData;
    /**
     * Validate normalized data
     */
    validate(data: NormalizedData): ValidationResult;
}
//# sourceMappingURL=enhanced-quickbooks.d.ts.map