/**
 * Alerts Service
 * 
 * Manages intelligent alerts with explanations and threshold tracking.
 */

import { createClient } from '@/lib/supabase/server';
import type { Alert, TenantId } from '@/lib/domain/types';
import { generateExplanation } from '@/lib/judgment/rules';

/**
 * List alerts for a tenant
 */
export async function listAlerts(
  tenantId: TenantId,
  includeAcknowledged: boolean = false
): Promise<Alert[]> {
  try {
    const supabase = await createClient();
    
    // Verify tenant access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('[listAlerts] User not authenticated');
      return [];
    }
    
    // Set tenant context for RLS
    try {
      await supabase.rpc('set_tenant_context', { tenant_id: tenantId });
    } catch {
      // RPC might not exist, continue anyway
    }
    
    let query = supabase
      .from('alerts')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    
    if (!includeAcknowledged) {
      query = query.eq('acknowledged', false);
    }
    
    const { data: alerts, error } = await query;
    
    if (error) {
      console.error('[listAlerts] Error:', error);
      return [];
    }
    
    return (alerts ?? []).map((a) => ({
      id: a.id,
      tenantId: a.tenant_id,
      severity: a.severity as 'info' | 'warning' | 'critical',
      title: a.title,
      message: a.message,
      explanation: generateExplanation({
        type: 'alert',
        sourceId: a.source_id ?? 'unknown',
        timestamp: new Date(a.created_at),
        rawData: {
          alertType: a.alert_type,
          threshold: a.threshold_value,
          actual: a.actual_value,
        },
      }),
      threshold: a.threshold_value && a.actual_value ? {
        type: a.alert_type ?? 'unknown',
        value: Number(a.threshold_value),
        actual: Number(a.actual_value),
      } : undefined,
      acknowledged: a.acknowledged ?? false,
      acknowledgedBy: a.acknowledged_by,
      acknowledgedAt: a.acknowledged_at ? new Date(a.acknowledged_at) : undefined,
      createdAt: new Date(a.created_at),
    }));
  } catch (error) {
    console.error('[listAlerts] Unexpected error:', error);
    return [];
  }
}

/**
 * Acknowledge an alert
 */
export async function acknowledgeAlert(
  tenantId: TenantId,
  alertId: string
): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    // Verify tenant access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('[acknowledgeAlert] User not authenticated');
      return false;
    }
    
    // Set tenant context for RLS
    try {
      await supabase.rpc('set_tenant_context', { tenant_id: tenantId });
    } catch {
      // RPC might not exist, continue anyway
    }
    
    const { error } = await supabase
      .from('alerts')
      .update({
        acknowledged: true,
        acknowledged_by: user.id,
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', alertId)
      .eq('tenant_id', tenantId);
    
    if (error) {
      console.error('[acknowledgeAlert] Error:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[acknowledgeAlert] Unexpected error:', error);
    return false;
  }
}
