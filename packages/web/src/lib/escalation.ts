/**
 * Escalation and Severity-Based Alerting System
 * Automatically escalates tickets based on severity and age
 */

import { createClient } from "@/lib/supabase/client";

export type Severity = "low" | "medium" | "high" | "critical";

/**
 * Check and escalate tickets based on rules
 */
export async function checkAndEscalateTickets(): Promise<void> {
  const supabase = createClient();

  // Get escalation rules
  const { data: rules } = await supabase
    .from("escalation_rules")
    .select("*")
    .eq("enabled", true);

  if (!rules || rules.length === 0) return;

  // Get open tickets
  const { data: tickets } = await supabase
    .from("support_tickets")
    .select("*")
    .in("status", ["open", "in_progress"]);

  if (!tickets) return;

  for (const ticket of tickets) {
    const ageHours = (Date.now() - new Date((ticket as any).created_at).getTime()) / (1000 * 60 * 60);

    for (const rule of rules) {
      const condition = (rule as any).trigger_condition as {
        severity?: Severity;
        age_hours?: number;
        status?: string;
      };

      // Check if rule matches
      const matchesSeverity = !condition.severity || (ticket as any).severity === condition.severity;
      const matchesAge = !condition.age_hours || ageHours >= condition.age_hours;
      const matchesStatus = !condition.status || (ticket as any).status === condition.status;

      if (matchesSeverity && matchesAge && matchesStatus) {
        // Escalate
        await escalateTicket((ticket as any).id, (rule as any).id, (rule as any).target_user_id, (rule as any).action);
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

  // Update ticket
  const updates: Record<string, any> = {
    priority: Math.min(((ticket as any).priority as number) + 1, 10), // Increase priority
    updated_at: new Date().toISOString(),
  };

  if (targetUserId && action === "assign") {
    updates.assigned_to = targetUserId;
  }

  await supabase.from("support_tickets").update(updates as any as never).eq("id", ticketId);

  // Log escalation
  await supabase.from("escalation_history").insert({
    ticket_id: ticketId,
    rule_id: ruleId,
    from_user_id: (ticket as any).assigned_to,
    to_user_id: targetUserId,
    reason: "Automatic escalation based on rule",
  } as any);

  // Send alert (in production, use notification system)
  if (action === "notify" && targetUserId) {
    // Send notification to target user
    console.log(`Escalation alert: Ticket ${ticketId} escalated to ${targetUserId}`);
  }
}

/**
 * Create escalation rule
 */
export async function createEscalationRule(
  name: string,
  triggerCondition: Record<string, any>,
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
  } as any);
}
