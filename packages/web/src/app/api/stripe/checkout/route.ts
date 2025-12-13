/**
 * Stripe Checkout API Route
 * 
 * Creates a Stripe Checkout session for plan upgrades.
 * Includes input validation and security checks.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/shared/db/prismaClient';
import { createCheckoutSession } from '@/domain/billing/stripeService';
import { PlanCode, getPlanConfig } from '@/domain/billing/planConfig';
import { trackCheckoutStarted } from '@/lib/monitoring/alerts';
import { trackConversionFunnel } from '@/lib/metrics/business';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Prisma binary engine

/**
 * Validate plan code
 */
function isValidPlanCode(planCode: unknown): planCode is PlanCode {
  return typeof planCode === 'string' && ['free', 'pro', 'scale'].includes(planCode);
}

/**
 * Validate URL format and origin
 */
function isValidOriginUrl(url: unknown): boolean {
  if (typeof url !== 'string') {
    return false;
  }
  try {
    const parsed = new URL(url);
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://settler.dev';
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && url.startsWith(origin);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('[Stripe Checkout] STRIPE_SECRET_KEY not configured');
      return NextResponse.json(
        { error: 'Billing is not available at this time. Please contact support.' },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in to continue.' }, { status: 401 });
    }

    const billingAccount = await prisma.billingAccount.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });

    const body = await request.json();
    const { planCode, successUrl, cancelUrl, billingCycle } = body;
    
    // Validate billing cycle
    const validBillingCycle = billingCycle === 'annual' ? 'annual' : 'monthly';

    // Input validation
    if (!isValidPlanCode(planCode)) {
      return NextResponse.json(
        { error: 'Invalid plan code. Must be one of: free, pro, scale' },
        { status: 400 }
      );
    }

    // Use provided URLs or construct defaults
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://settler.dev';
    const finalSuccessUrl = successUrl || `${siteUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`;
    const finalCancelUrl = cancelUrl || `${siteUrl}/pricing?canceled=1`;

    if (!isValidOriginUrl(finalSuccessUrl) || !isValidOriginUrl(finalCancelUrl)) {
      return NextResponse.json(
        { error: 'Invalid URL format or origin for successUrl or cancelUrl' },
        { status: 400 }
      );
    }

    if (!billingAccount) {
      // Try to create billing account if it doesn't exist
      try {
        const newAccount = await prisma.billingAccount.create({
          data: {
            userId: user.id,
            email: user.email || '',
            status: 'active',
          },
        });
        // Use the new account
        const session = await createCheckoutSession(
          newAccount.id,
          planCode,
          finalSuccessUrl,
          finalCancelUrl,
          validBillingCycle
        );
        if (!session.url) {
          return NextResponse.json(
            { error: 'Failed to create checkout session URL' },
            { status: 500 }
          );
        }
        return NextResponse.json({ url: session.url });
      } catch (createError) {
        console.error('[Stripe Checkout] Failed to create billing account:', createError);
        return NextResponse.json(
          { error: 'Failed to initialize billing account. Please contact support.' },
          { status: 500 }
        );
      }
    }

    // Prevent downgrading to free (must use customer portal)
    const planConfig = getPlanConfig(planCode);
    if (planConfig && planConfig.code === 'free') {
      return NextResponse.json(
        { error: 'Cannot upgrade to free plan. Please use customer portal to cancel subscription.' },
        { status: 400 }
      );
    }

    const session = await createCheckoutSession(
      billingAccount.id,
      planCode,
      finalSuccessUrl,
      finalCancelUrl,
      validBillingCycle
    );

    if (!session.url) {
      return NextResponse.json(
        { error: 'Failed to create checkout session URL' },
        { status: 500 }
      );
    }

    // Track checkout started
    trackCheckoutStarted(billingAccount.id, planCode, validBillingCycle);
    trackConversionFunnel('started_checkout', {
      billingAccountId: billingAccount.id,
      planCode,
      billingCycle: validBillingCycle,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Stripe Checkout] Error creating checkout session:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
