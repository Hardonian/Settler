"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const validation_1 = require("../middleware/validation");
const authorization_1 = require("../middleware/authorization");
const Permissions_1 = require("../infrastructure/security/Permissions");
const db_1 = require("../db");
const logger_1 = require("../utils/logger");
const async_mutex_1 = require("async-mutex");
const JobRouteService_1 = require("../application/services/JobRouteService");
const api_response_1 = require("../utils/api-response");
const error_handler_1 = require("../utils/error-handler");
const event_tracker_1 = require("../utils/event-tracker");
const adapter_config_validator_1 = require("../utils/adapter-config-validator");
const router = (0, express_1.Router)();
exports.jobsRouter = router;
const jobService = new JobRouteService_1.JobRouteService();
// Per-job mutex to prevent concurrent execution
// Cleanup mutexes after 1 hour of inactivity to prevent memory leaks
const jobMutexes = new Map();
const MUTEX_TTL = 60 * 60 * 1000; // 1 hour
function getJobMutex(jobId) {
    const entry = jobMutexes.get(jobId);
    if (entry) {
        entry.lastUsed = Date.now();
        return entry.mutex;
    }
    const mutex = new async_mutex_1.Mutex();
    jobMutexes.set(jobId, { mutex, lastUsed: Date.now() });
    return mutex;
}
// Cleanup old mutexes periodically
function cleanupOldMutexes() {
    const now = Date.now();
    for (const [jobId, entry] of jobMutexes.entries()) {
        if (now - entry.lastUsed > MUTEX_TTL) {
            jobMutexes.delete(jobId);
        }
    }
}
// Run cleanup every 30 minutes
setInterval(cleanupOldMutexes, 30 * 60 * 1000);
// Validation schemas with input sanitization
const adapterConfigSchema = zod_1.z.record(zod_1.z.union([
    zod_1.z.string().max(1000),
    zod_1.z.number(),
    zod_1.z.boolean(),
    zod_1.z.array(zod_1.z.string().max(1000)),
])).refine((config) => {
    // Prevent prototype pollution
    return !('__proto__' in config || 'constructor' in config || 'prototype' in config);
}, { message: 'Invalid config keys' });
const createJobSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(255),
        source: zod_1.z.object({
            adapter: zod_1.z.string().min(1).max(50),
            config: adapterConfigSchema,
        }),
        target: zod_1.z.object({
            adapter: zod_1.z.string().min(1).max(50),
            config: adapterConfigSchema,
        }),
        rules: zod_1.z.object({
            matching: zod_1.z.array(zod_1.z.object({
                field: zod_1.z.string(),
                type: zod_1.z.enum(["exact", "fuzzy", "range"]),
                tolerance: zod_1.z.number().optional(),
                days: zod_1.z.number().optional(),
                threshold: zod_1.z.number().optional(),
            })),
            conflictResolution: zod_1.z.enum(["first-wins", "last-wins", "manual-review"]).optional(),
        }),
        schedule: zod_1.z.string().optional(), // Cron expression
    }),
});
const getJobSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
});
const paginationSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default("1"),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default("100"),
    }),
});
// Create reconciliation job
router.post("/", (0, authorization_1.requirePermission)(Permissions_1.Permission.JOBS_WRITE), (0, validation_1.validateRequest)(createJobSchema), async (req, res) => {
    try {
        const userId = req.userId;
        // Validate adapter configs (UX-002)
        (0, adapter_config_validator_1.validateAdapterConfig)(req.body.source.adapter, req.body.source.config);
        (0, adapter_config_validator_1.validateAdapterConfig)(req.body.target.adapter, req.body.target.config);
        const job = await jobService.createJob(userId, req.body);
        // Track event
        (0, event_tracker_1.trackEventAsync)(userId, 'JobCreated', {
            jobId: job.id,
            sourceAdapter: req.body.source.adapter,
            targetAdapter: req.body.target.adapter,
            hasSchedule: !!req.body.schedule,
        });
        (0, api_response_1.sendCreated)(res, job, "Reconciliation job created successfully");
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create reconciliation job";
        (0, logger_1.logError)('Failed to create job', error, { userId: req.userId });
        (0, api_response_1.sendError)(res, 500, 'INTERNAL_ERROR', message, undefined, req.traceId);
    }
});
// Get all jobs with pagination
router.get("/", (0, authorization_1.requirePermission)(Permissions_1.Permission.JOBS_READ), (0, validation_1.validateRequest)(paginationSchema), async (req, res) => {
    try {
        const userId = req.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
        const offset = (page - 1) * limit;
        const [jobs, totalResult] = await Promise.all([
            (0, db_1.query)(`SELECT id, name, status, created_at
           FROM jobs
           WHERE user_id = $1
           ORDER BY created_at DESC
           LIMIT $2 OFFSET $3`, [userId, limit, offset]),
            (0, db_1.query)(`SELECT COUNT(*) as count FROM jobs WHERE user_id = $1`, [userId]),
        ]);
        if (!totalResult[0]) {
            throw new Error('Failed to get job count');
        }
        const total = parseInt(totalResult[0].count);
        res.json({
            data: jobs.map(job => ({
                id: job.id,
                userId,
                name: job.name,
                status: job.status,
                createdAt: job.created_at.toISOString(),
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to fetch jobs", 500, { userId: req.userId });
    }
});
// Get job by ID
router.get("/:id", (0, authorization_1.requirePermission)(Permissions_1.Permission.JOBS_READ), (0, validation_1.validateRequest)(getJobSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        if (!id || !userId) {
            return (0, api_response_1.sendError)(res, 400, 'BAD_REQUEST', 'Job ID and User ID are required', undefined, req.traceId);
        }
        // Check ownership
        await new Promise((resolve, reject) => {
            (0, authorization_1.requireResourceOwnership)(req, res, (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            }, 'job', id);
        });
        const job = await jobService.getJob(id, userId);
        if (!job) {
            return (0, api_response_1.sendError)(res, 404, 'NOT_FOUND', 'Job not found', undefined, req.traceId);
        }
        (0, api_response_1.sendSuccess)(res, job);
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to fetch job", 500, { userId: req.userId, jobId: req.params.id });
    }
});
// Trigger job execution with race condition prevention
router.post("/:id/run", (0, authorization_1.requirePermission)(Permissions_1.Permission.JOBS_WRITE), (0, validation_1.validateRequest)(getJobSchema), async (req, res) => {
    const { id } = req.params;
    const userId = req.userId;
    if (!id || !userId) {
        return (0, api_response_1.sendError)(res, 400, 'BAD_REQUEST', 'Job ID and User ID are required', undefined, req.traceId);
    }
    const mutex = getJobMutex(id);
    const release = await mutex.acquire();
    try {
        // Check ownership
        await new Promise((resolve, reject) => {
            (0, authorization_1.requireResourceOwnership)(req, res, (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            }, 'job', id);
        });
        // Check if job is already running (optimistic locking)
        const jobs = await (0, db_1.query)(`SELECT status, version FROM jobs WHERE id = $1 AND user_id = $2`, [id, userId]);
        if (jobs.length === 0 || !jobs[0]) {
            return (0, api_response_1.sendError)(res, 404, 'NOT_FOUND', 'Job not found', undefined, req.traceId);
        }
        const job = jobs[0];
        if (job.status === 'running') {
            return (0, api_response_1.sendError)(res, 409, 'CONFLICT', 'Job is already running', undefined, req.traceId);
        }
        // Update job status atomically
        const updated = await (0, db_1.query)(`UPDATE jobs
         SET status = 'running', version = version + 1, updated_at = NOW()
         WHERE id = $1 AND user_id = $2 AND version = $3
         RETURNING id`, [id, userId, job.version]);
        if (updated.length === 0 || !updated[0]) {
            return (0, api_response_1.sendError)(res, 409, 'CONFLICT', 'Job state changed, please retry', undefined, req.traceId);
        }
        // Create execution record
        const executions = await (0, db_1.query)(`INSERT INTO executions (job_id, status)
         VALUES ($1, 'running')
         RETURNING id`, [id]);
        if (executions.length === 0 || !executions[0]) {
            return (0, api_response_1.sendError)(res, 500, 'INTERNAL_ERROR', 'Failed to create execution record', undefined, req.traceId);
        }
        const executionId = executions[0].id;
        // Log audit event
        await (0, db_1.query)(`INSERT INTO audit_logs (event, user_id, metadata)
         VALUES ($1, $2, $3)`, [
            'job_executed',
            userId,
            JSON.stringify({ jobId: id, executionId }),
        ]);
        // Queue job execution (async)
        // In production, this would use a job queue like Bull
        setTimeout(async () => {
            try {
                // Execute reconciliation logic here
                await (0, db_1.query)(`UPDATE executions SET status = 'completed', completed_at = NOW()
             WHERE id = $1`, [executionId]);
                await (0, db_1.query)(`UPDATE jobs SET status = 'active', updated_at = NOW() WHERE id = $1`, [id]);
            }
            catch (error) {
                (0, logger_1.logError)('Job execution failed', error, { executionId, jobId: id });
                await (0, db_1.query)(`UPDATE executions SET status = 'failed', error = $1 WHERE id = $2`, [error instanceof Error ? error.message : 'Unknown error', executionId]);
                await (0, db_1.query)(`UPDATE jobs SET status = 'active', updated_at = NOW() WHERE id = $1`, [id]);
            }
        }, 0);
        (0, logger_1.logInfo)('Job execution started', { jobId: id, executionId, userId });
        res.status(202).json({
            data: {
                id: executionId,
                jobId: id,
                status: "running",
                startedAt: new Date().toISOString(),
            },
            message: "Job execution started",
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to start job execution", 500, { userId, jobId: id });
    }
    finally {
        release();
    }
});
// Delete job
router.delete("/:id", (0, authorization_1.requirePermission)(Permissions_1.Permission.JOBS_DELETE), (0, validation_1.validateRequest)(getJobSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        if (!id || !userId) {
            return (0, api_response_1.sendError)(res, 400, 'BAD_REQUEST', 'Job ID and User ID are required', undefined, req.traceId);
        }
        // Check ownership
        await new Promise((resolve, reject) => {
            (0, authorization_1.requireResourceOwnership)(req, res, (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            }, 'job', id);
        });
        const deleted = await jobService.deleteJob(id, userId);
        if (!deleted) {
            return (0, api_response_1.sendError)(res, 404, 'NOT_FOUND', 'Job not found', undefined, req.traceId);
        }
        (0, api_response_1.sendNoContent)(res);
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to delete job", 500, { userId: req.userId, jobId: req.params.id });
    }
});
//# sourceMappingURL=jobs.js.map