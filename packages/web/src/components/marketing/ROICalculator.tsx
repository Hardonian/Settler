/**
 * ROI Calculator Component
 *
 * Interactive calculator showing ROI from using Settler.
 * Helps subscribers understand value proposition.
 */

'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, TrendingUp, DollarSign, Clock } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';

interface ROICalculatorProps {
  className?: string;
}

export function ROICalculator({ className }: ROICalculatorProps) {
  const [monthlyTransactions, setMonthlyTransactions] = useState(10000);
  const [hoursPerReconciliation, setHoursPerReconciliation] = useState(2);
  const [hourlyRate, setHourlyRate] = useState(75);
  const [errorRate, setErrorRate] = useState(5);

  const calculations = useMemo(() => {
    // Current costs (manual reconciliation)
    const monthlyHours = monthlyTransactions * hoursPerReconciliation;
    const monthlyCost = monthlyHours * hourlyRate;
    const errorCost = monthlyCost * (errorRate / 100);
    const totalCurrentCost = monthlyCost + errorCost;

    // With Settler
    // Starter: $99/month for up to 10,000 transactions
    // Growth: $299/month for up to 100,000 transactions
    const settlerMonthlyCost = monthlyTransactions <= 10000 ? 99 : 299;
    const automatedHours = monthlyTransactions * 0.05; // 5 minutes per reconciliation
    const automatedCost = automatedHours * hourlyRate;
    const automatedErrorCost = automatedCost * 0.01; // 1% error rate
    const totalSettlerCost = settlerMonthlyCost + automatedCost + automatedErrorCost;

    // Savings
    const monthlySavings = totalCurrentCost - totalSettlerCost;
    const annualSavings = monthlySavings * 12;
    const roi = ((annualSavings - settlerMonthlyCost * 12) / (settlerMonthlyCost * 12)) * 100;
    const timeSaved = monthlyHours - automatedHours;

    return {
      current: {
        monthlyCost,
        errorCost,
        total: totalCurrentCost,
        hours: monthlyHours,
      },
      settler: {
        monthlyCost: settlerMonthlyCost,
        automatedCost,
        errorCost: automatedErrorCost,
        total: totalSettlerCost,
        hours: automatedHours,
      },
      savings: {
        monthly: monthlySavings,
        annual: annualSavings,
        roi,
        timeSaved,
      },
    };
  }, [monthlyTransactions, hoursPerReconciliation, hourlyRate, errorRate]);

  return (
    <Card className={cn('bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 border-0 shadow-2xl', className)}>
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
              Calculate Your ROI
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              See how much Settler can save you
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="transactions">Monthly Transactions</Label>
            <Input
              id="transactions"
              type="number"
              value={monthlyTransactions}
              onChange={(e) => setMonthlyTransactions(Number(e.target.value))}
              min={1}
              className="text-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hours">Hours per Reconciliation</Label>
            <Input
              id="hours"
              type="number"
              step="0.5"
              value={hoursPerReconciliation}
              onChange={(e) => setHoursPerReconciliation(Number(e.target.value))}
              min={0.5}
              className="text-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rate">Hourly Rate ($)</Label>
            <Input
              id="rate"
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(Number(e.target.value))}
              min={1}
              className="text-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="error">Current Error Rate (%)</Label>
            <Input
              id="error"
              type="number"
              step="0.1"
              value={errorRate}
              onChange={(e) => setErrorRate(Number(e.target.value))}
              min={0}
              max={100}
              className="text-lg"
            />
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
          <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Annual Savings
              </span>
            </div>
            <div className="text-3xl font-bold text-green-600">
              ${formatNumber(calculations.savings.annual)}
            </div>
          </div>
          <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                ROI
              </span>
            </div>
            <div className="text-3xl font-bold text-blue-600">
              {calculations.savings.roi > 0 ? '+' : ''}
              {calculations.savings.roi.toFixed(0)}%
            </div>
          </div>
          <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Hours Saved/Month
              </span>
            </div>
            <div className="text-3xl font-bold text-purple-600">
              {calculations.savings.timeSaved.toFixed(0)}
            </div>
          </div>
        </div>

        {/* Comparison */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-semibold text-slate-600 dark:text-slate-400 mb-2">
                Current Cost
              </div>
              <div className="text-2xl font-bold text-red-600">
                ${formatNumber(calculations.current.total)}
                <span className="text-sm font-normal text-slate-500">/month</span>
              </div>
            </div>
            <div>
              <div className="font-semibold text-slate-600 dark:text-slate-400 mb-2">
                With Settler
              </div>
              <div className="text-2xl font-bold text-green-600">
                ${formatNumber(calculations.settler.total)}
                <span className="text-sm font-normal text-slate-500">/month</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
