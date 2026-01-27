"use strict";
/**
 * Token Rotation Service
 * Implements refresh token rotation to prevent token reuse attacks
 *
 * When a refresh token is used, it's invalidated and a new one is issued.
 * This prevents attackers from using stolen refresh tokens multiple times.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rotateRefreshToken = rotateRefreshToken;
exports.storeRefreshToken = storeRefreshToken;
exports.revokeRefreshToken = revokeRefreshToken;
exports.revokeAllUserTokens = revokeAllUserTokens;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../../db");
const config_1 = require("../../config");
const logger_1 = require("../../utils/logger");
const uuid_1 = require("uuid");
/**
 * Rotate refresh token: invalidate old token and issue new one
 *
 * @param oldRefreshToken - The refresh token to rotate
 * @returns New token pair (access + refresh) or null if invalid
 */
async function rotateRefreshToken(oldRefreshToken) {
    try {
        // Verify and decode the old refresh token
        const decoded = jsonwebtoken_1.default.verify(oldRefreshToken, config_1.config.jwt.refreshSecret || config_1.config.jwt.secret, {
            issuer: 'settler-api',
            audience: 'settler-client',
        });
        if (decoded.type !== 'refresh') {
            (0, logger_1.logWarn)('Invalid token type for rotation', { type: decoded.type });
            return null;
        }
        // Check if token exists and is valid in database
        const tokens = await (0, db_1.query)(`SELECT id, user_id, revoked_at, expires_at
       FROM refresh_tokens
       WHERE id = $1 AND user_id = $2`, [decoded.tokenId, decoded.userId]);
        if (tokens.length === 0) {
            (0, logger_1.logWarn)('Refresh token not found in database', { tokenId: decoded.tokenId });
            return null;
        }
        if (!tokens[0]) {
            return null;
        }
        const tokenRecord = tokens[0];
        // Check if token is revoked
        if (tokenRecord.revoked_at) {
            (0, logger_1.logWarn)('Attempted use of revoked refresh token', { tokenId: decoded.tokenId });
            return null;
        }
        // Check if token is expired
        if (new Date(tokenRecord.expires_at) < new Date()) {
            (0, logger_1.logWarn)('Attempted use of expired refresh token', { tokenId: decoded.tokenId });
            return null;
        }
        // Revoke the old token
        await (0, db_1.query)(`UPDATE refresh_tokens
       SET revoked_at = NOW()
       WHERE id = $1`, [decoded.tokenId]);
        // Generate new token pair
        const newRefreshTokenId = (0, uuid_1.v4)();
        if (!config_1.config.jwt.secret) {
            throw new Error('JWT secret not configured');
        }
        const jwtSecret = config_1.config.jwt.secret;
        const accessTokenExpiry = typeof config_1.config.jwt.accessTokenExpiry === 'string'
            ? config_1.config.jwt.accessTokenExpiry
            : (typeof config_1.config.jwt.accessTokenExpiry === 'number' ? config_1.config.jwt.accessTokenExpiry : '15m');
        const newAccessToken = jsonwebtoken_1.default.sign({ userId: decoded.userId, type: 'access' }, jwtSecret, {
            expiresIn: accessTokenExpiry,
            issuer: 'settler-api',
            audience: 'settler-client',
        });
        const refreshSecret = (config_1.config.jwt.refreshSecret || jwtSecret);
        const refreshTokenExpiry = typeof config_1.config.jwt.refreshTokenExpiry === 'string'
            ? config_1.config.jwt.refreshTokenExpiry
            : (typeof config_1.config.jwt.refreshTokenExpiry === 'number' ? config_1.config.jwt.refreshTokenExpiry : '7d');
        const newRefreshToken = jsonwebtoken_1.default.sign({ userId: decoded.userId, tokenId: newRefreshTokenId, type: 'refresh' }, refreshSecret, {
            expiresIn: refreshTokenExpiry,
            issuer: 'settler-api',
            audience: 'settler-client',
        });
        // Store new refresh token in database
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
        await (0, db_1.query)(`INSERT INTO refresh_tokens (id, user_id, expires_at)
       VALUES ($1, $2, $3)`, [newRefreshTokenId, decoded.userId, expiresAt]);
        // Log audit event
        await (0, db_1.query)(`INSERT INTO audit_logs (event, user_id, metadata)
       VALUES ($1, $2, $3)`, [
            'token_rotated',
            decoded.userId,
            JSON.stringify({ oldTokenId: decoded.tokenId, newTokenId: newRefreshTokenId }),
        ]);
        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            refreshTokenId: newRefreshTokenId,
        };
    }
    catch (error) {
        (0, logger_1.logError)('Token rotation failed', error);
        return null;
    }
}
/**
 * Store refresh token in database
 *
 * @param userId - User ID
 * @param refreshTokenId - Token ID (UUID)
 * @param expiresInDays - Expiration in days (default: 7)
 */
async function storeRefreshToken(userId, refreshTokenId, expiresInDays = 7) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    await (0, db_1.query)(`INSERT INTO refresh_tokens (id, user_id, expires_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (id) DO NOTHING`, [refreshTokenId, userId, expiresAt]);
}
/**
 * Revoke refresh token
 *
 * @param refreshTokenId - Token ID to revoke
 * @param userId - User ID (for security)
 */
async function revokeRefreshToken(refreshTokenId, userId) {
    const result = await (0, db_1.query)(`UPDATE refresh_tokens
     SET revoked_at = NOW()
     WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL
     RETURNING id`, [refreshTokenId, userId]);
    return result.length > 0;
}
/**
 * Revoke all refresh tokens for a user
 *
 * @param userId - User ID
 */
async function revokeAllUserTokens(userId) {
    await (0, db_1.query)(`UPDATE refresh_tokens
     SET revoked_at = NOW()
     WHERE user_id = $1 AND revoked_at IS NULL`, [userId]);
}
//# sourceMappingURL=token-rotation.js.map