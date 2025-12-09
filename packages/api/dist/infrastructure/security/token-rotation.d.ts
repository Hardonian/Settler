/**
 * Token Rotation Service
 * Implements refresh token rotation to prevent token reuse attacks
 *
 * When a refresh token is used, it's invalidated and a new one is issued.
 * This prevents attackers from using stolen refresh tokens multiple times.
 */
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    refreshTokenId: string;
}
export interface RefreshTokenPayload {
    userId: string;
    tokenId: string;
    type: 'refresh';
}
/**
 * Rotate refresh token: invalidate old token and issue new one
 *
 * @param oldRefreshToken - The refresh token to rotate
 * @returns New token pair (access + refresh) or null if invalid
 */
export declare function rotateRefreshToken(oldRefreshToken: string): Promise<TokenPair | null>;
/**
 * Store refresh token in database
 *
 * @param userId - User ID
 * @param refreshTokenId - Token ID (UUID)
 * @param expiresInDays - Expiration in days (default: 7)
 */
export declare function storeRefreshToken(userId: string, refreshTokenId: string, expiresInDays?: number): Promise<void>;
/**
 * Revoke refresh token
 *
 * @param refreshTokenId - Token ID to revoke
 * @param userId - User ID (for security)
 */
export declare function revokeRefreshToken(refreshTokenId: string, userId: string): Promise<boolean>;
/**
 * Revoke all refresh tokens for a user
 *
 * @param userId - User ID
 */
export declare function revokeAllUserTokens(userId: string): Promise<void>;
//# sourceMappingURL=token-rotation.d.ts.map