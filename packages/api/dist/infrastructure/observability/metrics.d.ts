/**
 * Prometheus Metrics
 * Exports Prometheus-compatible metrics
 */
import { Registry, Counter, Histogram, Gauge } from 'prom-client';
export declare const register: Registry<"text/plain; version=0.0.4; charset=utf-8">;
export declare const httpRequestDuration: Histogram<"tenant_id" | "route" | "method" | "status_code" | "tier">;
export declare const httpRequestTotal: Counter<"tenant_id" | "route" | "method" | "status_code" | "tier">;
export declare const httpRequestErrors: Counter<"tenant_id" | "route" | "method" | "tier" | "error_type">;
export declare const reconciliationsTotal: Counter<"tenant_id" | "job_id" | "status" | "tier">;
export declare const reconciliationsDuration: Histogram<"tenant_id" | "job_id" | "tier">;
export declare const webhookProcessingDuration: Histogram<"status" | "adapter">;
export declare const webhookDeliveriesTotal: Counter<"status" | "status_code">;
export declare const activeConnections: Gauge<string>;
export declare const queueDepth: Gauge<"tenant_id" | "queue_name" | "priority">;
export declare const tenantQuotaUsage: Gauge<"tenant_id" | "tier" | "quota_type">;
export declare const tenantQuotaLimit: Gauge<"tenant_id" | "tier" | "quota_type">;
export declare const tenantRateLimitHits: Counter<"tenant_id" | "tier">;
export declare const tenantResourceUsage: Histogram<"tenant_id" | "tier" | "resource_type">;
export declare const tenantConcurrentRequests: Gauge<"tenant_id" | "tier">;
export declare const apiKeyUsageTotal: Counter<"user_id" | "api_key_id">;
//# sourceMappingURL=metrics.d.ts.map