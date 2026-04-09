/**
 * Cost Controls Service
 * Usage ceilings per tenant and background job limits
 */

import { query } from "../../db";
import { logInfo, logError } from "../../utils/logger";

export interface TenantUsageCeiling {
  tenantId: string;
  billingAccountId: string;
  usageType: "ingestions" | "reconciliations" | "api_requests" | "storage";
  monthlyLimit: number;
  currentUsage: number;
  resetDate: Date;
}

export interface BackgroundJobLimit {
  jobType: "ingestion" | "reconciliation" | "webhook" | "export";
  maxConcurrent: number;
  currentRunning: number;
  maxPerTenant: number;
}

/**
 * Set usage ceiling for a tenant
 */
export async function setTenantUsageCeiling(
  tenantId: string,
  billingAccountId: string,
  usageType: TenantUsageCeiling["usageType"],
  monthlyLimit: number
): Promise<void> {
  if (!tenantId || typeof tenantId !== "string") {
    throw new Error("Invalid tenantId");
  }
  if (!billingAccountId || typeof billingAccountId !== "string") {
    throw new Error("Invalid billingAccountId");
  }
  if (!usageType || typeof usageType !== "string") {
    throw new Error("Invalid usageType");
  }
  if (typeof monthlyLimit !== "number" || monthlyLimit < 0 || isNaN(monthlyLimit)) {
    throw new Error("Invalid monthlyLimit: must be a non-negative number");
  }

  try {
    const resetDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
    await query(
      `INSERT INTO tenant_usage_ceilings (
        tenant_id, billing_account_id, usage_type, monthly_limit, reset_date
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (tenant_id, usage_type)
      DO UPDATE SET 
        monthly_limit = EXCLUDED.monthly_limit,
        updated_at = NOW()`,
      [tenantId, billingAccountId, usageType, monthlyLimit, resetDate]
    );

    logInfo("Usage ceiling set", { tenantId, usageType, monthlyLimit });
  } catch (error) {
    logError("Failed to set usage ceiling", error, { tenantId, usageType });
    throw error;
  }
}

/**
 * Check if tenant has exceeded usage ceiling
 */
export async function checkUsageCeiling(
  tenantId: string,
  usageType: TenantUsageCeiling["usageType"]
): Promise<{ exceeded: boolean; currentUsage: number; limit: number }> {
  try {
    const ceiling = await query<{
      monthly_limit: number;
      reset_date: Date;
    }>(
      `SELECT monthly_limit, reset_date
       FROM tenant_usage_ceilings
       WHERE tenant_id = $1 AND usage_type = $2`,
      [tenantId, usageType]
    );

    if (ceiling.length === 0 || !ceiling[0]) {
      // No ceiling set, allow usage
      return { exceeded: false, currentUsage: 0, limit: Infinity };
    }

    const ceilingRecord = ceiling[0];
    const limit = Number(ceilingRecord.monthly_limit);
    const resetDate = ceilingRecord.reset_date;

    // Get current usage for this month
    const currentUsage = await getCurrentUsage(tenantId, usageType, resetDate);

    return {
      exceeded: currentUsage >= limit,
      currentUsage,
      limit,
    };
  } catch (error) {
    logError("Failed to check usage ceiling", error, { tenantId, usageType });
    // Fail open - allow usage if check fails
    return { exceeded: false, currentUsage: 0, limit: Infinity };
  }
}

/**
 * Get current usage for tenant
 */
async function getCurrentUsage(
  tenantId: string,
  usageType: TenantUsageCeiling["usageType"],
  resetDate: Date
): Promise<number> {
  const startDate =
    resetDate < new Date()
      ? new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      : resetDate;

  switch (usageType) {
    case "ingestions": {
      const ingestionCount = await query<{ count: number }>(
        `SELECT COUNT(*) as count
         FROM ingestions
         WHERE tenant_id = $1
           AND created_at >= $2
           AND status != 'failed'`,
        [tenantId, startDate]
      );
      return Number(ingestionCount[0]?.count || 0);
    }

    case "reconciliations": {
      const reconCount = await query<{ count: number }>(
        `SELECT COUNT(*) as count
         FROM reconciliation_runs
         WHERE tenant_id = $1
           AND started_at >= $2`,
        [tenantId, startDate]
      );
      return Number(reconCount[0]?.count || 0);
    }

    case "api_requests": {
      const requestCount = await query<{ count: number }>(
        `SELECT COUNT(*) as count
         FROM audit_logs
         WHERE tenant_id = $1
           AND timestamp >= $2`,
        [tenantId, startDate]
      );
      return Number(requestCount[0]?.count || 0);
    }

    case "storage":
      // Estimate storage usage (would need actual storage tracking)
      return 0;

    default:
      return 0;
  }
}

/**
 * Set background job limit
 */
export async function setBackgroundJobLimit(
  jobType: BackgroundJobLimit["jobType"],
  maxConcurrent: number,
  maxPerTenant: number
): Promise<void> {
  try {
    await query(
      `INSERT INTO background_job_limits (
        job_type, max_concurrent, max_per_tenant, updated_at
      ) VALUES ($1, $2, $3, NOW())
      ON CONFLICT (job_type)
      DO UPDATE SET 
        max_concurrent = EXCLUDED.max_concurrent,
        max_per_tenant = EXCLUDED.max_per_tenant,
        updated_at = NOW()`,
      [jobType, maxConcurrent, maxPerTenant]
    );

    logInfo("Background job limit set", { jobType, maxConcurrent, maxPerTenant });
  } catch (error) {
    logError("Failed to set background job limit", error, { jobType });
    throw error;
  }
}

/**
 * Check if background job can run
 */
export async function canRunBackgroundJob(
  jobType: BackgroundJobLimit["jobType"],
  tenantId?: string
): Promise<{ allowed: boolean; reason?: string; currentRunning: number; limit: number }> {
  try {
    const limit = await query<{
      max_concurrent: number;
      max_per_tenant: number;
    }>(
      `SELECT max_concurrent, max_per_tenant
       FROM background_job_limits
       WHERE job_type = $1`,
      [jobType]
    );

    if (limit.length === 0 || !limit[0]) {
      // No limit set, allow
      return { allowed: true, currentRunning: 0, limit: Infinity };
    }

    const limitRecord = limit[0];
    const maxConcurrent = Number(limitRecord.max_concurrent);
    const maxPerTenant = Number(limitRecord.max_per_tenant);

    // Get current running jobs
    const currentRunning = await getCurrentRunningJobs(jobType, tenantId);

    // Check global limit
    if (currentRunning.global >= maxConcurrent) {
      return {
        allowed: false,
        reason: `Global limit exceeded: ${currentRunning.global}/${maxConcurrent}`,
        currentRunning: currentRunning.global,
        limit: maxConcurrent,
      };
    }

    // Check per-tenant limit if tenantId provided
    if (tenantId && currentRunning.perTenant >= maxPerTenant) {
      return {
        allowed: false,
        reason: `Tenant limit exceeded: ${currentRunning.perTenant}/${maxPerTenant}`,
        currentRunning: currentRunning.perTenant,
        limit: maxPerTenant,
      };
    }

    return {
      allowed: true,
      currentRunning: tenantId ? currentRunning.perTenant : currentRunning.global,
      limit: tenantId ? maxPerTenant : maxConcurrent,
    };
  } catch (error) {
    logError("Failed to check background job limit", error, { jobType, tenantId });
    // Fail open - allow job if check fails
    return { allowed: true, currentRunning: 0, limit: Infinity };
  }
}

/**
 * Get current running jobs count
 */
async function getCurrentRunningJobs(
  jobType: BackgroundJobLimit["jobType"],
  tenantId?: string
): Promise<{ global: number; perTenant: number }> {
  let globalQuery = "";
  let tenantQuery = "";

  switch (jobType) {
    case "ingestion":
      globalQuery = `SELECT COUNT(*) as count FROM ingestions WHERE status = 'processing'`;
      tenantQuery = tenantId
        ? `SELECT COUNT(*) as count FROM ingestions WHERE status = 'processing' AND tenant_id = $1`
        : "";
      break;
    case "reconciliation":
      globalQuery = `SELECT COUNT(*) as count FROM reconciliation_runs WHERE status = 'running'`;
      tenantQuery = tenantId
        ? `SELECT COUNT(*) as count FROM reconciliation_runs WHERE status = 'running' AND tenant_id = $1`
        : "";
      break;
    case "webhook":
      globalQuery = `SELECT COUNT(*) as count FROM webhook_deliveries WHERE status = 'pending'`;
      tenantQuery = tenantId
        ? `SELECT COUNT(*) as count FROM webhook_deliveries wd 
           JOIN webhooks w ON wd.webhook_id = w.id 
           WHERE wd.status = 'pending' AND w.tenant_id = $1`
        : "";
      break;
    case "export":
      globalQuery = `SELECT COUNT(*) as count FROM exports WHERE status = 'processing'`;
      tenantQuery = tenantId
        ? `SELECT COUNT(*) as count FROM exports WHERE status = 'processing' AND tenant_id = $1`
        : "";
      break;
  }

  const globalResult = await query<{ count: number }>(globalQuery);
  const global = Number(globalResult[0]?.count || 0);

  let perTenant = 0;
  if (tenantQuery && tenantId) {
    const tenantResult = await query<{ count: number }>(tenantQuery, [tenantId]);
    perTenant = Number(tenantResult[0]?.count || 0);
  }

  return { global, perTenant };
}

/**
 * Get all tenant usage ceilings
 */
export async function getAllUsageCeilings(): Promise<TenantUsageCeiling[]> {
  const ceilings = await query<{
    tenant_id: string;
    billing_account_id: string;
    usage_type: string;
    monthly_limit: number;
    reset_date: Date;
  }>(
    `SELECT tenant_id, billing_account_id, usage_type, monthly_limit, reset_date
     FROM tenant_usage_ceilings
     ORDER BY tenant_id, usage_type`
  );

  const result: TenantUsageCeiling[] = [];

  for (const ceiling of ceilings) {
    const currentUsage = await getCurrentUsage(
      ceiling.tenant_id,
      ceiling.usage_type as TenantUsageCeiling["usageType"],
      ceiling.reset_date
    );

    result.push({
      tenantId: ceiling.tenant_id,
      billingAccountId: ceiling.billing_account_id,
      usageType: ceiling.usage_type as TenantUsageCeiling["usageType"],
      monthlyLimit: Number(ceiling.monthly_limit),
      currentUsage,
      resetDate: ceiling.reset_date,
    });
  }

  return result;
}
