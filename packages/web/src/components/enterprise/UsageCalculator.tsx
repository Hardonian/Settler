"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function UsageCalculator() {
  const [inputs, setInputs] = useState({
    transactionsPerMonth: "100000",
    integrations: "3",
    jobsPerDay: "10",
    dataRetention: "12",
  });
  const [estimate, setEstimate] = useState<{
    baseCost: number;
    transactionCost: number;
    totalCost: number;
  } | null>(null);

  const calculate = () => {
    const transactions = parseInt(inputs.transactionsPerMonth) || 0;
    const integrations = parseInt(inputs.integrations) || 0;
    // const _jobs = parseInt(inputs.jobsPerDay) || 0;
    const retention = parseInt(inputs.dataRetention) || 12;

    // Base enterprise plan
    const baseCost = 500;

    // Transaction costs (beyond included)
    const includedTransactions = 100000;
    const overageTransactions = Math.max(0, transactions - includedTransactions);
    const transactionCost = (overageTransactions / 1000) * 0.1; // $0.10 per 1K

    // Integration costs
    const integrationCost = (integrations - 5) * 50; // $50 per additional integration

    // Storage costs
    const storageCost = retention * 10; // $10 per month of retention

    const totalCost = baseCost + transactionCost + integrationCost + storageCost;

    setEstimate({
      baseCost,
      transactionCost: transactionCost + integrationCost + storageCost,
      totalCost,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Enterprise Usage Calculator
        </CardTitle>
        <CardDescription>Estimate your monthly costs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="transactions">Transactions per Month</Label>
          <Input
            id="transactions"
            type="number"
            value={inputs.transactionsPerMonth}
            onChange={(e) => setInputs({ ...inputs, transactionsPerMonth: e.target.value })}
            placeholder="100000"
          />
        </div>

        <div>
          <Label htmlFor="integrations">Number of Integrations</Label>
          <Input
            id="integrations"
            type="number"
            value={inputs.integrations}
            onChange={(e) => setInputs({ ...inputs, integrations: e.target.value })}
            placeholder="3"
          />
        </div>

        <div>
          <Label htmlFor="jobs">Reconciliation Jobs per Day</Label>
          <Input
            id="jobs"
            type="number"
            value={inputs.jobsPerDay}
            onChange={(e) => setInputs({ ...inputs, jobsPerDay: e.target.value })}
            placeholder="10"
          />
        </div>

        <div>
          <Label htmlFor="retention">Data Retention (Months)</Label>
          <Input
            id="retention"
            type="number"
            value={inputs.dataRetention}
            onChange={(e) => setInputs({ ...inputs, dataRetention: e.target.value })}
            placeholder="12"
          />
        </div>

        <Button onClick={calculate} className="w-full">
          Calculate Estimate
        </Button>

        {estimate && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-3">
              Estimated Monthly Cost
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Base Plan:</span>
                <span className="font-semibold">${estimate.baseCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Usage & Add-ons:</span>
                <span className="font-semibold">${estimate.transactionCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-blue-900 dark:text-blue-300 pt-2 border-t border-blue-200 dark:border-blue-800">
                <span>Total:</span>
                <span>${estimate.totalCost.toFixed(2)}/month</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
