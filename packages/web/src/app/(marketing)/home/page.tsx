'use client';

import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { HeroAnimationWrapper } from "@/components/HeroAnimationWrapper";
import { TextRevealHeading } from "@/components/ui/TextReveal";
import { ParallaxBackground, ParallaxBlobs } from "@/components/ui/ParallaxBackground";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { FeatureShowcase } from "@/components/landing/FeatureShowcase";
import { ComparisonTable } from "@/components/landing/ComparisonTable";
import {
  TestimonialCarousel,
  ROICalculator,
} from "@/components/marketing";
import {
  Database,
  ArrowRight,
  Shield,
  RefreshCw,
  CheckCircle2,
  Code2,
  Terminal,
  GitBranch,
  Cpu,
  FileCode,
  Play,
  BookOpen,
  Github
} from "lucide-react";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Image from "next/image";

// Dynamic imports for heavy components with loading fallback
const AnimatedCodeBlock = dynamic(
  () => import("@/components/AnimatedCodeBlock").then(mod => ({ default: mod.AnimatedCodeBlock })),
  {
    ssr: false,
    loading: () => (
      <div className="bg-slate-900 rounded-xl p-6 min-h-[300px] flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading code editor...</div>
      </div>
    )
  }
);


export default function HomePage() {
  // OSS/Developer-first workflow steps
  const devWorkflowSteps = [
    {
      number: 1,
      title: "Install SDK",
      description: "npm install @settler/sdk. No complex setup, no vendor lock-in.",
      icon: Terminal,
      code: "npm install @settler/sdk",
      illustration: "/illustrations/feature-integration.svg",
    },
    {
      number: 2,
      title: "Define Rules",
      description: "Write deterministic matching rules in code. Version control them.",
      icon: FileCode,
      code: "rules: { matching: [{ field: 'amount', tolerance: 0.01 }] }",
      illustration: "/illustrations/feature-deterministic.svg",
    },
    {
      number: 3,
      title: "Run Reconciliation",
      description: "Execute via API or CLI. Same inputs always produce same outputs.",
      icon: Play,
      code: "await client.reconciliations.create(config)",
      illustration: "/illustrations/feature-audit.svg",
    },
    {
      number: 4,
      title: "Review Evidence",
      description: "Inspect variance sets with full audit trail. Export to JSON/CSV.",
      icon: GitBranch,
      code: "Evidence: SHA256 hash chain",
      illustration: "/illustrations/feature-human.svg",
    },
  ];

  // OSS value drivers
  const ossBenefits = [
    {
      icon: Code2,
      title: "Fully Open Source",
      description: "Apache 2.0 licensed. Audit, modify, self-host."
    },
    {
      icon: Shield,
      title: "Deterministic Output",
      description: "Same data + same rules = same results. Always."
    },
    {
      icon: Terminal,
      title: "CLI & API First",
      description: "Programmatic reconciliation. CI/CD integration ready."
    },
    {
      icon: Database,
      title: "Data Sovereignty",
      description: "Your data stays in your infrastructure."
    },
    {
      icon: Cpu,
      title: "Replayable Runs",
      description: "Re-run any reconciliation with identical results."
    },
    {
      icon: GitBranch,
      title: "Version Controlled Rules",
      description: "Rules as code. Review, test, deploy like software."
    },
  ];

  const codeExample = `import { SettlerClient } from "@settler/sdk";

// Initialize with your API key
const client = new SettlerClient({
  apiKey: process.env.SETTLER_API_KEY
});

// Define deterministic reconciliation rules
const reconciliation = await client.reconciliations.create({
  source: { adapter: "stripe", config: { apiKey: process.env.STRIPE_KEY } },
  target: { adapter: "postgres", config: { connectionString: process.env.DATABASE_URL } },
  rules: {
    matching: [
      { field: "amount", tolerance: 0.01 },
      { field: "date", tolerance: "24h" }
    ],
    tolerances: {
      amount: { maxDiff: 0.01 },
      currency: { requireExact: true }
    }
  },
  output: {
    format: "json",
    includeEvidence: true,
    hashAlgorithm: "sha256"
  }
});

// Get variance report with full audit trail
const variances = await client.reconciliations.getVariances(reconciliation.id);
// eslint-disable-next-line no-console
console.log(\`Found \${variances.count} discrepancies\`);
// eslint-disable-next-line no-console
console.log(\`Evidence hash: \${variances.evidenceHash}\`);`;

  return (
    <ErrorBoundary context="Home Page">
      <main
        id="main-content"
        className="min-h-screen bg-slate-50 dark:bg-slate-950 antialiased"
        aria-label="Settler homepage"
      >
        <Navigation />

        {/* Hero Section - OSS First Message */}
        <section
          className="relative pt-20 sm:pt-24 lg:pt-32 pb-16 sm:pb-20 lg:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden"
          aria-labelledby="hero-heading"
        >
          <ParallaxBackground>
            <ParallaxBlobs count={3} />
          </ParallaxBackground>

          {/* Grid pattern background */}
          <div
            className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-10"
            aria-hidden="true"
          />

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <HeroAnimationWrapper>
                <div className="text-left max-w-2xl">
                  {/* OSS Badge */}
                  <div className="mb-6 flex justify-start">
                    <Badge
                      className="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-2 text-sm font-medium inline-flex items-center gap-2"
                    >
                      <Github className="w-4 h-4" aria-hidden="true" />
                      Open Source Reconciliation Engine
                    </Badge>
                  </div>

                  {/* Main headline - Dev focused */}
                  <div className="mb-6 sm:mb-8 text-left">
                    <TextRevealHeading
                      as="h1"
                      id="hero-heading"
                      text="Reconciliation as Code"
                      className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 text-slate-900 dark:text-white tracking-tight leading-[1.1]"
                      delay={0}
                      staggerDelay={0.02}
                      splitBy="words"
                    />
                  </div>

                  {/* Subheadline - OSS/Dev value proposition */}
                  <div className="mb-10 sm:mb-12">
                    <p className="text-lg sm:text-xl text-slate-700 dark:text-slate-300 leading-relaxed">
                      Deterministic financial reconciliation you can audit, version control, and self-host.
                      Built for developers who demand inspectability.
                    </p>
                  </div>

                  {/* CTA buttons - Dev focused */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-start items-center mb-12 sm:mb-16">
                    <Button
                      size="lg"
                      asChild
                      className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 px-8 py-6 text-lg font-semibold shadow-xl transition-all duration-200"
                    >
                      <Link href="/docs/quickstart" className="flex items-center justify-center gap-3">
                        <BookOpen className="w-5 h-5" aria-hidden="true" />
                        <span>Read Quickstart</span>
                      </Link>
                    </Button>

                    <Button
                      size="lg"
                      variant="outline"
                      asChild
                      className="w-full sm:w-auto px-8 py-6 text-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200"
                    >
                      <Link href="https://github.com/settler-dev/settler" className="flex items-center justify-center gap-3" target="_blank" rel="noopener noreferrer">
                        <Github className="w-5 h-5" aria-hidden="true" />
                        <span>GitHub</span>
                      </Link>
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

        {/* OSS Value Drivers */}
        <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <Badge className="mb-4 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 px-3 py-1">
                Why Developers Choose Settler
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-slate-900 dark:text-white tracking-tight">
                Reconciliation That Respects Your Workflow
              </h2>
              <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
                No black boxes. No vendor lock-in. Just clean, deterministic code that runs where you want it.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {ossBenefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <SpotlightCard
                    key={index}
                    className="p-6 sm:p-8 h-full transition-all duration-300 hover:shadow-xl"
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-slate-700 dark:text-slate-300" aria-hidden="true" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-2 text-slate-900 dark:text-white">
                      {benefit.title}
                    </h3>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                      {benefit.description}
                    </p>
                  </SpotlightCard>
                );
              })}
            </div>
          </div>
        </section>

        {/* Developer Workflow */}
        <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <Badge className="mb-4 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-3 py-1">
                Developer Experience
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-slate-900 dark:text-white tracking-tight">
                Reconciliation in 4 Lines of Code
              </h2>
              <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
                Install the SDK, define your rules, run reconciliation, review evidence. No complex setup required.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {devWorkflowSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div
                    key={index}
                    className="relative p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center"
                  >
                    <div className="absolute -top-3 left-6 w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-sm font-bold">
                      {step.number}
                    </div>

                    <div className="w-full aspect-square relative mb-6 p-4">
                      <Image
                        src={step.illustration}
                        alt={step.title}
                        fill
                        className="object-contain"
                      />
                    </div>

                    <div className="pt-2">
                       <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white flex items-center justify-center gap-2">
                        <Icon className="w-5 h-5 text-slate-700 dark:text-slate-300" aria-hidden="true" />
                        {step.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                        {step.description}
                      </p>
                      <code className="block text-xs bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded text-slate-700 dark:text-slate-300 font-mono">
                        {step.code}
                      </code>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Code Example Section */}
        <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10 sm:mb-12">
              <Badge className="mb-4 bg-slate-800 text-slate-200 px-3 py-1 border border-slate-700">
                TypeScript SDK
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
                Inspectable, Testable, Version Controlled
              </h2>
              <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto">
                Your reconciliation rules are code. Review them in PRs, test them in CI, deploy them with confidence.
              </p>
            </div>

            <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-900 border-b border-slate-800">
                <div className="w-3 h-3 rounded-full bg-red-500" aria-hidden="true" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" aria-hidden="true" />
                <div className="w-3 h-3 rounded-full bg-green-500" aria-hidden="true" />
                <span className="ml-4 text-sm text-slate-400 font-mono">reconciliation.ts</span>
              </div>
              <div className="p-4 sm:p-6 overflow-x-auto">
                <AnimatedCodeBlock
                  code={codeExample}
                  language="typescript"
                  title="Rules-First API"
                  description="Explicit rules, deterministic outputs, and inspectable evidence."
                />
              </div>
            </div>

            {/* Code features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
              {[
                { icon: CheckCircle2, title: "Type Safe", desc: "Full TypeScript support with IntelliSense" },
                { icon: RefreshCw, title: "Deterministic", desc: "Same inputs always produce same outputs" },
                { icon: Shield, title: "Auditable", desc: "Complete evidence chain with SHA256 hashes" },
              ].map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-slate-300" aria-hidden="true" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">{feature.title}</h4>
                      <p className="text-sm text-slate-400">{feature.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Feature Showcase - Using the updated component */}
        <FeatureShowcase />

        {/* Comparison Table */}
        <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 px-3 py-1">
                Comparison
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-slate-900 dark:text-white tracking-tight">
                Settler vs. The Alternatives
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                See how Settler compares to manual processes and closed-source solutions
              </p>
            </div>
            <ComparisonTable />
          </div>
        </section>

        {/* ROI Calculator */}
        <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-3 py-1">
                ROI Calculator
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-slate-900 dark:text-white tracking-tight">
                Calculate Your Time Savings
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                See how much engineering time you can reclaim by automating reconciliation
              </p>
            </div>
            <ROICalculator />
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 px-3 py-1">
                Developer Stories
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-slate-900 dark:text-white tracking-tight">
                Trusted by Engineering Teams
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                See what developers are saying about reconciliation as code
              </p>
            </div>
            <TestimonialCarousel />
          </div>
        </section>

        {/* FAQ Accordion */}
        <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10 sm:mb-12">
              <Badge className="mb-4 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 px-3 py-1">
                FAQ
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-slate-900 dark:text-white tracking-tight">
                Common Questions
              </h2>
            </div>
            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem value="what-is" className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-6">
                <AccordionTrigger className="text-base sm:text-lg font-semibold py-4 hover:no-underline">
                  What is Settler?
                </AccordionTrigger>
                <AccordionContent className="text-sm sm:text-base text-slate-600 dark:text-slate-400 pb-4 leading-relaxed">
                  Settler is an open-source reconciliation engine that normalizes financial data, applies deterministic matching rules, and surfaces variances for human review. It&apos;s designed for teams who need transparency and auditability in their financial workflows.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="oss" className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-6">
                <AccordionTrigger className="text-base sm:text-lg font-semibold py-4 hover:no-underline">
                  Is it really open source?
                </AccordionTrigger>
                <AccordionContent className="text-sm sm:text-base text-slate-600 dark:text-slate-400 pb-4 leading-relaxed">
                  Yes. Settler is licensed under Apache 2.0. You can self-host it, modify it, and contribute back. The core reconciliation engine, SDK, and all adapters are fully open source. We also offer managed cloud hosting for teams who prefer it.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="deterministic" className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-6">
                <AccordionTrigger className="text-base sm:text-lg font-semibold py-4 hover:no-underline">
                  What does &quot;deterministic&quot; mean?
                </AccordionTrigger>
                <AccordionContent className="text-sm sm:text-base text-slate-600 dark:text-slate-400 pb-4 leading-relaxed">
                  Deterministic means the same inputs always produce the same outputs. Given the same data sources and matching rules, Settler will always identify the same variances. This makes debugging, testing, and auditing possible.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="self-host" className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-6">
                <AccordionTrigger className="text-base sm:text-lg font-semibold py-4 hover:no-underline">
                  Can I self-host Settler?
                </AccordionTrigger>
                <AccordionContent className="text-sm sm:text-base text-slate-600 dark:text-slate-400 pb-4 leading-relaxed">
                  Absolutely. Self-hosting is a first-class use case. Settler runs on Node.js and connects to your existing Postgres database. Your data never leaves your infrastructure unless you choose to use our managed cloud service.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="not" className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-6">
                <AccordionTrigger className="text-base sm:text-lg font-semibold py-4 hover:no-underline">
                  What is Settler NOT?
                </AccordionTrigger>
                <AccordionContent className="text-sm sm:text-base text-slate-600 dark:text-slate-400 pb-4 leading-relaxed">
                  Settler is not accounting software, an audit tool, or compliance software. It does not make decisions or automate judgment. It surfaces variances and evidence for human review. You decide how to act on the results.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* Final CTA - OSS focused */}
        <section className="py-20 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-slate-800 text-slate-200 px-4 py-2 border border-slate-700">
              Apache 2.0 Licensed
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 tracking-tight">
              Own Your Reconciliation Logic
            </h2>
            <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Stop relying on black boxes. Deploy reconciliation you can audit, test, and version control. Start free, self-host when ready.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                asChild
                className="w-full sm:w-auto bg-white text-slate-900 hover:bg-slate-100 px-10 py-7 text-lg font-semibold shadow-2xl transition-all duration-200 min-h-[56px] min-w-[200px]"
              >
                <Link href="/docs/quickstart" className="flex items-center justify-center gap-3">
                  <BookOpen className="w-5 h-5" aria-hidden="true" />
                  Read Quickstart
                </Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                asChild
                className="w-full sm:w-auto px-10 py-7 text-lg border-2 border-slate-600 bg-transparent text-white hover:bg-slate-800 transition-all duration-200 min-h-[56px] min-w-[200px]"
              >
                <Link href="https://github.com/settler-dev/settler" className="flex items-center justify-center gap-3" target="_blank" rel="noopener noreferrer">
                  <Github className="w-5 h-5" aria-hidden="true" />
                  View on GitHub
                </Link>
              </Button>
            </div>
            <p className="mt-8 text-sm text-slate-500">
              No credit card required. Open source forever.
            </p>
          </div>
        </section>

        <Footer />
      </main>
    </ErrorBoundary>
  );
}
