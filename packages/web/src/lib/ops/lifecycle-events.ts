/**
 * Lifecycle Event Emission Helper
 *
 * Server-side helper for emitting activation funnel events.
 * Uses Prisma to write to UsageEvent table.
 */

import type { Prisma } from "@prisma/client";

interface LifecycleEventParams {
  userId?: string;
  tenantId?: string;
  billingAccountId?: string;
  properties?: Record<string, unknown>;
}

interface ActivationFunnelModule {
  emitLifecycleEvent: (eventType: string, params: LifecycleEventParams) => Promise<void>;
}

/**
 * Exported event type map.
 *
 * This is safe to import in both environments; when the real activation-funnel
 * module is available, this object is patched in-place.
 */
export const LifecycleEventType = {
  USER_SIGNED_UP: "user.signed_up",
  TENANT_CREATED: "tenant.created",
  PROVIDER_CONNECTED: "provider.connected",
  RECON_FIRST_RUN: "recon.first_run",
  RECON_EXCEPTION_CREATED: "recon.exception_created",
  RECON_EXCEPTION_RESOLVED: "recon.exception_resolved",
  BILLING_CHECKOUT_STARTED: "billing.checkout_started",
  BILLING_CHECKOUT_COMPLETED: "billing.checkout_completed",
  BILLING_PAYMENT_FAILED: "billing.payment_failed",
  BILLING_SUBSCRIPTION_CANCELED: "billing.subscription_canceled",
} as const;

let cachedModule: ActivationFunnelModule | null = null;

async function getActivationFunnel(): Promise<ActivationFunnelModule> {
  if (cachedModule) return cachedModule;

  try {
    // Prefer ESM dynamic import (avoids eslint no-var-requires, works in Next runtime)
    const mod = (await import("@settler/api/src/ops/activation-funnel")) as ActivationFunnelModule;
    // Note: LifecycleEventType is const, so we don't extend it at runtime
    // Additional event types from the API module can be accessed via mod.LifecycleEventType if needed
    cachedModule = { emitLifecycleEvent: mod.emitLifecycleEvent };
    return cachedModule;
  } catch {
    // Fallback: implement inline if import fails
    cachedModule = {
      emitLifecycleEvent: async function emitLifecycleEventFallback(
        eventType: string,
        params: LifecycleEventParams
      ) {
        const { PrismaClient } = await import("@prisma/client");
        const prisma = new PrismaClient();
        try {
          const { userId, tenantId, billingAccountId, properties = {} } = params;

          let finalBillingAccountId: string | undefined = billingAccountId;
          if (!finalBillingAccountId && userId) {
            const account = await prisma.billingAccount.findFirst({
              where: { userId },
              select: { id: true },
            });
            finalBillingAccountId = account?.id;
          }

          if (!finalBillingAccountId) {
            return;
          }

          await prisma.usageEvent.create({
            data: {
              billingAccountId: finalBillingAccountId,
              userId: userId ?? null,
              tenantId: tenantId ?? null,
              eventType,
              quantity: 1,
              unit: "event",
              metadata: (properties ?? {}) as Prisma.InputJsonValue,
              timestamp: new Date(),
              aggregated: false,
            },
          });
        } finally {
          await prisma.$disconnect();
        }
      },
    };
    return cachedModule;
  }
}

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
    const mod = await getActivationFunnel();
    await mod.emitLifecycleEvent(eventType, params);
  } catch (error) {
    // Don't throw - event tracking should never break the main flow
    console.error(`Failed to emit lifecycle event ${eventType}:`, error);
  }
}
