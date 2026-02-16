"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { HeroAnimationWrapper } from "@/components/HeroAnimationWrapper";
import { TextReveal, TextRevealHeading } from "@/components/ui/TextReveal";
import { ParallaxBackground, ParallaxBlobs } from "@/components/ui/ParallaxBackground";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { Database, Sliders, AlertTriangle, Eye, ArrowRight } from "lucide-react";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Dynamic imports for heavy components
const AnimatedCodeBlock = dynamic(() => import("@/components/AnimatedCodeBlock").then(mod => ({ default: mod.AnimatedCodeBlock })), { ssr: false });

export default function Home() {
  const howItWorksSteps = [
    {
      number: 1,
      title: "Ingest Data",
      description: "Bring data in through adapters, files, or your own pipelines.",
      icon: Database,
      illustration: "/illustrations/feature-integration.svg",
    },
    {
      number: 2,
      title: "Normalize",
      description: "Map records into a canonical schema with explicit, inspectable transforms.",
      icon: Sliders,
      illustration: "/illustrations/feature-deterministic.svg",
    },
    {
      number: 3,
      title: "Apply Rules",
      description: "Run deterministic matching rules and tolerances you define.",
      icon: Eye,
      illustration: "/illustrations/feature-audit.svg",
    },
    {
      number: 4,
      title: "Surface Variances",
      description: "Generate variance sets and evidence for human review.",
      icon: AlertTriangle,
      illustration: "/illustrations/feature-human.svg",
    },
  ];

  const codeExample = `import { SettlerClient } from "@settler/sdk";

const client = new SettlerClient({ apiKey: "sk_live_..." });

// Run a deterministic reconciliation
const reconciliation = await client.reconciliations.create({
  source: { adapter: "stripe" },
  target: { adapter: "database" },
  rules: { matching: [{ field: "amount", tolerance: 0.01 }] }
});`;

  return (
    <ErrorBoundary context="Home Page">
      <main
        id="main-content"
        className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black"
        aria-label="Settler homepage"
      >
        <Navigation />

        {/* Hero Section */}
        <section
          className="relative pt-12 sm:pt-20 lg:pt-24 pb-20 sm:pb-24 lg:pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[85vh] sm:min-h-[90vh] lg:min-h-[92vh] flex items-center"
          aria-labelledby="hero-heading"
        >
          <ParallaxBackground>
            <ParallaxBlobs count={3} />
          </ParallaxBackground>

          {/* Grid pattern background */}
          <div
            className="absolute inset-0 bg-grid-slate-200 dark:bg-grid-slate-800 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.3))] -z-10"
            aria-hidden="true"
          />

          {/* Subtle gradient overlay for depth */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-50/50 dark:to-slate-900/30 -z-10"
            aria-hidden="true"
          />

          <div className="max-w-7xl mx-auto relative z-10 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <HeroAnimationWrapper>
                <div className="text-left max-w-2xl">
                  {/* Main headline with constrained width for readability */}
                  <div className="mb-6 sm:mb-8 lg:mb-10">
                    <TextRevealHeading
                      as="h1"
                      id="hero-heading"
                      text="Open-Source Reconciliation Engine for Financial Data"
                      className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-100 dark:to-white bg-clip-text text-transparent leading-[1.1] tracking-tight"
                      delay={0}
                      staggerDelay={0.02}
                      splitBy="words"
                    />
                  </div>

                  {/* Subheadline with optimal reading width */}
                  <div className="mb-10 sm:mb-12 lg:mb-14">
                    <TextReveal
                      text="Settler normalizes data, applies explicit rules, and surfaces variances for review. Deterministic, inspectable, and designed for human-in-the-loop workflows."
                      className="text-lg sm:text-xl text-slate-700 dark:text-slate-300 leading-relaxed font-normal"
                      delay={0.2}
                      staggerDelay={0.01}
                      splitBy="words"
                    />
                  </div>

                  {/* CTA buttons with clear hierarchy */}
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 justify-start items-center mb-12 px-0">
                    <Button
                      size="lg"
                      asChild
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-10 py-6 text-lg font-semibold shadow-2xl transition-all"
                    >
                      <Link
                        href="/docs/quickstart"
                        className="flex items-center justify-center gap-2"
                      >
                        <span>Get Started</span>
                        <ArrowRight className="w-5 h-5" aria-hidden="true" />
                      </Link>
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      asChild
                      className="w-full sm:w-auto px-10 py-6 text-lg border-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm font-medium"
                    >
                      <Link href="/open-source">Explore OSS</Link>
                    </Button>
                  </div>
                </div>
              </HeroAnimationWrapper>

              <div className="hidden lg:block relative">
                <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full -z-10" />
                <Image
                  src="/illustrations/hero-visual.svg"
                  alt="Settler Reconciliation Engine Visualization"
                  width={600}
                  height={500}
                  priority
                  className="w-full h-auto drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section with Diagram */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 border-y border-slate-200/60 dark:border-slate-800/60 bg-white/30 dark:bg-slate-900/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-slate-900 dark:text-white">
                How Settler Works
              </h2>
              <Image
                src="/illustrations/how-settler-works.svg"
                alt="Settler Reconciliation Pipeline Diagram"
                width={800}
                height={300}
                className="mx-auto w-full max-w-4xl h-auto mb-12 drop-shadow-sm"
                loading="lazy"
              />
              <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
                A deterministic pipeline that turns messy financial inputs into traceable variances
                your team can review.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {howItWorksSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <SpotlightCard
                    key={index}
                    className="p-8 flex flex-col items-center text-center group"
                  >
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-blue-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      <Image
                        src={step.illustration}
                        alt={step.title}
                        width={80}
                        height={80}
                        className="relative z-10 w-20 h-20"
                        loading="lazy"
                      />
                    </div>
                    <div className="w-10 h-10 mx-auto mb-4 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">
                      {step.title}
                    </h3>
                    <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                      {step.description}
                    </p>
                  </SpotlightCard>
                );
              })}
            </div>
          </div>
        </section>

        {/* Product in Motion - Code Example */}
        <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10 md:mb-12">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 text-slate-900 dark:text-white">
                Deterministic Rules You Can Inspect
              </h2>
              <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Every reconciliation run is explainable and replayable. No hidden heuristics, no
                silent edits.
              </p>
            </div>
            <SpotlightCard className="p-0 overflow-hidden shadow-xl md:shadow-2xl">
              <AnimatedCodeBlock
                code={codeExample}
                title="Rules-First API"
                description="Explicit rules, deterministic outputs, and inspectable evidence."
                language="typescript"
              />
            </SpotlightCard>
          </div>
        </section>

        {/* Details Accordion */}
        <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 md:mb-8 text-center text-slate-900 dark:text-white">
              Details
            </h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="features">
                <AccordionTrigger className="text-base md:text-lg font-semibold">
                  What Settler Does
                </AccordionTrigger>
                <AccordionContent className="text-sm md:text-base text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
                  <p>
                    <strong>Surfaces discrepancies:</strong> Outputs variance sets instead of
                    silently resolving them.
                  </p>
                  <p>
                    <strong>Deterministic and inspectable:</strong> Same inputs produce the same
                    outputs, with traceable rule paths.
                  </p>
                  <p>
                    <strong>Provider-agnostic:</strong> Normalize from any adapter or file format
                    into a canonical model.
                  </p>
                  <p>
                    <strong>Human-in-the-loop:</strong> Review and resolve exceptions with evidence
                    attached.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="integrations">
                <AccordionTrigger className="text-base md:text-lg font-semibold">
                  What Settler Is Not
                </AccordionTrigger>
                <AccordionContent className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  <p>
                    Settler is not accounting software, an audit, or compliance tooling. It does not
                    guarantee correctness, and it does not automate judgment.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="security">
                <AccordionTrigger className="text-base md:text-lg font-semibold">
                  Security & Audit Notes
                </AccordionTrigger>
                <AccordionContent className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  <p>
                    Audit evidence is produced as deterministic outputs. You decide how to review
                    and certify results. See the{" "}
                    <Link
                      href="/security-and-audit"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Security & Audit
                    </Link>{" "}
                    page for disclosure and limits.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 text-slate-900 dark:text-white">
              Explore the OSS Engine
            </h2>
            <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 mb-6 md:mb-8 max-w-2xl mx-auto leading-relaxed">
              Start with the quickstart and review how determinism and variance reporting work in
              practice.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <Button
                size="lg"
                asChild
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-5 sm:py-6 text-base sm:text-lg font-semibold shadow-xl hover:shadow-2xl transition-all transform hover:scale-[1.02]"
              >
                <Link href="/docs/quickstart" className="flex items-center justify-center gap-2">
                  Read Quickstart <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="w-full sm:w-auto px-8 py-5 sm:py-6 text-base sm:text-lg border-2 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm"
              >
                <Link href="/open-source">Open Source</Link>
              </Button>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </ErrorBoundary>
  );
}
