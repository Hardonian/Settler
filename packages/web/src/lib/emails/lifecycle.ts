/**
 * Lifecycle Email Automation
 * 
 * Sends automated emails at key user lifecycle events.
 */

import { prisma } from '@/shared/db/prismaClient';

export type EmailEvent =
  | 'welcome'
  | 'onboarding_step_1'
  | 'onboarding_step_2'
  | 'onboarding_step_3'
  | 'trial_start'
  | 'trial_ending'
  | 'trial_expired'
  | 'upgrade_prompt'
  | 'usage_limit_warning'
  | 'usage_limit_exceeded'
  | 'payment_failed'
  | 'payment_succeeded'
  | 'subscription_cancelled'
  | 'subscription_renewed';

export interface EmailData {
  to: string;
  event: EmailEvent;
  data?: Record<string, unknown>;
}

/**
 * Send lifecycle email (placeholder - integrate with email service)
 */
export async function sendLifecycleEmail(emailData: EmailData): Promise<void> {
  try {
    // TODO: Integrate with email service (SendGrid, Resend, etc.)
    console.log('[Lifecycle Email] Sending email:', emailData);

    // For now, log to database for tracking
    await prisma.$executeRaw`
      INSERT INTO activity_log (
        user_id,
        action,
        resource_type,
        metadata,
        created_at
      ) VALUES (
        (SELECT id FROM users WHERE email = ${emailData.to} LIMIT 1),
        ${emailData.event},
        'email',
        ${JSON.stringify(emailData.data || {})}::jsonb,
        NOW()
      )
    `;
  } catch (error) {
    console.error('[Lifecycle Email] Error sending email:', error);
    // Don't throw - email failures shouldn't block operations
  }
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(userId: string, email: string): Promise<void> {
  await sendLifecycleEmail({
    to: email,
    event: 'welcome',
    data: {
      userId,
    },
  });
}

/**
 * Send onboarding step email
 */
export async function sendOnboardingStepEmail(
  userId: string,
  email: string,
  step: number
): Promise<void> {
  await sendLifecycleEmail({
    to: email,
    event: `onboarding_step_${step}` as EmailEvent,
    data: {
      userId,
      step,
    },
  });
}

/**
 * Send trial start email
 */
export async function sendTrialStartEmail(userId: string, email: string): Promise<void> {
  await sendLifecycleEmail({
    to: email,
    event: 'trial_start',
    data: {
      userId,
    },
  });
}

/**
 * Send trial ending email
 */
export async function sendTrialEndingEmail(
  userId: string,
  email: string,
  daysRemaining: number
): Promise<void> {
  await sendLifecycleEmail({
    to: email,
    event: 'trial_ending',
    data: {
      userId,
      daysRemaining,
    },
  });
}

/**
 * Send usage limit warning email
 */
export async function sendUsageLimitWarningEmail(
  userId: string,
  email: string,
  service: string,
  usage: number,
  limit: number
): Promise<void> {
  await sendLifecycleEmail({
    to: email,
    event: 'usage_limit_warning',
    data: {
      userId,
      service,
      usage,
      limit,
      percentage: (usage / limit) * 100,
    },
  });
}

/**
 * Send upgrade prompt email
 */
export async function sendUpgradePromptEmail(
  userId: string,
  email: string,
  currentTier: string,
  recommendedTier: string
): Promise<void> {
  await sendLifecycleEmail({
    to: email,
    event: 'upgrade_prompt',
    data: {
      userId,
      currentTier,
      recommendedTier,
    },
  });
}

/**
 * Schedule lifecycle emails based on user events
 */
export async function scheduleLifecycleEmails(userId: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        billingAccounts: {
          take: 1,
        },
      },
    });

    if (!user || !user.email) {
      return;
    }

    const billingAccount = user.billingAccounts[0];
    if (!billingAccount) {
      // New user - send welcome email
      await sendWelcomeEmail(userId, user.email);
      return;
    }

    // Check subscription status and send appropriate emails
    if (billingAccount.subscriptionTier === 'free') {
      // Check usage and send upgrade prompts if needed
      // This would integrate with usage tracking
    }

    // Check trial status
    if (billingAccount.subscriptionStatus === 'trialing') {
      const trialEnd = billingAccount.trialEndsAt;
      if (trialEnd) {
        const daysRemaining = Math.ceil(
          (trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysRemaining <= 3 && daysRemaining > 0) {
          await sendTrialEndingEmail(userId, user.email, daysRemaining);
        }
      }
    }
  } catch (error) {
    console.error('[Lifecycle Emails] Error scheduling emails:', error);
  }
}
