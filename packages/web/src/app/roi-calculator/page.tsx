"use client";

import React from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AmbientLightOrbs } from "@/components/site/HomeInfographics";
import { EnterpriseRoiCalculator } from "@/components/site/EnterpriseRoiCalculator";
import { BilateralSettlementVisualizer } from "@/components/site/BilateralSettlementVisualizer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UiLink } from "@/components/ui/link";
import {
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  Lock,
  ArrowRight,
  Database,
  Building2,
  Scale,
} from "lucide-react";

export default function RoiCalculatorPage() {
  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden flex flex-col">
      <AmbientLightOrbs />
      <Navigation />

      <main className="flex-1 pt-20 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-16">
        {/* Hero Section */}
        <div className="text-center sm:text-left pt-6 sm:pt-10 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2 mb-3 justify-center sm:justify-start">
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-mono text-xs font-semibold"
            >
              EXECUTIVE CFO BRIEFING &amp; ROI
            </Badge>
            <Badge
              variant="outline"
              className="bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30 font-mono text-xs"
            >
              100% DETERMINISTIC RECOVERY
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Institutional Reconciliation ROI &amp; Revenue Recapture Engine
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            Quantify the exact financial impact of automated multi-processor reconciliation. Model
            your Stripe and PayPal processing volumes to calculate reclaimed fee slippage, shortened
            payout latency, and eliminate manual spreadsheet matching.
          </p>
        </div>

        {/* Primary Interactive ROI Calculator */}
        <section aria-label="Interactive ROI Calculator">
          <EnterpriseRoiCalculator />
        </section>

        {/* Strategic Cross-Rail Acquisition Visualizer */}
        <section aria-label="Bilateral Settlement Enclave" className="space-y-6 pt-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant="outline"
                className="border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-xs font-mono font-semibold"
              >
                CROSS-RAIL RECONCILIATION INVARIANT
              </Badge>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              The Sovereign Bilateral Settlement Enclave
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              See how Settler operates as the neutral, zero-knowledge reconciliation layer between
              Stripe and PayPal feeds, sealing multi-million dollar batches into tamper-evident RFC
              6962 SHA-256 Merkle proofs.
            </p>
          </div>

          <BilateralSettlementVisualizer />
        </section>

        {/* Enterprise Trust Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-slate-200/80 dark:border-white/10">
          <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/40 space-y-2.5">
            <div className="h-10 w-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              SOX-404 Cryptographic Evidence
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Every reconciled settlement produces verifiable Merkle proofs that can be handed
              directly to Big-4 auditors without sampling.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/40 space-y-2.5">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Scale className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Zero Merchant Lock-in
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Settler is strictly neutral and gateway-independent. Route volume across any processor
              with guaranteed zero-float drag.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/40 space-y-2.5">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Row-Level Security &amp; Tenant Isolation
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Enforced at the kernel layer with PostgreSQL RLS, multi-region residency boundaries,
              and AES-256 encrypted credential vaults.
            </p>
          </div>
        </section>

        {/* CTA Box */}
        <section className="rounded-3xl border border-teal-500/30 bg-gradient-to-r from-teal-950/40 via-slate-900 to-emerald-950/40 p-8 sm:p-12 text-center text-white space-y-6">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Ready to reclaim your processor fee slippage?
            </h2>
            <p className="text-sm text-slate-300">
              Explore the live operator console or connect your sandbox Stripe &amp; PayPal
              credentials in under 5 minutes.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-white text-slate-900 hover:bg-slate-100 font-bold"
            >
              <UiLink href="/demo/console">
                Explore Operator Console <ArrowRight className="ml-2 h-4 w-4" />
              </UiLink>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white/20 text-white hover:bg-white/10 font-medium"
            >
              <UiLink href="/realtime-dashboard">Live Telemetry Radar</UiLink>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
