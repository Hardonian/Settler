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
import { Decimal } from '@prisma/client/runtime/library';

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

    // Find AI tokens AddOn (create if doesn't exist)
    let aiTokensAddOn = await prisma.addOn.findUnique({
      where: { integrationId: 'ai_tokens' },
    });

    if (!aiTokensAddOn) {
      // Create the AI tokens AddOn if it doesn't exist
      aiTokensAddOn = await prisma.addOn.create({
        data: {
          integrationId: 'ai_tokens',
          name: 'AI Tokens',
          description: 'Additional AI tokens for insights generation',
          category: 'feature',
          basePriceMonthly: 0, // Pay-per-use via purchases
          isActive: true,
        },
      });
    }

    // Get purchased add-ons for AI tokens
    const purchases = await prisma.addOnPurchase.findMany({
      where: {
        billingAccountId: billingAccount.id,
        addOnId: aiTokensAddOn.id,
        status: 'active',
      },
      include: {
        addOn: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Extract quantity from metadata (stored there since AddOnPurchase doesn't have quantity field)
    const totalPurchasedTokens = purchases.reduce((sum, purchase) => {
      const metadata = purchase.metadata as Record<string, unknown> | null;
      const quantity = metadata?.quantity as number | undefined;
      return sum + (quantity || 0);
    }, 0);

    const response = NextResponse.json({
      plan: planCode,
      includedTokens,
      purchasedTokens: totalPurchasedTokens,
      totalAvailableTokens: includedTokens + totalPurchasedTokens,
      overagePrice,
      addOns: purchases.map((p) => {
        const metadata = p.metadata as Record<string, unknown> | null;
        return {
          id: p.id,
          quantity: (metadata?.quantity as number) || 0,
          purchasedAt: p.purchasedAt,
          expiresAt: null, // AddOnPurchase doesn't have expiresAt - tokens don't expire per business logic
        };
      }),
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

    // Find or create AI tokens AddOn
    let aiTokensAddOn = await prisma.addOn.findUnique({
      where: { integrationId: 'ai_tokens' },
    });

    if (!aiTokensAddOn) {
      aiTokensAddOn = await prisma.addOn.create({
        data: {
          integrationId: 'ai_tokens',
          name: 'AI Tokens',
          description: 'Additional AI tokens for insights generation',
          category: 'feature',
          basePriceMonthly: 0,
          isActive: true,
        },
      });
    }

    // Calculate price
    const pricePer1M = planCode === 'scale' ? 20 : 25;
    const price = (quantity / 1000000) * pricePer1M;

    // Create add-on purchase record (would integrate with Stripe for payment)
    const purchase = await prisma.addOnPurchase.create({
      data: {
        billingAccountId: billingAccount.id,
        addOnId: aiTokensAddOn.id,
        status: 'pending', // Would be 'active' after payment confirmation
        metadata: {
          planCode,
          pricePer1M,
          quantity,
          price,
        },
      },
    });

    // In production, would create Stripe checkout session here
    // For now, return the purchase details
    const response = NextResponse.json({
      addOn: {
        id: purchase.id,
        quantity,
        price,
        status: purchase.status,
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
