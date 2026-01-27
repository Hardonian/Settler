"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../db");
const hash_1 = require("../utils/hash");
const logger_1 = require("../utils/logger");
const config_1 = require("../config");
/**
 * Express middleware for API key or JWT token authentication.
 *
 * Supports two authentication methods:
 * 1. API Key: `X-API-Key` header with `rk_` prefix
 * 2. JWT Token: `Authorization: Bearer <token>` header
 *
 * On success, attaches `userId` and `apiKeyId` (if API key) to `req`.
 * On failure, returns 401 Unauthorized.
 *
 * @example
 * ```typescript
 * app.use("/api/v1", authMiddleware, protectedRouter);
 * ```
 */
const authMiddleware = async (req, res, next) => {
    try {
        // Check for API key in header
        const apiKey = req.headers["x-api-key"];
        if (apiKey) {
            try {
                await validateApiKey(req, apiKey);
                return next();
            }
            catch (error) {
                const message = error instanceof Error ? error.message : "Invalid API key";
                (0, logger_1.logWarn)('API key validation failed', {
                    ip: req.ip,
                    userAgent: req.headers['user-agent'],
                    error: message,
                });
                res.status(401).json({
                    error: "Unauthorized",
                    message,
                });
                return;
            }
        }
        // Check for JWT token
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            try {
                await validateJWT(req, authHeader.substring(7));
                return next();
            }
            catch (error) {
                const message = error instanceof Error ? error.message : "The provided token is invalid or expired";
                (0, logger_1.logWarn)('JWT validation failed', {
                    ip: req.ip,
                    userAgent: req.headers['user-agent'],
                    error: message,
                });
                res.status(401).json({
                    error: "Invalid Token",
                    message,
                });
                return;
            }
        }
        // No auth provided
        res.status(401).json({
            error: "Unauthorized",
            message: "API key or Bearer token required",
        });
    }
    catch (error) {
        (0, logger_1.logError)('Auth middleware error', error);
        next(error);
    }
};
exports.authMiddleware = authMiddleware;
async function validateApiKey(req, apiKey) {
    if (!apiKey.startsWith("rk_")) {
        throw new Error("Invalid API key format");
    }
    // Extract prefix for database lookup
    const prefix = apiKey.substring(0, 12);
    // Lookup API key in database
    const keys = await (0, db_1.query)(`SELECT id, user_id, key_hash, scopes, rate_limit, revoked_at, expires_at
     FROM api_keys
     WHERE key_prefix = $1`, [prefix]);
    if (keys.length === 0) {
        // Log failed attempt for security monitoring
        await (0, db_1.query)(`INSERT INTO audit_logs (event, ip, user_agent, path, metadata)
       VALUES ($1, $2, $3, $4, $5)`, [
            'api_key_auth_failed',
            req.ip || null,
            req.headers['user-agent'] || null,
            req.path,
            JSON.stringify({ keyPrefix: prefix }),
        ]);
        throw new Error("Invalid API key");
    }
    if (!keys[0]) {
        throw new Error("Invalid API key");
    }
    const keyRecord = keys[0];
    // Verify full key against hash
    const isValid = await (0, hash_1.verifyApiKey)(apiKey, keyRecord.key_hash);
    if (!isValid) {
        // Log failed attempt
        await (0, db_1.query)(`INSERT INTO audit_logs (event, api_key_id, ip, user_agent, path, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`, [
            'api_key_auth_failed',
            keyRecord.id,
            req.ip || null,
            req.headers['user-agent'] || null,
            req.path,
            JSON.stringify({ keyPrefix: prefix }),
        ]);
        throw new Error("Invalid API key");
    }
    // Check if key is revoked or expired
    if (keyRecord.revoked_at) {
        throw new Error("API key has been revoked");
    }
    if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
        throw new Error("API key has expired");
    }
    // Update last used timestamp
    await (0, db_1.query)(`UPDATE api_keys SET last_used_at = NOW() WHERE id = $1`, [keyRecord.id]);
    // Set request properties
    req.userId = keyRecord.user_id;
    req.apiKeyId = keyRecord.id;
    req.apiKey = apiKey;
}
async function validateJWT(req, token) {
    if (!config_1.config.jwt.secret || config_1.config.jwt.secret === 'your-secret-key-change-in-production') {
        throw new Error("JWT authentication not configured");
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret, {
            issuer: 'settler-api',
            audience: 'settler-client',
        });
        // Check token type (access vs refresh)
        if (decoded.type === 'refresh') {
            throw new Error("Refresh tokens cannot be used for API access");
        }
        req.userId = decoded.userId;
    }
    catch (error) {
        if (error instanceof Error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error("Token has expired");
            }
            if (error.name === 'JsonWebTokenError') {
                throw new Error("Invalid token");
            }
        }
        throw error;
    }
}
//# sourceMappingURL=auth.js.map