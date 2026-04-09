/**
 * Escalation and Severity-Based Alerting System
 * Automatically escalates tickets based on severity and age
 */

import { createClient } from "@/lib/supabase/client";

export type Severity = "low" | "medium" | "high" | "critical";

interface SupportTicket {
  id: string;
  created_at: string;
  severity?: Severity;
  status: string;
  priority?: number;
  assigned_to?: string;
}

interface EscalationRule {
  id: string;
  trigger_condition: {
    severity?: Severity;
    age_hours?: number;
    status?: string;
  };
  target_user_id?: string;
  action: "assign" | "notify" | "escalate";
}

/**
 * Check and escalate tickets based on rules
 */
export async function checkAndEscalateTickets(): Promise<void> {
  const supabase = createClient();

  // Get escalation rules
  const { data: rules } = await supabase.from("escalation_rules").select("*").eq("enabled", true);

  if (!rules || rules.length === 0) return;

  // Get open tickets
  const { data: tickets } = await supabase
    .from("support_tickets")
    .select("*")
    .in("status", ["open", "in_progress"]);

  if (!tickets) return;

  for (const ticket of tickets as SupportTicket[]) {
    const ageHours = (Date.now() - new Date(ticket.created_at).getTime()) / (1000 * 60 * 60);

    for (const rule of rules as EscalationRule[]) {
      const condition = rule.trigger_condition;

      // Check if rule matches
      const matchesSeverity = !condition.severity || ticket.severity === condition.severity;
      const matchesAge = !condition.age_hours || ageHours >= condition.age_hours;
      const matchesStatus = !condition.status || ticket.status === condition.status;

      if (matchesSeverity && matchesAge && matchesStatus) {
        // Escalate
        await escalateTicket(ticket.id, rule.id, rule.target_user_id, rule.action);
      }
    }
  }
}

/**
 * Escalate a ticket
 */
async function escalateTicket(
  ticketId: string,
  ruleId: string,
  targetUserId?: string,
  action?: "assign" | "notify" | "escalate"
): Promise<void> {
  const supabase = createClient();

  // Get current ticket
  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("id", ticketId)
    .single();

  if (!ticket) return;

  const ticketData = ticket as SupportTicket;

  // Update ticket
  const updates: {
    priority?: number;
    updated_at: string;
    assigned_to?: string;
  } = {
    priority: Math.min((ticketData.priority || 0) + 1, 10), // Increase priority
    updated_at: new Date().toISOString(),
  };

  if (targetUserId && action === "assign") {
    updates.assigned_to = targetUserId;
  }

  await supabase
    .from("support_tickets")
    .update(updates as never)
    .eq("id", ticketId);

  // Log escalation
  await supabase.from("escalation_history").insert({
    ticket_id: ticketId,
    rule_id: ruleId,
    from_user_id: ticketData.assigned_to,
    to_user_id: targetUserId,
    reason: "Automatic escalation based on rule",
  } as never);

  // Send alert (in production, use notification system)
  if (action === "notify" && targetUserId) {
    // Send notification to target user
    // eslint-disable-next-line no-console
    console.log(`Escalation alert: Ticket ${ticketId} escalated to ${targetUserId}`);
  }
}

/**
 * Create escalation rule
 */
export async function createEscalationRule(
  name: string,
  triggerCondition: {
    severity?: Severity;
    age_hours?: number;
    status?: string;
  },
  action: "assign" | "notify" | "escalate",
  targetUserId?: string
): Promise<void> {
  const supabase = createClient();

  await supabase.from("escalation_rules").insert({
    name,
    trigger_condition: triggerCondition,
    action,
    target_user_id: targetUserId,
    enabled: true,
  } as never);
}
