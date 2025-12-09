"use strict";
/**
 * Exception Queue Routes
 * UX-008: Exception queue UI for reviewing and resolving unmatched transactions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.exceptionsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const validation_1 = require("../middleware/validation");
const authorization_1 = require("../middleware/authorization");
const Permissions_1 = require("../infrastructure/security/Permissions");
const db_1 = require("../db");
const error_handler_1 = require("../utils/error-handler");
const typed_errors_1 = require("../utils/typed-errors");
const event_tracker_1 = require("../utils/event-tracker");
const router = (0, express_1.Router)();
exports.exceptionsRouter = router;
const listExceptionsSchema = zod_1.z.object({
    query: zod_1.z.object({
        jobId: zod_1.z.string().uuid().optional(),
        resolution_status: zod_1.z.enum(['open', 'in_progress', 'resolved', 'dismissed']).optional(),
        category: zod_1.z.string().optional(),
        startDate: zod_1.z.string().datetime().optional(),
        endDate: zod_1.z.string().datetime().optional(),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default("50"),
        offset: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default("0"),
    }),
});
const resolveExceptionSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
    body: zod_1.z.object({
        resolution: zod_1.z.enum(['matched', 'manual', 'ignored']),
        notes: zod_1.z.string().max(1000).optional(),
    }),
});
const bulkResolveSchema = zod_1.z.object({
    body: zod_1.z.object({
        exceptionIds: zod_1.z.array(zod_1.z.string().uuid()).min(1).max(100),
        resolution: zod_1.z.enum(['matched', 'manual', 'ignored']),
        notes: zod_1.z.string().max(1000).optional(),
    }),
});
// List exceptions (unmatched transactions)
router.get("/exceptions", (0, authorization_1.requirePermission)(Permissions_1.Permission.REPORTS_READ), (0, validation_1.validateRequest)(listExceptionsSchema), async (req, res) => {
    try {
        const userId = req.userId;
        const queryParams = listExceptionsSchema.parse({ query: req.query });
        const { jobId, resolution_status = 'open', category, startDate, endDate, limit, offset, } = queryParams.query;
        // Build query
        const conditions = [];
        const values = [];
        let paramCount = 1;
        // Join with jobs to ensure user ownership
        conditions.push(`j.user_id = $${paramCount++}`);
        values.push(userId);
        if (jobId) {
            conditions.push(`e.job_id = $${paramCount++}`);
            values.push(jobId);
        }
        if (resolution_status) {
            conditions.push(`e.resolution_status = $${paramCount++}`);
            values.push(resolution_status);
        }
        if (category) {
            conditions.push(`e.category = $${paramCount++}`);
            values.push(category);
        }
        if (startDate) {
            conditions.push(`e.created_at >= $${paramCount++}`);
            values.push(new Date(startDate));
        }
        if (endDate) {
            conditions.push(`e.created_at <= $${paramCount++}`);
            values.push(new Date(endDate));
        }
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        // Get exceptions
        const exceptions = await (0, db_1.query)(`SELECT e.id, e.job_id, e.execution_id, e.category, e.severity,
                e.description, e.resolution_status,
                e.resolved_at, e.resolved_by, e.resolution_notes,
                e.created_at
         FROM exceptions e
         JOIN jobs j ON e.job_id = j.id
         ${whereClause}
         ORDER BY e.created_at DESC
         LIMIT $${paramCount++} OFFSET $${paramCount++}`, [...values, limit, offset]);
        // Get total count
        const countResult = await (0, db_1.query)(`SELECT COUNT(*) as count
         FROM exceptions e
         JOIN jobs j ON e.job_id = j.id
         ${whereClause}`, values);
        if (!countResult[0]) {
            throw new Error('Failed to get exception count');
        }
        const total = parseInt(countResult[0].count);
        res.json({
            data: exceptions.map((e) => {
                if (!e)
                    return null;
                return {
                    id: e.id,
                    jobId: e.job_id,
                    executionId: e.execution_id,
                    category: e.category,
                    severity: e.severity,
                    description: e.description,
                    status: e.resolution_status,
                    resolvedAt: e.resolved_at?.toISOString() || null,
                    resolvedBy: e.resolved_by || null,
                    notes: e.resolution_notes || null,
                    createdAt: e.created_at.toISOString(),
                };
            }).filter((e) => e !== null),
            pagination: {
                limit,
                offset,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to list exceptions", 500, { userId: req.userId });
    }
});
// Get exception details
router.get("/exceptions/:id", (0, authorization_1.requirePermission)(Permissions_1.Permission.REPORTS_READ), async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        if (!id || !userId) {
            throw new typed_errors_1.NotFoundError("Exception ID and User ID are required", "exception", id || "unknown");
        }
        const exceptions = await (0, db_1.query)(`SELECT e.id, e.job_id, e.execution_id, e.category, e.severity,
                e.description, e.resolution_status,
                e.resolved_at, e.resolved_by, e.resolution_notes,
                e.created_at
         FROM exceptions e
         JOIN jobs j ON e.job_id = j.id
         WHERE e.id = $1 AND j.user_id = $2`, [id, userId]);
        if (exceptions.length === 0 || !exceptions[0]) {
            throw new typed_errors_1.NotFoundError("Exception not found", "exception", id);
        }
        const e = exceptions[0];
        res.json({
            data: {
                id: e.id,
                jobId: e.job_id,
                executionId: e.execution_id,
                category: e.category,
                severity: e.severity,
                description: e.description,
                status: e.resolution_status,
                resolvedAt: e.resolved_at?.toISOString() || null,
                resolvedBy: e.resolved_by || null,
                notes: e.resolution_notes || null,
                createdAt: e.created_at.toISOString(),
            },
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to get exception", 500, { userId: req.userId });
    }
});
// Resolve exception
router.post("/exceptions/:id/resolve", (0, authorization_1.requirePermission)(Permissions_1.Permission.REPORTS_EXPORT), (0, validation_1.validateRequest)(resolveExceptionSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const { resolution, notes } = req.body;
        const userId = req.userId;
        if (!id || !userId) {
            throw new typed_errors_1.NotFoundError("Exception ID and User ID are required", "exception", id || "unknown");
        }
        // Verify ownership
        const existing = await (0, db_1.query)(`SELECT e.id, e.status
         FROM exceptions e
         JOIN jobs j ON e.job_id = j.id
         WHERE e.id = $1 AND j.user_id = $2`, [id, userId]);
        if (existing.length === 0 || !existing[0]) {
            throw new typed_errors_1.NotFoundError("Exception not found", "exception", id);
        }
        const existingException = existing[0];
        if (existingException.status !== 'pending') {
            throw new typed_errors_1.ValidationError("Exception is already resolved", 'status', [{
                    field: 'status',
                    message: `Exception is already ${existingException.status}`,
                    code: 'ALREADY_RESOLVED',
                }]);
        }
        await (0, db_1.transaction)(async (client) => {
            // Update exception
            await client.query(`UPDATE exceptions
           SET status = 'resolved',
               resolution = $1,
               notes = $2,
               resolved_at = NOW(),
               resolved_by = $3,
               updated_at = NOW()
           WHERE id = $4`, [resolution, notes || null, userId, id]);
            // Log audit event
            await client.query(`INSERT INTO audit_logs (event, user_id, metadata)
           VALUES ($1, $2, $3)`, [
                'exception_resolved',
                userId,
                JSON.stringify({ exceptionId: id, resolution, notes }),
            ]);
        });
        // Track event
        (0, event_tracker_1.trackEventAsync)(userId, 'ExceptionResolved', {
            exceptionId: id,
            resolution,
        });
        res.json({
            message: "Exception resolved successfully",
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to resolve exception", 500, { userId: req.userId });
    }
});
// Bulk resolve exceptions
router.post("/exceptions/bulk-resolve", (0, authorization_1.requirePermission)(Permissions_1.Permission.REPORTS_EXPORT), (0, validation_1.validateRequest)(bulkResolveSchema), async (req, res) => {
    try {
        const { exceptionIds, resolution, notes } = req.body;
        const userId = req.userId;
        await (0, db_1.transaction)(async (client) => {
            // Verify all exceptions belong to user
            const ownedResult = await client.query(`SELECT e.id
           FROM exceptions e
           JOIN jobs j ON e.job_id = j.id
           WHERE e.id = ANY($1) AND j.user_id = $2 AND e.status = 'pending'`, [exceptionIds, userId]);
            const owned = ownedResult.rows || [];
            if (owned.length !== exceptionIds.length) {
                throw new typed_errors_1.ValidationError("Some exceptions not found or already resolved", 'exceptionIds', [{
                        field: 'exceptionIds',
                        message: `Only ${owned.length} of ${exceptionIds.length} exceptions can be resolved`,
                        code: 'INVALID_EXCEPTIONS',
                    }]);
            }
            // Bulk update
            await client.query(`UPDATE exceptions
           SET resolution_status = 'resolved',
               resolution_notes = $1,
               resolved_at = NOW(),
               resolved_by = $2,
               updated_at = NOW()
           WHERE id = ANY($3)`, [notes || null, userId, exceptionIds]);
            // Log audit event
            await client.query(`INSERT INTO audit_logs (event, user_id, metadata)
           VALUES ($1, $2, $3)`, [
                'exceptions_bulk_resolved',
                userId,
                JSON.stringify({ exceptionIds, resolution, count: exceptionIds.length }),
            ]);
        });
        // Track events
        for (const exceptionId of exceptionIds) {
            (0, event_tracker_1.trackEventAsync)(userId, 'ExceptionResolved', {
                exceptionId,
                resolution,
                bulk: true,
            });
        }
        res.json({
            message: `Resolved ${exceptionIds.length} exceptions successfully`,
            count: exceptionIds.length,
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to bulk resolve exceptions", 500, { userId: req.userId });
    }
});
// Get exception statistics
router.get("/exceptions/stats", (0, authorization_1.requirePermission)(Permissions_1.Permission.REPORTS_READ), async (req, res) => {
    try {
        const userId = req.userId;
        const { jobId } = req.query;
        const conditions = [];
        const values = [];
        let paramCount = 1;
        conditions.push(`j.user_id = $${paramCount++}`);
        values.push(userId);
        if (jobId) {
            conditions.push(`e.job_id = $${paramCount++}`);
            values.push(jobId);
        }
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const stats = await (0, db_1.query)(`SELECT 
           COUNT(*) as total,
           COUNT(*) FILTER (WHERE e.resolution_status = 'open') as open,
           COUNT(*) FILTER (WHERE e.resolution_status = 'in_progress') as in_progress,
           COUNT(*) FILTER (WHERE e.resolution_status = 'resolved') as resolved,
           COUNT(*) FILTER (WHERE e.resolution_status = 'dismissed') as dismissed,
           json_object_agg(e.category, COUNT(*)) FILTER (WHERE e.category IS NOT NULL) as by_category
         FROM exceptions e
         JOIN jobs j ON e.job_id = j.id
         ${whereClause}
         GROUP BY e.category`, values);
        // Aggregate stats
        const aggregated = {
            total: 0,
            open: 0,
            inProgress: 0,
            resolved: 0,
            dismissed: 0,
            byCategory: {},
        };
        for (const stat of stats) {
            aggregated.total += parseInt(stat.total);
            aggregated.open += parseInt(stat.open);
            aggregated.inProgress += parseInt(stat.in_progress);
            aggregated.resolved += parseInt(stat.resolved);
            aggregated.dismissed += parseInt(stat.dismissed);
            if (stat.by_category && typeof stat.by_category === 'object') {
                Object.assign(aggregated.byCategory, stat.by_category);
            }
        }
        res.json({
            data: aggregated,
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to get exception statistics", 500, { userId: req.userId });
    }
});
//# sourceMappingURL=exceptions.js.map