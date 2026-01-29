/**
 * Usage Tracking Middleware
 * 
 * Tracks usage events for billing and enforcement.
 * Records every transaction processed for usage-based pricing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database.types';

export interface UsageEvent {
  billingAccountId: string;
  tenantId?: string;
  userId?: string;
  eventType: string; // 'reconciliation_transaction', 'receipt_upload', 'api_call', etc.
  integrationId?: string;
  quantity: number; // Number of transactions/units
  unit: string; // 'transaction', 'receipt', 'api_call', etc.
  metadata?: Record<string, unknown>;
}

/**
 * Record a usage event
 * 
 * This should be called for every billable action:
 * - Reconciliation transaction processed
 * - Receipt uploaded
 * - API call made (if metered)
 */
export async function recordUsageEvent(event: UsageEvent): Promise<void> {
  try {
    const supabase = (await createClient()) as any;

    const insertData: Database['public']['Tables']['usage_events']['Insert'] = {
      billing_account_id: event.billingAccountId,
      tenant_id: event.tenantId ?? null,
      user_id: event.userId ?? null,
      event_type: event.eventType,
      integration_id: event.integrationId ?? null,
      quantity: event.quantity,
      unit: event.unit,
      metadata: event.metadata ?? {},
      timestamp: new Date().toISOString(),
    };

    // Insert usage event
    const { error } = await supabase.from('usage_events').insert(insertData);

    if (error) {
      console.error('[Usage Tracking] Failed to record event:', error);
      // Don't throw - usage tracking should not break the request
    }
  } catch (error) {
    console.error('[Usage Tracking] Error:', error);
    // Don't throw - usage tracking should not break the request
  }
}

/**
 * Track reconciliation transaction usage
 * 
 * Call this for every transaction processed in a reconciliation job.
 */
export async function trackReconciliationTransaction(
  billingAccountId: string,
  tenantId: string,
  userId: string,
  transactionCount: number,
  integrationId?: string
): Promise<void> {
  await recordUsageEvent({
    billingAccountId,
    tenantId,
    userId,
    eventType: 'reconciliation_transaction',
    ...(integrationId !== undefined && { integrationId }),
    quantity: transactionCount,
    unit: 'transaction',
    metadata: {
      tracked_at: new Date().toISOString(),
    },
  });
}

/**
 * Get current usage for a billing account
 */
export async function getCurrentUsage(
  billingAccountId: string,
  period: 'daily' | 'monthly' = 'monthly'
): Promise<{
  totalTransactions: number;
  totalCost: number;
  periodStart: Date;
  periodEnd: Date;
}> {
  const supabase = (await createClient()) as any;

  const now = new Date();
  const periodStart = period === 'monthly'
    ? new Date(now.getFullYear(), now.getMonth(), 1)
    : new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const periodEnd = period === 'monthly'
    ? new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  // Get usage from usage_events
  const { data, error } = await supabase
    .from('usage_events')
    .select('quantity, event_type')
    .eq('billing_account_id', billingAccountId)
    .eq('event_type', 'reconciliation_transaction')
    .gte('timestamp', periodStart.toISOString())
    .lte('timestamp', periodEnd.toISOString());

  if (error) {
    console.error('[Usage Tracking] Failed to get usage:', error);
    return {
      totalTransactions: 0,
      totalCost: 0,
      periodStart,
      periodEnd,
    };
  }

  const totalTransactions = (data ?? []).reduce((sum: number, event: typeof data[0]) => {
    return sum + Number(event?.quantity || 0);
  }, 0) || 0;

  // Calculate cost: $0.01 per transaction
  const totalCost = totalTransactions * 0.01;

  return {
    totalTransactions,
    totalCost,
    periodStart,
    periodEnd,
  };
}

/**
 * Check if usage exceeds plan limits
 */
export async function checkUsageLimit(
  billingAccountId: string,
  planId: string,
  additionalTransactions: number = 0
): Promise<{
  allowed: boolean;
  currentUsage: number;
  limit: number;
  wouldExceed: boolean;
}> {
  const { getPlan } = await import('@/config/pricing-simple');
  const plan = getPlan(planId);

  const currentUsage = await getCurrentUsage(billingAccountId, 'monthly');
  const totalUsage = currentUsage.totalTransactions + additionalTransactions;

  // Free tier has hard limit
  if (planId === 'free') {
    const allowed = totalUsage <= plan.includedTransactions;
    return {
      allowed,
      currentUsage: currentUsage.totalTransactions,
      limit: plan.includedTransactions,
      wouldExceed: totalUsage > plan.includedTransactions,
    };
  }

  // Paid tiers have no hard limit (just billing)
  return {
    allowed: true,
    currentUsage: currentUsage.totalTransactions,
    limit: Infinity,
    wouldExceed: false,
  };
}

/**
 * Middleware to track usage for API routes
 */
export function withUsageTracking<
  T extends (request: NextRequest, ...args: any[]) => Promise<NextResponse>
>(
  handler: T,
  options: {
    eventType: string;
    getQuantity?: (request: NextRequest, response?: NextResponse) => number | Promise<number>;
    getBillingAccountId: (request: NextRequest) => Promise<string | null>;
  }
): T {
  return (async (...args: Parameters<T>) => {
    const request = args[0] as NextRequest;
    const startTime = Date.now();

    // Call handler
    const response = await handler.apply(null, args);

    // Track usage after successful request
    if (response.status < 400) {
      try {
        const billingAccountId = await options.getBillingAccountId(request);
        if (billingAccountId) {
          const quantity = options.getQuantity
            ? await options.getQuantity(request, response)
            : 1;

          await recordUsageEvent({
            billingAccountId,
            eventType: options.eventType,
            quantity,
            unit: 'request',
            metadata: {
              route: request.nextUrl.pathname,
              method: request.method,
              duration_ms: Date.now() - startTime,
            },
          });
        }
      } catch (error) {
        // Don't fail the request if usage tracking fails
        console.error('[Usage Tracking] Failed to track usage:', error);
      }
    }

    return response;
  }) as T;
}
