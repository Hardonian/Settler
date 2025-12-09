/**
 * Request Signing Middleware
 *
 * Implements HMAC request signing for webhook security and API authentication
 * Supports multiple signature algorithms (HMAC-SHA256, HMAC-SHA512)
 *
 * Usage:
 * - Webhook signature verification
 * - API request signing for third-party integrations
 * - Request replay protection via timestamp validation
 */
import { Request, Response, NextFunction } from 'express';
export interface SignedRequest extends Request {
    signature?: {
        algorithm: string;
        timestamp: number;
        signature: string;
        verified: boolean;
    };
}
/**
 * Signature verification result
 */
export interface SignatureVerificationResult {
    valid: boolean;
    reason?: string;
    algorithm?: string;
    timestamp?: number;
}
/**
 * Request signing configuration
 */
export interface RequestSigningConfig {
    secret: string;
    algorithm?: 'sha256' | 'sha512';
    timestampTolerance?: number;
    headerName?: string;
    timestampHeaderName?: string;
}
/**
 * Verify request signature
 */
export declare function verifyRequestSignature(payload: string | Buffer, signature: string, timestamp: string | number, secret: string, algorithm?: 'sha256' | 'sha512'): SignatureVerificationResult;
/**
 * Generate request signature
 */
export declare function generateRequestSignature(payload: string | Buffer, secret: string, algorithm?: 'sha256' | 'sha512'): {
    signature: string;
    timestamp: number;
    header: string;
};
/**
 * Request signing middleware factory
 */
export declare function requestSigningMiddleware(config: RequestSigningConfig): (req: SignedRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
/**
 * Webhook signature verification middleware (for incoming webhooks)
 */
export declare function webhookSignatureMiddleware(secret: string): (req: SignedRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
//# sourceMappingURL=request-signing.d.ts.map