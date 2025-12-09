"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const validation_1 = require("../middleware/validation");
const authorization_1 = require("../middleware/authorization");
const Permissions_1 = require("../infrastructure/security/Permissions");
const db_1 = require("../db");
const hash_1 = require("../utils/hash");
const logger_1 = require("../utils/logger");
const error_handler_1 = require("../utils/error-handler");
const User_1 = require("../domain/entities/User");
const router = (0, express_1.Router)();
exports.usersRouter = router;
const deleteUserDataSchema = zod_1.z.object({
    body: zod_1.z.object({
        password: zod_1.z.string().min(1),
    }),
});
const exportUserDataSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
});
// GDPR: Delete user data
router.delete("/:id/data", (0, authorization_1.requirePermission)(Permissions_1.Permission.USERS_DELETE), (0, validation_1.validateRequest)(deleteUserDataSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const { password } = req.body;
        // Users can only delete their own data (or admins)
        if (id !== userId) {
            // Check if user is admin
            const users = await (0, db_1.query)('SELECT role FROM users WHERE id = $1', [userId]);
            if (users.length === 0 || !users[0] || (users[0].role !== User_1.UserRole.ADMIN && users[0].role !== User_1.UserRole.OWNER)) {
                return res.status(403).json({ error: 'Forbidden' });
            }
        }
        if (!id || !userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        // Verify password
        const targetUsers = await (0, db_1.query)('SELECT password_hash FROM users WHERE id = $1', [id]);
        if (targetUsers.length === 0 || !targetUsers[0]) {
            return res.status(404).json({ error: 'User not found' });
        }
        const isValid = await (0, hash_1.verifyPassword)(password, targetUsers[0].password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid password' });
        }
        // Soft delete with 30-day grace period
        await (0, db_1.transaction)(async (client) => {
            // Mark for deletion
            await client.query(`UPDATE users
           SET deleted_at = NOW(),
               deletion_scheduled_at = NOW() + INTERVAL '30 days',
               email = $1,
               name = 'Deleted User'
           WHERE id = $2`, [`deleted-${id}@settler.io`, id]);
            // Schedule hard deletion
            await client.query(`INSERT INTO audit_logs (event, user_id, metadata)
           VALUES ($1, $2, $3)`, [
                'user_deletion_scheduled',
                id,
                JSON.stringify({ scheduledAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }),
            ]);
        });
        // Log audit event
        await (0, db_1.query)(`INSERT INTO audit_logs (event, user_id, metadata)
         VALUES ($1, $2, $3)`, [
            'user_data_deletion_requested',
            userId,
            JSON.stringify({ targetUserId: id }),
        ]);
        (0, logger_1.logInfo)('User data deletion scheduled', { userId: id, requestedBy: userId });
        res.json({
            message: 'Deletion scheduled. Data will be permanently deleted in 30 days.',
            deletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
        return;
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to delete user data", 500, { userId: req.userId });
        return;
    }
});
// GDPR: Export user data
router.get("/:id/data-export", (0, authorization_1.requirePermission)(Permissions_1.Permission.USERS_READ), (0, validation_1.validateRequest)(exportUserDataSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        // Users can only export their own data
        if (id !== userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        // Fetch all user data
        const [users, jobs, reports, webhooks, apiKeys, auditLogs] = await Promise.all([
            (0, db_1.query)(`SELECT id, email, name, role, data_residency_region, created_at, updated_at
           FROM users WHERE id = $1`, [userId]),
            (0, db_1.query)(`SELECT id, name, source_adapter, target_adapter, rules, schedule, status, created_at, updated_at
           FROM jobs WHERE user_id = $1`, [userId]),
            (0, db_1.query)(`SELECT r.id, r.job_id, r.summary, r.generated_at
           FROM reports r
           JOIN jobs j ON r.job_id = j.id
           WHERE j.user_id = $1`, [userId]),
            (0, db_1.query)(`SELECT id, url, events, status, created_at, updated_at
           FROM webhooks WHERE user_id = $1`, [userId]),
            (0, db_1.query)(`SELECT id, name, scopes, rate_limit, created_at, last_used_at
           FROM api_keys WHERE user_id = $1`, [userId]),
            (0, db_1.query)(`SELECT event, metadata, timestamp
           FROM audit_logs
           WHERE user_id = $1
           ORDER BY timestamp DESC
           LIMIT 1000`, [userId]),
        ]);
        const exportData = {
            user: users[0],
            jobs: jobs,
            reports: reports,
            webhooks: webhooks,
            apiKeys: apiKeys.map(k => ({
                id: k.id,
                name: k.name,
                scopes: k.scopes,
                rateLimit: k.rate_limit,
                createdAt: k.created_at,
                lastUsedAt: k.last_used_at,
            })),
            auditLogs: auditLogs,
            exportedAt: new Date().toISOString(),
        };
        // Log export
        await (0, db_1.query)(`INSERT INTO audit_logs (event, user_id, metadata)
         VALUES ($1, $2, $3)`, [
            'user_data_exported',
            userId,
            JSON.stringify({ exportedAt: new Date() }),
        ]);
        (0, logger_1.logInfo)('User data exported', { userId });
        res.json({ data: exportData });
        return;
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to export user data", 500, { userId: req.userId });
        return;
    }
});
//# sourceMappingURL=users.js.map