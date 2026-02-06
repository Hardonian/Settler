"use strict";
/**
 * Zod schemas for runtime validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeJobParamsSchema = exports.enqueueJobParamsSchema = exports.jobRowSchema = exports.jobStatusSchema = void 0;
const zod_1 = require("zod");
exports.jobStatusSchema = zod_1.z.enum([
    'queued',
    'running',
    'succeeded',
    'failed',
    'dead',
    'canceled',
]);
exports.jobRowSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenant_id: zod_1.z.string().uuid(),
    type: zod_1.z.string(),
    payload: zod_1.z.record(zod_1.z.unknown()),
    status: exports.jobStatusSchema,
    attempts: zod_1.z.number().int().min(0),
    max_attempts: zod_1.z.number().int().min(1),
    run_at: zod_1.z.string().datetime(),
    locked_at: zod_1.z.string().datetime().nullable(),
    locked_by: zod_1.z.string().nullable(),
    heartbeat_at: zod_1.z.string().datetime().nullable(),
    started_at: zod_1.z.string().datetime().nullable(),
    finished_at: zod_1.z.string().datetime().nullable(),
    idempotency_key: zod_1.z.string().nullable(),
    created_by: zod_1.z.string().nullable(),
    error: zod_1.z.record(zod_1.z.unknown()).nullable(),
    result_id: zod_1.z.string().uuid().nullable(),
    created_at: zod_1.z.string().datetime(),
    updated_at: zod_1.z.string().datetime(),
});
exports.enqueueJobParamsSchema = zod_1.z.object({
    tenant_id: zod_1.z.string().uuid(),
    type: zod_1.z.string().min(1),
    payload: zod_1.z.record(zod_1.z.unknown()),
    idempotency_key: zod_1.z.string().optional(),
    run_at: zod_1.z.string().datetime().optional(),
    max_attempts: zod_1.z.number().int().min(1).max(10).optional(),
});
exports.completeJobParamsSchema = zod_1.z.object({
    job_id: zod_1.z.string().uuid(),
    worker_id: zod_1.z.string().min(1),
    status: zod_1.z.enum(['succeeded', 'failed']),
    error: zod_1.z.record(zod_1.z.unknown()).optional(),
    result: zod_1.z.record(zod_1.z.unknown()).optional(),
    artifact_ref: zod_1.z.string().optional(),
});
//# sourceMappingURL=schemas.js.map