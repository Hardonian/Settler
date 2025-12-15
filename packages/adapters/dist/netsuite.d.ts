/**
 * NetSuite Adapter
 *
 * Production-ready NetSuite integration with:
 * - Token-based authentication (TBA)
 * - Circuit breaker protection
 * - Error handling and retries
 * - Comprehensive transaction fetching
 */
import { Adapter, NormalizedData, FetchOptions, ValidationResult } from "./base";
export interface NetSuiteConfig {
    accountId: string;
    consumerKey: string;
    consumerSecret: string;
    tokenId: string;
    tokenSecret: string;
    sandbox?: boolean;
}
export declare class NetSuiteAdapter implements Adapter {
    name: string;
    version: string;
    private config;
    private baseUrl;
    constructor(config: NetSuiteConfig);
    /**
     * Fetch transactions from NetSuite
     */
    fetch(options: FetchOptions): Promise<NormalizedData[]>;
    /**
     * Normalize NetSuite transaction to common format
     */
    normalize(data: unknown): NormalizedData;
    /**
     * Validate normalized data
     */
    validate(data: NormalizedData): ValidationResult;
}
//# sourceMappingURL=netsuite.d.ts.map