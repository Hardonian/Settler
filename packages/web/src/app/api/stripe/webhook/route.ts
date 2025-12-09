/**
 * Stripe Webhook Handler
 * 
 * Handles Stripe webhook events for subscription lifecycle.
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe, syncSubscriptionFromWebhook } from '@/domain/billing/stripeService';
import { prisma } from '@/shared/db/prismaClient';
import { headers } from 'next/headers';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

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
    console.error('STRIPE_WEBHOOK_SECRET not configured');
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
    console.error('Webhook signature verification failed:', error.message);
    return NextResponse.json(
      { error: `Webhook Error: ${error.message}` },
      { status: 400 }
    );
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
      if (customer.metadata?.billingAccountId) {
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
      console.log('Invoice payment succeeded', event.data.object.id);
    }

    if (event.type === 'invoice.payment_failed') {
      // Could mark subscription as past_due
      console.log('Invoice payment failed', event.data.object.id);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
