"use strict";
/**
 * Zero Trust Authentication
 * Implements Zero Trust principles: Never trust, always verify
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZeroTrustAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../../config");
const hash_1 = require("../../utils/hash");
const db_1 = require("../../db");
class ZeroTrustAuth {
    static ACCESS_TOKEN_TTL = 15 * 60; // 15 minutes
    static REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days
    static JWT_ALGORITHM = 'HS256';
    /**
     * Generate short-lived access token (15 minutes)
     */
    static generateAccessToken(user, scopes) {
        if (!config_1.config.jwt.secret) {
            throw new Error('JWT_SECRET not configured');
        }
        const jti = crypto.randomUUID();
        const now = Math.floor(Date.now() / 1000);
        const payload = {
            userId: user.id,
            tenantId: user.tenantId,
            role: user.role,
            scopes,
            type: 'access',
            jti,
            iat: now,
            exp: now + this.ACCESS_TOKEN_TTL,
        };
        return jsonwebtoken_1.default.sign(payload, config_1.config.jwt.secret, {
            algorithm: this.JWT_ALGORITHM,
            issuer: 'settler-api',
            audience: 'settler-client',
        });
    }
    /**
     * Generate refresh token (7 days)
     */
    static generateRefreshToken(user) {
        if (!config_1.config.jwt.refreshSecret) {
            throw new Error('JWT_REFRESH_SECRET not configured');
        }
        const jti = crypto.randomUUID();
        const now = Math.floor(Date.now() / 1000);
        const payload = {
            userId: user.id,
            tenantId: user.tenantId,
            role: user.role,
            scopes: [], // Refresh tokens don't have scopes
            type: 'refresh',
            jti,
            iat: now,
            exp: now + this.REFRESH_TOKEN_TTL,
        };
        return jsonwebtoken_1.default.sign(payload, config_1.config.jwt.refreshSecret, {
            algorithm: this.JWT_ALGORITHM,
            issuer: 'settler-api',
            audience: 'settler-client',
        });
    }
    /**
     * Verify and decode access token
     */
    static verifyAccessToken(token) {
        if (!config_1.config.jwt.secret) {
            throw new Error('JWT_SECRET not configured');
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret, {
                algorithms: [this.JWT_ALGORITHM],
                issuer: 'settler-api',
                audience: 'settler-client',
            });
            if (decoded.type !== 'access') {
                throw new Error('Invalid token type');
            }
            // Check if token is revoked (in production, check Redis/DB)
            // For now, we'll implement revocation checking separately
            return decoded;
        }
        catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Access token expired');
            }
            if (error.name === 'JsonWebTokenError') {
                throw new Error('Invalid access token');
            }
            throw error;
        }
    }
    /**
     * Verify refresh token
     */
    static verifyRefreshToken(token) {
        if (!config_1.config.jwt.refreshSecret) {
            throw new Error('JWT_REFRESH_SECRET not configured');
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.refreshSecret, {
                algorithms: [this.JWT_ALGORITHM],
                issuer: 'settler-api',
                audience: 'settler-client',
            });
            if (decoded.type !== 'refresh') {
                throw new Error('Invalid token type');
            }
            return decoded;
        }
        catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Refresh token expired');
            }
            if (error.name === 'JsonWebTokenError') {
                throw new Error('Invalid refresh token');
            }
            throw error;
        }
    }
    /**
     * Validate API key with Zero Trust principles
     */
    static async validateApiKey(apiKey, ipAddress, userAgent) {
        // Never trust - always verify
        if (!apiKey.startsWith('rk_')) {
            throw new Error('Invalid API key format');
        }
        const prefix = apiKey.substring(0, 12);
        // Lookup API key
        const keys = await (0, db_1.query)(`SELECT 
        ak.id, ak.user_id, ak.tenant_id, ak.key_hash, ak.scopes, ak.rate_limit,
        ak.ip_whitelist, ak.revoked_at, ak.expires_at, u.role
      FROM api_keys ak
      JOIN users u ON ak.user_id = u.id
      WHERE ak.key_prefix = $1 AND ak.deleted_at IS NULL`, [prefix]);
        if (keys.length === 0) {
            // Log failed attempt
            await (0, db_1.query)(`INSERT INTO audit_logs (event, ip, user_agent, metadata)
         VALUES ($1, $2, $3, $4)`, ['api_key_auth_failed', ipAddress, userAgent, JSON.stringify({ prefix })]);
            throw new Error('Invalid API key');
        }
        if (!keys[0]) {
            throw new Error('API key not found');
        }
        const keyRecord = keys[0];
        // Verify key hash
        const isValid = await (0, hash_1.verifyApiKey)(apiKey, keyRecord.key_hash);
        if (!isValid) {
            await (0, db_1.query)(`INSERT INTO audit_logs (event, api_key_id, ip, user_agent, metadata)
         VALUES ($1, $2, $3, $4, $5)`, ['api_key_auth_failed', keyRecord.id, ipAddress, userAgent, JSON.stringify({ prefix })]);
            throw new Error('Invalid API key');
        }
        // Check revocation
        if (keyRecord.revoked_at) {
            throw new Error('API key revoked');
        }
        // Check expiration
        if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
            throw new Error('API key expired');
        }
        // Check IP whitelist (least privilege)
        if (keyRecord.ip_whitelist && keyRecord.ip_whitelist.length > 0) {
            if (!keyRecord.ip_whitelist.includes(ipAddress)) {
                await (0, db_1.query)(`INSERT INTO audit_logs (event, api_key_id, ip, user_agent, metadata)
           VALUES ($1, $2, $3, $4, $5)`, ['api_key_ip_blocked', keyRecord.id, ipAddress, userAgent, JSON.stringify({ ipAddress })]);
                throw new Error('IP address not whitelisted');
            }
        }
        // Update last used
        await (0, db_1.query)(`UPDATE api_keys SET last_used_at = NOW() WHERE id = $1`, [keyRecord.id]);
        return {
            userId: keyRecord.user_id,
            tenantId: keyRecord.tenant_id,
            role: keyRecord.role,
            scopes: keyRecord.scopes,
            apiKeyId: keyRecord.id,
            ipAddress,
            userAgent,
        };
    }
    /**
     * Revoke token (for logout or security incidents)
     */
    static async revokeToken(jti, reason) {
        // Store revoked token ID in Redis with TTL matching token expiration
        // For now, we'll use a database table
        await (0, db_1.query)(`INSERT INTO revoked_tokens (jti, revoked_at, reason, expires_at)
       VALUES ($1, NOW(), $2, NOW() + INTERVAL '7 days')
       ON CONFLICT (jti) DO NOTHING`, [jti, reason]);
    }
    /**
     * Check if token is revoked
     */
    static async isTokenRevoked(jti) {
        const result = await (0, db_1.query)(`SELECT COUNT(*)::INTEGER as count
       FROM revoked_tokens
       WHERE jti = $1 AND expires_at > NOW()`, [jti]);
        return (result[0]?.count ?? 0) > 0;
    }
}
exports.ZeroTrustAuth = ZeroTrustAuth;
//# sourceMappingURL=ZeroTrustAuth.js.map