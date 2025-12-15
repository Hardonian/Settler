/**
 * Enhanced PayPal Adapter
 *
 * Production-ready PayPal integration with:
 * - OAuth 2.0 authentication
 * - Circuit breaker protection
 * - Error handling and retries
 * - Rate limiting
 * - Comprehensive transaction fetching
 */
import { Adapter, NormalizedData, FetchOptions, ValidationResult } from "./base";
export interface PayPalConfig {
    clientId: string;
    clientSecret: string;
    sandbox?: boolean;
}
export declare class EnhancedPayPalAdapter implements Adapter {
    name: string;
    version: string;
    private config;
    private baseUrl;
    private accessToken;
    private tokenExpiry;
    constructor(config: PayPalConfig);
    /**
     * Get OAuth access token
     */
    private getAccessToken;
    /**
     * Fetch transactions from PayPal
     */
    fetch(options: FetchOptions): Promise<NormalizedData[]>;
    /**
     * Extract page token from PayPal pagination URL
     */
    private extractPageToken;
    /**
     * Normalize PayPal transaction to common format
     */
    normalize(data: unknown): NormalizedData;
    /**
     * Validate normalized data
     */
    validate(data: NormalizedData): ValidationResult;
}
//# sourceMappingURL=enhanced-paypal.d.ts.map