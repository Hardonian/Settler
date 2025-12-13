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
import { trackPaymentFailure, trackCheckoutCompleted, trackSubscriptionCancellation } from '@/lib/monitoring/alerts';
import { trackRevenue, trackBusinessEvent } from '@/lib/metrics/business';

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
    console.error('[Stripe Webhook] Error checking event idempotency:', error);
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
      console.warn('[Stripe Webhook] Event already received:', eventId);
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

export async function POST(request: NextRequest) {
  // Read RAW body - CRITICAL for signature verification
  const body = await request.text();
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
    console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify signature using RAW body
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const error = err as Error;
    console.error('[Stripe Webhook] Signature verification failed:', error.message);
    return NextResponse.json(
      { error: `Webhook Error: ${error.message}` },
      { status: 400 }
    );
  }

  // Database-backed idempotency check
  const alreadyProcessed = await isEventProcessed(event.id);
  if (alreadyProcessed) {
    console.info('[Stripe Webhook] Event already processed:', {
      eventId: event.id,
      type: event.type,
    });
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Record event receipt (with idempotency protection)
  try {
    await recordEventReceived(event.id, event.type, JSON.parse(body));
  } catch (error) {
    console.error('[Stripe Webhook] Failed to record event:', error);
    // Continue processing - event might have been recorded in parallel
  }

  // Extract billing account ID for audit trail
  const billingAccountId = extractBillingAccountId(event);

  try {
    // Handle checkout.session.completed - create subscription from checkout
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Track checkout completion
      const billingAccountId = session.metadata?.billingAccountId;
      const planCode = session.metadata?.planCode;
      const billingCycle = session.metadata?.billingCycle as 'monthly' | 'annual' | undefined;
      
      if (billingAccountId && planCode) {
        trackCheckoutCompleted(
          billingAccountId,
          planCode,
          billingCycle || 'monthly',
          session.id
        );
      }
      
      if (session.mode === 'subscription' && session.subscription) {
        // Fetch the subscription to sync it
        const subscriptionId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription.id;
        
        try {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await syncSubscriptionFromWebhook({
            ...event,
            type: 'customer.subscription.created',
            data: {
              object: subscription,
            },
          } as Stripe.Event);
        } catch (error) {
          console.error('[Stripe Webhook] Failed to sync subscription from checkout:', error);
          throw error;
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

      // Track subscription lifecycle events
      const subscription = event.data.object as Stripe.Subscription;
      const billingAccountId = subscription.metadata?.billingAccountId;
      
      if (billingAccountId) {
        if (event.type === 'customer.subscription.deleted') {
          trackSubscriptionCancellation(
            billingAccountId,
            subscription.metadata?.planCode || 'unknown'
          );
        } else if (event.type === 'customer.subscription.created') {
          trackBusinessEvent('subscription_created', {
            billingAccountId,
            planCode: subscription.metadata?.planCode,
            subscriptionId: subscription.id,
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

    // Handle payment method events
    if (event.type === 'payment_method.attached') {
      const paymentMethod = event.data.object as Stripe.PaymentMethod;
      console.info('[Stripe Webhook] Payment method attached', {
        paymentMethodId: paymentMethod.id,
        customerId: paymentMethod.customer,
      });
    }

    // Handle subscription schedule events (for prorations, upgrades, etc.)
    if (event.type === 'customer.subscription_schedule.created' || 
        event.type === 'customer.subscription_schedule.updated' ||
        event.type === 'customer.subscription_schedule.released') {
      const schedule = event.data.object as Stripe.SubscriptionSchedule;
      console.info('[Stripe Webhook] Subscription schedule event', {
        scheduleId: schedule.id,
        customerId: schedule.customer,
        status: schedule.status,
      });
    }

    // Handle invoice events for upcoming invoices
    if (event.type === 'invoice.upcoming') {
      const invoice = event.data.object as Stripe.Invoice;
      console.info('[Stripe Webhook] Upcoming invoice', {
        invoiceId: invoice.id,
        amountDue: invoice.amount_due,
        customerId: invoice.customer,
      });
    }

    // Handle invoice events
    if (event.type === 'invoice.paid') {
      const invoice = event.data.object as Stripe.Invoice;
      // Access subscription via type assertion since TypeScript types may not expose it directly
      const subscriptionId = (invoice as any).subscription as string | Stripe.Subscription | null;
      const subscriptionIdString = typeof subscriptionId === 'string' 
        ? subscriptionId 
        : subscriptionId?.id || null;
      
      console.info('[Stripe Webhook] Invoice payment succeeded', {
        invoiceId: invoice.id,
        subscriptionId: subscriptionIdString,
      });
      
      // Update subscription status if needed
      if (subscriptionIdString) {
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscriptionIdString },
          data: { status: 'active' },
        });

        // Track revenue
        if (invoice.amount_paid && invoice.currency) {
          const subscription = await prisma.subscription.findFirst({
            where: { stripeSubscriptionId: subscriptionIdString },
            select: { billingAccountId: true, planName: true },
          });

          if (subscription) {
            const planCode = subscription.planName.toLowerCase().includes('pro') ? 'pro' : 
                           subscription.planName.toLowerCase().includes('scale') ? 'scale' : 'free';
            trackRevenue(
              invoice.amount_paid / 100, // Convert from cents
              invoice.currency,
              planCode,
              'monthly' // TODO: Determine from subscription
            );
          }
        }
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice;
      // Access subscription via type assertion since TypeScript types may not expose it directly
      const subscriptionId = (invoice as any).subscription as string | Stripe.Subscription | null;
      const subscriptionIdString = typeof subscriptionId === 'string' 
        ? subscriptionId 
        : subscriptionId?.id || null;
      
      console.warn('[Stripe Webhook] Invoice payment failed', {
        invoiceId: invoice.id,
        subscriptionId: subscriptionIdString,
      });
      
      // Update subscription status if needed
      if (subscriptionIdString) {
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscriptionIdString },
          data: { status: 'past_due' },
        });

        // Track payment failure
        const subscription = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: subscriptionIdString },
          select: { billingAccountId: true },
        });

        if (subscription) {
          trackPaymentFailure(
            subscription.billingAccountId,
            subscriptionIdString,
            new Error(`Payment failed for invoice ${invoice.id}`)
          );
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
        console.warn('[Stripe Webhook] Failed to update billing account ID:', error);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Stripe Webhook] Error processing webhook:', {
      eventId: event.id,
      eventType: event.type,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Mark as failed in database
    try {
      await markEventFailed(event.id, errorMessage);
    } catch (dbError) {
      console.error('[Stripe Webhook] Failed to mark event as failed:', dbError);
    }
    
    // Return 500 so Stripe retries
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
