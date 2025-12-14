/**
 * Pricing Calculator Component
 * 
 * Interactive calculator to estimate costs based on usage.
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Calculator, DollarSign } from 'lucide-react';

interface PricingTier {
  name: string;
  basePrice: number;
  apiCalls: number;
  reconciliations: number;
  receipts: number;
  features: string[];
}

const PRICING_TIERS: PricingTier[] = [
  {
    name: 'Free',
    basePrice: 0,
    apiCalls: 1000,
    reconciliations: 10,
    receipts: 100,
    features: ['Basic reconciliation', 'API access', 'Community support'],
  },
  {
    name: 'Pro',
    basePrice: 49,
    apiCalls: 10000,
    reconciliations: 100,
    receipts: 1000,
    features: ['Advanced reconciliation', 'Priority support', 'Custom adapters'],
  },
  {
    name: 'Enterprise',
    basePrice: 299,
    apiCalls: 100000,
    reconciliations: 1000,
    receipts: 10000,
    features: ['Unlimited usage', 'Dedicated support', 'SLA guarantee', 'Custom integrations'],
  },
];

const OVERAGE_RATES = {
  apiCalls: 0.01, // $0.01 per 1000 API calls
  reconciliations: 0.50, // $0.50 per reconciliation
  receipts: 0.10, // $0.10 per receipt
};

export function PricingCalculator() {
  const [apiCalls, setApiCalls] = useState(5000);
  const [reconciliations, setReconciliations] = useState(50);
  const [receipts, setReceipts] = useState(500);

  const calculateCost = (tier: PricingTier) => {
    let cost = tier.basePrice;

    // Calculate overages
    const apiCallsOverage = Math.max(0, apiCalls - tier.apiCalls);
    const reconciliationsOverage = Math.max(0, reconciliations - tier.reconciliations);
    const receiptsOverage = Math.max(0, receipts - tier.receipts);

    cost += (apiCallsOverage / 1000) * OVERAGE_RATES.apiCalls;
    cost += reconciliationsOverage * OVERAGE_RATES.reconciliations;
    cost += receiptsOverage * OVERAGE_RATES.receipts;

    return {
      basePrice: tier.basePrice,
      overages: {
        apiCalls: apiCallsOverage,
        reconciliations: reconciliationsOverage,
        receipts: receiptsOverage,
      },
      overageCost: cost - tier.basePrice,
      total: cost,
    };
  };

  const freeCost = calculateCost(PRICING_TIERS[0]);
  const proCost = calculateCost(PRICING_TIERS[1]);
  const enterpriseCost = calculateCost(PRICING_TIERS[2]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Pricing Calculator
        </CardTitle>
        <CardDescription>
          Estimate your monthly cost based on expected usage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Usage Inputs */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-calls">API Calls per Month</Label>
            <div className="flex items-center gap-4">
              <Slider
                id="api-calls"
                min={0}
                max={200000}
                step={1000}
                value={[apiCalls]}
                onValueChange={([value]) => setApiCalls(value)}
                className="flex-1"
              />
              <Input
                type="number"
                value={apiCalls}
                onChange={(e) => setApiCalls(Number(e.target.value))}
                className="w-32"
                min={0}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reconciliations">Reconciliations per Month</Label>
            <div className="flex items-center gap-4">
              <Slider
                id="reconciliations"
                min={0}
                max={2000}
                step={10}
                value={[reconciliations]}
                onValueChange={([value]) => setReconciliations(value)}
                className="flex-1"
              />
              <Input
                type="number"
                value={reconciliations}
                onChange={(e) => setReconciliations(Number(e.target.value))}
                className="w-32"
                min={0}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="receipts">Receipts Parsed per Month</Label>
            <div className="flex items-center gap-4">
              <Slider
                id="receipts"
                min={0}
                max={20000}
                step={100}
                value={[receipts]}
                onValueChange={([value]) => setReceipts(value)}
                className="flex-1"
              />
              <Input
                type="number"
                value={receipts}
                onChange={(e) => setReceipts(Number(e.target.value))}
                className="w-32"
                min={0}
              />
            </div>
          </div>
        </div>

        {/* Cost Comparison */}
        <div className="grid gap-4 md:grid-cols-3">
          {PRICING_TIERS.map((tier, index) => {
            const cost = index === 0 ? freeCost : index === 1 ? proCost : enterpriseCost;
            const isRecommended = index === 1;

            return (
              <Card
                key={tier.name}
                className={isRecommended ? 'border-blue-500 border-2' : ''}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{tier.name}</CardTitle>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">
                      {formatCurrency(cost.total)}
                    </span>
                    <span className="text-slate-500 text-sm">/month</span>
                  </div>
                  {cost.overageCost > 0 && (
                    <p className="text-xs text-slate-500">
                      {formatCurrency(tier.basePrice)} base + {formatCurrency(cost.overageCost)} overage
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Savings Indicator */}
        {proCost.total < freeCost.total && (
          <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-700 dark:text-green-400">
              💡 <strong>Tip:</strong> With your usage, Pro plan would save you{' '}
              {formatCurrency(freeCost.total - proCost.total)} per month compared to overages on Free.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
