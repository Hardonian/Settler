/**
 * Quota Service
 * Enforces resource quotas for tenants
 */

import { ITenantRepository } from '../../domain/repositories/ITenantRepository';
import { query } from '../../db';
import { logWarn } from '../../utils/logger';

export enum QuotaType {
  RATE_LIMIT = 'rateLimitRpm',
  STORAGE = 'storageBytes',
  CONCURRENT_JOBS = 'concurrentJobs',
  MONTHLY_RECONCILIATIONS = 'monthlyReconciliations',
  CUSTOM_DOMAINS = 'customDomains',
}

export class QuotaExceededError extends Error {
  constructor(
    public quotaType: QuotaType,
    public currentUsage: number,
    public limit: number
  ) {
    super(`Quota exceeded: ${quotaType}. Usage: ${currentUsage}/${limit}`);
    this.name = 'QuotaExceededError';
  }
}

export class QuotaService {
  constructor(private tenantRepo: ITenantRepository) {}

  /**
   * Check if tenant can perform an action within quota limits
   */
  async checkQuota(
    tenantId: string,
    quotaType: QuotaType,
    requestedValue: number = 1
  ): Promise<{ allowed: boolean; currentUsage: number; limit: number }> {
    const tenant = await this.tenantRepo.findById(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Enterprise tenants bypass quotas
    if (tenant.isEnterprise()) {
      return { allowed: true, currentUsage: 0, limit: Infinity };
    }

    const quotas = tenant.quotas;
    let limit: number;
    let currentUsage: number = 0;

    switch (quotaType) {
      case QuotaType.STORAGE:
        limit = quotas.storageBytes;
        const storageResult = await query<{ current_storage_bytes: number }>(
          `SELECT COALESCE(current_storage_bytes, 0) as current_storage_bytes
           FROM tenant_quota_usage WHERE tenant_id = $1`,
          [tenantId]
        );
        currentUsage = storageResult[0]?.current_storage_bytes || 0;
        break;

      case QuotaType.CONCURRENT_JOBS:
        limit = quotas.concurrentJobs;
        const jobsResult = await query<{ count: number }>(
          `SELECT COUNT(*)::INTEGER as count
           FROM executions
           WHERE tenant_id = $1 AND status = 'running'`,
          [tenantId]
        );
        currentUsage = jobsResult[0]?.count || 0;
        break;

      case QuotaType.MONTHLY_RECONCILIATIONS:
        limit = quotas.monthlyReconciliations;
        const reconResult = await query<{ sum: number }>(
          `SELECT COALESCE(SUM(metric_value), 0)::BIGINT as sum
           FROM tenant_usage
           WHERE tenant_id = $1
             AND metric_type = 'reconciliation'
             AND period_start >= date_trunc('month', NOW())`,
          [tenantId]
        );
        currentUsage = reconResult[0]?.sum || 0;
        break;

      case QuotaType.CUSTOM_DOMAINS:
        limit = quotas.customDomains === -1 ? Infinity : quotas.customDomains;
        const domainResult = await query<{ count: number }>(
          `SELECT COUNT(*)::INTEGER as count
           FROM tenants
           WHERE id = $1 AND config->>'customDomain' IS NOT NULL
             AND config->>'customDomainVerified' = 'true'`,
          [tenantId]
        );
        currentUsage = domainResult[0]?.count || 0;
        break;

      case QuotaType.RATE_LIMIT:
        // Rate limiting is handled separately by RateLimitService
        limit = quotas.rateLimitRpm;
        return { allowed: true, currentUsage: 0, limit };

      default:
        throw new Error(`Unknown quota type: ${quotaType}`);
    }

    const allowed = (currentUsage + requestedValue) <= limit;

    if (!allowed) {
      logWarn('Quota exceeded', {
        tenantId,
        quotaType,
        currentUsage,
        limit,
        requestedValue,
      });
    }

    return { allowed, currentUsage, limit };
  }

  /**
   * Enforce quota - throws QuotaExceededError if exceeded
   */
  async enforceQuota(
    tenantId: string,
    quotaType: QuotaType,
    requestedValue: number = 1
  ): Promise<void> {
    const { allowed, currentUsage, limit } = await this.checkQuota(
      tenantId,
      quotaType,
      requestedValue
    );

    if (!allowed) {
      throw new QuotaExceededError(quotaType, currentUsage, limit);
    }
  }

  /**
   * Increment quota usage
   */
  async incrementUsage(
    tenantId: string,
    quotaType: QuotaType,
    value: number = 1
  ): Promise<void> {
    switch (quotaType) {
      case QuotaType.STORAGE:
        await query(
          `INSERT INTO tenant_quota_usage (tenant_id, current_storage_bytes, updated_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (tenant_id) DO UPDATE SET
             current_storage_bytes = tenant_quota_usage.current_storage_bytes + $2,
             updated_at = NOW()`,
          [tenantId, value]
        );
        break;

      case QuotaType.CONCURRENT_JOBS:
        await query(
          `INSERT INTO tenant_quota_usage (tenant_id, current_concurrent_jobs, updated_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (tenant_id) DO UPDATE SET
             current_concurrent_jobs = tenant_quota_usage.current_concurrent_jobs + $2,
             updated_at = NOW()`,
          [tenantId, value]
        );
        break;

      case QuotaType.MONTHLY_RECONCILIATIONS:
        await query(
          `INSERT INTO tenant_usage (tenant_id, metric_type, metric_value, period_start, period_end)
           VALUES ($1, 'reconciliation', $2, date_trunc('month', NOW()), date_trunc('month', NOW()) + INTERVAL '1 month')
           ON CONFLICT (tenant_id, metric_type, period_start) DO UPDATE SET
             metric_value = tenant_usage.metric_value + $2`,
          [tenantId, value]
        );
        break;

      default:
        // Other quota types don't need explicit tracking
        break;
    }
  }

  /**
   * Decrement quota usage
   */
  async decrementUsage(
    tenantId: string,
    quotaType: QuotaType,
    value: number = 1
  ): Promise<void> {
    switch (quotaType) {
      case QuotaType.STORAGE:
        await query(
          `UPDATE tenant_quota_usage
           SET current_storage_bytes = GREATEST(0, current_storage_bytes - $2),
               updated_at = NOW()
           WHERE tenant_id = $1`,
          [tenantId, value]
        );
        break;

      case QuotaType.CONCURRENT_JOBS:
        await query(
          `UPDATE tenant_quota_usage
           SET current_concurrent_jobs = GREATEST(0, current_concurrent_jobs - $2),
               updated_at = NOW()
           WHERE tenant_id = $1`,
          [tenantId, value]
        );
        break;

      default:
        // Other quota types don't need explicit decrementing
        break;
    }
  }

  /**
   * Get current usage for all quotas
   */
  async getUsage(tenantId: string): Promise<Record<QuotaType, { current: number; limit: number }>> {
    const tenant = await this.tenantRepo.findById(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const quotas = tenant.quotas;
    const usageResult = await query<{
      current_storage_bytes: number;
      current_concurrent_jobs: number;
    }>(
      `SELECT COALESCE(current_storage_bytes, 0) as current_storage_bytes,
              COALESCE(current_concurrent_jobs, 0) as current_concurrent_jobs
       FROM tenant_quota_usage WHERE tenant_id = $1`,
      [tenantId]
    );

    const monthlyReconResult = await query<{ sum: number }>(
      `SELECT COALESCE(SUM(metric_value), 0)::BIGINT as sum
       FROM tenant_usage
       WHERE tenant_id = $1
         AND metric_type = 'reconciliation'
         AND period_start >= date_trunc('month', NOW())`,
      [tenantId]
    );

    const usage = usageResult[0] || { current_storage_bytes: 0, current_concurrent_jobs: 0 };
    const monthlyRecon = monthlyReconResult[0]?.sum || 0;

    return {
      [QuotaType.STORAGE]: {
        current: usage.current_storage_bytes,
        limit: quotas.storageBytes,
      },
      [QuotaType.CONCURRENT_JOBS]: {
        current: usage.current_concurrent_jobs,
        limit: quotas.concurrentJobs,
      },
      [QuotaType.MONTHLY_RECONCILIATIONS]: {
        current: monthlyRecon,
        limit: quotas.monthlyReconciliations,
      },
      [QuotaType.RATE_LIMIT]: {
        current: 0, // Tracked separately
        limit: quotas.rateLimitRpm,
      },
      [QuotaType.CUSTOM_DOMAINS]: {
        current: 0, // Tracked separately
        limit: quotas.customDomains === -1 ? Infinity : quotas.customDomains,
      },
    };
  }
}
