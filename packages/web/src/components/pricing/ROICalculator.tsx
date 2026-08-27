"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, DollarSign, Clock, Calculator } from "lucide-react";

interface ROIInputs {
  monthlyTransactions: number;
  hoursPerWeek: number;
  hourlyRate: number;
  errorRatePercent: number;
}

const DEFAULTS: ROIInputs = {
  monthlyTransactions: 10000,
  hoursPerWeek: 10,
  hourlyRate: 55,
  errorRatePercent: 2,
};

/**
 * Settler cost calculation (simplified from planConfig):
 * - Pro: $99/mo base + $0.01/txn for first 100k, $0.005 after
 * - Growth: $299/mo base + $0.008/txn
 */
function settlerMonthlyCost(txnVolume: number): number {
  const base = txnVolume <= 50_000 ? 99 : 299;
  const rate = txnVolume <= 100_000 ? 0.01 : 0.005;
  return base + txnVolume * rate;
}

export function ROICalculator() {
  const [inputs, setInputs] = useState<ROIInputs>(DEFAULTS);
  const [companySize, setCompanySize] = useState<string>("mid");

  const roi = useMemo(() => {
    const { monthlyTransactions, hoursPerWeek, hourlyRate, errorRatePercent } = inputs;

    // Current manual cost
    const weeklyLaborCost = hoursPerWeek * hourlyRate;
    const monthlyLaborCost = weeklyLaborCost * 4.33;
    const annualLaborCost = monthlyLaborCost * 12;

    // Error correction cost (each error costs ~30 min of investigation)
    const monthlyErrors = (monthlyTransactions * errorRatePercent) / 100;
    const errorCorrectionHours = monthlyErrors * 0.5;
    const monthlyErrorCost = errorCorrectionHours * hourlyRate;
    const annualErrorCost = monthlyErrorCost * 12;

    // Audit prep cost (conservative: 2 weeks/year of dedicated prep)
    const annualAuditPrepCost = 80 * hourlyRate;

    // Total current annual cost
    const totalCurrentAnnual = annualLaborCost + annualErrorCost + annualAuditPrepCost;

    // Settler cost
    const monthlySettler = settlerMonthlyCost(monthlyTransactions);
    const annualSettler = monthlySettler * 12;

    // Settler reduces labor by ~85%, errors by ~95%, audit prep by ~90%
    const laborReduction = 0.85;
    const errorReduction = 0.95;
    const auditReduction = 0.9;

    const residualLabor = annualLaborCost * (1 - laborReduction);
    const residualErrors = annualErrorCost * (1 - errorReduction);
    const residualAudit = annualAuditPrepCost * (1 - auditReduction);

    const totalWithSettler = annualSettler + residualLabor + residualErrors + residualAudit;
    const annualSavings = totalCurrentAnnual - totalWithSettler;
    const monthlySavings = annualSavings / 12;

    // Time savings
    const weeklyHoursSaved = hoursPerWeek * laborReduction;
    const monthlyHoursSaved = weeklyHoursSaved * 4.33;

    // Payback period
    const paybackMonths = annualSettler > 0 ? monthlySettler / (annualSavings / 12) : 0;

    // ROI percentage
    const roiPercent = annualSettler > 0 ? (annualSavings / annualSettler) * 100 : 0;

    return {
      totalCurrentAnnual,
      annualSettler,
      annualSavings,
      monthlySavings,
      monthlySettler,
      monthlyHoursSaved,
      paybackMonths: Math.max(paybackMonths, 0),
      roiPercent,
      monthlyErrors,
    };
  }, [inputs]);

  const updateInput = (key: keyof ROIInputs, value: string) => {
    const num = parseInt(value) || 0;
    setInputs((prev) => ({ ...prev, [key]: num }));
  };

  const presets: Record<string, Partial<ROIInputs>> = {
    startup: { monthlyTransactions: 2000, hoursPerWeek: 5, hourlyRate: 45, errorRatePercent: 3 },
    mid: { monthlyTransactions: 10000, hoursPerWeek: 10, hourlyRate: 55, errorRatePercent: 2 },
    growth: { monthlyTransactions: 50000, hoursPerWeek: 25, hourlyRate: 60, errorRatePercent: 1.5 },
    enterprise: {
      monthlyTransactions: 200000,
      hoursPerWeek: 60,
      hourlyRate: 70,
      errorRatePercent: 1,
    },
  };

  const handlePreset = (key: string) => {
    setCompanySize(key);
    if (presets[key]) {
      setInputs((prev) => ({ ...prev, ...presets[key] }));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      {/* Inputs Column */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="border-border/60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Your Numbers</CardTitle>
            </div>
            <CardDescription>Adjust to match your current reconciliation workload</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Company Size Preset */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Company Stage
              </Label>
              <Select value={companySize} onValueChange={handlePreset}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="startup">Startup (&lt;5k txn/mo)</SelectItem>
                  <SelectItem value="mid">Mid-Market (5k–25k txn/mo)</SelectItem>
                  <SelectItem value="growth">Growth (25k–100k txn/mo)</SelectItem>
                  <SelectItem value="enterprise">Enterprise (100k+ txn/mo)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="roi-txns"
                className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
              >
                Monthly Transactions
              </Label>
              <Input
                id="roi-txns"
                type="number"
                value={inputs.monthlyTransactions}
                onChange={(e) => updateInput("monthlyTransactions", e.target.value)}
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="roi-hours"
                className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
              >
                Hours / Week on Reconciliation
              </Label>
              <Input
                id="roi-hours"
                type="number"
                value={inputs.hoursPerWeek}
                onChange={(e) => updateInput("hoursPerWeek", e.target.value)}
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="roi-rate"
                className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
              >
                Hourly Labor Cost ($)
              </Label>
              <Input
                id="roi-rate"
                type="number"
                value={inputs.hourlyRate}
                onChange={(e) => updateInput("hourlyRate", e.target.value)}
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="roi-errors"
                className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
              >
                Reconciliation Error Rate (%)
              </Label>
              <Input
                id="roi-errors"
                type="number"
                step="0.1"
                value={inputs.errorRatePercent}
                onChange={(e) => updateInput("errorRatePercent", e.target.value)}
                className="font-mono"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Column */}
      <div className="lg:col-span-3 space-y-4">
        {/* Annual Savings Hero */}
        <Card className="border-primary/30 bg-primary/[0.03]">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="h-5 w-5 text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Projected Annual Savings
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-bold text-primary font-mono">
                ${Math.round(roi.annualSavings).toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">/year</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Badge variant="outline" className="gap-1.5 font-mono">
                <DollarSign className="h-3 w-3" />${Math.round(roi.monthlySavings).toLocaleString()}
                /mo saved
              </Badge>
              <Badge variant="outline" className="gap-1.5 font-mono">
                <Clock className="h-3 w-3" />
                {Math.round(roi.monthlyHoursSaved)}h/mo freed
              </Badge>
              <Badge
                variant={roi.roiPercent > 200 ? "success" : "outline"}
                className="gap-1.5 font-mono"
              >
                {Math.round(roi.roiPercent)}% ROI
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-border/40">
            <CardContent className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                Current Annual Cost
              </p>
              <p className="text-xl font-bold font-mono text-red-600 dark:text-red-400">
                ${Math.round(roi.totalCurrentAnnual).toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">Labor + errors + audit prep</p>
            </CardContent>
          </Card>
          <Card className="border-border/40">
            <CardContent className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                Settler Annual Cost
              </p>
              <p className="text-xl font-bold font-mono text-green-600 dark:text-green-400">
                ${Math.round(roi.annualSettler).toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                ${Math.round(roi.monthlySettler).toLocaleString()}/mo platform fee
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/40">
            <CardContent className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                Payback Period
              </p>
              <p className="text-xl font-bold font-mono">
                {roi.paybackMonths < 1 ? "< 1 month" : `${roi.paybackMonths.toFixed(1)} months`}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">Time to recoup investment</p>
            </CardContent>
          </Card>
          <Card className="border-border/40">
            <CardContent className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                Error Reduction
              </p>
              <p className="text-xl font-bold font-mono text-green-600 dark:text-green-400">
                {Math.round(roi.monthlyErrors)} → {Math.round(roi.monthlyErrors * 0.05)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Monthly exceptions (95% reduction)
              </p>
            </CardContent>
          </Card>
        </div>

        <p className="text-[10px] text-muted-foreground text-center">
          Estimates based on industry benchmarks. Assumes 85% labor reduction, 95% error reduction,
          90% audit prep reduction. Actual results vary by implementation.
        </p>
      </div>
    </div>
  );
}
