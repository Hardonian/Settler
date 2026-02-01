/**
 * Conversion Tracking Analytics
 * Tracks conversion events for marketing and sales optimization
 */

export interface ConversionEvent {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp?: Date;
}

// Conversion funnel stages
export const CONVERSION_STAGES = {
  PAGE_VIEW: 'page_view',
  SIGNUP_START: 'signup_start',
  SIGNUP_COMPLETE: 'signup_complete',
  TRIAL_START: 'trial_start',
  FIRST_RECONCILIATION: 'first_reconciliation',
  FIRST_PAID_INVOICE: 'first_paid_invoice',
  UPGRADE: 'upgrade',
  CHURN: 'churn',
} as const;

/**
 * Track conversion event
 */
export async function trackConversion(
  event: string,
  properties?: Record<string, any>
): Promise<void> {
  try {
    // Get session ID from localStorage or generate
    const sessionId =
      typeof window !== 'undefined'
        ? localStorage.getItem('analytics_session_id') ||
          `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        : undefined;

    if (typeof window !== 'undefined') {
      localStorage.setItem('analytics_session_id', sessionId || '');
    }

    const conversionEvent: ConversionEvent = {
      event,
      properties: {
        ...properties,
        sessionId,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        referrer: typeof window !== 'undefined' ? document.referrer : undefined,
      },
      timestamp: new Date(),
    };

    // Send to analytics endpoint
    await fetch('/api/analytics/conversion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(conversionEvent),
    }).catch((error) => {
      console.error('Failed to track conversion:', error);
      // Don't throw - analytics failures shouldn't break the app
    });
  } catch (_error) {
    console.error('Conversion tracking error:', error);
  }
}

/**
 * Track page view with conversion context
 */
export async function trackPageView(
  path: string,
  properties?: Record<string, any>,
  conversionStage?: string
): Promise<void> {
  await trackConversion(CONVERSION_STAGES.PAGE_VIEW, {
    path,
    ...properties,
    conversionStage: conversionStage || 'awareness',
  });
}

/**
 * Track signup start
 */
export async function trackSignupStart(source?: string): Promise<void> {
  await trackConversion(CONVERSION_STAGES.SIGNUP_START, {
    source: source || 'unknown',
  });
}

/**
 * Track signup completion
 */
export async function trackSignupComplete(userId: string, plan?: string): Promise<void> {
  await trackConversion(CONVERSION_STAGES.SIGNUP_COMPLETE, {
    userId,
    plan,
  });
}

/**
 * Track trial start
 */
export async function trackTrialStart(userId: string): Promise<void> {
  await trackConversion(CONVERSION_STAGES.TRIAL_START, {
    userId,
  });
}

/**
 * Track first reconciliation (key conversion milestone)
 */
export async function trackFirstReconciliation(userId: string, jobId: string): Promise<void> {
  await trackConversion(CONVERSION_STAGES.FIRST_RECONCILIATION, {
    userId,
    jobId,
  });
}

/**
 * Track first paid invoice (conversion to paid)
 */
export async function trackFirstPaidInvoice(userId: string, amount: number, plan: string): Promise<void> {
  await trackConversion(CONVERSION_STAGES.FIRST_PAID_INVOICE, {
    userId,
    amount,
    plan,
  });
}

/**
 * Track upgrade
 */
export async function trackUpgrade(userId: string, fromPlan: string, toPlan: string): Promise<void> {
  await trackConversion(CONVERSION_STAGES.UPGRADE, {
    userId,
    fromPlan,
    toPlan,
  });
}

/**
 * Track churn
 */
export async function trackChurn(userId: string, reason?: string): Promise<void> {
  await trackConversion(CONVERSION_STAGES.CHURN, {
    userId,
    reason,
  });
}

/**
 * Track playground visit
 */
export async function trackPlaygroundVisit(): Promise<void> {
  await trackConversion('playground_visit', {
    path: typeof window !== 'undefined' ? window.location.pathname : undefined,
  });
}
