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

export const dynamic = 'force-dynamic';

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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const billingAccount = await prisma.billingAccount.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!billingAccount) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 404 });
    }

    const body = await request.json();
    const { planCode, successUrl, cancelUrl } = body;

    // Input validation
    if (!isValidPlanCode(planCode)) {
      return NextResponse.json(
        { error: 'Invalid plan code. Must be one of: free, pro, scale' },
        { status: 400 }
      );
    }

    if (!isValidOriginUrl(successUrl) || !isValidOriginUrl(cancelUrl)) {
      return NextResponse.json(
        { error: 'Invalid URL format or origin for successUrl or cancelUrl' },
        { status: 400 }
      );
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
      successUrl,
      cancelUrl
    );

    if (!session.url) {
      return NextResponse.json(
        { error: 'Failed to create checkout session URL' },
        { status: 500 }
      );
    }

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
