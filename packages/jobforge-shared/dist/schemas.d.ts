/**
 * Zod schemas for runtime validation
 */
import { z } from "zod";
export declare const jobStatusSchema: z.ZodEnum<{
    queued: "queued";
    running: "running";
    succeeded: "succeeded";
    failed: "failed";
    dead: "dead";
    canceled: "canceled";
}>;
export declare const jobRowSchema: z.ZodObject<{
    id: z.ZodString;
    tenant_id: z.ZodString;
    type: z.ZodString;
    payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    status: z.ZodEnum<{
        queued: "queued";
        running: "running";
        succeeded: "succeeded";
        failed: "failed";
        dead: "dead";
        canceled: "canceled";
    }>;
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
}, z.core.$strip>;
export declare const enqueueJobParamsSchema: z.ZodObject<{
    tenant_id: z.ZodString;
    type: z.ZodString;
    payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    idempotency_key: z.ZodOptional<z.ZodString>;
    run_at: z.ZodOptional<z.ZodString>;
    max_attempts: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const completeJobParamsSchema: z.ZodObject<{
    job_id: z.ZodString;
    worker_id: z.ZodString;
    status: z.ZodEnum<{
        succeeded: "succeeded";
        failed: "failed";
    }>;
    error: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    result: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    artifact_ref: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
//# sourceMappingURL=schemas.d.ts.map