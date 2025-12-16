/**
 * AI Token Management Service
 * 
 * Manages AI analysis token usage and limits per tier.
 */

import { createClient } from '@/lib/supabase/server';
import type { TenantId } from '@/lib/domain/types';

export interface TokenUsage {
  used: number;
  limit: number;
  period: 'day' | 'week' | 'month';
  resetDate: Date;
}

/**
 * Get token usage for a tenant
 */
export async function getTokenUsage(tenantId: TenantId): Promise<TokenUsage | null> {
  try {
    const supabase = await createClient();
    
    // Verify tenant access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return null;
    }
    
    // Set tenant context for RLS
    await supabase.rpc('set_tenant_context', { tenant_id: tenantId }).catch(() => {});
    
    // Get subscription tier (mock for now - integrate with actual billing)
    // Free: 1 per week, Pro: 10 per month, Enterprise: unlimited
    const tier = 'free'; // TODO: Get from subscription
    
    const limits: Record<string, TokenUsage> = {
      free: {
        used: 0,
        limit: 1,
        period: 'week',
        resetDate: getNextResetDate('week'),
      },
      pro: {
        used: 0,
        limit: 10,
        period: 'month',
        resetDate: getNextResetDate('month'),
      },
      enterprise: {
        used: 0,
        limit: -1, // Unlimited
        period: 'month',
        resetDate: getNextResetDate('month'),
      },
    };
    
    // Query actual usage from database (mock for now)
    const { data: usage } = await supabase
      .from('ai_analysis_usage')
      .select('tokens_used, period_start')
      .eq('tenant_id', tenantId)
      .order('period_start', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    const tokenUsage = limits[tier] || limits.free;
    
    if (usage) {
      tokenUsage.used = usage.tokens_used || 0;
    }
    
    return tokenUsage;
  } catch (error) {
    console.error('[getTokenUsage] Error:', error);
    return null;
  }
}

/**
 * Check if tenant has available tokens
 */
export async function checkTokenUsage(tenantId: TenantId): Promise<{
  hasTokens: boolean;
  usage: TokenUsage | null;
}> {
  const usage = await getTokenUsage(tenantId);
  
  if (!usage) {
    return { hasTokens: false, usage: null };
  }
  
  // Unlimited
  if (usage.limit === -1) {
    return { hasTokens: true, usage };
  }
  
  // Check if used < limit
  return {
    hasTokens: usage.used < usage.limit,
    usage,
  };
}

/**
 * Consume tokens for an analysis
 */
export async function consumeTokens(
  tenantId: TenantId,
  tokens: number
): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    // Verify tenant access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return false;
    }
    
    // Set tenant context for RLS
    await supabase.rpc('set_tenant_context', { tenant_id: tenantId }).catch(() => {});
    
    // Get current period
    const usage = await getTokenUsage(tenantId);
    if (!usage) {
      return false;
    }
    
    // Check if tokens available
    const check = await checkTokenUsage(tenantId);
    if (!check.hasTokens) {
      return false;
    }
    
    // Record usage (mock for now - create table if needed)
    await supabase
      .from('ai_analysis_usage')
      .upsert({
        tenant_id: tenantId,
        period_start: getPeriodStart(usage.period),
        tokens_used: (usage.used || 0) + tokens,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'tenant_id,period_start',
      });
    
    return true;
  } catch (error) {
    console.error('[consumeTokens] Error:', error);
    return false;
  }
}

function getNextResetDate(period: 'day' | 'week' | 'month'): Date {
  const now = new Date();
  const reset = new Date(now);
  
  switch (period) {
    case 'day':
      reset.setDate(reset.getDate() + 1);
      reset.setHours(0, 0, 0, 0);
      break;
    case 'week':
      reset.setDate(reset.getDate() + (7 - reset.getDay()));
      reset.setHours(0, 0, 0, 0);
      break;
    case 'month':
      reset.setMonth(reset.getMonth() + 1);
      reset.setDate(1);
      reset.setHours(0, 0, 0, 0);
      break;
  }
  
  return reset;
}

function getPeriodStart(period: 'day' | 'week' | 'month'): Date {
  const now = new Date();
  const start = new Date(now);
  
  switch (period) {
    case 'day':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(start.getDate() - start.getDay());
      start.setHours(0, 0, 0, 0);
      break;
    case 'month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
  }
  
  return start;
}
