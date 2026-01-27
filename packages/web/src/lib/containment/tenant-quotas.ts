/**
 * Tenant Quotas & Rate Limiting
 * 
 * Implements per-tenant quotas and rate limits to prevent one tenant
 * from spiking global costs or starving queues.
 */

import { prisma } from '@/shared/db/prismaClient';
import { Prisma } from '@prisma/client';

export interface TenantQuota {
  tenantId: string;
  requestsPerMinute: number;
  jobsPerHour: number;
  maxConcurrentJobs: number;
  maxRecordsPerRun: number; // Tier-based
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

/**
 * Get tenant quota configuration
 * 
 * In production, this should fetch from database based on subscription tier.
 */
export async function getTenantQuota(tenantId: string): Promise<TenantQuota> {
  // Default quotas (can be overridden by subscription tier)
  const defaultQuota: TenantQuota = {
    tenantId,
    requestsPerMinute: 100,
    jobsPerHour: 50,
    maxConcurrentJobs: 5,
    maxRecordsPerRun: 10000,
    maxExportSizeMB: 100,
  };

  // TODO: Fetch from database based on subscription tier
  // For now, return default
  return defaultQuota;
}

/**
 * Check if tenant has exceeded request rate limit
 */
export async function checkRequestRateLimit(
  tenantId: string
): Promise<QuotaCheckResult> {
  const quota = await getTenantQuota(tenantId);
  
  try {
    // Query usage events or telemetry table
    // This is a placeholder - actual implementation depends on your telemetry schema
    const requestsLastMinute = 0; // TODO: Query actual count
    
    if (requestsLastMinute >= quota.requestsPerMinute) {
      return {
        allowed: false,
        reason: 'Rate limit exceeded',
        retryAfter: 60,
        currentUsage: {
          requestsLastMinute,
          jobsLastHour: 0,
          concurrentJobs: 0,
        },
      };
    }

    return {
      allowed: true,
      currentUsage: {
        requestsLastMinute,
        jobsLastHour: 0,
        concurrentJobs: 0,
      },
    };
  } catch {
    console.error('[Quota] Error checking rate limit:', error);
    // Fail open - allow request
    return { allowed: true };
  }
}

/**
 * Check if tenant can create a new job
 */
export async function checkJobQuota(
  tenantId: string,
  estimatedRecords?: number
): Promise<QuotaCheckResult> {
  const quota = await getTenantQuota(tenantId);

  try {
    // Check concurrent jobs
    const concurrentJobs = await getConcurrentJobCount(tenantId);
    if (concurrentJobs >= quota.maxConcurrentJobs) {
      return {
        allowed: false,
        reason: 'Maximum concurrent jobs reached',
        retryAfter: 300, // 5 minutes
        currentUsage: {
          requestsLastMinute: 0,
          jobsLastHour: 0,
          concurrentJobs,
        },
      };
    }

    // Check jobs per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const jobsLastHour = await getJobCountSince(tenantId, oneHourAgo);
    if (jobsLastHour >= quota.jobsPerHour) {
      return {
        allowed: false,
        reason: 'Job quota exceeded for this hour',
        retryAfter: 3600, // 1 hour
        currentUsage: {
          requestsLastMinute: 0,
          jobsLastHour,
          concurrentJobs,
        },
      };
    }

    // Check records per run limit
    if (estimatedRecords && estimatedRecords > quota.maxRecordsPerRun) {
      return {
        allowed: false,
        reason: `Job exceeds maximum records per run (${quota.maxRecordsPerRun})`,
        currentUsage: {
          requestsLastMinute: 0,
          jobsLastHour,
          concurrentJobs,
        },
      };
    }

    return {
      allowed: true,
      currentUsage: {
        requestsLastMinute: 0,
        jobsLastHour,
        concurrentJobs,
      },
    };
  } catch {
    console.error('[Quota] Error checking job quota:', error);
    // Fail open - allow job creation
    return { allowed: true };
  }
}

/**
 * Get count of concurrent jobs for a tenant
 */
async function getConcurrentJobCount(tenantId: string): Promise<number> {
  try {
    // Query jobs table for running jobs
    // This is a placeholder - actual implementation depends on your jobs schema
    const runningJobs = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM jobs
      WHERE tenant_id = ${tenantId}
        AND status IN ('queued', 'running')
    `.catch(() => [{ count: BigInt(0) }]);

    return Number(runningJobs[0]?.count || 0);
  } catch {
    console.error('[Quota] Error getting concurrent job count:', error);
    return 0;
  }
}

/**
 * Get count of jobs created since a timestamp
 */
async function getJobCountSince(tenantId: string, since: Date): Promise<number> {
  try {
    const jobs = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM jobs
      WHERE tenant_id = ${tenantId}
        AND created_at >= ${since}
    `.catch(() => [{ count: BigInt(0) }]);

    return Number(jobs[0]?.count || 0);
  } catch {
    console.error('[Quota] Error getting job count:', error);
    return 0;
  }
}

/**
 * Record usage for quota tracking
 */
export async function recordUsage(
  tenantId: string,
  type: 'request' | 'job' | 'export',
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    // Record in usage events table
    // This is a placeholder - actual implementation depends on your telemetry schema
    await prisma.usageEvent.create({
      data: {
        billingAccountId: tenantId, // Assuming tenantId maps to billingAccountId
        eventType: type,
        quantity: 1,
        metadata: (metadata || {}) as Prisma.InputJsonValue,
      },
    }).catch(() => {
      // Ignore errors - usage tracking is best-effort
    });
  } catch {
    console.error('[Quota] Error recording usage:', error);
    // Don't throw - usage tracking is best-effort
  }
}
