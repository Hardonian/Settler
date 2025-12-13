/**
 * Error Monitoring & Alerts
 * 
 * Centralized error tracking and alerting system.
 * Integrates with Sentry and provides business metrics.
 */

import * as Sentry from '@sentry/nextjs';
import { analytics } from '@/lib/analytics';

export interface AlertContext {
  userId?: string;
  billingAccountId?: string;
  planCode?: string;
  service?: string;
  operation?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Track critical error with alert
 */
export function trackCriticalError(
  error: Error,
  context: AlertContext = {}
): void {
  // Log to Sentry with context
  Sentry.captureException(error, {
    level: 'error',
    tags: {
      type: 'critical_error',
      service: context.service,
      planCode: context.planCode,
    },
    extra: {
      ...context.metadata,
      billingAccountId: context.billingAccountId,
      operation: context.operation,
    },
  });

  // Track in analytics
  analytics.trackError(error, {
    type: 'critical_error',
    ...context,
  });

  // TODO: Send to PagerDuty/Slack if critical
  // This would be configured based on error type and severity
}

/**
 * Track billing-related error
 */
export function trackBillingError(
  error: Error,
  context: AlertContext = {}
): void {
  Sentry.captureException(error, {
    level: 'error',
    tags: {
      type: 'billing_error',
      planCode: context.planCode,
    },
    extra: {
      billingAccountId: context.billingAccountId,
      ...context.metadata,
    },
  });

  analytics.trackError(error, {
    type: 'billing_error',
    ...context,
  });
}

/**
 * Track usage limit exceeded event
 */
export function trackUsageLimitExceeded(
  billingAccountId: string,
  service: string,
  currentUsage: number,
  limit: number,
  planCode: string
): void {
  Sentry.captureMessage('Usage limit exceeded', {
    level: 'warning',
    tags: {
      type: 'usage_limit_exceeded',
      service,
      planCode,
    },
    extra: {
      billingAccountId,
      currentUsage,
      limit,
    },
  });

  analytics.trackEvent('usage_limit_exceeded', {
    billingAccountId,
    service,
    currentUsage,
    limit,
    planCode,
  });
}

/**
 * Track payment failure
 */
export function trackPaymentFailure(
  billingAccountId: string,
  subscriptionId: string,
  error: Error
): void {
  Sentry.captureException(error, {
    level: 'error',
    tags: {
      type: 'payment_failure',
    },
    extra: {
      billingAccountId,
      subscriptionId,
    },
  });

  analytics.trackEvent('payment_failure', {
    billingAccountId,
    subscriptionId,
    error: error.message,
  });
}

/**
 * Track checkout started
 */
export function trackCheckoutStarted(
  billingAccountId: string,
  planCode: string,
  billingCycle: 'monthly' | 'annual'
): void {
  analytics.trackEvent('checkout_started', {
    billingAccountId,
    planCode,
    billingCycle,
  });
}

/**
 * Track checkout completed
 */
export function trackCheckoutCompleted(
  billingAccountId: string,
  planCode: string,
  billingCycle: 'monthly' | 'annual',
  sessionId: string
): void {
  analytics.trackEvent('checkout_completed', {
    billingAccountId,
    planCode,
    billingCycle,
    sessionId,
  });
}

/**
 * Track checkout canceled
 */
export function trackCheckoutCanceled(
  billingAccountId: string,
  planCode: string,
  billingCycle: 'monthly' | 'annual'
): void {
  analytics.trackEvent('checkout_canceled', {
    billingAccountId,
    planCode,
    billingCycle,
  });
}

/**
 * Track subscription upgrade
 */
export function trackSubscriptionUpgrade(
  billingAccountId: string,
  fromPlan: string,
  toPlan: string
): void {
  analytics.trackEvent('subscription_upgraded', {
    billingAccountId,
    fromPlan,
    toPlan,
  });
}

/**
 * Track subscription downgrade
 */
export function trackSubscriptionDowngrade(
  billingAccountId: string,
  fromPlan: string,
  toPlan: string
): void {
  analytics.trackEvent('subscription_downgraded', {
    billingAccountId,
    fromPlan,
    toPlan,
  });
}

/**
 * Track subscription cancellation
 */
export function trackSubscriptionCancellation(
  billingAccountId: string,
  planCode: string
): void {
  analytics.trackEvent('subscription_canceled', {
    billingAccountId,
    planCode,
  });
}
