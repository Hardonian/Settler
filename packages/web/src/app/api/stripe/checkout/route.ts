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
import { requestSizeLimits } from '@/middleware/request-size-limit';
import { redisRateLimiters } from '@/lib/security/rate-limiter-redis';
import { auditBilling } from '@/lib/audit/logger';
import { trackApiMetric } from '@/lib/monitoring/metrics';

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
  const startTime = Date.now();

  try {
    // Check request size
    const sizeCheck = requestSizeLimits.api(request);
    if (sizeCheck) {
      return sizeCheck;
    }

    // Apply rate limiting
    const rateLimitCheck = await redisRateLimiters.billing(request);
    if (rateLimitCheck) {
      return rateLimitCheck;
    }

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

    // Prevent downgrading to free (must use customer portal)
    const planConfig = getPlanConfig(planCode);
    if (planConfig && planConfig.code === 'free') {
      return NextResponse.json(
        { error: 'Cannot upgrade to free plan. Please use customer portal to cancel subscription.' },
        { status: 400 }
      );
    }

    // Create checkout session (already uses safe Stripe calls internally)
    const session = await createCheckoutSession(
      billingAccount.id,
      planCode,
      finalSuccessUrl,
      finalCancelUrl
    );

    if (!session.url) {
      return NextResponse.json(
        { error: 'Failed to create checkout session URL' },
        { status: 500 }
      );
    }

    // Audit log
    await auditBilling('checkout_session_created', billingAccount.id, user.id, {
      planCode,
    });

    // Track metrics
    await trackApiMetric('/api/stripe/checkout', 'POST', 200, Date.now() - startTime);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Stripe Checkout] Error creating checkout session:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Track error metrics
    await trackApiMetric('/api/stripe/checkout', 'POST', 500, Date.now() - startTime);

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
