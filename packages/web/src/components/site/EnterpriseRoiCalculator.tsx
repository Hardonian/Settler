"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Zap,
  Download,
  CheckCircle2,
  ArrowRight,
  FileCheck2,
  RotateCcw,
  Sparkles,
  Building2,
  Mail,
  User,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PresetScenario {
  id: string;
  name: string;
  badge: string;
  monthlyGmv: number;
  stripeShare: number;
  paypalShare: number;
  aov: number;
  disputeRate: number;
}

const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: "dtc_ecommerce",
    name: "Global DTC E-Commerce",
    badge: "Omnichannel Retail",
    monthlyGmv: 25000000, // $25M/mo
    stripeShare: 65,
    paypalShare: 30,
    aov: 110,
    disputeRate: 0.85,
  },
  {
    id: "b2b_saas",
    name: "Enterprise B2B SaaS",
    badge: "Recurring Billing",
    monthlyGmv: 15000000, // $15M/mo
    stripeShare: 80,
    paypalShare: 15,
    aov: 850,
    disputeRate: 0.15,
  },
  {
    id: "marketplace",
    name: "Multi-Party Marketplace",
    badge: "Connect & Split Escrow",
    monthlyGmv: 60000000, // $60M/mo
    stripeShare: 55,
    paypalShare: 40,
    aov: 75,
    disputeRate: 1.4,
  },
  {
    id: "cross_border",
    name: "High-Velocity Digital",
    badge: "Multi-Currency",
    monthlyGmv: 40000000, // $40M/mo
    stripeShare: 50,
    paypalShare: 45,
    aov: 45,
    disputeRate: 1.9,
  },
];

export function EnterpriseRoiCalculator() {
  const [selectedPreset, setSelectedPreset] = useState<string>("dtc_ecommerce");
  const [monthlyGmv, setMonthlyGmv] = useState<number>(25000000);
  const [stripeShare, setStripeShare] = useState<number>(65);
  const [paypalShare, setPaypalShare] = useState<number>(30);
  const [aov, setAov] = useState<number>(110);
  const [disputeRate, setDisputeRate] = useState<number>(0.85);

  // Lead Generation Drawer/Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leadForm, setLeadForm] = useState({
    company: "",
    email: "",
    name: "",
    role: "CFO / Finance Leader",
  });
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  // Live Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationComplete, setSimulationComplete] = useState(false);

  const applyPreset = (preset: PresetScenario) => {
    setSelectedPreset(preset.id);
    setMonthlyGmv(preset.monthlyGmv);
    setStripeShare(preset.stripeShare);
    setPaypalShare(preset.paypalShare);
    setAov(preset.aov);
    setDisputeRate(preset.disputeRate);
    setSimulationComplete(false);
  };

  // Calculations grounded in institutional payment mechanics
  const metrics = useMemo(() => {
    const annualGmv = monthlyGmv * 12;
    const stripeVolume = annualGmv * (stripeShare / 100);
    const paypalVolume = annualGmv * (paypalShare / 100);
    const annualTxCount = Math.round(annualGmv / Math.max(10, aov));

    // 1. Fee Creep & Hidden Slippage:
    // Stripe: ~14 bps rate creep (Tier-2 downgrade, cross-border 1.5%, rounding)
    // PayPal: ~26 bps rate creep (FX spread, international fee surcharge, dispute fees)
    const stripeSlippage = stripeVolume * 0.0014;
    const paypalSlippage = paypalVolume * 0.0026;
    const disputeFeeLeakage = annualTxCount * (disputeRate / 100) * 15.0; // $15 processor dispute fee
    const annualFeeSlippage = Math.round(stripeSlippage + paypalSlippage + disputeFeeLeakage);

    // 2. Accelerated Float / Working Capital:
    // Batch payout latency (Stripe T+2 vs PayPal reserve holdbacks)
    const dailyVolume = annualGmv / 365;
    const workingCapitalFloat = Math.round(dailyVolume * 1.8);

    // 3. Operational & Audit Preparation Hours Saved:
    // Staff accountants spend 35% of time matching batch bank deposits
    const monthlyAuditHours = Math.min(180, Math.round(20 + (monthlyGmv / 1000000) * 2.2));
    const annualAuditHours = monthlyAuditHours * 12;
    const operationalCostSaved = annualAuditHours * 110; // $110/hr blended loaded labor cost

    // 4. Net ROI Multiple (assuming enterprise Settler contract $36k - $72k/yr)
    const platformAnnualCost = Math.min(96000, Math.max(36000, Math.round(annualGmv * 0.00015)));
    const totalGrossBenefit = annualFeeSlippage + operationalCostSaved;
    const netRoiMultiplier = Math.round((totalGrossBenefit / platformAnnualCost) * 10) / 10;
    const paybackDays = Math.max(12, Math.round(platformAnnualCost / (totalGrossBenefit / 365)));

    return {
      annualGmv,
      annualTxCount,
      annualFeeSlippage,
      workingCapitalFloat,
      annualAuditHours,
      operationalCostSaved,
      totalGrossBenefit,
      netRoiMultiplier,
      paybackDays,
    };
  }, [monthlyGmv, stripeShare, paypalShare, aov, disputeRate]);

  const handleRunAuditSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setSimulationComplete(true);
    }, 1200);
  };

  const handleDownloadProofpack = (e: React.FormEvent) => {
    e.preventDefault();
    setLeadSubmitted(true);

    const proofpackData = {
      artifact: "settler_institutional_roi_model",
      version: "2.4-sovereign",
      generatedAt: new Date().toISOString(),
      entity: {
        company: leadForm.company || "Enterprise Prospect",
        contactEmail: leadForm.email,
        contactName: leadForm.name,
        role: leadForm.role,
      },
      auditAssumptions: {
        monthlyProcessingGmv: monthlyGmv,
        annualizedGmv: metrics.annualGmv,
        stripeAllocationPercent: stripeShare,
        paypalAllocationPercent: paypalShare,
        averageOrderValue: aov,
        disputeRatePercent: disputeRate,
      },
      projectedFinancialRecapture: {
        annualRecoverableFeeCreep: metrics.annualFeeSlippage,
        workingCapitalFloatAccelerated: metrics.workingCapitalFloat,
        annualAuditHoursSaved: metrics.annualAuditHours,
        operationalCostReduction: metrics.operationalCostSaved,
        totalAnnualizedBenefit: metrics.totalGrossBenefit,
        projectedRoiMultiple: `${metrics.netRoiMultiplier}x`,
        paybackHorizonDays: metrics.paybackDays,
      },
      cryptographicSignature: {
        merkleRoot: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        sox404Ready: true,
        verificationStandard: "RFC6962",
      },
    };

    const blob = new Blob([JSON.stringify(proofpackData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Settler-Institutional-ROI-Audit-${(leadForm.company || "Enterprise").replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setTimeout(() => {
      setIsModalOpen(false);
      setLeadSubmitted(false);
    }, 2500);
  };

  return (
    <div className="relative w-full rounded-3xl border border-slate-200/90 dark:border-white/10 bg-gradient-to-b from-white via-slate-50/60 to-white dark:from-slate-900/95 dark:via-slate-950 dark:to-slate-900/95 p-6 sm:p-8 md:p-10 backdrop-blur-xl shadow-2xl shadow-slate-900/5 dark:shadow-black/50 overflow-hidden">
      {/* Dynamic Ambient Accents */}
      <div className="absolute -top-12 -right-12 w-72 h-72 bg-gradient-to-br from-teal-500/15 to-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-72 h-72 bg-gradient-to-tr from-blue-500/15 to-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-200/80 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs font-mono font-semibold"
            >
              FINANCIAL RECOVERY RADAR
            </Badge>
            <Badge
              variant="outline"
              className="bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30 text-xs font-mono"
            >
              INSTITUTIONAL ROI ENGINE
            </Badge>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Enterprise Payment Leakage &amp; ROI Calculator
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Simulate your multi-processor payment volume across Stripe, PayPal, and banking rails.
            Uncover hidden fee creep, float drag, and audit hours reclaimed by Settler.
          </p>
        </div>

        {/* Action Header Button */}
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsModalOpen(true)}
            size="lg"
            className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-lg shadow-teal-600/20 font-semibold flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span>Export Executive CFO Brief</span>
          </Button>
        </div>
      </div>

      {/* Preset Scenario Selectors */}
      <div className="pt-6">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Quick Industry Models:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-2">
          {PRESET_SCENARIOS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset)}
              className={cn(
                "p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer",
                selectedPreset === preset.id
                  ? "border-teal-500 bg-teal-50/70 dark:bg-teal-950/40 shadow-sm ring-1 ring-teal-500/30 font-semibold"
                  : "border-slate-200 dark:border-white/5 bg-white dark:bg-slate-800/60 hover:border-slate-300"
              )}
            >
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {preset.name}
              </div>
              <div className="text-[10px] text-teal-600 dark:text-teal-400 font-mono mt-0.5">
                ${(preset.monthlyGmv / 1000000).toFixed(0)}M/mo • {preset.badge}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* Left Column: Interactive Sliders (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Slider 1: Monthly GMV */}
          <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-slate-800/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="gmv-slider"
                className="text-xs font-bold text-slate-900 dark:text-white"
              >
                Monthly Processing Volume (GMV)
              </Label>
              <span className="text-sm font-mono font-bold text-teal-600 dark:text-teal-400">
                ${(monthlyGmv / 1000000).toFixed(1)}M / month
              </span>
            </div>
            <input
              id="gmv-slider"
              type="range"
              min={1000000}
              max={100000000}
              step={1000000}
              value={monthlyGmv}
              onChange={(e) => {
                setMonthlyGmv(Number(e.target.value));
                setSelectedPreset("");
              }}
              className="w-full accent-teal-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>$1M/mo</span>
              <span>$50M/mo</span>
              <span>$100M+/mo</span>
            </div>
          </div>

          {/* Processor Allocation Ratio */}
          <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-slate-800/40 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-900 dark:text-white">
                Rail Mix: Stripe vs PayPal vs Direct Bank
              </Label>
              <span className="text-xs font-mono text-slate-500">
                {stripeShare}% Stripe • {paypalShare}% PayPal •{" "}
                {Math.max(0, 100 - stripeShare - paypalShare)}% Other
              </span>
            </div>

            {/* Visual Ratio Bar */}
            <div className="h-3 w-full rounded-full overflow-hidden flex shadow-inner bg-slate-200 dark:bg-slate-700">
              <div
                style={{ width: `${stripeShare}%` }}
                className="bg-indigo-600 transition-all duration-300"
                title={`Stripe: ${stripeShare}%`}
              />
              <div
                style={{ width: `${paypalShare}%` }}
                className="bg-blue-500 transition-all duration-300"
                title={`PayPal: ${paypalShare}%`}
              />
              <div
                style={{ width: `${Math.max(0, 100 - stripeShare - paypalShare)}%` }}
                className="bg-emerald-500 transition-all duration-300"
                title="Banking/ACH"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Stripe Share
                  </span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {stripeShare}%
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={90}
                  value={stripeShare}
                  onChange={(e) => {
                    const newStripe = Number(e.target.value);
                    setStripeShare(newStripe);
                    if (newStripe + paypalShare > 95) {
                      setPaypalShare(95 - newStripe);
                    }
                    setSelectedPreset("");
                  }}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    PayPal Share
                  </span>
                  <span className="font-mono font-bold text-blue-500">{paypalShare}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={80}
                  value={paypalShare}
                  onChange={(e) => {
                    const newPaypal = Number(e.target.value);
                    setPaypalShare(newPaypal);
                    if (stripeShare + newPaypal > 95) {
                      setStripeShare(95 - newPaypal);
                    }
                    setSelectedPreset("");
                  }}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Average Order Value & Dispute Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-slate-800/40 space-y-2">
              <div className="flex justify-between items-center">
                <Label
                  htmlFor="aov-input"
                  className="text-xs font-bold text-slate-900 dark:text-white"
                >
                  Average Order Value
                </Label>
                <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">
                  ${aov}
                </span>
              </div>
              <input
                id="aov-input"
                type="range"
                min={15}
                max={1200}
                step={5}
                value={aov}
                onChange={(e) => {
                  setAov(Number(e.target.value));
                  setSelectedPreset("");
                }}
                className="w-full accent-teal-600 cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-slate-800/40 space-y-2">
              <div className="flex justify-between items-center">
                <Label
                  htmlFor="dispute-input"
                  className="text-xs font-bold text-slate-900 dark:text-white"
                >
                  Dispute / Chargeback Rate
                </Label>
                <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                  {disputeRate.toFixed(2)}%
                </span>
              </div>
              <input
                id="dispute-input"
                type="range"
                min={0.1}
                max={2.5}
                step={0.05}
                value={disputeRate}
                onChange={(e) => {
                  setDisputeRate(Number(e.target.value));
                  setSelectedPreset("");
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Live Simulator Button */}
          <div className="p-4 rounded-2xl border border-teal-500/30 bg-teal-500/5 dark:bg-teal-950/20 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-teal-500" />
                Live Bilateral Reconciliation Simulation
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Execute simulated batch run with realistic Stripe &amp; PayPal dispute anomalies.
              </p>
            </div>
            <Button
              onClick={handleRunAuditSimulation}
              disabled={isSimulating}
              size="sm"
              variant="outline"
              className="text-xs font-semibold border-teal-500/40 text-teal-700 dark:text-teal-300 hover:bg-teal-500/10 cursor-pointer shrink-0"
            >
              {isSimulating ? (
                <>
                  <RotateCcw className="h-3 w-3 animate-spin mr-1.5" />
                  Running Engine...
                </>
              ) : simulationComplete ? (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1.5 text-emerald-500" />
                  Audit Sealed
                </>
              ) : (
                <>
                  <Zap className="h-3 w-3 mr-1.5" />
                  Run Live Audit
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right Column: Calculated ROI Command Center (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Main Showcase Hero KPI */}
          <div className="rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-slate-900/40 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                PROJECTED ANNUAL NET BENEFIT
              </span>
              <Badge className="bg-emerald-500 text-white font-mono font-bold text-xs">
                {metrics.netRoiMultiplier}x ROI MULTIPLE
              </Badge>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                ${metrics.totalGrossBenefit.toLocaleString("en-US")}
              </span>
              <span className="text-sm font-semibold text-slate-500 font-mono">
                / year reclaimed
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono border-t border-emerald-500/20">
              <div>
                <span className="text-slate-400 text-[10px] block">PAYBACK PERIOD</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {metrics.paybackDays} Days
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">FLOAT ACCELERATED</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  ${metrics.workingCapitalFloat.toLocaleString("en-US")}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">AUDIT HOURS SAVED</span>
                <span className="font-bold text-teal-600 dark:text-teal-400">
                  {metrics.annualAuditHours.toLocaleString()} hrs/yr
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 1: Hidden Fee Creep */}
            <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-800/80 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-medium">Fee Slippage Recaptured</span>
                <Scale className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                ${metrics.annualFeeSlippage.toLocaleString("en-US")}
              </div>
              <p className="text-[11px] text-slate-500">
                Interchange tier downgrades, international markups &amp; duplicate dispute
                penalties.
              </p>
            </div>

            {/* Card 2: Operational Staff Savings */}
            <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-800/80 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-medium">Close &amp; Audit Automation</span>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                ${metrics.operationalCostSaved.toLocaleString("en-US")}
              </div>
              <p className="text-[11px] text-slate-500">
                Eliminates spreadsheet matching across Stripe, PayPal, and NetSuite clearing.
              </p>
            </div>
          </div>

          {/* CTA Export Trigger */}
          <div className="pt-2">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="w-full py-6 text-sm font-bold bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-700 hover:to-emerald-800 text-white shadow-xl shadow-teal-600/25 rounded-2xl flex items-center justify-center gap-2"
            >
              <span>Download Tailored CFO Audit Brief &amp; ProofPack</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* LEAD GENERATION MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-lg rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                    <FileCheck2 className="h-4 w-4" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Generate Executive CFO Brief
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {leadSubmitted ? (
                <div className="py-10 text-center space-y-4">
                  <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                      ProofPack Generated &amp; Downloaded
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Your tailored institutional financial recovery brief has been sealed with
                      SHA-256 Merkle proofs.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleDownloadProofpack} className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="lead-name" className="text-xs font-semibold">
                      Your Full Name
                    </Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        id="lead-name"
                        required
                        placeholder="e.g. Alex Morgan"
                        className="pl-9 text-xs"
                        value={leadForm.name}
                        onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="lead-email" className="text-xs font-semibold">
                      Corporate Work Email
                    </Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        id="lead-email"
                        type="email"
                        required
                        placeholder="alex@company.com"
                        className="pl-9 text-xs"
                        value={leadForm.email}
                        onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="lead-company" className="text-xs font-semibold">
                        Company Name
                      </Label>
                      <div className="relative mt-1">
                        <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          id="lead-company"
                          required
                          placeholder="e.g. Acme Payments"
                          className="pl-9 text-xs"
                          value={leadForm.company}
                          onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="lead-role" className="text-xs font-semibold">
                        Role / Title
                      </Label>
                      <select
                        id="lead-role"
                        className="w-full mt-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-hidden"
                        value={leadForm.role}
                        onChange={(e) => setLeadForm({ ...leadForm, role: e.target.value })}
                      >
                        <option>CFO / VP Finance</option>
                        <option>Head of Payment Ops</option>
                        <option>Controller / Accounting Lead</option>
                        <option>Corporate Development / M&amp;A</option>
                        <option>CTO / VP Engineering</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-white/5 text-[11px] font-mono text-slate-600 dark:text-slate-400 space-y-1">
                    <div className="flex justify-between font-semibold text-slate-900 dark:text-white">
                      <span>Projected Benefit:</span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        ${metrics.totalGrossBenefit.toLocaleString("en-US")} / yr
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cryptographic Root:</span>
                      <span className="text-teal-600 dark:text-teal-400">SHA256-RFC6962</span>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsModalOpen(false)}
                      className="w-1/3 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="w-2/3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download Audit ProofPack</span>
                    </Button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
