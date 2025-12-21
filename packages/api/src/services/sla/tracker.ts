/**
 * SLA Tracking Service
 * 
 * Tracks support response times and SLA compliance.
 * Enforces SLA commitments for paid tiers.
 */

import { supabase } from '../../infrastructure/supabase/client';
import { logInfo, logError } from '../../utils/logger';

interface SLAPolicy {
  tier: string;
  response_time_hours: number; // SLA response time in hours
  resolution_time_hours?: number; // Optional resolution time SLA
  uptime_percentage?: number; // Optional uptime SLA (for Enterprise)
}

// SLA policies per tier
const SLA_POLICIES: Record<string, SLAPolicy> = {
  free: {
    tier: 'free',
    response_time_hours: 0, // No SLA (best-effort)
  },
  starter: {
    tier: 'starter',
    response_time_hours: 24, // 24-hour response SLA
  },
  growth: {
    tier: 'growth',
    response_time_hours: 24, // 24-hour response SLA
  },
  scale: {
    tier: 'scale',
    response_time_hours: 4, // 4-hour response SLA
    resolution_time_hours: 48, // 48-hour resolution SLA
  },
  enterprise: {
    tier: 'enterprise',
    response_time_hours: 1, // 1-hour response SLA
    resolution_time_hours: 24, // 24-hour resolution SLA
    uptime_percentage: 99.9, // 99.9% uptime SLA
  },
};

/**
 * Get SLA policy for tier
 */
export function getSLAPolicy(tierId: string): SLAPolicy {
  // Map legacy plan names
  const tierMap: Record<string, string> = {
    base: 'starter',
    pro: 'growth',
  };
  
  const mappedTier = tierMap[tierId] || tierId;
  return SLA_POLICIES[mappedTier] || SLA_POLICIES.free;
}

/**
 * Check if tier has SLA
 */
export function hasSLA(tierId: string): boolean {
  const policy = getSLAPolicy(tierId);
  return policy.response_time_hours > 0;
}

/**
 * Record support ticket creation
 */
export async function recordSupportTicket(
  billingAccountId: string,
  ticketId: string,
  tierId: string,
  priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): Promise<{ sla_applies: boolean; sla_hours: number }> {
  const policy = getSLAPolicy(tierId);
  
  if (!hasSLA(tierId)) {
    return { sla_applies: false, sla_hours: 0 };
  }

  try {
    // Record ticket with SLA tracking
    const { error } = await supabase
      .from('support_tickets')
      .insert({
        id: ticketId,
        billing_account_id: billingAccountId,
        tier_id: tierId,
        priority,
        sla_response_hours: policy.response_time_hours,
        sla_resolution_hours: policy.resolution_time_hours,
        created_at: new Date().toISOString(),
        status: 'open',
      });

    if (error) {
      logError('Error recording support ticket', error);
      return { sla_applies: false, sla_hours: 0 };
    }

    logInfo('Recorded support ticket with SLA', {
      ticketId,
      billingAccountId,
      tierId,
      sla_hours: policy.response_time_hours,
    });

    return { sla_applies: true, sla_hours: policy.response_time_hours };
  } catch (error) {
    logError('Error recording support ticket', error);
    return { sla_applies: false, sla_hours: 0 };
  }
}

/**
 * Record support ticket response
 */
export async function recordSupportResponse(
  ticketId: string,
  respondedAt: Date
): Promise<{ sla_met: boolean; response_time_hours: number; sla_hours: number }> {
  try {
    // Get ticket
    const { data: ticket, error: fetchError } = await supabase
      .from('support_tickets')
      .select('created_at, sla_response_hours, tier_id')
      .eq('id', ticketId)
      .single();

    if (fetchError || !ticket) {
      logError('Error fetching support ticket', fetchError);
      return { sla_met: false, response_time_hours: 0, sla_hours: 0 };
    }

    // Calculate response time
    const created = new Date(ticket.created_at);
    const responseTimeMs = respondedAt.getTime() - created.getTime();
    const responseTimeHours = responseTimeMs / (1000 * 60 * 60);
    const slaHours = ticket.sla_response_hours || 0;

    // Check if SLA met
    const slaMet = slaHours > 0 && responseTimeHours <= slaHours;

    // Update ticket
    const { error: updateError } = await supabase
      .from('support_tickets')
      .update({
        responded_at: respondedAt.toISOString(),
        response_time_hours: responseTimeHours,
        sla_met: slaMet,
        status: 'responded',
      })
      .eq('id', ticketId);

    if (updateError) {
      logError('Error updating support ticket', updateError);
      return { sla_met: false, response_time_hours: responseTimeHours, sla_hours: slaHours };
    }

    logInfo('Recorded support response', {
      ticketId,
      response_time_hours: responseTimeHours,
      sla_hours: slaHours,
      sla_met: slaMet,
    });

    return { sla_met: slaMet, response_time_hours: responseTimeHours, sla_hours: slaHours };
  } catch (error) {
    logError('Error recording support response', error);
    return { sla_met: false, response_time_hours: 0, sla_hours: 0 };
  }
}

/**
 * Get SLA compliance metrics for billing account
 */
export async function getSLAComplianceMetrics(
  billingAccountId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  total_tickets: number;
  sla_met: number;
  sla_missed: number;
  sla_percentage: number;
  avg_response_time_hours: number;
}> {
  try {
    const { data: tickets, error } = await supabase
      .from('support_tickets')
      .select('sla_met, response_time_hours')
      .eq('billing_account_id', billingAccountId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .not('responded_at', 'is', null);

    if (error) {
      logError('Error fetching SLA metrics', error);
      return {
        total_tickets: 0,
        sla_met: 0,
        sla_missed: 0,
        sla_percentage: 0,
        avg_response_time_hours: 0,
      };
    }

    const totalTickets = tickets?.length || 0;
    const slaMet = tickets?.filter(t => t.sla_met === true).length || 0;
    const slaMissed = tickets?.filter(t => t.sla_met === false).length || 0;
    const slaPercentage = totalTickets > 0 ? (slaMet / totalTickets) * 100 : 0;
    const avgResponseTime =
      tickets?.reduce((sum, t) => sum + (t.response_time_hours || 0), 0) / totalTickets || 0;

    return {
      total_tickets: totalTickets,
      sla_met: slaMet,
      sla_missed: slaMissed,
      sla_percentage: slaPercentage,
      avg_response_time_hours: avgResponseTime,
    };
  } catch (error) {
    logError('Error calculating SLA compliance metrics', error);
    return {
      total_tickets: 0,
      sla_met: 0,
      sla_missed: 0,
      sla_percentage: 0,
      avg_response_time_hours: 0,
    };
  }
}

/**
 * Check for SLA violations and alert
 */
export async function checkSLAViolations(): Promise<{
  violations: number;
  alerts_sent: number;
}> {
  try {
    // Get open tickets that may violate SLA
    const { data: tickets, error } = await supabase
      .from('support_tickets')
      .select('id, billing_account_id, tier_id, created_at, sla_response_hours, priority')
      .eq('status', 'open')
      .not('sla_response_hours', 'is', null);

    if (error) {
      logError('Error fetching open tickets', error);
      return { violations: 0, alerts_sent: 0 };
    }

    const now = new Date();
    let violations = 0;
    let alertsSent = 0;

    for (const ticket of tickets || []) {
      const created = new Date(ticket.created_at);
      const elapsedHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
      const slaHours = ticket.sla_response_hours || 0;

      // Check if SLA violated
      if (slaHours > 0 && elapsedHours > slaHours) {
        violations++;

        // Alert operations team (in production, send email/Slack alert)
        logError('SLA VIOLATION DETECTED', new Error('SLA violation'), {
          ticketId: ticket.id,
          billingAccountId: ticket.billing_account_id,
          tierId: ticket.tier_id,
          priority: ticket.priority,
          elapsed_hours: elapsedHours,
          sla_hours: slaHours,
        });

        // Update ticket status
        await supabase
          .from('support_tickets')
          .update({
            sla_violated: true,
            sla_violated_at: now.toISOString(),
          })
          .eq('id', ticket.id);

        alertsSent++;
      }
    }

    logInfo('Checked SLA violations', {
      violations,
      alerts_sent: alertsSent,
      total_tickets_checked: tickets?.length || 0,
    });

    return { violations, alerts_sent: alertsSent };
  } catch (error) {
    logError('Error checking SLA violations', error);
    return { violations: 0, alerts_sent: 0 };
  }
}
