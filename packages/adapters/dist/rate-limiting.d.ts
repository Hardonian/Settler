/**
 * Rate Limiting
 *
 * Tracks and enforces rate limits per provider
 */
export interface RateLimitConfig {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
}
export interface RateLimitCheck {
    allowed: boolean;
    retryAfter?: number;
    remaining?: number;
}
/**
 * Check if request is within rate limits
 */
export declare function checkRateLimit(providerId: string, tenantId: string, supabaseUrl: string, supabaseServiceKey: string): Promise<RateLimitCheck>;
/**
 * Record API call for rate limiting
 */
export declare function recordApiCall(_providerId: string, _tenantId: string, _supabaseUrl: string, _supabaseServiceKey: string): Promise<void>;
//# sourceMappingURL=rate-limiting.d.ts.map