/**
 * Admin Dashboard Metric Contracts
 *
 * TypeScript types and Zod schemas for snapshot and delta events.
 * Ensures type safety and validation across the admin dashboard system.
 */

import { z } from "zod";

// ============================================================================
// Time Range Types
// ============================================================================

export const TimeRangeSchema = z.enum(["24h", "7d", "30d", "custom"]);
export type TimeRange = z.infer<typeof TimeRangeSchema>;

// ============================================================================
// KPI Metrics
// ============================================================================

export const KPIMetricsSchema = z.object({
  matchedPercent: z.number().min(0).max(100),
  exceptionsCount: z.number().int().min(0),
  avgTimeToResolve: z.number().min(0), // milliseconds
  totalVolume: z.number().int().min(0),
  refundsCount: z.number().int().min(0),
  payoutGaps: z.number().int().min(0),
  matchedCount: z.number().int().min(0),
  unmatchedCount: z.number().int().min(0),
  confidenceAvg: z.number().min(0).max(1).nullable(),
  confidenceMin: z.number().min(0).max(1).nullable(),
  confidenceMax: z.number().min(0).max(1).nullable(),
});
export type KPIMetrics = z.infer<typeof KPIMetricsSchema>;

// ============================================================================
// Trend Data Points
// ============================================================================

export const TrendPointSchema = z.object({
  timestamp: z.string(),
  value: z.number(),
});
export type TrendPoint = z.infer<typeof TrendPointSchema>;

export const TrendDataSchema = z.object({
  matchedPercent: z.array(TrendPointSchema),
  exceptions: z.array(TrendPointSchema),
  volume: z.array(TrendPointSchema),
  avgTimeToResolve: z.array(TrendPointSchema),
});
export type TrendData = z.infer<typeof TrendDataSchema>;

// ============================================================================
// Exception Heatmap
// ============================================================================

export const ExceptionHeatmapSchema = z.object({
  source: z.string(),
  severity: z.enum(["info", "warn", "critical"]),
  count: z.number().int().min(0),
});
export type ExceptionHeatmap = z.infer<typeof ExceptionHeatmapSchema>;

// ============================================================================
// Activity Feed Item
// ============================================================================

export const ActivityFeedItemSchema = z.object({
  id: z.string().uuid(),
  type: z.enum([
    "run_completed",
    "exception_created",
    "exception_resolved",
    "match_reviewed",
    "export_created",
  ]),
  timestamp: z.string(),
  message: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type ActivityFeedItem = z.infer<typeof ActivityFeedItemSchema>;

// ============================================================================
// Snapshot Response
// ============================================================================

export const MetricsSnapshotSchema = z.object({
  timestamp: z.string(),
  range: TimeRangeSchema,
  kpis: KPIMetricsSchema,
  trends: TrendDataSchema,
  exceptionHeatmap: z.array(ExceptionHeatmapSchema),
  recentActivity: z.array(ActivityFeedItemSchema),
});
export type MetricsSnapshot = z.infer<typeof MetricsSnapshotSchema>;

// ============================================================================
// Exception Queue Item
// ============================================================================

export const ExceptionStatusSchema = z.enum(["new", "in_review", "resolved", "exported"]);
export type ExceptionStatus = z.infer<typeof ExceptionStatusSchema>;

export const ExceptionSeveritySchema = z.enum(["info", "warn", "critical"]);
export type ExceptionSeverity = z.infer<typeof ExceptionSeveritySchema>;

export const ExceptionItemSchema = z.object({
  id: z.string().uuid(),
  runId: z.string().uuid().nullable(),
  matchId: z.string().uuid().nullable(),
  tenantId: z.string().uuid(),
  source: z.string(),
  severity: ExceptionSeveritySchema,
  status: ExceptionStatusSchema,
  reason: z.string(),
  ruleId: z.string().nullable(),
  detectorId: z.string().nullable(),
  evidence: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  reviewedBy: z.string().uuid().nullable(),
  reviewedAt: z.string().datetime().nullable(),
  slaTimer: z.number().int().min(0).nullable(), // milliseconds since creation
});
export type ExceptionItem = z.infer<typeof ExceptionItemSchema>;

// ============================================================================
// Reconciliation Run
// ============================================================================

export const RunStatusSchema = z.enum(["pending", "running", "completed", "failed"]);
export type RunStatus = z.infer<typeof RunStatusSchema>;

export const ReconciliationRunSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().nullable(),
  status: RunStatusSchema,
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  sourceCount: z.number().int().min(0),
  targetCount: z.number().int().min(0),
  matchedCount: z.number().int().min(0),
  unmatchedSourceCount: z.number().int().min(0),
  unmatchedTargetCount: z.number().int().min(0),
  confidenceAvg: z.number().min(0).max(1).nullable(),
  errorMessage: z.string().nullable(),
  traceId: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type ReconciliationRun = z.infer<typeof ReconciliationRunSchema>;

// ============================================================================
// Audit Trail Item
// ============================================================================

export const AuditItemSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  userId: z.string().uuid().nullable(),
  auditType: z.string(),
  action: z.string(),
  entityType: z.string().nullable(),
  entityId: z.string().uuid().nullable(),
  changes: z.record(z.string(), z.unknown()).nullable(),
  beforeState: z.record(z.string(), z.unknown()).nullable(),
  afterState: z.record(z.string(), z.unknown()).nullable(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string().datetime(),
});
export type AuditItem = z.infer<typeof AuditItemSchema>;

// ============================================================================
// Delta Events (for SSE)
// ============================================================================

export const MetricsDeltaSchema = z.object({
  type: z.literal("metrics_delta"),
  kpis: KPIMetricsSchema.partial(),
  timestamp: z.string(),
});
export type MetricsDelta = z.infer<typeof MetricsDeltaSchema>;

export const ExceptionsDeltaSchema = z.object({
  type: z.literal("exceptions_delta"),
  added: z.array(ExceptionItemSchema).optional(),
  updated: z.array(ExceptionItemSchema).optional(),
  removed: z.array(z.string().uuid()).optional(),
  counts: z
    .object({
      new: z.number().int().min(0),
      in_review: z.number().int().min(0),
      resolved: z.number().int().min(0),
      exported: z.number().int().min(0),
    })
    .optional(),
  timestamp: z.string(),
});
export type ExceptionsDelta = z.infer<typeof ExceptionsDeltaSchema>;

export const RunDeltaSchema = z.object({
  type: z.literal("run_delta"),
  run: ReconciliationRunSchema,
  timestamp: z.string(),
});
export type RunDelta = z.infer<typeof RunDeltaSchema>;

export const HealthDeltaSchema = z.object({
  type: z.literal("health"),
  status: z.enum(["connected", "reconnecting", "offline"]),
  latency: z.number().min(0).nullable(),
  timestamp: z.string(),
});
export type HealthDelta = z.infer<typeof HealthDeltaSchema>;

export const StreamEventSchema = z.discriminatedUnion("type", [
  MetricsDeltaSchema,
  ExceptionsDeltaSchema,
  RunDeltaSchema,
  HealthDeltaSchema,
]);
export type StreamEvent = z.infer<typeof StreamEventSchema>;

// ============================================================================
// API Request/Response Types
// ============================================================================

export const MetricsQueryParamsSchema = z.object({
  range: TimeRangeSchema.default("24h"),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  tenantId: z.string().uuid().optional(),
});

export const ExceptionsQueryParamsSchema = z.object({
  status: ExceptionStatusSchema.optional(),
  severity: ExceptionSeveritySchema.optional(),
  source: z.string().optional(),
  tenantId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const RunsQueryParamsSchema = z.object({
  status: RunStatusSchema.optional(),
  tenantId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const AuditQueryParamsSchema = z.object({
  ruleId: z.string().optional(),
  source: z.string().optional(),
  status: z.string().optional(),
  actor: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
