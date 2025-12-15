/**
 * WooCommerce Adapter
 *
 * Production-ready WooCommerce integration with:
 * - REST API authentication
 * - Circuit breaker protection
 * - Error handling and retries
 * - Comprehensive order fetching
 */
import { Adapter, NormalizedData, FetchOptions, ValidationResult } from "./base";
export interface WooCommerceConfig {
    storeUrl: string;
    consumerKey: string;
    consumerSecret: string;
    version?: string;
}
export declare class WooCommerceAdapter implements Adapter {
    name: string;
    version: string;
    private config;
    private apiVersion;
    constructor(config: WooCommerceConfig);
    /**
     * Fetch orders from WooCommerce
     */
    fetch(options: FetchOptions): Promise<NormalizedData[]>;
    /**
     * Normalize WooCommerce order to common format
     */
    normalize(data: unknown): NormalizedData;
    /**
     * Validate normalized data
     */
    validate(data: NormalizedData): ValidationResult;
}
//# sourceMappingURL=woocommerce.d.ts.map