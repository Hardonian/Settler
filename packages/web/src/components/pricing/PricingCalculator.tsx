/**
 * Pricing Calculator Component
 * 
 * Helps users estimate their monthly cost based on usage.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Plan {
  name: string;
  price: number;
  includedReconciliations: number;
  maxReconciliations: number;
}

const PLANS: Plan[] = [
  {
    name: 'Starter',
    price: 99,
    includedReconciliations: 10000,
    maxReconciliations: 10000,
  },
  {
    name: 'Growth',
    price: 299,
    includedReconciliations: 100000,
    maxReconciliations: 100000,
  },
];

export function PricingCalculator() {
  const [monthlyReconciliations, setMonthlyReconciliations] = useState<number>(10000);
  const [exceptionRate, setExceptionRate] = useState<number>(1);

  // Calculate recommended plan - always guaranteed to return a plan
  const recommendedPlan: Plan = PLANS.find(
    plan => monthlyReconciliations <= plan.maxReconciliations
  ) ?? PLANS[PLANS.length - 1]!;

  // Calculate exceptions
  const monthlyExceptions = Math.ceil((monthlyReconciliations * exceptionRate) / 100);
  const exceptionCost = monthlyExceptions * 0.10;

  // Calculate total cost
  const totalCost = recommendedPlan.price + exceptionCost;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Pricing Calculator</CardTitle>
        <CardDescription>
          Estimate your monthly cost based on reconciliation volume
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="reconciliations">Monthly Reconciliations</Label>
            <Input
              id="reconciliations"
              type="number"
              min="0"
              value={monthlyReconciliations}
              onChange={(e) => setMonthlyReconciliations(parseInt(e.target.value) || 0)}
              className="mt-1"
            />
            <p className="text-sm text-slate-500 mt-1">
              Expected monthly reconciliation volume
            </p>
          </div>

          <div>
            <Label htmlFor="exception-rate">Exception Rate (%)</Label>
            <Input
              id="exception-rate"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={exceptionRate}
              onChange={(e) => setExceptionRate(parseFloat(e.target.value) || 0)}
              className="mt-1"
            />
            <p className="text-sm text-slate-500 mt-1">
              Exception rate requiring system review (most customers see 0.5-1% with our automated resolution)
            </p>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="font-semibold mb-4">Estimated Monthly Cost</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Recommended Plan:</span>
              <Badge variant="outline" className="text-base">
                {recommendedPlan.name}
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Base Price:</span>
              <span className="font-semibold">${recommendedPlan.price.toLocaleString()}/month</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">
                System Review Exceptions ({monthlyExceptions.toLocaleString()} × $0.10):
              </span>
              <span className="font-semibold">${exceptionCost.toFixed(2)}/month</span>
            </div>
            <div className="text-xs text-slate-500 italic pt-1">
              95%+ of matches resolve automatically with confidence-based resolution
            </div>

            <div className="border-t pt-3 flex justify-between items-center">
              <span className="text-base font-semibold">Total Estimated Cost:</span>
              <span className="text-2xl font-bold text-blue-600">
                ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/month
              </span>
            </div>
          </div>

          {monthlyReconciliations > recommendedPlan.maxReconciliations && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Your usage exceeds the {recommendedPlan.name} plan limit. Contact us for Enterprise pricing (typically $2K-$10K/month).
              </p>
            </div>
          )}

          <div className="mt-6">
            <Button className="w-full" size="lg" asChild>
              <Link href="/signup">Start Free Trial</Link>
            </Button>
            <p className="text-xs text-center text-slate-500 mt-2">
              14-day free trial • No credit card required
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
