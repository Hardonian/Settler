/**
 * Convert API - POST /api/v1/convert
 * 
 * Convert units, currencies, and financial formulas.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/shared/auth/apiKey';
import { recordServiceUsage } from '@/shared/usage/usageEvent';
import { checkRequestEntitlement, createEntitlementErrorResponse } from '@/shared/middleware/entitlements';
import { publicRoute } from '@/middleware/billing-gate-universal';
import { appLogger } from '@/lib/utils/logger';
import { withSecurity } from '@/lib/middleware/api-security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

// Simple unit conversion rates (in production, use a proper conversion service)
const UNIT_CONVERSIONS: Record<string, Record<string, number>> = {
  length: {
    'm_to_ft': 3.28084,
    'ft_to_m': 0.3048,
    'km_to_mi': 0.621371,
    'mi_to_km': 1.60934,
  },
  weight: {
    'kg_to_lb': 2.20462,
    'lb_to_kg': 0.453592,
  },
  volume: {
    'l_to_gal': 0.264172,
    'gal_to_l': 3.78541,
  },
};

// Simple currency conversion (in production, use a real FX API)
const CURRENCY_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.85,
  GBP: 0.73,
  JPY: 110.0,
  CAD: 1.25,
};

export const POST = withSecurity(
  publicRoute(async function POST(request: NextRequest) {
  try {
    // Try to authenticate, but allow unauthenticated access for playground
    let isAuthenticated = false;
    
    const auth = await authenticateApiKey(request);
    if (auth) {
      isAuthenticated = true;
    }
    // Unauthenticated access allowed for playground (graceful degradation)

    // For unauthenticated users, allow basic conversions (demo mode)
    if (!isAuthenticated) {
      const body = await request.json();
      const { type, from, to, value } = body;

      if (!type || value === undefined) {
        return NextResponse.json(
          { error: 'type and value are required' },
          { status: 400 }
        );
      }

      // Perform demo conversion
      let result: number;
      let unit: string | undefined;

      if (type === 'unit') {
        if (!from || !to) {
          return NextResponse.json(
            { error: 'from and to are required for unit conversion' },
            { status: 400 }
          );
        }
        const conversionKey = `${from}_to_${to}`;
        const category = getUnitCategory(from);
        const rate = UNIT_CONVERSIONS[category]?.[conversionKey];
        if (!rate) {
          return NextResponse.json(
            { error: `Conversion from ${from} to ${to} is not supported` },
            { status: 400 }
          );
        }
        result = value * rate;
        unit = to;
      } else if (type === 'currency') {
        if (!from || !to) {
          return NextResponse.json(
            { error: 'from and to are required for currency conversion' },
            { status: 400 }
          );
        }
        const fromRate = CURRENCY_RATES[from.toUpperCase()] || 1.0;
        const toRate = CURRENCY_RATES[to.toUpperCase()] || 1.0;
        const usdValue = value / fromRate;
        result = usdValue * toRate;
        unit = to.toUpperCase();
      } else {
        return NextResponse.json(
          { error: `Invalid type: ${type}. Must be 'unit' or 'currency' for demo mode` },
          { status: 400 }
        );
      }

      return NextResponse.json({
        result,
        unit,
        originalValue: value,
        originalUnit: from,
        demo: true,
        message: 'This is a demo response. Sign in for full conversion features.',
      });
    }

    if (!auth || !auth.billingAccountId) {
      return NextResponse.json(
        { error: 'Billing account required' },
        { status: 400 }
      );
    }

    // Check entitlement - convert service uses reconcile entitlement
    const entitlement = await checkRequestEntitlement(auth, 'reconcile');
    if (!entitlement.allowed && entitlement.error) {
      return createEntitlementErrorResponse(entitlement.error);
    }

    const body = await request.json();
    const { type, from, to, value, formula } = body;

    if (!type || value === undefined) {
      return NextResponse.json(
        { error: 'type and value are required' },
        { status: 400 }
      );
    }

    let result: number;
    let unit: string | undefined;

    if (type === 'unit') {
      if (!from || !to) {
        return NextResponse.json(
          { error: 'from and to are required for unit conversion' },
          { status: 400 }
        );
      }

      const conversionKey = `${from}_to_${to}`;
      const category = getUnitCategory(from);
      const rate = UNIT_CONVERSIONS[category]?.[conversionKey];

      if (!rate) {
        return NextResponse.json(
          { error: `Conversion from ${from} to ${to} is not supported` },
          { status: 400 }
        );
      }

      result = value * rate;
      unit = to;
    } else if (type === 'currency') {
      if (!from || !to) {
        return NextResponse.json(
          { error: 'from and to are required for currency conversion' },
          { status: 400 }
        );
      }

      const fromRate = CURRENCY_RATES[from.toUpperCase()];
      const toRate = CURRENCY_RATES[to.toUpperCase()];

      if (!fromRate || !toRate) {
        return NextResponse.json(
          { error: `Currency conversion for ${from} or ${to} is not supported` },
          { status: 400 }
        );
      }

      // Convert to USD first, then to target currency
      const usdValue = value / fromRate;
      result = usdValue * toRate;
      unit = to.toUpperCase();
    } else if (type === 'financial') {
      if (!formula) {
        return NextResponse.json(
          { error: 'formula is required for financial conversion' },
          { status: 400 }
        );
      }

      // Simple financial formula evaluation
      // In production, use a proper formula parser
      result = evaluateFinancialFormula(formula, value);
      unit = undefined;
    } else {
      return NextResponse.json(
        { error: `Invalid type: ${type}. Must be 'unit', 'currency', or 'financial'` },
        { status: 400 }
      );
    }

    // Record usage
    await recordServiceUsage({
      billingAccountId: auth!.billingAccountId,
      service: 'settler-convert',
      operation: type,
      quantity: 1,
      metadata: {
        from,
        to,
        value,
      },
    });

    return NextResponse.json({
      result,
      unit,
      originalValue: value,
      originalUnit: from,
    });
  } catch (error) {
    // Never return 500 - always return 200 with error info for playground
    appLogger.error('Convert API error', error);
    return NextResponse.json(
      {
        error: 'Failed to perform conversion',
        message: error instanceof Error ? error.message : 'Unknown error',
        demo: true,
      },
      { status: 200 }
    );
  }
}),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: false }
);

function getUnitCategory(unit: string): string {
  const lengthUnits = ['m', 'ft', 'km', 'mi'];
  const weightUnits = ['kg', 'lb'];
  const volumeUnits = ['l', 'gal'];

  if (lengthUnits.includes(unit.toLowerCase())) return 'length';
  if (weightUnits.includes(unit.toLowerCase())) return 'weight';
  if (volumeUnits.includes(unit.toLowerCase())) return 'volume';
  return 'length'; // default
}

function evaluateFinancialFormula(formula: string, value: number): number {
  // Simple formula evaluation (in production, use a proper parser)
  // Supported formulas: 'compound_interest', 'simple_interest', 'present_value', 'future_value'
  switch (formula.toLowerCase()) {
    case 'compound_interest':
      // Simplified: A = P(1 + r/n)^(nt) - using default rate of 5% annually
      return value * Math.pow(1 + 0.05 / 12, 12); // Monthly compounding
    case 'simple_interest':
      // Simplified: A = P(1 + rt) - using default rate of 5% for 1 year
      return value * (1 + 0.05 * 1);
    case 'present_value':
      // Simplified: PV = FV / (1 + r)^n - using default rate of 5% for 1 year
      return value / Math.pow(1 + 0.05, 1);
    case 'future_value':
      // Simplified: FV = PV * (1 + r)^n - using default rate of 5% for 1 year
      return value * Math.pow(1 + 0.05, 1);
    default:
      throw new Error(`Unsupported formula: ${formula}`);
  }
}
