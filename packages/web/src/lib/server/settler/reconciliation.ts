/**
 * Reconciliation Service
 * 
 * Runs reconciliation jobs and retrieves reconciliation summaries.
 */

import { createClient } from '@/lib/supabase/server';
import type { ReconciliationSummary, ReconciliationItem, TenantId, SourceId } from '@/lib/domain/types';
import { calculateImpact, generateExplanation } from '@/lib/judgment/rules';

export interface ReconciliationParams {
  sourceId: SourceId;
  targetAdapter?: string;
  rules?: Array<{ field: string; tolerance?: number; window?: string }>;
}

/**
 * Run a reconciliation for a tenant
 */
export async function runReconciliation(
  tenantId: TenantId,
  params: ReconciliationParams
): Promise<ReconciliationSummary | null> {
  try {
    const supabase = await createClient();
    
    // Verify tenant access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('[runReconciliation] User not authenticated');
      return null;
    }
    
    // Set tenant context for RLS
    await supabase.rpc('set_tenant_context', { tenant_id: tenantId }).catch(() => {
      // RPC might not exist, continue anyway
    });
    
    // Find or create recon_job
    const { data: existingJob, error: findError } = await supabase
      .from('recon_jobs')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('source_adapter', params.sourceId)
      .eq('status', 'active')
      .maybeSingle();
    
    if (findError && findError.code !== 'PGRST116') {
      console.error('[runReconciliation] Error finding job:', findError);
    }
    
    const jobId = existingJob?.id;
    
    // Create recon_result
    const { data: result, error: createError } = await supabase
      .from('recon_results')
      .insert({
        recon_job_id: jobId,
        tenant_id: tenantId,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (createError || !result) {
      console.error('[runReconciliation] Error creating result:', createError);
      return null;
    }
    
    // In production, this would trigger actual reconciliation processing
    // For now, return a summary with the result ID
    return {
      id: result.id,
      tenantId,
      sourceId: params.sourceId,
      status: 'running',
      totalDelta: 0,
      currency: 'USD',
      mismatchCount: 0,
      startedAt: new Date(result.started_at),
    };
  } catch (error) {
    console.error('[runReconciliation] Unexpected error:', error);
    return null;
  }
}

/**
 * Get reconciliation summary by ID
 */
export async function getReconciliationSummary(
  tenantId: TenantId,
  reconciliationId: string
): Promise<ReconciliationSummary | null> {
  try {
    const supabase = await createClient();
    
    // Verify tenant access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('[getReconciliationSummary] User not authenticated');
      return null;
    }
    
    // Set tenant context for RLS
    await supabase.rpc('set_tenant_context', { tenant_id: tenantId }).catch(() => {
      // RPC might not exist, continue anyway
    });
    
    const { data: result, error } = await supabase
      .from('recon_results')
      .select('*')
      .eq('id', reconciliationId)
      .eq('tenant_id', tenantId)
      .single();
    
    if (error || !result) {
      console.error('[getReconciliationSummary] Error:', error);
      return null;
    }
    
    // Get highest risk item
    const { data: items } = await supabase
      .from('recon_results')
      .select('*')
      .eq('id', reconciliationId)
      .limit(1);
    
    return {
      id: result.id,
      tenantId,
      sourceId: result.recon_job_id ?? 'unknown',
      status: result.status as 'running' | 'completed' | 'failed',
      totalDelta: result.total_amount_unmatched ? Number(result.total_amount_unmatched) : 0,
      currency: result.currency ?? 'USD',
      mismatchCount: result.unmatched_source_count ?? 0,
      startedAt: new Date(result.started_at),
      completedAt: result.completed_at ? new Date(result.completed_at) : undefined,
    };
  } catch (error) {
    console.error('[getReconciliationSummary] Unexpected error:', error);
    return null;
  }
}

/**
 * List reconciliation items for a reconciliation
 */
export async function listReconciliationItems(
  tenantId: TenantId,
  reconciliationId: string
): Promise<ReconciliationItem[]> {
  try {
    const supabase = await createClient();
    
    // Verify tenant access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('[listReconciliationItems] User not authenticated');
      return [];
    }
    
    // Set tenant context for RLS
    await supabase.rpc('set_tenant_context', { tenant_id: tenantId }).catch(() => {
      // RPC might not exist, continue anyway
    });
    
    // Query reconciliation graph nodes for items
    const { data: nodes, error } = await supabase
      .from('reconciliation_graph_nodes')
      .select('*')
      .eq('job_id', reconciliationId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[listReconciliationItems] Error:', error);
      return [];
    }
    
    // Transform nodes to ReconciliationItem objects
    const items: ReconciliationItem[] = [];
    
    for (const node of nodes ?? []) {
      const data = node.data as Record<string, unknown>;
      const sourceAmount = typeof data.sourceAmount === 'number' ? data.sourceAmount : 0;
      const targetAmount = typeof data.targetAmount === 'number' ? data.targetAmount : 0;
      const delta = sourceAmount - targetAmount;
      
      const impact = calculateImpact(delta, node.currency ?? 'USD', node.confidence ? Number(node.confidence) : 0.75);
      const explanation = generateExplanation({
        type: 'reconciliation_item',
        sourceId: node.source_id ?? 'unknown',
        timestamp: new Date(node.timestamp),
        rawData: data,
      }, delta);
      
      items.push({
        id: node.id,
        reconciliationId,
        sourceId: node.source_id ?? 'unknown',
        sourceAmount,
        sourceCurrency: node.currency ?? 'USD',
        targetAmount,
        targetCurrency: node.currency ?? 'USD',
        delta,
        status: node.node_type === 'match' ? 'matched' : 
                node.node_type === 'unmatched' ? 'unmatched' : 'conflict',
        impact,
        explanation,
        urgency: impact.riskScore > 0.7 ? 'high' : impact.riskScore > 0.5 ? 'medium' : 'low',
        createdAt: new Date(node.created_at),
      });
    }
    
    // Sort by impact (risk score descending)
    items.sort((a, b) => b.impact.riskScore - a.impact.riskScore);
    
    return items;
  } catch (error) {
    console.error('[listReconciliationItems] Unexpected error:', error);
    return [];
  }
}
