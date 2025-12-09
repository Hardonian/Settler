"use strict";
/**
 * Audit Trail Routes
 * UX-006: Trust anchors - Complete audit trail visibility
 * Future-forward: Immutable audit logs, compliance-ready, searchable
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditTrailRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const validation_1 = require("../middleware/validation");
const authorization_1 = require("../middleware/authorization");
const Permissions_1 = require("../infrastructure/security/Permissions");
const db_1 = require("../db");
const error_handler_1 = require("../utils/error-handler");
const router = (0, express_1.Router)();
exports.auditTrailRouter = router;
const getAuditTrailSchema = zod_1.z.object({
    query: zod_1.z.object({
        resourceType: zod_1.z.enum(["job", "execution", "match", "exception"]).optional(),
        resourceId: zod_1.z.string().uuid().optional(),
        startDate: zod_1.z.string().datetime().optional(),
        endDate: zod_1.z.string().datetime().optional(),
        eventType: zod_1.z.string().optional(),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default("100"),
        offset: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default("0"),
    }),
});
// Get audit trail
router.get("/audit-trail", (0, authorization_1.requirePermission)(Permissions_1.Permission.ADMIN_AUDIT), (0, validation_1.validateRequest)(getAuditTrailSchema), async (req, res) => {
    try {
        const userId = req.userId;
        const queryParams = getAuditTrailSchema.parse({ query: req.query });
        const { resourceType, resourceId, startDate, endDate, eventType, limit, offset, } = queryParams.query;
        const conditions = [];
        const values = [];
        let paramCount = 1;
        // Filter by user's tenant
        conditions.push(`user_id = $${paramCount++}`);
        values.push(userId);
        if (resourceType && resourceId) {
            conditions.push(`metadata->>'resourceType' = $${paramCount++}`);
            values.push(resourceType);
            conditions.push(`metadata->>'resourceId' = $${paramCount++}`);
            values.push(resourceId);
        }
        if (startDate) {
            conditions.push(`timestamp >= $${paramCount++}`);
            values.push(new Date(startDate));
        }
        if (endDate) {
            conditions.push(`timestamp <= $${paramCount++}`);
            values.push(new Date(endDate));
        }
        if (eventType) {
            conditions.push(`event = $${paramCount++}`);
            values.push(eventType);
        }
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const auditLogs = await (0, db_1.query)(`SELECT id, event, user_id, metadata, timestamp, ip, user_agent
         FROM audit_logs
         ${whereClause}
         ORDER BY timestamp DESC
         LIMIT $${paramCount++} OFFSET $${paramCount++}`, [...values, limit, offset]);
        const countResult = await (0, db_1.query)(`SELECT COUNT(*) as count FROM audit_logs ${whereClause}`, values);
        if (!countResult[0]) {
            throw new Error('Failed to get audit log count');
        }
        const total = parseInt(countResult[0].count);
        res.json({
            data: auditLogs.map(log => ({
                id: log.id,
                event: log.event,
                userId: log.user_id,
                metadata: log.metadata,
                timestamp: log.timestamp.toISOString(),
                ip: log.ip,
                userAgent: log.user_agent,
                // Trust indicators
                trustLevel: calculateTrustLevel(log),
                immutable: true, // Audit logs are immutable
            })),
            pagination: {
                limit,
                offset,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to get audit trail", 500, { userId: req.userId });
    }
});
// Get audit trail for specific resource
router.get("/audit-trail/:resourceType/:resourceId", (0, authorization_1.requirePermission)(Permissions_1.Permission.ADMIN_AUDIT), async (req, res) => {
    try {
        const { resourceType, resourceId } = req.params;
        const userId = req.userId;
        if (!resourceType || !resourceId) {
            res.status(400).json({ error: 'resourceType and resourceId are required' });
            return;
        }
        const auditLogs = await (0, db_1.query)(`SELECT id, event, user_id, metadata, timestamp
         FROM audit_logs
         WHERE user_id = $1
           AND metadata->>'resourceType' = $2
           AND metadata->>'resourceId' = $3
         ORDER BY timestamp DESC`, [userId, resourceType, resourceId]);
        res.json({
            data: {
                resourceType,
                resourceId,
                events: auditLogs.map(log => ({
                    id: log.id,
                    event: log.event,
                    userId: log.user_id,
                    metadata: log.metadata,
                    timestamp: log.timestamp.toISOString(),
                })),
                trustLevel: "high", // Complete audit trail
                immutable: true,
            },
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to get resource audit trail", 500, { userId: req.userId });
    }
});
// Export audit trail (compliance)
router.get("/audit-trail/export", (0, authorization_1.requirePermission)(Permissions_1.Permission.ADMIN_AUDIT), async (req, res) => {
    try {
        const userId = req.userId;
        const { format = "csv", startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        const auditLogs = await (0, db_1.query)(`SELECT event, timestamp, metadata
         FROM audit_logs
         WHERE user_id = $1 AND timestamp >= $2 AND timestamp <= $3
         ORDER BY timestamp DESC`, [userId, start, end]);
        if (format === "csv") {
            res.setHeader("Content-Type", "text/csv");
            res.setHeader("Content-Disposition", `attachment; filename="audit-trail-${userId}.csv"`);
            let csv = "Event,Timestamp,Metadata\n";
            for (const log of auditLogs) {
                csv += `${log.event},${log.timestamp.toISOString()},"${JSON.stringify(log.metadata).replace(/"/g, '""')}"\n`;
            }
            res.send(csv);
            return;
        }
        res.json({
            data: auditLogs,
            format: "json",
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to export audit trail", 500, { userId: req.userId });
    }
});
function calculateTrustLevel(log) {
    // High trust: System events, user actions with IP/UA
    if (log.ip && log.user_agent) {
        return "high";
    }
    // Medium trust: User events without IP/UA
    if (log.event.includes("user_") || log.event.includes("api_")) {
        return "medium";
    }
    return "low";
}
//# sourceMappingURL=audit-trail.js.map