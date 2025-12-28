/**
 * Lifecycle Event Emission Helper
 * 
 * Server-side helper for emitting activation funnel events.
 * Uses Prisma to write to UsageEvent table.
 */

import { PrismaClient } from '@prisma/client';

// Import lifecycle event functions - handle both direct import and fallback
let emitLifecycleEvent: any;
let LifecycleEventType: any;

try {
  const activationFunnel = require('@settler/api/src/ops/activation-funnel');
  emitLifecycleEvent = activationFunnel.emitLifecycleEvent;
  LifecycleEventType = activationFunnel.LifecycleEventType;
} catch {
  // Fallback: implement inline if import fails
  console.warn('Could not import activation funnel functions, using fallback implementation');
  
  LifecycleEventType = {
    USER_SIGNED_UP: 'user.signed_up',
    TENANT_CREATED: 'tenant.created',
    PROVIDER_CONNECTED: 'provider.connected',
    RECON_FIRST_RUN: 'recon.first_run',
    RECON_EXCEPTION_CREATED: 'recon.exception_created',
    RECON_EXCEPTION_RESOLVED: 'recon.exception_resolved',
    BILLING_CHECKOUT_STARTED: 'billing.checkout_started',
    BILLING_CHECKOUT_COMPLETED: 'billing.checkout_completed',
    BILLING_PAYMENT_FAILED: 'billing.payment_failed',
    BILLING_SUBSCRIPTION_CANCELED: 'billing.subscription_canceled',
  };

  emitLifecycleEvent = async function(eventType: string, params: any) {
    const prisma = new PrismaClient();
    try {
      const { userId, tenantId, billingAccountId, properties = {} } = params;
      
      let finalBillingAccountId = billingAccountId;
      if (!finalBillingAccountId && userId) {
        const account = await prisma.billingAccount.findFirst({
          where: { userId },
          select: { id: true },
        });
        finalBillingAccountId = account?.id;
      }
      
      if (!finalBillingAccountId) {
        console.warn(`Cannot emit lifecycle event ${eventType}: no billing account ID available`);
        return;
      }

      await prisma.usageEvent.create({
        data: {
          billingAccountId: finalBillingAccountId,
          userId: userId || null,
          tenantId: tenantId || null,
          eventType,
          quantity: 1,
          unit: 'event',
          metadata: properties as any,
          timestamp: new Date(),
          aggregated: false,
        },
      });
    } catch (error) {
      console.error(`Failed to emit lifecycle event ${eventType}:`, error);
    } finally {
      await prisma.$disconnect();
    }
  };
}

const prisma = new PrismaClient();

/**
 * Emit lifecycle event (server-side wrapper)
 * Handles errors gracefully - never throws
 */
export async function emitLifecycleEventSafe(
  eventType: string,
  params: {
    userId?: string;
    tenantId?: string;
    billingAccountId?: string;
    properties?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    await emitLifecycleEvent(eventType, params);
  } catch (error) {
    // Don't throw - event tracking should never break the main flow
    console.error(`Failed to emit lifecycle event ${eventType}:`, error);
  }
}

// Export LifecycleEventType for use in other files
export { LifecycleEventType };
