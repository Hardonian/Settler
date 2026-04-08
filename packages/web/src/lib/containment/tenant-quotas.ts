/**
 * Tenant Quotas & Rate Limiting
 *
 * Implements per-tenant quotas and rate limits to prevent one tenant
 * from spiking global costs or starving queues.
 *
 * Quota tiers are resolved from the `subscriptions` table via Supabase.
 * Usage counters query the `recon_jobs` (Prisma) and `ai_usage_events`
 * (Supabase) tables as available.
 */

import { prisma } from "@/shared/db/prismaClient";
import { Prisma } from "@prisma/client";
import { createAdminClient } from "@/lib/supabase/server";

export interface TenantQuota {
  tenantId: string;
  requestsPerMinute: number;
  jobsPerHour: number;
  maxConcurrentJobs: number;
  maxRecordsPerRun: number;
  maxExportSizeMB: number;
}

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  retryAfter?: number; // seconds
  currentUsage?: {
    requestsLastMinute: number;
    jobsLastHour: number;
    concurrentJobs: number;
  };
}

// ---------------------------------------------------------------------------
// Tier-based quota matrix
// ---------------------------------------------------------------------------

const QUOTA_BY_PLAN: Record<string, Omit<TenantQuota, "tenantId">> = {
  free: {
    requestsPerMinute: 30,
    jobsPerHour: 10,
    maxConcurrentJobs: 2,
    maxRecordsPerRun: 5000,
    maxExportSizeMB: 25,
  },
  starter: {
    requestsPerMinute: 100,
    jobsPerHour: 50,
    maxConcurrentJobs: 5,
    maxRecordsPerRun: 10000,
    maxExportSizeMB: 100,
  },
  pro: {
    requestsPerMinute: 300,
    jobsPerHour: 200,
    maxConcurrentJobs: 10,
    maxRecordsPerRun: 100000,
    maxExportSizeMB: 500,
  },
  enterprise: {
    requestsPerMinute: 1000,
    jobsPerHour: 1000,
    maxConcurrentJobs: 50,
    maxRecordsPerRun: 1000000,
    maxExportSizeMB: 2048,
  },
};

const DEFAULT_QUOTA: Omit<TenantQuota, "tenantId"> = QUOTA_BY_PLAN.starter ?? {
  requestsPerMinute: 100,
  jobsPerHour: 50,
  maxConcurrentJobs: 5,
  maxRecordsPerRun: 10000,
  maxExportSizeMB: 100,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get tenant quota configuration resolved from the subscriptions table.
 */
export async function getTenantQuota(tenantId: string): Promise<TenantQuota> {
  try {
    const admin = await createAdminClient();

    // Look up active subscription for this tenant
    const { data: subscription } = await admin
      .from("subscriptions")
      .select("plan_id, plan_name, status")
      .eq("billing_account_id", tenantId)
      .in("status", ["active", "trialing"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const planKey = (subscription?.plan_id ?? subscription?.plan_name ?? "starter")
      .toLowerCase()
      .split("_")[0]; // e.g. "pro_annual" → "pro"

    const tierQuota: Omit<TenantQuota, "tenantId"> = QUOTA_BY_PLAN[planKey] ?? DEFAULT_QUOTA;

    return { tenantId, ...tierQuota };
  } catch {
    return { tenantId, ...DEFAULT_QUOTA };
  }
}

/**
 * Check if tenant has exceeded request rate limit.
 * Queries ai_usage_events for request count in the last minute.
 */
export async function checkRequestRateLimit(tenantId: string): Promise<QuotaCheckResult> {
  const quota = await getTenantQuota(tenantId);

  try {
    const admin = await createAdminClient();
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();

    const { count } = await admin
      .from("ai_usage_events")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .gte("created_at", oneMinuteAgo);

    const requestsLastMinute = count ?? 0;

    if (requestsLastMinute >= quota.requestsPerMinute) {
      return {
        allowed: false,
        reason: "Rate limit exceeded",
        retryAfter: 60,
        currentUsage: { requestsLastMinute, jobsLastHour: 0, concurrentJobs: 0 },
      };
    }

    return {
      allowed: true,
      currentUsage: { requestsLastMinute, jobsLastHour: 0, concurrentJobs: 0 },
    };
  } catch (error) {
    console.error("[Quota] Error checking rate limit:", error);
    return { allowed: true }; // fail open
  }
}

/**
 * Check if tenant can create a new reconciliation job.
 */
export async function checkJobQuota(
  tenantId: string,
  estimatedRecords?: number
): Promise<QuotaCheckResult> {
  const quota = await getTenantQuota(tenantId);

  try {
    const concurrentJobs = await getConcurrentJobCount(tenantId);
    if (concurrentJobs >= quota.maxConcurrentJobs) {
      return {
        allowed: false,
        reason: "Maximum concurrent jobs reached",
        retryAfter: 300,
        currentUsage: { requestsLastMinute: 0, jobsLastHour: 0, concurrentJobs },
      };
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const jobsLastHour = await getJobCountSince(tenantId, oneHourAgo);
    if (jobsLastHour >= quota.jobsPerHour) {
      return {
        allowed: false,
        reason: "Job quota exceeded for this hour",
        retryAfter: 3600,
        currentUsage: { requestsLastMinute: 0, jobsLastHour, concurrentJobs },
      };
    }

    if (estimatedRecords && estimatedRecords > quota.maxRecordsPerRun) {
      return {
        allowed: false,
        reason: `Job exceeds maximum records per run (${quota.maxRecordsPerRun})`,
        currentUsage: { requestsLastMinute: 0, jobsLastHour, concurrentJobs },
      };
    }

    return {
      allowed: true,
      currentUsage: { requestsLastMinute: 0, jobsLastHour, concurrentJobs },
    };
  } catch (error) {
    console.error("[Quota] Error checking job quota:", error);
    return { allowed: true }; // fail open
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function getConcurrentJobCount(tenantId: string): Promise<number> {
  try {
    const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM recon_jobs
      WHERE tenant_id = ${tenantId}
        AND status IN ('queued', 'running')
    `.catch(() => [{ count: BigInt(0) }]);
    return Number(rows[0]?.count ?? 0);
  } catch {
    return 0;
  }
}

async function getJobCountSince(tenantId: string, since: Date): Promise<number> {
  try {
    const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM recon_jobs
      WHERE tenant_id = ${tenantId}
        AND created_at >= ${since}
    `.catch(() => [{ count: BigInt(0) }]);
    return Number(rows[0]?.count ?? 0);
  } catch {
    return 0;
  }
}

/**
 * Record usage for quota / billing tracking.
 */
export async function recordUsage(
  tenantId: string,
  type: "request" | "job" | "export",
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.usageEvent
      .create({
        data: {
          billingAccountId: tenantId,
          eventType: type,
          quantity: 1,
          metadata: (metadata ?? {}) as Prisma.InputJsonValue,
        },
      })
      .catch(() => {
        // Ignore errors — usage tracking is best-effort
      });
  } catch (error) {
    console.error("[Quota] Error recording usage:", error);
  }
}
