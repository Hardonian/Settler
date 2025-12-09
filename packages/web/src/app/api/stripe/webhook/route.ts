/**
 * Stripe Webhook Handler
 * 
 * Handles Stripe webhook events for subscription lifecycle.
 * Includes proper security, error handling, and logging.
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe, syncSubscriptionFromWebhook } from '@/domain/billing/stripeService';
import { prisma } from '@/shared/db/prismaClient';
import { headers } from 'next/headers';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

// Rate limiting: track webhook processing to prevent abuse
const webhookProcessing = new Map<string, number>();
const WEBHOOK_RATE_LIMIT_MS = 1000; // 1 second between same event

/**
 * Check if webhook event was recently processed (idempotency)
 */
function isRecentlyProcessed(eventId: string): boolean {
  const lastProcessed = webhookProcessing.get(eventId);
  if (!lastProcessed) {
    return false;
  }
  return Date.now() - lastProcessed < WEBHOOK_RATE_LIMIT_MS;
}

/**
 * Mark webhook event as processed
 */
function markAsProcessed(eventId: string): void {
  webhookProcessing.set(eventId, Date.now());
  // Cleanup old entries (keep last 1000)
  if (webhookProcessing.size > 1000) {
    const entries = Array.from(webhookProcessing.entries());
    entries.sort((a, b) => b[1] - a[1]);
    webhookProcessing.clear();
    entries.slice(0, 1000).forEach(([id, time]) => webhookProcessing.set(id, time));
  }
}

export async function POST(request: NextRequest) {
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
    // eslint-disable-next-line no-console
    console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const error = err as Error;
    // eslint-disable-next-line no-console
    console.error('[Stripe Webhook] Signature verification failed:', error.message);
    return NextResponse.json(
      { error: `Webhook Error: ${error.message}` },
      { status: 400 }
    );
  }

  // Idempotency check: prevent duplicate processing
  if (isRecentlyProcessed(event.id)) {
    // eslint-disable-next-line no-console
    console.warn('[Stripe Webhook] Event already processed recently', { eventId: event.id, type: event.type });
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    // Handle subscription events
    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      await syncSubscriptionFromWebhook(event);
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

    // Handle invoice events (optional - for payment tracking)
    if (event.type === 'invoice.payment_succeeded') {
      // Could update subscription status or send notifications
      // eslint-disable-next-line no-console
      console.info('[Stripe Webhook] Invoice payment succeeded', { invoiceId: (event.data.object as Stripe.Invoice).id });
    }

    if (event.type === 'invoice.payment_failed') {
      // Could mark subscription as past_due
      // eslint-disable-next-line no-console
      console.warn('[Stripe Webhook] Invoice payment failed', { invoiceId: (event.data.object as Stripe.Invoice).id });
    }

    // Mark as processed
    markAsProcessed(event.id);

    return NextResponse.json({ received: true });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Stripe Webhook] Error processing webhook:', {
      eventId: event.id,
      eventType: event.type,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
