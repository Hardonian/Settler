"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { HeroAnimationWrapper } from "@/components/HeroAnimationWrapper";
import { TextReveal, TextRevealHeading } from "@/components/ui/TextReveal";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import {
  Database,
  Sliders,
  Eye,
  AlertTriangle,
  ArrowRight,
  Target,
  Layers,
  GitBranch,
  CheckCircle,
} from "lucide-react";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const AnimatedCodeBlock = dynamic(
  () =>
    import("@/components/AnimatedCodeBlock").then((mod) => ({
      default: mod.AnimatedCodeBlock,
    })),
  { ssr: false }
);

import { HeroMedia } from "@/components/HeroMedia";

export default function Home() {
  const dashboardRoutes = [
    { name: "Reconciliation", path: "/reconcile", icon: Layers },
    { name: "Receipt Parser", path: "/parser", icon: Database },
    { name: "Categorization", path: "/categorize", icon: Sliders },
    { name: "Data Exports", path: "/exports", icon: GitBranch },
  ];

  const howItWorksSteps = [
    {
      number: 1,
      title: "Ingest Data",
      description:
        "Bring data in through adapters, files, or your own pipelines.",
      icon: Database,
      illustration: "/illustrations/feature-integration.svg",
    },
    {
      number: 2,
      title: "Normalize",
      description:
        "Map records into a canonical schema with explicit, inspectable transforms.",
      icon: Sliders,
      illustration: "/illustrations/feature-deterministic.svg",
    },
    {
      number: 3,
      title: "Apply Rules",
      description:
        "Run deterministic matching rules and tolerances you define.",
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

// Deterministic reconciliation with inspectable rules
const reconciliation = await client.reconciliations.create({
  source: { adapter: "stripe" },
  target: { adapter: "database" },
  rules: { matching: [{ field: "amount", tolerance: 0.01 }] }
});`;

  return (
    <ErrorBoundary context="Home Page">
      <main
        id="main-content"
        className="min-h-screen bg-bg text-foreground"
        aria-label="Settler homepage"
      >
        <Navigation />

        {/* Hero Section */}
        <section
          className="relative min-h-[90vh] flex items-center pt-24 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden"
          aria-labelledby="hero-heading"
        >
          <div className="absolute inset-0 bg-grid-quiet [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] -z-10" />

          <div className="max-w-7xl mx-auto relative z-10 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <HeroAnimationWrapper>
                <div className="text-left max-w-2xl">
                  <div className="mb-8 flex justify-start">
                    <Badge className="bg-teal-500/10 text-teal-500 border-teal-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                      Deterministic Infrastructure
                    </Badge>
                  </div>

                  <div className="mb-6">
                    <TextRevealHeading
                      as="h1"
                      id="hero-heading"
                      text="Reconciliation at Financial Grade"
                      className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 text-foreground leading-[1.05] tracking-tight"
                      delay={0}
                      staggerDelay={0.02}
                      splitBy="words"
                    />
                  </div>

                  <div className="mb-10">
                    <TextReveal
                      text="Normalize data, apply explicit rules, and surface variances with precision. Settler provides the audit-ready backbone for your financial operations."
                      className="text-lg md:text-xl text-muted leading-relaxed font-normal max-w-xl"
                      delay={0.2}
                      staggerDelay={0.01}
                      splitBy="words"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 mb-12">
                    <Button
                      size="lg"
                      asChild
                      className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-6 rounded-md shadow-lg shadow-teal-500/20 transition-all font-semibold"
                    >
                      <Link href="/reconcile" className="flex items-center gap-2">
                        Get Started <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      asChild
                      className="border-border bg-transparent text-foreground hover:bg-neutral-20 px-8 py-6"
                    >
                      <Link href="/contact">Discuss Architecture</Link>
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-border/50">
                    {dashboardRoutes.map((route) => {
                      const Icon = route.icon;
                      return (
                        <Link
                          key={route.path}
                          href={route.path}
                          className="group flex flex-col gap-2"
                        >
                          <div className="w-8 h-8 rounded bg-neutral-20 flex items-center justify-center group-hover:bg-teal-500/10 transition-colors">
                            <Icon className="w-4 h-4 text-muted group-hover:text-teal-500 transition-colors" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted group-hover:text-foreground transition-colors">
                            {route.name}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </HeroAnimationWrapper>

              <div className="relative group">
                <div className="absolute inset-0 bg-teal-500/5 blur-3xl rounded-full -z-10 animate-pulse" />
                <HeroMedia
                  className="rounded-2xl border border-border shadow-2xl aspect-[4/3] w-full"
                  videoSrc="/hero/settler-hero.mp4"
                  fallbackSrc="/hero/settler-hero-fallback.png"
                  poster="/hero/settler-hero-fallback.png"
                />

                {/* Floating Metric Card */}
                <div className="absolute -bottom-6 -left-6 bg-card border border-border p-4 rounded-xl shadow-xl animate-float hidden md:block">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-teal-500" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-muted uppercase tracking-wider">Reliability</div>
                      <div className="text-lg font-mono font-bold">99.98% Confidence</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* How It Works Section with Diagram */}
        <section
          className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900"
          aria-label="How Settler works"
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 text-slate-900 dark:text-white tracking-tight">
                A Deterministic Pipeline
              </h2>
              <Image
                src="/illustrations/how-settler-works.svg"
                alt="Settler reconciliation pipeline diagram showing data flow from ingestion through normalization and rule application to variance surfacing"
                width={800}
                height={300}
                className="mx-auto w-full max-w-4xl h-auto mb-12 drop-shadow-sm"
                loading="lazy"
              />
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
                Turns messy financial inputs into traceable variances your team
                can review. Same inputs, same rules, same results.
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
                      <div
                        className="absolute inset-0 bg-blue-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-hidden="true"
                      />
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
                      <Icon
                        className="w-5 h-5 text-slate-600 dark:text-slate-400"
                        aria-hidden="true"
                      />
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

        {/* Code Example */}
        <section
          className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950"
          aria-label="Code example"
        >
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10 md:mb-12">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 text-slate-900 dark:text-white tracking-tight">
                Inspectable Rules You Can Version Control
              </h2>
              <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Every reconciliation run is explainable and replayable. No hidden
                heuristics, no silent edits.
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

        {/* Enterprise Inevitability Narrative */}
        <section
          className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900"
          aria-label="Why this matters"
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-slate-900 dark:text-white tracking-tight">
                What Mature Financial Infrastructure Evolves Toward
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
                Manual reconciliation is a phase. Deterministic, API-based
                reconciliation is the stable end-state.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {[
                {
                  icon: Target,
                  title: "Failure Surface Reduction",
                  description:
                    "Reconciliation is not a task. It is a structural risk surface. Determinism reduces that surface by eliminating probabilistic drift.",
                },
                {
                  icon: Eye,
                  title: "Reviewable Decisions",
                  description:
                    "AI compresses uncertainty. Humans retain authority. Every flagged variance includes evidence and confidence context for informed review.",
                },
                {
                  icon: Layers,
                  title: "Operational Maturity",
                  description:
                    "From manual exports to version-controlled rules. From fragile scripts to deterministic pipelines. From hope to operational confidence.",
                },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-6 md:p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800"
                  >
                    <Icon
                      className="w-10 h-10 text-slate-700 dark:text-slate-300 mb-4"
                      aria-hidden="true"
                    />
                    <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Before vs Controlled State */}
        <section
          className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950"
          aria-label="Before and after comparison"
        >
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-slate-900 dark:text-white tracking-tight">
                The Operational Shift
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-6">
                  <AlertTriangle
                    className="w-6 h-6 text-slate-400"
                    aria-hidden="true"
                  />
                  <h3 className="text-xl font-semibold text-slate-500 dark:text-slate-400">
                    Before
                  </h3>
                </div>
                <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                  {[
                    "Manual CSV exports and spreadsheet matching",
                    "Fragile scripts that fail silently at scale",
                    "Untracked variances accumulating risk",
                    "No audit trail for reconciliation decisions",
                    "Failure surfaces expanding with transaction volume",
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span
                        className="text-slate-400 mt-0.5 flex-shrink-0"
                        aria-hidden="true"
                      >
                        --
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-900 dark:border-white shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <CheckCircle
                    className="w-6 h-6 text-slate-900 dark:text-white"
                    aria-hidden="true"
                  />
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                    Controlled State
                  </h3>
                </div>
                <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                  {[
                    "Deterministic rules applied programmatically via API",
                    "Version-controlled matching logic reviewed in PRs",
                    "Every variance traceable with evidence hashing",
                    "Complete audit trail for every reconciliation run",
                    "Failure surface compressed through governance boundaries",
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span
                        className="text-slate-900 dark:text-white mt-0.5 flex-shrink-0 font-medium"
                        aria-hidden="true"
                      >
                        --
                      </span>
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section
          className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900"
          aria-label="Common questions"
        >
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center text-slate-900 dark:text-white tracking-tight">
              Common Questions
            </h2>
            <Accordion type="single" collapsible className="w-full space-y-3">
              <AccordionItem
                value="features"
                className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 px-6"
              >
                <AccordionTrigger className="text-base md:text-lg font-semibold py-4 hover:no-underline">
                  What Settler Does
                </AccordionTrigger>
                <AccordionContent className="text-sm md:text-base text-slate-600 dark:text-slate-400 pb-4 leading-relaxed space-y-2">
                  <p>
                    <strong>Surfaces discrepancies:</strong> Outputs variance
                    sets instead of silently resolving them.
                  </p>
                  <p>
                    <strong>Deterministic and inspectable:</strong> Same inputs
                    produce the same outputs, with traceable rule paths.
                  </p>
                  <p>
                    <strong>Provider-agnostic:</strong> Normalize from any
                    adapter or file format into a canonical model.
                  </p>
                  <p>
                    <strong>Human-in-the-loop:</strong> Review and resolve
                    exceptions with evidence attached.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem
                value="not"
                className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 px-6"
              >
                <AccordionTrigger className="text-base md:text-lg font-semibold py-4 hover:no-underline">
                  What Settler Is Not
                </AccordionTrigger>
                <AccordionContent className="text-sm md:text-base text-slate-600 dark:text-slate-400 pb-4 leading-relaxed">
                  Settler is not accounting software, an audit tool, or
                  compliance certification. It does not make decisions or
                  automate judgment. It surfaces variances and evidence for human
                  review.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem
                value="security"
                className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 px-6"
              >
                <AccordionTrigger className="text-base md:text-lg font-semibold py-4 hover:no-underline">
                  Security and Audit
                </AccordionTrigger>
                <AccordionContent className="text-sm md:text-base text-slate-600 dark:text-slate-400 pb-4 leading-relaxed">
                  Audit evidence is produced as deterministic outputs with
                  SHA256 hashing. You decide how to review and certify results.
                  See the{" "}
                  <Link
                    href="/security-and-audit"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Security and Audit
                  </Link>{" "}
                  page for full disclosure and operational limits.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* Final CTA */}
        <section
          className="py-20 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white"
          aria-label="Get started"
        >
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-slate-800 text-slate-200 px-4 py-2 border border-slate-700">
              Open Source - Apache 2.0
            </Badge>
            <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-6 tracking-tight">
              Own Your Reconciliation Logic
            </h2>
            <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Deploy reconciliation you can audit, test, and version control.
              Start with the documentation or discuss your architecture with our
              team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                asChild
                className="w-full sm:w-auto bg-white text-slate-900 hover:bg-slate-100 px-10 py-7 text-lg font-semibold shadow-2xl transition-all min-h-[56px] min-w-[200px]"
              >
                <Link
                  href="/docs/quickstart"
                  className="flex items-center justify-center gap-2"
                >
                  Read Quickstart{" "}
                  <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="w-full sm:w-auto px-10 py-7 text-lg border-2 border-slate-600 bg-transparent text-white hover:bg-slate-800 transition-all min-h-[56px] min-w-[200px]"
              >
                <Link
                  href="/contact"
                  className="flex items-center justify-center gap-2"
                >
                  Discuss Your Architecture
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </ErrorBoundary>
  );
}
