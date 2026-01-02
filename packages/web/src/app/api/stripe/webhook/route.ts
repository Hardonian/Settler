/**
 * Stripe Webhook Handler
 * 
 * Handles Stripe webhook events for subscription lifecycle.
 * MANDATORY REQUIREMENTS:
 * - Node.js runtime (NOT Edge)
 * - RAW request body for signature verification
 * - Database-backed idempotency using stripe_events table
 * - Bypasses all auth middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe, syncSubscriptionFromWebhook } from '@/domain/billing/stripeService';
import { prisma } from '@/shared/db/prismaClient';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { trackWebhookMetric } from '@/lib/monitoring/metrics';
import { requestSizeLimits } from '@/middleware/request-size-limit';
import { getTraceId } from '@/lib/observability/trace';
import { logger } from '@/lib/observability/logger';
import { emitLifecycleEventSafe, LifecycleEventType } from '@/lib/ops/lifecycle-events';
import { safeLogger } from '@/lib/observability/safe-logger';
// NOTE: Webhooks don't use billing gates - they're authenticated via Stripe signature

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // CRITICAL: Must be Node.js runtime for Prisma

/**
 * Check if event was already processed (database-backed idempotency)
 */
async function isEventProcessed(eventId: string): Promise<boolean> {
  try {
    const existing = await prisma.stripeEvent.findUnique({
      where: { eventId },
      select: { id: true, status: true },
    });
    return existing !== null && existing.status === 'processed';
  } catch (error) {
    await safeLogger.error('[Stripe Webhook] Error checking event idempotency', {
      eventId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    // On error, assume not processed to allow retry
    return false;
  }
}

/**
 * Record event receipt in database
 */
async function recordEventReceived(
  eventId: string,
  eventType: string,
  rawPayload: unknown
): Promise<void> {
  try {
    await prisma.stripeEvent.create({
      data: {
        eventId,
        type: eventType,
        status: 'received',
        rawPayload: rawPayload as never,
      },
    });
  } catch (error: any) {
    // If unique violation, event was already received (idempotent)
    if (error?.code === 'P2002') {
      await safeLogger.debug('[Stripe Webhook] Event already received', { eventId });
      return;
    }
    throw error;
  }
}

/**
 * Mark event as processed
 */
async function markEventProcessed(eventId: string): Promise<void> {
  await prisma.stripeEvent.update({
    where: { eventId },
    data: {
      status: 'processed',
      processedAt: new Date(),
    },
  });
}

/**
 * Mark event as failed
 */
async function markEventFailed(eventId: string, error: string): Promise<void> {
  await prisma.stripeEvent.update({
    where: { eventId },
    data: {
      status: 'failed',
      error,
      processedAt: new Date(),
    },
  });
}

/**
 * Extract billing account ID from event metadata
 */
function extractBillingAccountId(event: Stripe.Event): string | null {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    return session.metadata?.billingAccountId || null;
  }
  
  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    return subscription.metadata?.billingAccountId || null;
  }
  
  if (event.type === 'customer.updated') {
    const customer = event.data.object as Stripe.Customer;
    return customer.metadata?.billingAccountId || null;
  }
  
  if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice;
    // Invoice.subscription can be string | Stripe.Subscription | null
    // Access via type assertion since TypeScript types may not expose it directly
    const subscription = (invoice as any).subscription as string | Stripe.Subscription | null;
    if (!subscription || typeof subscription === 'string') {
      // We'd need to fetch the subscription to get metadata, but for now return null
      return null;
    }
    return subscription.metadata?.billingAccountId || null;
  }
  
  return null;
}

// Webhook route - authenticated via Stripe signature, not billing gate
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const traceId = await getTraceId(request);

  // Check request size (max 500KB for webhooks)
  const sizeCheck = requestSizeLimits.webhook(request);
  if (sizeCheck) {
    sizeCheck.headers.set('x-trace-id', traceId);
    return sizeCheck;
  }

  // Read RAW body - CRITICAL for signature verification
  const body = await request.text();
  
  // Double-check size after reading
  if (body.length > 500 * 1024) {
    return NextResponse.json(
      { error: 'Request body too large' },
      { status: 413 }
    );
  }
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    await safeLogger.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured');
    // Configuration error - return 503 (service unavailable) instead of 500
    // This indicates misconfiguration, not a transient error
    return NextResponse.json(
      { error: 'Webhook secret not configured', message: 'Server configuration error' },
      { status: 503 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify signature using RAW body
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const error = err as Error;
    await safeLogger.error('[Stripe Webhook] Signature verification failed', {
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: `Webhook Error: ${error.message}` },
      { status: 400 }
    );
  }

  // Database-backed idempotency check
  const alreadyProcessed = await isEventProcessed(event.id);
  if (alreadyProcessed) {
    await logger.info('Stripe webhook event already processed', {
      trace_id: traceId,
      eventId: event.id,
      type: event.type,
    });
    const response = NextResponse.json({ received: true, duplicate: true, trace_id: traceId });
    response.headers.set('x-trace-id', traceId);
    return response;
  }

  // Record event receipt (with idempotency protection)
  try {
    await recordEventReceived(event.id, event.type, JSON.parse(body));
  } catch (error) {
    await safeLogger.error('[Stripe Webhook] Failed to record event', {
      eventId: event.id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    // Continue processing - event might have been recorded in parallel
  }

  // Extract billing account ID for audit trail
  const billingAccountId = extractBillingAccountId(event);

  try {
    // Handle checkout.session.completed - create subscription from checkout
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Emit lifecycle event: checkout completed
      if (billingAccountId) {
        try {
          const billingAccount = await prisma.billingAccount.findUnique({
            where: { id: billingAccountId },
            select: { userId: true, tenantId: true },
          });

          await emitLifecycleEventSafe(LifecycleEventType.BILLING_CHECKOUT_COMPLETED, {
            userId: billingAccount?.userId || undefined,
            tenantId: billingAccount?.tenantId || undefined,
            billingAccountId,
            properties: {
              session_id: session.id,
              mode: session.mode,
            },
          });
        } catch (eventError) {
          // Don't fail webhook processing if event emission fails
          await safeLogger.error('[Stripe Webhook] Failed to emit checkout completed event', {
            eventId: event.id,
            error: eventError instanceof Error ? eventError.message : String(eventError),
            stack: eventError instanceof Error ? eventError.stack : undefined,
          });
        }
      }
      
      if (session.mode === 'subscription' && session.subscription) {
        // Fetch the subscription to sync it
        const subscriptionId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription.id;
        
        try {
          // Use safe Stripe call with rate limit handling
          const { safeStripeCall } = await import('@/lib/stripe/rate-limit-handler');
          const result = await safeStripeCall(async (stripe) => {
            return await stripe.subscriptions.retrieve(subscriptionId);
          });
          await syncSubscriptionFromWebhook({
            ...event,
            type: 'customer.subscription.created',
            data: {
              object: result.data,
            },
          } as Stripe.Event);
        } catch (error) {
          await safeLogger.error('[Stripe Webhook] Failed to sync subscription from checkout', {
            eventId: event.id,
            subscriptionId,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          });
          // Don't throw - log and continue (graceful degradation)
          // Webhook will be marked as failed but won't crash
        }
      }
    }

    // Handle subscription events
    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      await syncSubscriptionFromWebhook(event);

      // Emit lifecycle event: subscription canceled
      if (event.type === 'customer.subscription.deleted' && billingAccountId) {
        try {
          const billingAccount = await prisma.billingAccount.findUnique({
            where: { id: billingAccountId },
            select: { userId: true, tenantId: true },
          });

          const subscription = event.data.object as Stripe.Subscription;

          await emitLifecycleEventSafe(LifecycleEventType.BILLING_SUBSCRIPTION_CANCELED, {
            userId: billingAccount?.userId || undefined,
            tenantId: billingAccount?.tenantId || undefined,
            billingAccountId,
            properties: {
              subscription_id: subscription.id,
              canceled_at: subscription.canceled_at,
            },
          });
        } catch (eventError) {
          await safeLogger.error('[Stripe Webhook] Failed to emit subscription canceled event', {
            eventId: event.id,
            error: eventError instanceof Error ? eventError.message : String(eventError),
            stack: eventError instanceof Error ? eventError.stack : undefined,
          });
        }
      }
    }

    // Handle customer events (optional - for metadata updates)
    if (event.type === 'customer.updated') {
      const customer = event.data.object as Stripe.Customer;
      if (customer.metadata?.billingAccountId && typeof customer.metadata.billingAccountId === 'string') {
        await prisma.billingAccount.updateMany({
          where: { stripeCustomerId: customer.id },
          data: {
            email: customer.email || undefined,
            name: customer.name || undefined,
          },
        });
      }
    }

    // Handle invoice events
    if (event.type === 'invoice.paid') {
      const invoice = event.data.object as Stripe.Invoice;
      // Access subscription via type assertion since TypeScript types may not expose it directly
      const subscriptionId = (invoice as any).subscription as string | Stripe.Subscription | null;
      const subscriptionIdString = typeof subscriptionId === 'string' 
        ? subscriptionId 
        : subscriptionId?.id || null;
      
      await safeLogger.info('[Stripe Webhook] Invoice payment succeeded', {
        invoiceId: invoice.id,
        subscriptionId: subscriptionIdString,
      });
      
      // Update subscription status if needed
      if (subscriptionIdString) {
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscriptionIdString },
          data: { status: 'active' },
        });
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice;
      // Access subscription via type assertion since TypeScript types may not expose it directly
      const subscriptionId = (invoice as any).subscription as string | Stripe.Subscription | null;
      const subscriptionIdString = typeof subscriptionId === 'string' 
        ? subscriptionId 
        : subscriptionId?.id || null;
      
      await safeLogger.warn('[Stripe Webhook] Invoice payment failed', {
        invoiceId: invoice.id,
        subscriptionId: subscriptionIdString,
      });
      
      // Update subscription status if needed
      if (subscriptionIdString) {
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscriptionIdString },
          data: { status: 'past_due' },
        });

        // Emit lifecycle event: payment failed
        if (billingAccountId) {
          try {
            const billingAccount = await prisma.billingAccount.findUnique({
              where: { id: billingAccountId },
              select: { userId: true, tenantId: true },
            });

            await emitLifecycleEventSafe(LifecycleEventType.BILLING_PAYMENT_FAILED, {
              userId: billingAccount?.userId || undefined,
              tenantId: billingAccount?.tenantId || undefined,
              billingAccountId,
              properties: {
                invoice_id: invoice.id,
                subscription_id: subscriptionIdString,
                amount_due: invoice.amount_due,
              },
            });
          } catch (eventError) {
            await safeLogger.error('[Stripe Webhook] Failed to emit payment failed event', {
              eventId: event.id,
              error: eventError instanceof Error ? eventError.message : String(eventError),
              stack: eventError instanceof Error ? eventError.stack : undefined,
            });
          }
        }
      }
    }

    // Mark as processed
    await markEventProcessed(event.id);

    // Update billing account ID if we extracted it
    if (billingAccountId) {
      try {
        await prisma.stripeEvent.update({
          where: { eventId: event.id },
          data: { billingAccountId },
        });
      } catch (error) {
        // Non-critical - just log
        await safeLogger.warn('[Stripe Webhook] Failed to update billing account ID', {
          eventId: event.id,
          billingAccountId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Track metrics
    const durationMs = Date.now() - startTime;
    await trackWebhookMetric(event.type, true, durationMs);

    const response = NextResponse.json({ received: true, trace_id: traceId });
    response.headers.set('x-trace-id', traceId);
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await logger.error('Stripe webhook processing failed', {
      trace_id: traceId,
      eventId: event.id,
      eventType: event.type,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Mark as failed in database
    try {
      await markEventFailed(event.id, errorMessage);
    } catch (dbError) {
      await logger.error('Failed to mark Stripe event as failed', {
        trace_id: traceId,
        eventId: event.id,
        error: dbError instanceof Error ? dbError.message : String(dbError),
      });
    }

    // Track error metrics
    const durationMs = Date.now() - startTime;
    await trackWebhookMetric(event.type, false, durationMs);
    
    // Return 500 so Stripe retries
    const response = NextResponse.json(
      { error: 'Webhook processing failed', trace_id: traceId },
      { status: 500 }
    );
    response.headers.set('x-trace-id', traceId);
    return response;
  }
}
