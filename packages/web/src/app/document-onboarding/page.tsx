"use client";

import React from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AmbientLightOrbs } from "@/components/site/HomeInfographics";
import { AutonomousDocumentOnboarding } from "@/components/site/AutonomousDocumentOnboarding";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UiLink } from "@/components/ui/link";
import { ArrowRight } from "lucide-react";

export default function DocumentOnboardingPage() {
  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden flex flex-col">
      <AmbientLightOrbs />
      <Navigation />

      <main className="flex-1 pt-20 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-16">
        <div className="text-center sm:text-left pt-6 sm:pt-10 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2 mb-3 justify-center sm:justify-start">
            <Badge
              variant="outline"
              className="bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30 font-mono text-xs font-semibold"
            >
              ZERO-CODE RECONCILIATION INGESTION
            </Badge>
            <Badge
              variant="outline"
              className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 font-mono text-xs"
            >
              AUTONOMOUS CADENCE SYNTHESIS
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Self-Serve Document Onboarding &amp; Cadence Engine
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            Eliminate weeks of custom data engineering. Drop your raw Stripe, PayPal, or bank
            statements to automatically discover column topologies, infer contractual fee schedules,
            and launch automated reconciliation cadences.
          </p>
        </div>

        {/* Autonomous Document Onboarding Canvas */}
        <section aria-label="Autonomous Document Onboarding">
          <AutonomousDocumentOnboarding />
        </section>

        {/* Action Next Steps */}
        <section className="rounded-3xl border border-teal-500/30 bg-gradient-to-r from-teal-950/40 via-slate-900 to-emerald-950/40 p-8 sm:p-12 text-center text-white space-y-6">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Ready to connect your live production credentials?
            </h2>
            <p className="text-sm text-slate-300">
              Transition from static statement analysis to continuous live API polling and webhook
              ingestion in under 3 minutes.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-white text-slate-900 hover:bg-slate-100 font-bold"
            >
              <UiLink href="/onboarding">
                Launch Live Connection Wizard <ArrowRight className="ml-2 h-4 w-4" />
              </UiLink>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white/20 text-white hover:bg-white/10 font-medium"
            >
              <UiLink href="/roi-calculator">Calculate Recoverable ROI</UiLink>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
