"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeysRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const validation_1 = require("../middleware/validation");
const authorization_1 = require("../middleware/authorization");
const Permissions_1 = require("../infrastructure/security/Permissions");
const db_1 = require("../db");
const hash_1 = require("../utils/hash");
const logger_1 = require("../utils/logger");
const error_handler_1 = require("../utils/error-handler");
const typed_errors_1 = require("../utils/typed-errors");
const router = (0, express_1.Router)();
exports.apiKeysRouter = router;
const createApiKeySchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(255),
        scopes: zod_1.z.array(zod_1.z.string()).optional(),
        rateLimit: zod_1.z.number().int().min(1).max(10000).optional(),
        expiresAt: zod_1.z.string().datetime().optional(),
    }),
});
const updateApiKeySchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(255).optional(),
        scopes: zod_1.z.array(zod_1.z.string()).optional(),
        rateLimit: zod_1.z.number().int().min(1).max(10000).optional(),
        revoked: zod_1.z.boolean().optional(),
    }),
});
const regenerateApiKeySchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
});
// List API keys (masked)
router.get("/api-keys", (0, authorization_1.requirePermission)(Permissions_1.Permission.USERS_WRITE), async (req, res) => {
    try {
        const userId = req.userId;
        const keys = await (0, db_1.query)(`SELECT id, name, scopes, rate_limit, revoked_at, expires_at, last_used_at, created_at, key_prefix
         FROM api_keys
         WHERE user_id = $1
         ORDER BY created_at DESC`, [userId]);
        const maskedKeys = keys.map((key) => ({
            id: key.id,
            name: key.name,
            keyPrefix: `${key.key_prefix}...`, // Masked key
            scopes: key.scopes,
            rateLimit: key.rate_limit,
            revoked: key.revoked_at !== null,
            expired: key.expires_at ? new Date(key.expires_at) < new Date() : false,
            lastUsedAt: key.last_used_at?.toISOString() || null,
            createdAt: key.created_at.toISOString(),
        }));
        res.json({
            data: maskedKeys,
            count: maskedKeys.length,
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to list API keys", 500, { userId: req.userId });
    }
});
// Get API key details (masked)
router.get("/api-keys/:id", (0, authorization_1.requirePermission)(Permissions_1.Permission.USERS_WRITE), async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: "API key ID required" });
            return;
        }
        const userId = req.userId;
        const keys = await (0, db_1.query)(`SELECT id, name, scopes, rate_limit, revoked_at, expires_at, last_used_at, created_at, key_prefix
         FROM api_keys
         WHERE id = $1 AND user_id = $2`, [id, userId]);
        if (keys.length === 0 || !keys[0]) {
            throw new typed_errors_1.NotFoundError("API key not found", "api_key", id);
        }
        const key = keys[0];
        res.json({
            data: {
                id: key.id,
                name: key.name,
                keyPrefix: `${key.key_prefix}...`, // Masked
                scopes: key.scopes,
                rateLimit: key.rate_limit,
                revoked: key.revoked_at !== null,
                expired: key.expires_at ? new Date(key.expires_at) < new Date() : false,
                lastUsedAt: key.last_used_at?.toISOString() || null,
                createdAt: key.created_at.toISOString(),
            },
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to get API key", 500, { userId: req.userId });
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
        // Log audit event
        await (0, db_1.query)(`INSERT INTO audit_logs (event, user_id, metadata)
         VALUES ($1, $2, $3)`, [
            'api_key_created',
            userId,
            JSON.stringify({ apiKeyId: result[0]?.id || '', name }),
        ]);
        // Log business event
        await (0, db_1.query)(`INSERT INTO events (user_id, event_name, properties)
         VALUES ($1, $2, $3)`, [
            userId,
            'APIKeyCreated',
            JSON.stringify({
                apiKeyId: result[0]?.id || '',
                keyType: 'live',
                name,
            }),
        ]).catch(() => {
            // Events table might not exist yet, ignore
        });
        if (!result[0]) {
            throw new Error('Failed to create API key');
        }
        (0, logger_1.logInfo)('API key created', { userId, apiKeyId: result[0].id });
        // Return key only once (never again)
        res.status(201).json({
            data: {
                id: result[0]?.id || '',
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
// Update API key
router.patch("/api-keys/:id", (0, authorization_1.requirePermission)(Permissions_1.Permission.USERS_WRITE), (0, validation_1.validateRequest)(updateApiKeySchema), async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: "API key ID required" });
            return;
        }
        const { name, scopes, rateLimit, revoked } = req.body;
        const userId = req.userId;
        // Verify ownership
        const existing = await (0, db_1.query)(`SELECT id, revoked_at FROM api_keys WHERE id = $1 AND user_id = $2`, [id, userId]);
        if (existing.length === 0) {
            throw new typed_errors_1.NotFoundError("API key not found", "api_key", id);
        }
        // Build update query
        const updates = [];
        const values = [];
        let paramCount = 1;
        if (name !== undefined) {
            updates.push(`name = $${paramCount++}`);
            values.push(name);
        }
        if (scopes !== undefined) {
            updates.push(`scopes = $${paramCount++}`);
            values.push(scopes);
        }
        if (rateLimit !== undefined) {
            updates.push(`rate_limit = $${paramCount++}`);
            values.push(rateLimit);
        }
        if (revoked !== undefined) {
            updates.push(`revoked_at = $${paramCount++}`);
            values.push(revoked ? new Date() : null);
        }
        if (updates.length === 0) {
            res.status(400).json({ error: "No fields to update" });
            return;
        }
        updates.push(`updated_at = NOW()`);
        values.push(id, userId);
        await (0, db_1.query)(`UPDATE api_keys SET ${updates.join(', ')} WHERE id = $${paramCount++} AND user_id = $${paramCount++}`, values);
        // Log audit event
        await (0, db_1.query)(`INSERT INTO audit_logs (event, user_id, metadata)
         VALUES ($1, $2, $3)`, [
            'api_key_updated',
            userId,
            JSON.stringify({ apiKeyId: id, updates: { name, scopes, rateLimit, revoked } }),
        ]);
        (0, logger_1.logInfo)('API key updated', { userId, apiKeyId: id });
        res.json({
            message: "API key updated successfully",
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to update API key", 500, { userId: req.userId });
    }
});
// Regenerate API key (creates new key, revokes old one)
router.post("/api-keys/:id/regenerate", (0, authorization_1.requirePermission)(Permissions_1.Permission.USERS_WRITE), (0, validation_1.validateRequest)(regenerateApiKeySchema), async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: "API key ID required" });
            return;
        }
        const userId = req.userId;
        // Verify ownership
        const existing = await (0, db_1.query)(`SELECT id, name, scopes, rate_limit, expires_at
         FROM api_keys
         WHERE id = $1 AND user_id = $2`, [id, userId]);
        if (existing.length === 0 || !existing[0]) {
            throw new typed_errors_1.NotFoundError("API key not found", "api_key", id);
        }
        const oldKey = existing[0];
        await (0, db_1.transaction)(async (client) => {
            // Revoke old key
            await client.query(`UPDATE api_keys SET revoked_at = NOW(), updated_at = NOW() WHERE id = $1`, [id]);
            // Create new key with same settings
            const { key, prefix } = (0, hash_1.generateApiKey)();
            const keyHash = await (0, hash_1.hashApiKey)(key);
            const result = await client.query(`INSERT INTO api_keys (user_id, key_prefix, key_hash, name, scopes, rate_limit, expires_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`, [
                userId,
                prefix,
                keyHash,
                oldKey.name,
                oldKey.scopes,
                oldKey.rate_limit,
                oldKey.expires_at,
            ]);
            // Log audit event
            await client.query(`INSERT INTO audit_logs (event, user_id, metadata)
           VALUES ($1, $2, $3)`, [
                'api_key_regenerated',
                userId,
                JSON.stringify({ oldApiKeyId: id, newApiKeyId: result.rows[0]?.id || '' }),
            ]);
            // Log business event
            await client.query(`INSERT INTO events (user_id, event_name, properties)
           VALUES ($1, $2, $3)`, [
                userId,
                'APIKeyRegenerated',
                JSON.stringify({
                    oldApiKeyId: id,
                    newApiKeyId: result.rows[0]?.id || '',
                }),
            ]).catch(() => {
                // Events table might not exist yet, ignore
            });
            if (!result.rows[0]) {
                throw new Error('Failed to regenerate API key');
            }
            (0, logger_1.logInfo)('API key regenerated', { userId, oldApiKeyId: id, newApiKeyId: result.rows[0].id });
            res.status(201).json({
                data: {
                    id: result.rows[0].id,
                    key, // Only returned on regeneration
                    name: oldKey.name,
                    scopes: oldKey.scopes,
                    rateLimit: oldKey.rate_limit,
                    createdAt: new Date().toISOString(),
                },
                message: "API key regenerated. Store the new key securely - it will not be shown again.",
            });
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to regenerate API key", 500, { userId: req.userId });
    }
});
// Delete API key
router.delete("/api-keys/:id", (0, authorization_1.requirePermission)(Permissions_1.Permission.USERS_DELETE), async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: "API key ID required" });
            return;
        }
        const userId = req.userId;
        // Verify ownership
        const existing = await (0, db_1.query)(`SELECT id FROM api_keys WHERE id = $1 AND user_id = $2`, [id, userId]);
        if (existing.length === 0) {
            throw new typed_errors_1.NotFoundError("API key not found", "api_key", id);
        }
        // Revoke instead of delete (soft delete)
        await (0, db_1.query)(`UPDATE api_keys SET revoked_at = NOW(), updated_at = NOW() WHERE id = $1`, [id || null]);
        // Log audit event
        await (0, db_1.query)(`INSERT INTO audit_logs (event, user_id, metadata)
         VALUES ($1, $2, $3)`, [
            'api_key_deleted',
            userId,
            JSON.stringify({ apiKeyId: id }),
        ]);
        (0, logger_1.logInfo)('API key deleted', { userId, apiKeyId: id });
        res.json({
            message: "API key revoked successfully",
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to delete API key", 500, { userId: req.userId });
    }
});
//# sourceMappingURL=api-keys.js.map