import { z } from "zod";

export const ReconReasonCategorySchema = z.enum([
  "match",
  "missing",
  "drift",
  "mismatch",
  "unclassified",
]);

export type ReconReasonCategory = z.infer<typeof ReconReasonCategorySchema>;

export const SourceTraceSchema = z
  .object({
    source: z.string(),
    recordId: z.string().optional(),
    line: z.number().int().nonnegative().optional(),
    column: z.string().optional(),
    field: z.string().optional(),
    path: z.string().optional(),
    note: z.string().optional(),
  })
  .passthrough();

export type SourceTrace = z.infer<typeof SourceTraceSchema>;

export const ReconItemSchema = z
  .object({
    id: z.string(),
    status: z.enum(["match", "missing", "drift", "mismatch"]),
    reasonCategory: ReconReasonCategorySchema.optional().default("unclassified"),
    reason: z.string().optional(),
    amount: z.number().optional(),
    currency: z.string().optional(),
    sourceTrace: SourceTraceSchema.optional(),
    targetTrace: SourceTraceSchema.optional(),
    fields: z.record(z.string(), z.unknown()).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export type ReconItem = z.infer<typeof ReconItemSchema>;

export const ReconRunSchema = z
  .object({
    runId: z.string(),
    status: z.enum(["completed", "running", "failed"]),
    startedAt: z.string(),
    completedAt: z.string().optional(),
    summary: z
      .object({
        totalItems: z.number().int().nonnegative().optional(),
        matched: z.number().int().nonnegative().optional(),
        missing: z.number().int().nonnegative().optional(),
        drift: z.number().int().nonnegative().optional(),
        mismatched: z.number().int().nonnegative().optional(),
      })
      .partial()
      .optional(),
    items: z.array(ReconItemSchema).default([]),
    raw: z
      .object({
        json: z.unknown().optional(),
        csv: z.string().optional(),
        log: z.string().optional(),
      })
      .partial()
      .optional(),
  })
  .passthrough();

export type ReconRun = z.infer<typeof ReconRunSchema>;

export const coerceReconRun = (raw: unknown): ReconRun | null => {
  const parsed = ReconRunSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
};
