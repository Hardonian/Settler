/**
 * Cost Control Service
 * 
 * PHASE 1: Cost Surface & Marginal Cost Audit
 * 
 * Enumerates all cost drivers and implements:
 * - Hard caps per tenant
 * - Backpressure mechanisms
 * - Degradation paths
 * - Abuse scenario mitigation
 * 
 * Goal: Marginal cost per tenant trends downward, no single tenant can spike global cost
 */

import { supabase } from '../infrastructure/supabase/client';
import { logError, logInfo, logWarn } from '../utils/logger';

export interface CostDriver {
  id: string;
  name: string;
  category: 'compute' | 'storage' | 'external_api' | 'retries' | 'support';
  unit: string; // 'requests', 'gb', 'api_calls', 'retries', 'tickets'
  baseCostPerUnit: number; // Estimated cost in USD
  scalingBehavior: 'linear' | 'sublinear' | 'fixed';
}

export interface TenantCostLimits {
  tenantId: string;
  billingAccountId: string;
  planId: string;
  limits: Record<string, {
    daily: number;
    monthly: number;
    burst: number; // Max allowed in short window
  }>;
  currentUsage: Record<string, {
    daily: number;
    monthly: number;
    lastReset: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CostControlResult {
  allowed: boolean;
  reason?: string;
  currentUsage?: number;
  limit?: number;
  retryAfter?: number;
  degradedMode?: boolean;
}

// Cost drivers enumeration
export const COST_DRIVERS: Record<string, CostDriver> = {
  // Compute costs
  edge_function_invocations: {
    id: 'edge_function_invocations',
    name: 'Edge Function Invocations',
    category: 'compute',
    unit: 'invocations',
    baseCostPerUnit: 0.0000002, // $0.0000002 per invocation (Supabase pricing)
    scalingBehavior: 'linear',
  },
  reconciliation_jobs: {
    id: 'reconciliation_jobs',
    name: 'Reconciliation Jobs',
    category: 'compute',
    unit: 'jobs',
    baseCostPerUnit: 0.001, // Estimated $0.001 per job
    scalingBehavior: 'linear',
  },
  receipt_processing: {
    id: 'receipt_processing',
    name: 'Receipt Processing (OCR)',
    category: 'external_api',
    unit: 'receipts',
    baseCostPerUnit: 0.01, // $0.01 per receipt (OpenAI API)
    scalingBehavior: 'linear',
  },
  
  // Storage costs
  database_rows: {
    id: 'database_rows',
    name: 'Database Rows',
    category: 'storage',
    unit: 'rows',
    baseCostPerUnit: 0.00000001, // $0.00000001 per row (estimated)
    scalingBehavior: 'linear',
  },
  storage_gb: {
    id: 'storage_gb',
    name: 'Storage (GB)',
    category: 'storage',
    unit: 'gb',
    baseCostPerUnit: 0.021, // $0.021 per GB/month (Supabase)
    scalingBehavior: 'linear',
  },
  
  // External API costs
  integration_syncs: {
    id: 'integration_syncs',
    name: 'Integration Syncs',
    category: 'external_api',
    unit: 'syncs',
    baseCostPerUnit: 0.0001, // Estimated cost per sync
    scalingBehavior: 'linear',
  },
  webhook_deliveries: {
    id: 'webhook_deliveries',
    name: 'Webhook Deliveries',
    category: 'external_api',
    unit: 'deliveries',
    baseCostPerUnit: 0.00001, // Estimated cost per delivery
    scalingBehavior: 'linear',
  },
  
  // Retry costs
  retry_attempts: {
    id: 'retry_attempts',
    name: 'Retry Attempts',
    category: 'retries',
    unit: 'attempts',
    baseCostPerUnit: 0.000001, // Cost of retry overhead
    scalingBehavior: 'linear',
  },
  
  // Support costs
  support_tickets: {
    id: 'support_tickets',
    name: 'Support Tickets',
    category: 'support',
    unit: 'tickets',
    baseCostPerUnit: 10, // Estimated $10 per ticket (human time)
    scalingBehavior: 'fixed',
  },
};

// Plan-based cost limits (per month)
const PLAN_COST_LIMITS: Record<string, Record<string, { daily: number; monthly: number; burst: number }>> = {
  free: {
    edge_function_invocations: { daily: 10000, monthly: 100000, burst: 100 },
    reconciliation_jobs: { daily: 10, monthly: 100, burst: 2 },
    receipt_processing: { daily: 10, monthly: 100, burst: 2 },
    database_rows: { daily: 100000, monthly: 1000000, burst: 10000 },
    storage_gb: { daily: 0.1, monthly: 1, burst: 0.01 },
    integration_syncs: { daily: 100, monthly: 1000, burst: 10 },
    webhook_deliveries: { daily: 1000, monthly: 10000, burst: 100 },
    retry_attempts: { daily: 1000, monthly: 10000, burst: 100 },
    support_tickets: { daily: 1, monthly: 5, burst: 1 },
  },
  starter: {
    edge_function_invocations: { daily: 100000, monthly: 1000000, burst: 1000 },
    reconciliation_jobs: { daily: 500, monthly: 5000, burst: 50 },
    receipt_processing: { daily: 500, monthly: 5000, burst: 50 },
    database_rows: { daily: 10000000, monthly: 100000000, burst: 1000000 },
    storage_gb: { daily: 10, monthly: 100, burst: 1 },
    integration_syncs: { daily: 10000, monthly: 100000, burst: 1000 },
    webhook_deliveries: { daily: 100000, monthly: 1000000, burst: 10000 },
    retry_attempts: { daily: 10000, monthly: 100000, burst: 1000 },
    support_tickets: { daily: 5, monthly: 20, burst: 2 },
  },
  growth: {
    edge_function_invocations: { daily: 1000000, monthly: 10000000, burst: 10000 },
    reconciliation_jobs: { daily: 5000, monthly: 50000, burst: 500 },
    receipt_processing: { daily: 5000, monthly: 50000, burst: 500 },
    database_rows: { daily: 100000000, monthly: 1000000000, burst: 10000000 },
    storage_gb: { daily: 100, monthly: 1000, burst: 10 },
    integration_syncs: { daily: 100000, monthly: 1000000, burst: 10000 },
    webhook_deliveries: { daily: 1000000, monthly: 10000000, burst: 100000 },
    retry_attempts: { daily: 100000, monthly: 1000000, burst: 10000 },
    support_tickets: { daily: 10, monthly: 50, burst: 5 },
  },
  scale: {
    edge_function_invocations: { daily: 10000000, monthly: 100000000, burst: 100000 },
    reconciliation_jobs: { daily: 50000, monthly: 500000, burst: 5000 },
    receipt_processing: { daily: 50000, monthly: 500000, burst: 5000 },
    database_rows: { daily: 1000000000, monthly: 10000000000, burst: 100000000 },
    storage_gb: { daily: 1000, monthly: 10000, burst: 100 },
    integration_syncs: { daily: 1000000, monthly: 10000000, burst: 100000 },
    webhook_deliveries: { daily: 10000000, monthly: 100000000, burst: 1000000 },
    retry_attempts: { daily: 1000000, monthly: 10000000, burst: 100000 },
    support_tickets: { daily: 50, monthly: 200, burst: 10 },
  },
  enterprise: {
    // Enterprise: high limits but still capped to prevent abuse
    edge_function_invocations: { daily: 100000000, monthly: 1000000000, burst: 1000000 },
    reconciliation_jobs: { daily: 500000, monthly: 5000000, burst: 50000 },
    receipt_processing: { daily: 500000, monthly: 5000000, burst: 50000 },
    database_rows: { daily: 10000000000, monthly: 100000000000, burst: 1000000000 },
    storage_gb: { daily: 10000, monthly: 100000, burst: 1000 },
    integration_syncs: { daily: 10000000, monthly: 100000000, burst: 1000000 },
    webhook_deliveries: { daily: 100000000, monthly: 1000000000, burst: 10000000 },
    retry_attempts: { daily: 10000000, monthly: 100000000, burst: 1000000 },
    support_tickets: { daily: 200, monthly: 1000, burst: 50 },
  },
};

export class CostControlService {
  /**
   * Check if a cost driver operation is allowed
   */
  async checkCostLimit(
    tenantId: string,
    billingAccountId: string,
    costDriverId: string,
    quantity: number = 1
  ): Promise<CostControlResult> {
    try {
      // Get tenant cost limits
      const limits = await this.getTenantCostLimits(tenantId, billingAccountId);
      
      if (!limits) {
        // Default to free tier limits if not found
        return {
          allowed: false,
          reason: 'Cost limits not configured',
        };
      }

      const driverLimits = limits.limits[costDriverId];
      if (!driverLimits) {
        logWarn(`No limits configured for cost driver: ${costDriverId}`, { tenantId });
        return { allowed: true }; // Fail open for unknown drivers
      }

      const currentUsage = limits.currentUsage[costDriverId] || {
        daily: 0,
        monthly: 0,
        lastReset: new Date(),
      };

      // Check burst limit (short-term protection)
      if (quantity > driverLimits.burst) {
        return {
          allowed: false,
          reason: `Burst limit exceeded. Max ${driverLimits.burst} ${COST_DRIVERS[costDriverId]?.unit || 'units'} per request`,
          currentUsage: currentUsage.daily,
          limit: driverLimits.daily,
          retryAfter: 60, // Wait 1 minute
        };
      }

      // Check daily limit
      if (currentUsage.daily + quantity > driverLimits.daily) {
        const degradedMode = currentUsage.daily > driverLimits.daily * 0.9; // Degrade at 90%
        return {
          allowed: false,
          reason: `Daily limit exceeded for ${costDriverId}`,
          currentUsage: currentUsage.daily,
          limit: driverLimits.daily,
          retryAfter: this.getSecondsUntilMidnight(),
          degradedMode,
        };
      }

      // Check monthly limit
      if (currentUsage.monthly + quantity > driverLimits.monthly) {
        return {
          allowed: false,
          reason: `Monthly limit exceeded for ${costDriverId}`,
          currentUsage: currentUsage.monthly,
          limit: driverLimits.monthly,
          retryAfter: this.getSecondsUntilMonthEnd(),
          degradedMode: true,
        };
      }

      // All checks passed
      return {
        allowed: true,
        currentUsage: currentUsage.daily,
        limit: driverLimits.daily,
      };
    } catch (error) {
      logError('Error checking cost limit', error);
      // Fail closed for cost control
      return {
        allowed: false,
        reason: 'Cost control check failed',
      };
    }
  }

  /**
   * Record cost usage
   */
  async recordCostUsage(
    tenantId: string,
    billingAccountId: string,
    costDriverId: string,
    quantity: number = 1
  ): Promise<void> {
    try {
      // Update usage counters
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get or create usage record
      const { data: existing } = await supabase
        .from('usage_events')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('billing_account_id', billingAccountId)
        .eq('event_type', `cost:${costDriverId}`)
        .gte('timestamp', today.toISOString())
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (existing) {
        // Update existing
        await supabase
          .from('usage_events')
          .update({
            quantity: (Number(existing.quantity) || 0) + quantity,
            updated_at: now.toISOString(),
          })
          .eq('id', existing.id);
      } else {
        // Create new
        await supabase
          .from('usage_events')
          .insert({
            billing_account_id: billingAccountId,
            tenant_id: tenantId,
            event_type: `cost:${costDriverId}`,
            quantity,
            unit: COST_DRIVERS[costDriverId]?.unit || 'units',
            metadata: {
              cost_driver_id: costDriverId,
              estimated_cost: quantity * (COST_DRIVERS[costDriverId]?.baseCostPerUnit || 0),
            },
          });
      }

      // Update tenant cost limits cache
      await this.invalidateCostLimitsCache(tenantId);
    } catch (error) {
      logError('Error recording cost usage', error);
      // Don't throw - cost tracking should not break operations
    }
  }

  /**
   * Get tenant cost limits
   */
  private async getTenantCostLimits(
    tenantId: string,
    billingAccountId: string
  ): Promise<TenantCostLimits | null> {
    try {
      // Get subscription plan
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan_id, billing_account_id')
        .eq('billing_account_id', billingAccountId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const planId = subscription?.plan_id || 'free';
      const planLimits = PLAN_COST_LIMITS[planId] || PLAN_COST_LIMITS.free;

      // Get current usage
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const { data: usageEvents } = await supabase
        .from('usage_events')
        .select('event_type, quantity, timestamp')
        .eq('tenant_id', tenantId)
        .eq('billing_account_id', billingAccountId)
        .like('event_type', 'cost:%')
        .gte('timestamp', monthStart.toISOString());

      const currentUsage: Record<string, { daily: number; monthly: number; lastReset: Date }> = {};

      // Aggregate usage
      usageEvents?.forEach((event) => {
        const driverId = event.event_type.replace('cost:', '');
        const quantity = Number(event.quantity) || 0;
        const eventDate = new Date(event.timestamp);

        if (!currentUsage[driverId]) {
          currentUsage[driverId] = {
            daily: 0,
            monthly: 0,
            lastReset: today,
          };
        }

        currentUsage[driverId].monthly += quantity;
        if (eventDate >= today) {
          currentUsage[driverId].daily += quantity;
        }
      });

      return {
        tenantId,
        billingAccountId,
        planId,
        limits: planLimits,
        currentUsage,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      logError('Error getting tenant cost limits', error);
      return null;
    }
  }

  /**
   * Invalidate cost limits cache
   */
  private async invalidateCostLimitsCache(tenantId: string): Promise<void> {
    // In a production system, this would invalidate Redis cache
    // For now, we'll rely on database queries
  }

  /**
   * Get seconds until midnight UTC
   */
  private getSecondsUntilMidnight(): number {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setUTCHours(24, 0, 0, 0);
    return Math.floor((midnight.getTime() - now.getTime()) / 1000);
  }

  /**
   * Get seconds until end of month
   */
  private getSecondsUntilMonthEnd(): number {
    const now = new Date();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return Math.floor((monthEnd.getTime() - now.getTime()) / 1000);
  }

  /**
   * Get estimated cost for a tenant
   */
  async getEstimatedCost(tenantId: string, billingAccountId: string, period: 'daily' | 'monthly' = 'monthly'): Promise<number> {
    try {
      const limits = await this.getTenantCostLimits(tenantId, billingAccountId);
      if (!limits) return 0;

      let totalCost = 0;
      Object.entries(limits.currentUsage).forEach(([driverId, usage]) => {
        const driver = COST_DRIVERS[driverId];
        if (driver) {
          const usageValue = period === 'daily' ? usage.daily : usage.monthly;
          totalCost += usageValue * driver.baseCostPerUnit;
        }
      });

      return totalCost;
    } catch (error) {
      logError('Error calculating estimated cost', error);
      return 0;
    }
  }

  /**
   * Check for abuse scenarios
   */
  async detectAbuse(tenantId: string, billingAccountId: string): Promise<{
    isAbuse: boolean;
    reason?: string;
    actions: string[];
  }> {
    try {
      const limits = await this.getTenantCostLimits(tenantId, billingAccountId);
      if (!limits) {
        return { isAbuse: false, actions: [] };
      }

      const abuseSignals: string[] = [];
      let isAbuse = false;

      // Check for rapid cost acceleration
      Object.entries(limits.currentUsage).forEach(([driverId, usage]) => {
        const driverLimits = limits.limits[driverId];
        if (driverLimits) {
          // If usage exceeds 95% of limit, flag as potential abuse
          if (usage.daily > driverLimits.daily * 0.95) {
            abuseSignals.push(`High daily usage for ${driverId}: ${usage.daily}/${driverLimits.daily}`);
            isAbuse = true;
          }
          if (usage.monthly > driverLimits.monthly * 0.95) {
            abuseSignals.push(`High monthly usage for ${driverId}: ${usage.monthly}/${driverLimits.monthly}`);
            isAbuse = true;
          }
        }
      });

      return {
        isAbuse,
        reason: abuseSignals.length > 0 ? abuseSignals.join('; ') : undefined,
        actions: isAbuse ? ['throttle', 'alert', 'review'] : [],
      };
    } catch (error) {
      logError('Error detecting abuse', error);
      return { isAbuse: false, actions: [] };
    }
  }
}

export const costControlService = new CostControlService();
