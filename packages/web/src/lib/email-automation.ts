/**
 * Email Automation System
 * Manages automated email sequences for onboarding, upgrades, expansion, churn save
 */

import { createClient } from "@/lib/supabase/client";

export type EmailSequenceType =
  | "onboarding"
  | "upgrade_prompt"
  | "expansion"
  | "churn_save"
  | "trial_ending"
  | "payment_failed"
  | "activation_reminder";

/**
 * Trigger email sequence for a user
 */
export async function triggerEmailSequence(
  userId: string,
  sequenceType: EmailSequenceType,
  metadata?: Record<string, unknown>
): Promise<void> {
  const supabase = createClient();

  // Get sequence
  const { data: sequence } = await supabase
    .from("email_sequences")
    .select("*")
    .eq("sequence_type", sequenceType)
    .eq("enabled", true)
    .single();

  if (!sequence) {
    console.warn(`Email sequence ${sequenceType} not found or disabled`);
    return;
  }

  // Get user email
  const { data: user } = await supabase.from("users").select("email").eq("id", userId).single();
  if (!(user as any)?.email) {
    console.warn(`User ${userId} has no email`);
    return;
  }

  // Get templates for this sequence
  const { data: templates } = await supabase
    .from("email_templates" as any)
    .select("*")
    .eq("sequence_id", (sequence as any).id)
    .eq("enabled", true)
    .order("order_index", { ascending: true });

  if (!templates || templates.length === 0) {
    console.warn(`No templates found for sequence ${sequenceType}`);
    return;
  }

  // Check user email preferences
  const { data: preferences } = await supabase
    .from("user_email_preferences" as any)
    .select("*")
    .eq("user_id", userId)
    .single();

  // Check if user has opted out
  if (preferences) {
    if (sequenceType === "onboarding" && !(preferences as any).onboarding_emails) return;
    if (sequenceType === "upgrade_prompt" && !(preferences as any).upgrade_prompts) return;
    if (sequenceType === "churn_save" && !(preferences as any).churn_save_emails) return;
    if (sequenceType === "expansion" && !(preferences as any).marketing_emails) return;
  }

  // Schedule emails
  let cumulativeDelay = 0;
  for (const template of templates) {
    const sendAt = new Date();
    sendAt.setHours(sendAt.getHours() + cumulativeDelay + ((template as any).delay_hours || 0));

    await supabase.from("email_sends").insert({
      user_id: userId,
      sequence_id: (sequence as any).id,
      template_id: (template as any).id,
      email_address: (user as any).email,
      subject: (template as any).subject,
      status: "pending",
      metadata: metadata || {},
    } as any);

    cumulativeDelay += ((template as any).delay_hours || 0);
  }
}

/**
 * Send onboarding email sequence
 */
export async function sendOnboardingSequence(userId: string): Promise<void> {
  await triggerEmailSequence(userId, "onboarding", {
    triggered_at: new Date().toISOString(),
  });
}

/**
 * Send upgrade prompt
 */
export async function sendUpgradePrompt(userId: string, reason: string): Promise<void> {
  await triggerEmailSequence(userId, "upgrade_prompt", {
    reason,
    triggered_at: new Date().toISOString(),
  });
}

/**
 * Send churn save sequence
 */
export async function sendChurnSaveSequence(userId: string, churnScore: number): Promise<void> {
  await triggerEmailSequence(userId, "churn_save", {
    churn_score: churnScore,
    triggered_at: new Date().toISOString(),
  });
}

/**
 * Send expansion opportunity email
 */
export async function sendExpansionEmail(userId: string): Promise<void> {
  await triggerEmailSequence(userId, "expansion", {
    triggered_at: new Date().toISOString(),
  });
}

/**
 * Send trial ending reminder
 */
export async function sendTrialEndingReminder(userId: string, daysRemaining: number): Promise<void> {
  await triggerEmailSequence(userId, "trial_ending", {
    days_remaining: daysRemaining,
    triggered_at: new Date().toISOString(),
  });
}

/**
 * Send payment failed recovery email
 */
export async function sendPaymentFailedEmail(userId: string, failureType: string): Promise<void> {
  await triggerEmailSequence(userId, "payment_failed", {
    failure_type: failureType,
    triggered_at: new Date().toISOString(),
  });
}
