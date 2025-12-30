'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp, Clock, DollarSign } from 'lucide-react';

export default function ROICalculatorPage() {
  const [transactionsPerMonth, setTransactionsPerMonth] = useState(1000);
  const [hoursPerMonth, setHoursPerMonth] = useState(10);
  const [hourlyRate, setHourlyRate] = useState(50);
  const [errorRate, setErrorRate] = useState(5);

  // Calculate manual reconciliation cost
  const manualCost = hoursPerMonth * hourlyRate;
  const errorCost = (transactionsPerMonth * errorRate / 100) * 10; // $10 per error
  const totalManualCost = manualCost + errorCost;

  // Calculate Settler cost
  const getSettlerPlan = () => {
    if (transactionsPerMonth <= 100) return { name: 'Free', base: 0, included: 100 };
    if (transactionsPerMonth <= 1000) return { name: 'Starter', base: 29, included: 1000 };
    if (transactionsPerMonth <= 10000) return { name: 'Growth', base: 99, included: 10000 };
    return { name: 'Enterprise', base: 500, included: 100000 };
  };

  const plan = getSettlerPlan();
  const overage = Math.max(0, transactionsPerMonth - plan.included);
  const settlerCost = plan.base + (overage * 0.01);

  // Calculate savings
  const monthlySavings = totalManualCost - settlerCost;
  const annualSavings = monthlySavings * 12;
  const roiPercentage = totalManualCost > 0 ? ((monthlySavings / totalManualCost) * 100) : 0;
  const paybackMonths = settlerCost > 0 ? (settlerCost / monthlySavings) : 0;

  // Time savings
  const timeSavedHours = hoursPerMonth - (transactionsPerMonth * 0.001); // 0.001 hours per transaction with Settler
  const timeSavedPercentage = hoursPerMonth > 0 ? ((timeSavedHours / hoursPerMonth) * 100) : 0;

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">ROI Calculator</h1>
          <p className="text-xl text-muted-foreground">
            Calculate your savings with Settler's automated reconciliation
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle>Your Current Setup</CardTitle>
              <CardDescription>Enter your current reconciliation metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="transactions">Transactions per Month</Label>
                <Input
                  id="transactions"
                  type="number"
                  value={transactionsPerMonth}
                  onChange={(e) => setTransactionsPerMonth(Number(e.target.value))}
                  min={0}
                />
              </div>
              <div>
                <Label htmlFor="hours">Hours Spent per Month</Label>
                <Input
                  id="hours"
                  type="number"
                  value={hoursPerMonth}
                  onChange={(e) => setHoursPerMonth(Number(e.target.value))}
                  min={0}
                />
              </div>
              <div>
                <Label htmlFor="rate">Hourly Rate ($)</Label>
                <Input
                  id="rate"
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  min={0}
                />
              </div>
              <div>
                <Label htmlFor="error">Error Rate (%)</Label>
                <Input
                  id="error"
                  type="number"
                  value={errorRate}
                  onChange={(e) => setErrorRate(Number(e.target.value))}
                  min={0}
                  max={100}
                />
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card>
            <CardHeader>
              <CardTitle>Your Savings</CardTitle>
              <CardDescription>Estimated savings with Settler</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Manual Cost</div>
                  <div className="text-2xl font-bold">${totalManualCost.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">per month</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Settler Cost</div>
                  <div className="text-2xl font-bold text-primary">${settlerCost.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">per month ({plan.name})</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Monthly Savings</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${monthlySavings.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Annual Savings</span>
                  <span className="text-xl font-bold text-green-600">
                    ${annualSavings.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">ROI: <strong>{roiPercentage.toFixed(1)}%</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Payback: <strong>{paybackMonths.toFixed(1)} months</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Time Saved: <strong>{timeSavedPercentage.toFixed(0)}%</strong></span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Breakdown Section */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
            <CardDescription>Detailed cost analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Manual Labor Cost</span>
                <span className="font-medium">${manualCost.toLocaleString()}/month</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Error Correction Cost</span>
                <span className="font-medium">${errorCost.toLocaleString()}/month</span>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="font-medium">Total Manual Cost</span>
                <span className="font-bold">${totalManualCost.toLocaleString()}/month</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span>Settler Base ({plan.name})</span>
                <span className="font-medium">${plan.base}/month</span>
              </div>
              {overage > 0 && (
                <div className="flex justify-between items-center">
                  <span>Settler Overage ({overage.toLocaleString()} transactions)</span>
                  <span className="font-medium">${(overage * 0.01).toLocaleString()}/month</span>
                </div>
              )}
              <div className="flex justify-between items-center border-t pt-2">
                <span className="font-medium">Total Settler Cost</span>
                <span className="font-bold text-primary">${settlerCost.toLocaleString()}/month</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="mt-8 text-center">
          <Button size="lg" className="mr-4">
            Start Free Trial
          </Button>
          <Button size="lg" variant="outline">
            Contact Sales
          </Button>
        </div>

        {/* Assumptions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-sm">Calculation Assumptions</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="list-disc list-inside space-y-1">
              <li>Error correction cost: $10 per error (conservative estimate)</li>
              <li>Settler processes transactions in 0.001 hours each (automated)</li>
              <li>Manual reconciliation: Variable time per transaction</li>
              <li>Savings include time savings, error reduction, and automation benefits</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
