/**
 * Funnel & Conversion Contracts
 * 
 * PHASE 2: FUNNEL & CONVERSION CONTRACTS
 * 
 * Canonical funnels with explicit conversion paths.
 * Every page has a next logical action.
 */

import { Prisma } from '@prisma/client';

export type FunnelStage =
  | 'visitor'
  | 'playground_engaged'
  | 'signed_up'
  | 'first_api_call'
  | 'first_reconciliation'
  | 'first_integration'
  | 'upgraded'
  | 'activated'
  | 'retained';

export interface FunnelTransition {
  from: FunnelStage;
  to: FunnelStage;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Canonical funnels with conversion paths
 */
export const FUNNELS = {
  /**
   * Visitor → Playground → Auth → First Job → Upgrade → Retention
   */
  main: {
    stages: [
      {
        id: 'visitor',
        name: 'Visitor',
        page: '/',
        nextAction: {
          label: 'Try Playground',
          url: '/playground',
          type: 'cta',
        },
        conversionCriteria: 'visits_playground',
      },
      {
        id: 'playground_engaged',
        name: 'Playground Engaged',
        page: '/playground',
        nextAction: {
          label: 'Sign Up',
          url: '/signup?next=/console',
          type: 'cta',
        },
        conversionCriteria: 'creates_account',
      },
      {
        id: 'signed_up',
        name: 'Signed Up',
        page: '/console',
        nextAction: {
          label: 'Get API Key',
          url: '/console/api-keys',
          type: 'gate',
        },
        conversionCriteria: 'creates_api_key',
      },
      {
        id: 'first_api_call',
        name: 'First API Call',
        page: '/console/api-logs',
        nextAction: {
          label: 'Run First Reconciliation',
          url: '/console/playground/reconcile',
          type: 'gate',
        },
        conversionCriteria: 'runs_reconciliation',
      },
      {
        id: 'first_reconciliation',
        name: 'First Reconciliation',
        page: '/console/reconciliation-view',
        nextAction: {
          label: 'Connect Integration',
          url: '/console/integrations',
          type: 'value',
        },
        conversionCriteria: 'connects_integration',
      },
      {
        id: 'first_integration',
        name: 'First Integration',
        page: '/console/integrations',
        nextAction: {
          label: 'Upgrade Plan',
          url: '/pricing?next=/console',
          type: 'upgrade',
        },
        conversionCriteria: 'upgrades_plan',
      },
      {
        id: 'upgraded',
        name: 'Upgraded',
        page: '/console',
        nextAction: {
          label: 'View Usage',
          url: '/console/usage',
          type: 'value',
        },
        conversionCriteria: 'views_usage_3_times',
      },
      {
        id: 'activated',
        name: 'Activated',
        page: '/console',
        nextAction: {
          label: 'Explore Features',
          url: '/console',
          type: 'value',
        },
        conversionCriteria: 'uses_product_weekly',
      },
      {
        id: 'retained',
        name: 'Retained',
        page: '/console',
        nextAction: null, // End of funnel
        conversionCriteria: 'uses_product_monthly',
      },
    ],
  },
} as const;

/**
 * Track funnel transition
 */
export async function trackFunnelTransition(
  transition: FunnelTransition
): Promise<void> {
  try {
    // Store in database for analysis
    if (transition.userId) {
      const { prisma } = await import('@/shared/db/prismaClient');
      
      // Get billing account if available
      let billingAccountId: string | undefined;
      if (transition.userId) {
        const billingAccount = await prisma.billingAccount.findFirst({
          where: { userId: transition.userId },
          select: { id: true },
        });
        billingAccountId = billingAccount?.id;
      }

      if (billingAccountId) {
        await prisma.usageEvent.create({
          data: {
            billingAccountId,
            userId: transition.userId,
            eventType: `funnel:${transition.from}→${transition.to}`,
            quantity: 1,
            metadata: (transition.metadata || {}) as Prisma.InputJsonValue,
            timestamp: transition.timestamp,
          },
        });
      }
    }

    // Track as analytics event
    if (typeof window !== 'undefined') {
      const { trackEvent } = await import('./analytics');
      trackEvent('funnel_transition', {
        from: transition.from,
        to: transition.to,
        sessionId: transition.sessionId,
        ...transition.metadata,
      });
    }
  } catch (_error) {
    console.error('[trackFunnelTransition] Failed to track:', error);
  }
}

/**
 * Get current user's funnel stage
 */
export async function getCurrentFunnelStage(
  userId: string
): Promise<FunnelStage> {
  try {
    // Dynamic import to avoid import-time failures
    const { prisma } = await import('@/shared/db/prismaClient');
    
    // Check for activation
    const activationEvent = await prisma.usageEvent.findFirst({
      where: {
        userId,
        eventType: 'value:activation_complete',
      },
    });
    if (activationEvent) return 'activated';

    // Check for upgrade
    const subscription = await prisma.subscription.findFirst({
      where: {
        billingAccount: {
          userId,
        },
        status: {
          in: ['active', 'trialing'],
        },
      },
    });
    if (subscription && subscription.planId !== 'free') {
      return 'upgraded';
    }

    // Check for first integration
    const integrationEvent = await prisma.usageEvent.findFirst({
      where: {
        userId,
        eventType: {
          startsWith: 'value:integration_connected',
        },
      },
    });
    if (integrationEvent) return 'first_integration';

    // Check for first reconciliation
    const reconEvent = await prisma.usageEvent.findFirst({
      where: {
        userId,
        eventType: {
          startsWith: 'value:reconciliation_completed',
        },
      },
    });
    if (reconEvent) return 'first_reconciliation';

    // Check for first API call
    const apiEvent = await prisma.usageEvent.findFirst({
      where: {
        userId,
        eventType: {
          startsWith: 'value:first_api_call',
        },
      },
    });
    if (apiEvent) return 'first_api_call';

    // Check if signed up
    const user = await prisma.billingAccount.findFirst({
      where: { userId },
    });
    if (user) return 'signed_up';

    return 'visitor';
  } catch (_error) {
    console.error('[getCurrentFunnelStage] Error:', error);
    return 'visitor';
  }
}

/**
 * Get next action for current stage
 */
export function getNextAction(stage: FunnelStage): {
  label: string;
  url: string;
  type: 'cta' | 'gate' | 'value' | 'upgrade';
} | null {
  const funnel = FUNNELS.main;
  const stageData = funnel.stages.find((s) => s.id === stage);
  return stageData?.nextAction || null;
}
