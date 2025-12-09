/**
 * Edge Function Security Utilities
 *
 * Provides HMAC validation, API key validation, rate limiting,
 * and fraud detection for Supabase Edge Functions
 *
 * Note: This utility is environment-aware and works in both Node.js
 * (for API package) and Deno (for Edge Functions) contexts.
 *
 * Priority: P1 (High - Edge function security)
 */
export interface EdgeFunctionSecurityConfig {
    requireHMAC?: boolean;
    requireAPIKey?: boolean;
    requireAuth?: boolean;
    rateLimit?: {
        windowMs: number;
        maxRequests: number;
    };
    allowedIPs?: string[];
}
/**
 * Validate HMAC signature for webhook requests
 */
export declare function validateHMACSignature(payload: string, signature: string, secret: string, algorithm?: "sha256" | "sha512"): Promise<boolean>;
/**
 * Validate API key from request
 */
export declare function validateAPIKey(apiKey: string, supabaseUrl: string, supabaseServiceKey: string): Promise<{
    valid: boolean;
    userId?: string;
    tenantId?: string;
    rateLimit?: number | null;
}>;
/**
 * Validate JWT token from Supabase Auth
 */
export declare function validateJWTToken(authHeader: string, supabaseUrl: string, supabaseAnonKey: string): Promise<{
    valid: boolean;
    userId?: string;
    tenantId?: string | undefined;
}>;
export declare function checkRateLimit(identifier: string, windowMs: number, maxRequests: number): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
};
/**
 * Validate IP address against allowlist
 */
export declare function validateIPAddress(ip: string, allowedIPs: string[]): boolean;
/**
 * Security middleware for Edge Functions
 */
export declare function secureEdgeFunction(request: Request, config: EdgeFunctionSecurityConfig, supabaseUrl: string, supabaseAnonKey: string, supabaseServiceKey: string): Promise<{
    authorized: boolean;
    error?: string;
    userId?: string;
    tenantId?: string;
}>;
/**
 * CORS headers for Edge Functions
 */
export declare function getCORSHeaders(origin?: string): Record<string, string>;
//# sourceMappingURL=edge-function-security.d.ts.map