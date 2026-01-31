/**
 * Zod schemas for runtime validation
 */

import { z } from 'zod'

export const jobStatusSchema = z.enum([
  'queued',
  'running',
  'succeeded',
  'failed',
  'dead',
  'canceled',
])

export const jobRowSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  type: z.string(),
  payload: z.record(z.unknown()),
  status: jobStatusSchema,
  attempts: z.number().int().min(0),
  max_attempts: z.number().int().min(1),
  run_at: z.string().datetime(),
  locked_at: z.string().datetime().nullable(),
  locked_by: z.string().nullable(),
  heartbeat_at: z.string().datetime().nullable(),
  started_at: z.string().datetime().nullable(),
  finished_at: z.string().datetime().nullable(),
  idempotency_key: z.string().nullable(),
  created_by: z.string().nullable(),
  error: z.record(z.unknown()).nullable(),
  result_id: z.string().uuid().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export const enqueueJobParamsSchema = z.object({
  tenant_id: z.string().uuid(),
  type: z.string().min(1),
  payload: z.record(z.unknown()),
  idempotency_key: z.string().optional(),
  run_at: z.string().datetime().optional(),
  max_attempts: z.number().int().min(1).max(10).optional(),
})

export const completeJobParamsSchema = z.object({
  job_id: z.string().uuid(),
  worker_id: z.string().min(1),
  status: z.enum(['succeeded', 'failed']),
  error: z.record(z.unknown()).optional(),
  result: z.record(z.unknown()).optional(),
  artifact_ref: z.string().optional(),
})
