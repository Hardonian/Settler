/**
 * Activation Funnel Instrumentation
 * 
 * Emits canonical lifecycle events for product-led growth tracking.
 * Uses existing UsageEvent table for event storage.
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Canonical lifecycle event types
 */
export enum LifecycleEventType {
  USER_SIGNED_UP = 'user.signed_up',
  TENANT_CREATED = 'tenant.created',
  PROVIDER_CONNECTED = 'provider.connected',
  RECON_FIRST_RUN = 'recon.first_run',
  RECON_EXCEPTION_CREATED = 'recon.exception_created',
  RECON_EXCEPTION_RESOLVED = 'recon.exception_resolved',
  BILLING_CHECKOUT_STARTED = 'billing.checkout_started',
  BILLING_CHECKOUT_COMPLETED = 'billing.checkout_completed',
  BILLING_PAYMENT_FAILED = 'billing.payment_failed',
  BILLING_SUBSCRIPTION_CANCELED = 'billing.subscription_canceled',
}

export interface LifecycleEventProperties {
  [key: string]: unknown;
}

/**
 * Emit a lifecycle event
 */
export async function emitLifecycleEvent(
  eventType: LifecycleEventType,
  params: {
    userId?: string;
    tenantId?: string;
    billingAccountId?: string;
    properties?: LifecycleEventProperties;
  }
): Promise<void> {
  try {
    const { userId, tenantId, billingAccountId, properties = {} } = params;

    // Find or create billing account if we have userId or tenantId
    let finalBillingAccountId = billingAccountId;
    if (!finalBillingAccountId && userId) {
      const account = await prisma.billingAccount.findFirst({
        where: { userId },
        select: { id: true },
      });
      finalBillingAccountId = account?.id;
    }
    if (!finalBillingAccountId && tenantId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { billingAccountId: true },
      });
      finalBillingAccountId = tenant?.billingAccountId || undefined;
    }

    // If still no billing account, create a minimal one for tracking
    if (!finalBillingAccountId && userId) {
      const user = await prisma.billingAccount.findFirst({
        where: { userId },
        select: { id: true, email: true },
      });
      if (!user) {
        // Would need user email - skip for now if not available
        // Use dynamic import to avoid circular dependencies
        import('../utils/logger').then(({ logWarn }) => {
          logWarn(`Cannot emit lifecycle event ${eventType}: no billing account found`);
        }).catch(() => {
          // Silent fail if logger unavailable
        });
        return;
      }
      finalBillingAccountId = user.id;
    }

    if (!finalBillingAccountId) {
      // Use dynamic import to avoid circular dependencies
      import('../utils/logger').then(({ logWarn }) => {
        logWarn(`Cannot emit lifecycle event ${eventType}: no billing account ID available`);
      }).catch(() => {
        // Silent fail if logger unavailable
      });
      return;
    }

    // Emit event via UsageEvent table
    await prisma.usageEvent.create({
      data: {
        billingAccountId: finalBillingAccountId,
        userId: userId || null,
        tenantId: tenantId || null,
        eventType,
        quantity: 1,
        unit: 'event',
        metadata: properties as Prisma.InputJsonValue,
        timestamp: new Date(),
        aggregated: false,
      },
    });
  } catch (error) {
    // Don't throw - event tracking should never break the main flow
    // Use dynamic import to avoid circular dependencies
    import('../utils/logger').then(({ logError }) => {
      logError(`Failed to emit lifecycle event ${eventType}`, error);
    }).catch(() => {
      // Silent fail if logger unavailable
    });
  }
}

/**
 * Get activation funnel metrics
 */
export async function getActivationFunnelMetrics(params: {
  startDate: Date;
  endDate: Date;
  tenantId?: string;
}) {
  const { startDate, endDate, tenantId } = params;

  const where: {
    timestamp: {
      gte: Date;
      lt: Date;
    };
    tenantId?: string;
  } = {
    timestamp: {
      gte: startDate,
      lt: endDate,
    },
  };

  if (tenantId) {
    where.tenantId = tenantId;
  }

  const [
    signups,
    tenantsCreated,
    providersConnected,
    firstRecons,
    exceptionsCreated,
    exceptionsResolved,
    checkoutsStarted,
    checkoutsCompleted,
    paymentsFailed,
    subscriptionsCanceled,
  ] = await Promise.all([
    prisma.usageEvent.count({
      where: {
        ...where,
        eventType: LifecycleEventType.USER_SIGNED_UP,
      },
    }),
    prisma.usageEvent.count({
      where: {
        ...where,
        eventType: LifecycleEventType.TENANT_CREATED,
      },
    }),
    prisma.usageEvent.count({
      where: {
        ...where,
        eventType: LifecycleEventType.PROVIDER_CONNECTED,
      },
    }),
    prisma.usageEvent.count({
      where: {
        ...where,
        eventType: LifecycleEventType.RECON_FIRST_RUN,
      },
    }),
    prisma.usageEvent.count({
      where: {
        ...where,
        eventType: LifecycleEventType.RECON_EXCEPTION_CREATED,
      },
    }),
    prisma.usageEvent.count({
      where: {
        ...where,
        eventType: LifecycleEventType.RECON_EXCEPTION_RESOLVED,
      },
    }),
    prisma.usageEvent.count({
      where: {
        ...where,
        eventType: LifecycleEventType.BILLING_CHECKOUT_STARTED,
      },
    }),
    prisma.usageEvent.count({
      where: {
        ...where,
        eventType: LifecycleEventType.BILLING_CHECKOUT_COMPLETED,
      },
    }),
    prisma.usageEvent.count({
      where: {
        ...where,
        eventType: LifecycleEventType.BILLING_PAYMENT_FAILED,
      },
    }),
    prisma.usageEvent.count({
      where: {
        ...where,
        eventType: LifecycleEventType.BILLING_SUBSCRIPTION_CANCELED,
      },
    }),
  ]);

  const conversionRates = {
    signupToConnect: signups > 0 ? (providersConnected / signups) * 100 : 0,
    connectToRecon: providersConnected > 0 ? (firstRecons / providersConnected) * 100 : 0,
    reconToResolved: exceptionsCreated > 0 ? (exceptionsResolved / exceptionsCreated) * 100 : 0,
    checkoutToCompleted: checkoutsStarted > 0 ? (checkoutsCompleted / checkoutsStarted) * 100 : 0,
  };

  return {
    signups,
    tenantsCreated,
    providersConnected,
    firstRecons,
    exceptionsCreated,
    exceptionsResolved,
    checkoutsStarted,
    checkoutsCompleted,
    paymentsFailed,
    subscriptionsCanceled,
    conversionRates,
  };
}
