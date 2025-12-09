"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const validation_1 = require("../middleware/validation");
const db_1 = require("../db");
const hash_1 = require("../utils/hash");
const logger_1 = require("../utils/logger");
const error_handler_1 = require("../utils/error-handler");
const config_1 = require("../config");
const authorization_1 = require("../middleware/authorization");
const Permissions_1 = require("../infrastructure/security/Permissions");
const token_rotation_1 = require("../infrastructure/security/token-rotation");
const uuid_1 = require("uuid");
const api_response_1 = require("../utils/api-response");
const router = (0, express_1.Router)();
exports.authRouter = router;
const loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(1),
    }),
});
const refreshTokenSchema = zod_1.z.object({
    body: zod_1.z.object({
        refreshToken: zod_1.z.string().min(1),
    }),
});
const createApiKeySchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(255),
        scopes: zod_1.z.array(zod_1.z.string()).optional(),
        rateLimit: zod_1.z.number().int().min(1).max(10000).optional(),
        expiresAt: zod_1.z.string().datetime().optional(),
    }),
});
// Login and get access + refresh tokens
router.post("/login", (0, validation_1.validateRequest)(loginSchema), async (req, res) => {
    try {
        const { email, password } = req.body;
        const users = await (0, db_1.query)(`SELECT id, password_hash, role FROM users WHERE email = $1 AND deleted_at IS NULL`, [email]);
        if (users.length === 0 || !users[0]) {
            res.status(401).json({ error: "Invalid credentials" });
            return;
        }
        const user = users[0];
        const isValid = await (0, hash_1.verifyPassword)(password, user.password_hash);
        if (!isValid) {
            res.status(401).json({ error: "Invalid credentials" });
            return;
        }
        if (!config_1.config.jwt.secret) {
            throw new Error('JWT secret not configured');
        }
        const jwtSecret = config_1.config.jwt.secret;
        const accessTokenExpiry = typeof config_1.config.jwt.accessTokenExpiry === 'string'
            ? config_1.config.jwt.accessTokenExpiry
            : (typeof config_1.config.jwt.accessTokenExpiry === 'number' ? config_1.config.jwt.accessTokenExpiry : '15m');
        const refreshSecret = (config_1.config.jwt.refreshSecret || jwtSecret);
        const refreshTokenExpiry = typeof config_1.config.jwt.refreshTokenExpiry === 'string'
            ? config_1.config.jwt.refreshTokenExpiry
            : (typeof config_1.config.jwt.refreshTokenExpiry === 'number' ? config_1.config.jwt.refreshTokenExpiry : '7d');
        // Generate access token (15 minutes)
        const accessToken = jsonwebtoken_1.default.sign({ userId: user.id, type: 'access' }, jwtSecret, {
            expiresIn: accessTokenExpiry,
            issuer: 'settler-api',
            audience: 'settler-client',
        });
        // Generate refresh token with rotation support
        const refreshTokenId = (0, uuid_1.v4)();
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id, tokenId: refreshTokenId, type: 'refresh' }, refreshSecret, {
            expiresIn: refreshTokenExpiry,
            issuer: 'settler-api',
            audience: 'settler-client',
        });
        // Store refresh token in database for rotation
        await (0, token_rotation_1.storeRefreshToken)(user.id, refreshTokenId, 7);
        // Log audit event
        await (0, db_1.query)(`INSERT INTO audit_logs (event, user_id, metadata)
         VALUES ($1, $2, $3)`, [
            'user_login',
            user.id,
            JSON.stringify({ ip: req.ip }),
        ]);
        (0, logger_1.logInfo)('User logged in', { userId: user.id });
        (0, api_response_1.sendSuccess)(res, {
            accessToken,
            refreshToken,
            expiresIn: 900, // 15 minutes in seconds
            user: {
                id: user.id,
                email,
                role: user.role,
            },
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to login", 500);
    }
});
// Refresh access token with rotation
router.post("/refresh", (0, validation_1.validateRequest)(refreshTokenSchema), async (req, res) => {
    try {
        const { refreshToken } = req.body;
        // Rotate refresh token (invalidates old, issues new)
        const tokenPair = await (0, token_rotation_1.rotateRefreshToken)(refreshToken);
        if (!tokenPair) {
            return (0, api_response_1.sendError)(res, 401, 'INVALID_TOKEN', 'Invalid or expired refresh token');
        }
        (0, api_response_1.sendSuccess)(res, {
            accessToken: tokenPair.accessToken,
            refreshToken: tokenPair.refreshToken,
            expiresIn: 900, // 15 minutes in seconds
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to refresh token", 401);
    }
});
// Create API key
router.post("/api-keys", (0, authorization_1.requirePermission)(Permissions_1.Permission.USERS_WRITE), (0, validation_1.validateRequest)(createApiKeySchema), async (req, res) => {
    try {
        const { name, scopes, rateLimit, expiresAt } = req.body;
        const userId = req.userId;
        const { key, prefix } = (0, hash_1.generateApiKey)();
        const keyHash = await (0, hash_1.hashApiKey)(key);
        const result = await (0, db_1.query)(`INSERT INTO api_keys (user_id, key_prefix, key_hash, name, scopes, rate_limit, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`, [
            userId,
            prefix,
            keyHash,
            name,
            scopes || ['jobs:read', 'jobs:write', 'reports:read'],
            rateLimit || 1000,
            expiresAt ? new Date(expiresAt) : null,
        ]);
        if (!result[0]) {
            throw new Error('Failed to create API key');
        }
        const apiKeyId = result[0].id;
        // Log audit event
        await (0, db_1.query)(`INSERT INTO audit_logs (event, user_id, metadata)
         VALUES ($1, $2, $3)`, [
            'api_key_created',
            userId,
            JSON.stringify({ apiKeyId, name }),
        ]);
        (0, logger_1.logInfo)('API key created', { userId, apiKeyId });
        // Return key only once (never again)
        res.status(201).json({
            data: {
                id: apiKeyId,
                key, // Only returned on creation
                name,
                scopes: scopes || ['jobs:read', 'jobs:write', 'reports:read'],
                rateLimit: rateLimit || 1000,
                createdAt: new Date().toISOString(),
            },
            message: "API key created. Store it securely - it will not be shown again.",
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to create API key", 500, { userId: req.userId });
    }
});
//# sourceMappingURL=auth.js.map