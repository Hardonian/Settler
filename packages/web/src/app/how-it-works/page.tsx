"use client";

import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { TextRevealHeading } from "@/components/ui/TextReveal";
import { ParallaxBackground, ParallaxBlobs } from "@/components/ui/ParallaxBackground";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import ArchitectureOverview from "@/components/stitch-import/ArchitectureOverview";
import { Plug, Code2, Play, BarChart3 } from "lucide-react";

const steps = [
  {
    number: 1,
    title: "Connect",
    description: "Attach a data source — Stripe, Shopify, QuickBooks, a CSV export, or your own adapter.",
    icon: Plug,
  },
  {
    number: 2,
    title: "Define Rules",
    description: "Write matching rules in code: field mappings, numeric tolerances, and date windows. Rules are version-controlled and testable.",
    icon: Code2,
  },
  {
    number: 3,
    title: "Run",
    description: "Execute the reconciliation. The engine applies your rules deterministically — same inputs always produce the same output.",
    icon: Play,
  },
  {
    number: 4,
    title: "Review Evidence",
    description: "Inspect every mismatch with full context: which rule matched, what the variance was, and a SHA-256 hash-linked audit trail.",
    icon: BarChart3,
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black">
      <Navigation />

      {/* Breadcrumbs */}
      <section className="px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs items={[{ label: "How It Works" }]} />
        </div>
      </section>

      {/* Hero Section */}
      <section
        className="relative pt-8 pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[50vh] md:min-h-[60vh] flex items-center"
        aria-labelledby="hero-heading"
      >
        <ParallaxBackground>
          <ParallaxBlobs count={3} />
        </ParallaxBackground>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center">
            <TextRevealHeading
              as="h1"
              id="hero-heading"
              text="How Settler Works"
              className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent leading-tight"
              delay={0}
              staggerDelay={0.02}
            />
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-6 md:mb-8 max-w-2xl mx-auto leading-relaxed">
              Connect a data source, define matching rules, run the engine, review evidence. Four explicit steps with no hidden logic.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <Button
                size="lg"
                asChild
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-5 sm:py-6 text-base sm:text-lg font-semibold"
              >
                <Link href="/docs/quickstart">Read the Quickstart</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="w-full sm:w-auto px-8 py-5 sm:py-6 text-base sm:text-lg"
              >
                <Link href="/docs">View Documentation</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <SpotlightCard key={index} className="p-5 md:p-6 text-center">
                  <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl md:text-2xl font-bold">
                    {step.number}
                  </div>
                  <div className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                    <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold mb-2 text-slate-900 dark:text-white">
                    {step.title}
                  </h3>
                  <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    {step.description}
                  </p>
                </SpotlightCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* Code Example */}
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-4xl mx-auto">
          <SpotlightCard className="p-6 md:p-8">
            <div className="text-center mb-5 md:mb-6">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-3 md:mb-4 text-slate-900 dark:text-white">
                Run a Demo Reconciliation in 5 Minutes
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base max-w-lg mx-auto">
                No database or API keys required for the demo. The example runs a Stripe↔QuickBooks reconciliation and writes <code className="font-mono text-xs bg-slate-800 text-green-400 px-1 rounded">evidence.json</code> and <code className="font-mono text-xs bg-slate-800 text-green-400 px-1 rounded">report.html</code> to <code className="font-mono text-xs bg-slate-800 text-green-400 px-1 rounded">examples/demo-output/</code>.
              </p>
            </div>

            <div className="bg-slate-900 dark:bg-slate-800 rounded-lg p-4 md:p-6 overflow-x-auto mb-5 md:mb-6">
              <pre className="text-green-400 text-xs md:text-sm leading-relaxed">
                <code>{`# Clone and install
git clone https://github.com/Hardonian/Settler.git
cd Settler && pnpm install

# Run the built-in demo (no API key required)
pnpm demo

# Inspect outputs
cat examples/demo-output/results.json
cat examples/demo-output/evidence.json

# Replay verification — re-runs deterministically from stored artifacts
pnpm settler:replay examples/demo-output/evidence.json`}</code>
              </pre>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button
                size="lg"
                asChild
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-5 sm:py-6 text-base sm:text-lg font-semibold"
              >
                <Link href="/docs/quickstart">Read the Quickstart</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="w-full sm:w-auto px-8 py-5 sm:py-6 text-base sm:text-lg"
              >
                <Link href="/docs">View Documentation</Link>
              </Button>
            </div>
          </SpotlightCard>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <ParallaxBackground speed={0.2}>
          <ParallaxBlobs count={2} />
        </ParallaxBackground>
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 text-slate-900 dark:text-white">
            Start with the Demo or Read the Docs
          </h2>
          <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 mb-6 md:mb-8 leading-relaxed">
            Run <code className="font-mono text-sm">pnpm demo</code> locally for a zero-credential first run, or read the quickstart to connect your own data sources.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button
              size="lg"
              asChild
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-5 sm:py-6 text-base sm:text-lg font-semibold"
            >
              <Link href="/docs/quickstart">Read the Quickstart</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="w-full sm:w-auto px-8 py-5 sm:py-6 text-base sm:text-lg"
            >
              <Link href="/docs">Full Documentation</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
            Architecture Overview
          </h2>
          <ArchitectureOverview />
        </div>
      </section>

      <Footer />
    </div>
  );
}
