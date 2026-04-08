/**
 * Lifecycle Email Automation
 *
 * Sends automated emails at key user lifecycle events via Resend.
 * Falls back to activity_log insert when Resend is not configured.
 */

import { prisma } from '@/shared/db/prismaClient';
import { sendTransactionalEmail } from '@/lib/email/resend';
import { createAdminClient } from '@/lib/supabase/server';

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

// ---------------------------------------------------------------------------
// Email content builders
// ---------------------------------------------------------------------------

function buildEmailContent(emailData: EmailData): { subject: string; html: string } {
  const { event, data = {} } = emailData;

  switch (event) {
    case 'welcome':
      return {
        subject: 'Welcome to Settler',
        html: `<h2>Welcome to Settler!</h2>
<p>You're all set. Head to your <a href="https://settler.dev/console">console</a> to start your first reconciliation run.</p>`,
      };

    case 'onboarding_step_1':
      return {
        subject: 'Step 1: Connect your first data source',
        html: `<h2>Let's connect your data</h2>
<p>Import your first source in the <a href="https://settler.dev/console/stitch">Stitch importer</a>.</p>`,
      };

    case 'onboarding_step_2':
      return {
        subject: 'Step 2: Run your first reconciliation',
        html: `<h2>Run a reconciliation</h2>
<p>Open the <a href="https://settler.dev/console">console</a> and kick off your first run.</p>`,
      };

    case 'onboarding_step_3':
      return {
        subject: 'Step 3: Review your results',
        html: `<h2>Review your results</h2>
<p>Check the <a href="https://settler.dev/console/runs">runs view</a> to see matches, exceptions, and evidence.</p>`,
      };

    case 'trial_start':
      return {
        subject: 'Your Settler trial has started',
        html: `<h2>Your trial is active</h2>
<p>You have full access for the next 14 days. <a href="https://settler.dev/console">Get started</a>.</p>`,
      };

    case 'trial_ending': {
      const days = data?.daysRemaining ?? 3;
      return {
        subject: `Your Settler trial ends in ${days} day${days === 1 ? '' : 's'}`,
        html: `<h2>Trial ending soon</h2>
<p>Your trial ends in <strong>${days} day${days === 1 ? '' : 's'}</strong>. <a href="https://settler.dev/pricing">Upgrade now</a> to keep full access.</p>`,
      };
    }

    case 'trial_expired':
      return {
        subject: 'Your Settler trial has ended',
        html: `<h2>Trial expired</h2>
<p>Upgrade to a paid plan to continue using Settler. <a href="https://settler.dev/pricing">View plans</a>.</p>`,
      };

    case 'upgrade_prompt':
      return {
        subject: 'Unlock more with Settler',
        html: `<h2>Ready to upgrade?</h2>
<p>You're on <strong>${data?.currentTier ?? 'Free'}</strong>. <a href="https://settler.dev/pricing">View ${data?.recommendedTier ?? 'Pro'} features</a>.</p>`,
      };

    case 'usage_limit_warning': {
      const pct = Math.round(((data?.usage as number) / (data?.limit as number)) * 100) || 80;
      return {
        subject: `You've used ${pct}% of your ${data?.service ?? ''} quota`,
        html: `<h2>Usage alert</h2>
<p>You've used <strong>${data?.usage}</strong> of <strong>${data?.limit}</strong> ${data?.service} units this period. <a href="https://settler.dev/pricing">Upgrade</a> to avoid interruption.</p>`,
      };
    }

    case 'usage_limit_exceeded':
      return {
        subject: `Usage limit reached for ${data?.service ?? 'your plan'}`,
        html: `<h2>Usage limit reached</h2>
<p>Your ${data?.service ?? 'plan'} limit has been reached. <a href="https://settler.dev/pricing">Upgrade now</a> to restore access.</p>`,
      };

    case 'payment_failed':
      return {
        subject: 'Payment failed — action required',
        html: `<h2>Payment failed</h2>
<p>We couldn't process your payment. <a href="https://settler.dev/console/billing">Update your payment method</a> to keep your account active.</p>`,
      };

    case 'payment_succeeded':
      return {
        subject: 'Payment received — thank you',
        html: `<h2>Payment confirmed</h2>
<p>Your payment was processed. <a href="https://settler.dev/console/billing">View invoice</a>.</p>`,
      };

    case 'subscription_cancelled':
      return {
        subject: 'Your Settler subscription has been cancelled',
        html: `<h2>Subscription cancelled</h2>
<p>Your subscription is cancelled. You'll retain access until the end of the billing period. <a href="https://settler.dev/pricing">Resubscribe anytime</a>.</p>`,
      };

    case 'subscription_renewed':
      return {
        subject: 'Settler subscription renewed',
        html: `<h2>Subscription renewed</h2>
<p>Your subscription has been renewed. <a href="https://settler.dev/console">Continue in your console</a>.</p>`,
      };

    default:
      return {
        subject: `Settler notification: ${event}`,
        html: `<p>An event occurred on your account: <strong>${event}</strong>.</p>`,
      };
  }
}

// ---------------------------------------------------------------------------
// Core send function
// ---------------------------------------------------------------------------

export async function sendLifecycleEmail(emailData: EmailData): Promise<void> {
  try {
    const { subject, html } = buildEmailContent(emailData);

    // Send via Resend (no-ops gracefully if RESEND_API_KEY is missing)
    const result = await sendTransactionalEmail({
      to: emailData.to,
      subject,
      html,
    });

    if (!result.success) {
      // eslint-disable-next-line no-console
      console.warn('[Lifecycle Email] Resend unavailable, logging to activity_log:', emailData.event);
    }

    // Always log to activity_log for audit trail
    try {
      const admin = await createAdminClient();
      await admin.from('activity_log').insert({
        activity_type: emailData.event,
        entity_type: 'email',
        metadata: {
          to: emailData.to,
          subject,
          sent: result.success,
          resend_id: result.id,
          ...(emailData.data ?? {}),
        },
      });
    } catch {
      // activity_log write failure must not bubble up
    }
  } catch (error) {
    console.error('[Lifecycle Email] Error sending email:', error);
    // Don't throw — email failures must not block the caller
  }
}

// ---------------------------------------------------------------------------
// Convenience helpers
// ---------------------------------------------------------------------------

export async function sendWelcomeEmail(userId: string, email: string): Promise<void> {
  await sendLifecycleEmail({ to: email, event: 'welcome', data: { userId } });
}

export async function sendOnboardingStepEmail(
  userId: string,
  email: string,
  step: number,
): Promise<void> {
  await sendLifecycleEmail({
    to: email,
    event: `onboarding_step_${step}` as EmailEvent,
    data: { userId, step },
  });
}

export async function sendTrialStartEmail(userId: string, email: string): Promise<void> {
  await sendLifecycleEmail({ to: email, event: 'trial_start', data: { userId } });
}

export async function sendTrialEndingEmail(
  userId: string,
  email: string,
  daysRemaining: number,
): Promise<void> {
  await sendLifecycleEmail({
    to: email,
    event: 'trial_ending',
    data: { userId, daysRemaining },
  });
}

export async function sendUsageLimitWarningEmail(
  userId: string,
  email: string,
  service: string,
  usage: number,
  limit: number,
): Promise<void> {
  await sendLifecycleEmail({
    to: email,
    event: 'usage_limit_warning',
    data: { userId, service, usage, limit, percentage: (usage / limit) * 100 },
  });
}

export async function sendUpgradePromptEmail(
  userId: string,
  email: string,
  currentTier: string,
  recommendedTier: string,
): Promise<void> {
  await sendLifecycleEmail({
    to: email,
    event: 'upgrade_prompt',
    data: { userId, currentTier, recommendedTier },
  });
}

export async function scheduleLifecycleEmails(userId: string): Promise<void> {
  try {
    const billingAccount = await prisma.billingAccount.findFirst({ where: { userId } });
    if (!billingAccount?.email) return;

    const userEmail = billingAccount.email;

    const subscription = await prisma.subscription.findFirst({
      where: {
        billingAccountId: billingAccount.id,
        status: { in: ['active', 'trialing'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (subscription?.status === 'trialing' && subscription.trialEnd) {
      const daysRemaining = Math.ceil(
        (subscription.trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      if (daysRemaining <= 3 && daysRemaining > 0) {
        await sendTrialEndingEmail(userId, userEmail, daysRemaining);
      }
    }
  } catch (error) {
    console.error('[Lifecycle Emails] Error scheduling emails:', error);
  }
}
