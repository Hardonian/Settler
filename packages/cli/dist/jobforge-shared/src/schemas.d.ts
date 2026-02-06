/**
 * Zod schemas for runtime validation
 */
import { z } from 'zod';
export declare const jobStatusSchema: z.ZodEnum<["queued", "running", "succeeded", "failed", "dead", "canceled"]>;
export declare const jobRowSchema: z.ZodObject<{
    id: z.ZodString;
    tenant_id: z.ZodString;
    type: z.ZodString;
    payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    status: z.ZodEnum<["queued", "running", "succeeded", "failed", "dead", "canceled"]>;
    attempts: z.ZodNumber;
    max_attempts: z.ZodNumber;
    run_at: z.ZodString;
    locked_at: z.ZodNullable<z.ZodString>;
    locked_by: z.ZodNullable<z.ZodString>;
    heartbeat_at: z.ZodNullable<z.ZodString>;
    started_at: z.ZodNullable<z.ZodString>;
    finished_at: z.ZodNullable<z.ZodString>;
    idempotency_key: z.ZodNullable<z.ZodString>;
    created_by: z.ZodNullable<z.ZodString>;
    error: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    result_id: z.ZodNullable<z.ZodString>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    tenant_id: string;
    payload: Record<string, unknown>;
    result_id: string | null;
    status: "succeeded" | "failed" | "queued" | "running" | "dead" | "canceled";
    type: string;
    error: Record<string, unknown> | null;
    id: string;
    attempts: number;
    max_attempts: number;
    run_at: string;
    locked_at: string | null;
    locked_by: string | null;
    heartbeat_at: string | null;
    started_at: string | null;
    finished_at: string | null;
    idempotency_key: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}, {
    tenant_id: string;
    payload: Record<string, unknown>;
    result_id: string | null;
    status: "succeeded" | "failed" | "queued" | "running" | "dead" | "canceled";
    type: string;
    error: Record<string, unknown> | null;
    id: string;
    attempts: number;
    max_attempts: number;
    run_at: string;
    locked_at: string | null;
    locked_by: string | null;
    heartbeat_at: string | null;
    started_at: string | null;
    finished_at: string | null;
    idempotency_key: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}>;
export declare const enqueueJobParamsSchema: z.ZodObject<{
    tenant_id: z.ZodString;
    type: z.ZodString;
    payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    idempotency_key: z.ZodOptional<z.ZodString>;
    run_at: z.ZodOptional<z.ZodString>;
    max_attempts: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    tenant_id: string;
    payload: Record<string, unknown>;
    type: string;
    max_attempts?: number | undefined;
    run_at?: string | undefined;
    idempotency_key?: string | undefined;
}, {
    tenant_id: string;
    payload: Record<string, unknown>;
    type: string;
    max_attempts?: number | undefined;
    run_at?: string | undefined;
    idempotency_key?: string | undefined;
}>;
export declare const completeJobParamsSchema: z.ZodObject<{
    job_id: z.ZodString;
    worker_id: z.ZodString;
    status: z.ZodEnum<["succeeded", "failed"]>;
    error: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    result: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    artifact_ref: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "succeeded" | "failed";
    job_id: string;
    worker_id: string;
    error?: Record<string, unknown> | undefined;
    result?: Record<string, unknown> | undefined;
    artifact_ref?: string | undefined;
}, {
    status: "succeeded" | "failed";
    job_id: string;
    worker_id: string;
    error?: Record<string, unknown> | undefined;
    result?: Record<string, unknown> | undefined;
    artifact_ref?: string | undefined;
}>;
//# sourceMappingURL=schemas.d.ts.map