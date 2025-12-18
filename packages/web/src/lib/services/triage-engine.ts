/**
 * Deterministic Triage Engine
 * 
 * Automatically triages support tickets based on rules and correlations with ops events.
 */

import { createClient } from '@/lib/supabase/server';

export interface TriageRule {
  condition: (ticket: any, context: TriageContext) => boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  score: number; // 0-100
  category?: string;
  reason: string;
}

export interface TriageContext {
  recentErrors: any[];
  recentJobs: any[];
  recentWebhooks: any[];
  userHistory: any[];
  orgHistory: any[];
}

export interface TriageResult {
  triageScore: number;
  suggestedPriority: 'low' | 'medium' | 'high' | 'critical';
  suggestedCategory?: string;
  suggestedAssignee?: string;
  confidence: number;
  triageRulesApplied: Array<{
    rule: string;
    matched: boolean;
    score: number;
  }>;
  correlationIds: string[];
}

/**
 * Triage rules (deterministic)
 */
const TRIAGE_RULES: TriageRule[] = [
  // Critical: Related to recent critical errors
  {
    condition: (ticket, context) => {
      return context.recentErrors.some(
        (e) => e.severity === 'critical' && e.route === ticket.context?.route
      );
    },
    priority: 'critical',
    score: 90,
    category: 'bug',
    reason: 'Related to critical system error',
  },

  // High: Contains keywords indicating urgent issue
  {
    condition: (ticket) => {
      const urgentKeywords = ['down', 'broken', 'urgent', 'critical', 'not working'];
      const text = `${ticket.subject} ${ticket.description}`.toLowerCase();
      return urgentKeywords.some((kw) => text.includes(kw));
    },
    priority: 'high',
    score: 75,
    reason: 'Contains urgent keywords',
  },

  // High: Related to failed webhooks
  {
    condition: (_ticket, context) => {
      return context.recentWebhooks.some((w) => w.status === 'failed');
    },
    priority: 'high',
    score: 70,
    category: 'integration',
    reason: 'Related to webhook failures',
  },

  // Medium: Related to recent errors (non-critical)
  {
    condition: (_ticket, context) => {
      return context.recentErrors.length > 0;
    },
    priority: 'medium',
    score: 50,
    category: 'bug',
    reason: 'Related to recent errors',
  },

  // Medium: User has multiple recent tickets
  {
    condition: (_ticket, context) => {
      return context.userHistory.length >= 3;
    },
    priority: 'medium',
    score: 45,
    reason: 'User has multiple recent tickets',
  },

  // Low: Default fallback
  {
    condition: () => true,
    priority: 'low',
    score: 20,
    reason: 'Default priority',
  },
];

/**
 * Triage a support ticket
 */
export async function triageTicket(ticketId: string): Promise<TriageResult> {
  const supabase = await createClient();

  // Get ticket
  const { data: ticket, error: ticketError } = await supabase
    .from('ops_support_tickets')
    .select('*')
    .eq('id', ticketId)
    .single();

  if (ticketError || !ticket) {
    throw new Error(`Ticket not found: ${ticketId}`);
  }

  // Build context
  const context = await buildTriageContext(ticket);

  // Apply rules
  const rulesApplied: Array<{
    rule: string;
    matched: boolean;
    score: number;
  }> = [];

  let maxScore = 0;
  let matchedPriority: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let matchedCategory: string | undefined;
  const correlationIds: string[] = [];

  for (const rule of TRIAGE_RULES) {
    const matched = rule.condition(ticket, context);
    rulesApplied.push({
      rule: rule.reason,
      matched,
      score: rule.score,
    });

    if (matched && rule.score > maxScore) {
      maxScore = rule.score;
      matchedPriority = rule.priority;
      matchedCategory = rule.category;
    }
  }

  // Collect correlation IDs
  context.recentErrors.forEach((e) => correlationIds.push(e.id));
  context.recentJobs.forEach((j) => correlationIds.push(j.id));
  context.recentWebhooks.forEach((w) => correlationIds.push(w.id));

  // Calculate confidence based on context richness
  let confidence = 0.5;
  if (context.recentErrors.length > 0) confidence += 0.2;
  if (context.recentJobs.length > 0) confidence += 0.1;
  if (context.recentWebhooks.length > 0) confidence += 0.1;
  if (context.userHistory.length > 0) confidence += 0.1;
  confidence = Math.min(confidence, 1.0);

  return {
    triageScore: maxScore,
    suggestedPriority: matchedPriority,
    suggestedCategory: matchedCategory,
    confidence,
    triageRulesApplied: rulesApplied,
    correlationIds,
  };
}

/**
 * Build triage context from ops events
 */
async function buildTriageContext(ticket: any): Promise<TriageContext> {
  const supabase = await createClient();
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Get recent errors
  const { data: recentErrors } = await supabase
    .from('ops_errors')
    .select('*')
    .gte('created_at', oneDayAgo.toISOString())
    .or(
      `route.eq.${ticket.context?.route || ''},organization_id.eq.${
        ticket.organization_id || ''
      }`
    )
    .limit(10);

  // Get recent jobs
  const { data: recentJobs } = await supabase
    .from('ops_jobs')
    .select('*')
    .gte('created_at', oneDayAgo.toISOString())
    .limit(10);

  // Get recent webhooks
  const { data: recentWebhooks } = await supabase
    .from('ops_webhooks')
    .select('*')
    .gte('created_at', oneDayAgo.toISOString())
    .eq('status', 'failed')
    .limit(10);

  // Get user history
  const { data: userHistory } = await supabase
    .from('ops_support_tickets')
    .select('*')
    .eq('user_id', ticket.user_id)
    .gte('created_at', oneDayAgo.toISOString())
    .limit(10);

  // Get org history
  const { data: orgHistory } = ticket.organization_id
    ? await supabase
        .from('ops_support_tickets')
        .select('*')
        .eq('organization_id', ticket.organization_id)
        .gte('created_at', oneDayAgo.toISOString())
        .limit(10)
    : { data: [] };

  return {
    recentErrors: recentErrors || [],
    recentJobs: recentJobs || [],
    recentWebhooks: recentWebhooks || [],
    userHistory: userHistory || [],
    orgHistory: orgHistory || [],
  };
}

/**
 * Store triage result
 */
export async function storeTriageResult(
  ticketId: string,
  result: TriageResult,
  triagedBy?: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from('support_ticket_triage').insert({
    ticket_id: ticketId,
    triage_score: result.triageScore,
    suggested_priority: result.suggestedPriority,
    suggested_category: result.suggestedCategory,
    confidence: result.confidence,
    triage_rules_applied: result.triageRulesApplied,
    correlation_ids: result.correlationIds,
    triaged_by: triagedBy || null,
  } as any);

  if (error) {
    console.error('Failed to store triage result:', error);
    throw error;
  }

  // Store correlations
  if (result.correlationIds.length > 0) {
    const correlations = result.correlationIds.map((corrId, index) => ({
      ticket_id: ticketId,
      correlation_type: 'ops_event', // Simplified for now
      correlated_id: corrId,
      correlation_strength: result.confidence,
      correlation_reason: `Auto-detected correlation #${index + 1}`,
    }));

    await supabase.from('support_correlations').insert(correlations as any);
  }
}
