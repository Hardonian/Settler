/**
 * AI Tokens Add-On API Route
 * 
 * Handles purchasing additional AI tokens as add-ons.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/shared/db/prismaClient';
import { getAccountPlanCode } from '@/domain/billing/entitlements';
import { getPlanConfig } from '@/domain/billing/planConfig';
import { validatePagination } from '@/lib/validation/api-validation';
import { getCorrelationId, addCorrelationHeaders } from '@/lib/monitoring/correlation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET - Get current AI token usage and available add-ons
 */
export async function GET(request: NextRequest) {
  const correlationId = await getCorrelationId();

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorrelationHeaders(response, correlationId);
    }

    const billingAccount = await prisma.billingAccount.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!billingAccount) {
      const response = NextResponse.json({ error: 'Billing account not found' }, { status: 404 });
      return addCorrelationHeaders(response, correlationId);
    }

    const planCode = await getAccountPlanCode(billingAccount.id).catch(() => 'free');
    const planConfig = getPlanConfig(planCode);

    // Get current AI token usage (would track in usage events)
    // For now, return plan limits
    const includedTokens = planConfig?.aiTokens?.included || 0;
    const overagePrice = planConfig?.aiTokens?.overagePrice || 0.025;

    // Get purchased add-ons
    const addOns = await prisma.billingAddOn.findMany({
      where: {
        billingAccountId: billingAccount.id,
        type: 'ai_tokens',
        status: 'active',
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalPurchasedTokens = addOns.reduce((sum, addon) => {
      return sum + (addon.quantity || 0);
    }, 0);

    const response = NextResponse.json({
      plan: planCode,
      includedTokens,
      purchasedTokens: totalPurchasedTokens,
      totalAvailableTokens: includedTokens + totalPurchasedTokens,
      overagePrice,
      addOns: addOns.map((a) => ({
        id: a.id,
        quantity: a.quantity,
        purchasedAt: a.createdAt,
        expiresAt: a.expiresAt,
      })),
      pricing: {
        commercial: {
          pricePer1M: 25,
          description: 'Commercial plan add-on pricing',
        },
        enterprise: {
          pricePer1M: 20,
          description: 'Enterprise plan add-on pricing (volume discount)',
        },
      },
    });

    return addCorrelationHeaders(response, correlationId);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[AI Tokens] Error fetching token info:', errorMessage);
    
    const response = NextResponse.json(
      { error: 'Failed to fetch AI token information' },
      { status: 500 }
    );
    return addCorrelationHeaders(response, correlationId);
  }
}

/**
 * POST - Purchase AI token add-on
 */
export async function POST(request: NextRequest) {
  const correlationId = await getCorrelationId();

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorrelationHeaders(response, correlationId);
    }

    const billingAccount = await prisma.billingAccount.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!billingAccount) {
      const response = NextResponse.json({ error: 'Billing account not found' }, { status: 404 });
      return addCorrelationHeaders(response, correlationId);
    }

    const planCode = await getAccountPlanCode(billingAccount.id).catch(() => 'free');
    const planConfig = getPlanConfig(planCode);

    if (!planConfig || planCode === 'free') {
      const response = NextResponse.json(
        { error: 'AI tokens are only available on paid plans' },
        { status: 403 }
      );
      return addCorrelationHeaders(response, correlationId);
    }

    const body = await request.json().catch(() => ({}));
    const quantity = parseInt(body.quantity, 10);

    if (!quantity || quantity < 1000 || quantity % 1000 !== 0) {
      const response = NextResponse.json(
        { error: 'Quantity must be a multiple of 1,000 tokens (minimum 1,000)' },
        { status: 400 }
      );
      return addCorrelationHeaders(response, correlationId);
    }

    // Calculate price
    const pricePer1M = planCode === 'scale' ? 20 : 25;
    const price = (quantity / 1000000) * pricePer1M;

    // Create add-on record (would integrate with Stripe for payment)
    const addOn = await prisma.billingAddOn.create({
      data: {
        billingAccountId: billingAccount.id,
        type: 'ai_tokens',
        quantity,
        price,
        status: 'pending', // Would be 'active' after payment confirmation
        metadata: {
          planCode,
          pricePer1M,
        },
      },
    });

    // In production, would create Stripe checkout session here
    // For now, return the add-on details
    const response = NextResponse.json({
      addOn: {
        id: addOn.id,
        quantity,
        price,
        status: addOn.status,
      },
      checkoutUrl: null, // Would be Stripe checkout URL in production
      message: 'Add-on created. Payment processing required.',
    }, { status: 201 });

    return addCorrelationHeaders(response, correlationId);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[AI Tokens] Error purchasing add-on:', errorMessage);
    
    const response = NextResponse.json(
      { error: 'Failed to purchase AI token add-on' },
      { status: 500 }
    );
    return addCorrelationHeaders(response, correlationId);
  }
}
