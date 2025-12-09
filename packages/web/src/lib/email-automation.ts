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

  type SequenceRow = { id: string };
  type UserRow = { email?: string };
  type TemplateRow = { id: string; delay_hours?: number; subject?: string };
  type PreferencesRow = {
    onboarding_emails?: boolean;
    upgrade_prompts?: boolean;
    churn_save_emails?: boolean;
    marketing_emails?: boolean;
  };
  
  const sequenceData = sequence as SequenceRow;
  
  // Get user email
  const { data: user } = await supabase.from("users").select("email").eq("id", userId).single();
  const userData = user as UserRow | null;
  if (!userData?.email) {
    console.warn(`User ${userId} has no email`);
    return;
  }

  // Get templates for this sequence
  const { data: templates } = await supabase
    .from("email_templates")
    .select("*")
    .eq("sequence_id", sequenceData.id)
    .eq("enabled", true)
    .order("order_index", { ascending: true });

  if (!templates || templates.length === 0) {
    console.warn(`No templates found for sequence ${sequenceType}`);
    return;
  }

  // Check user email preferences
  const { data: preferences } = await supabase
    .from("user_email_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();

  // Check if user has opted out
  const prefsData = preferences as PreferencesRow | null;
  if (prefsData) {
    if (sequenceType === "onboarding" && !prefsData.onboarding_emails) return;
    if (sequenceType === "upgrade_prompt" && !prefsData.upgrade_prompts) return;
    if (sequenceType === "churn_save" && !prefsData.churn_save_emails) return;
    if (sequenceType === "expansion" && !prefsData.marketing_emails) return;
  }

  // Schedule emails
  const typedTemplates = templates as TemplateRow[];
  let cumulativeDelay = 0;
  for (const template of typedTemplates) {
    const sendAt = new Date();
    sendAt.setHours(sendAt.getHours() + cumulativeDelay + (template.delay_hours || 0));

    await supabase.from("email_sends").insert({
      user_id: userId,
      sequence_id: sequenceData.id,
      template_id: template.id,
      email_address: userData.email,
      subject: template.subject || '',
      status: "pending",
      metadata: metadata || {},
    } as any);

    cumulativeDelay += template.delay_hours || 0;
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
export async function sendTrialEndingReminder(
  userId: string,
  daysRemaining: number
): Promise<void> {
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
