/**
 * Zero Trust Authentication
 * Implements Zero Trust principles: Never trust, always verify
 */
import { User, UserRole } from '../../domain/entities/User';
export interface TokenPayload {
    userId: string;
    tenantId: string;
    role: UserRole;
    scopes: string[];
    type: 'access' | 'refresh';
    jti: string;
    iat: number;
    exp: number;
}
export interface AuthContext {
    userId: string;
    tenantId: string;
    role: UserRole;
    scopes: string[];
    apiKeyId?: string;
    ipAddress: string;
    userAgent: string;
}
export declare class ZeroTrustAuth {
    private static readonly ACCESS_TOKEN_TTL;
    private static readonly REFRESH_TOKEN_TTL;
    private static readonly JWT_ALGORITHM;
    /**
     * Generate short-lived access token (15 minutes)
     */
    static generateAccessToken(user: User, scopes: string[]): string;
    /**
     * Generate refresh token (7 days)
     */
    static generateRefreshToken(user: User): string;
    /**
     * Verify and decode access token
     */
    static verifyAccessToken(token: string): TokenPayload;
    /**
     * Verify refresh token
     */
    static verifyRefreshToken(token: string): TokenPayload;
    /**
     * Validate API key with Zero Trust principles
     */
    static validateApiKey(apiKey: string, ipAddress: string, userAgent: string): Promise<AuthContext>;
    /**
     * Revoke token (for logout or security incidents)
     */
    static revokeToken(jti: string, reason: string): Promise<void>;
    /**
     * Check if token is revoked
     */
    static isTokenRevoked(jti: string): Promise<boolean>;
}
//# sourceMappingURL=ZeroTrustAuth.d.ts.map