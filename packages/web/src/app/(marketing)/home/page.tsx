import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { HeroAnimationWrapper } from "@/components/HeroAnimationWrapper";
import { TextRevealHeading } from "@/components/ui/TextReveal";
import { ParallaxBackground, ParallaxBlobs } from "@/components/ui/ParallaxBackground";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import {
  Database,
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
  Github,
  Eye,
  Target,
  Layers,
  ArrowRight,
  Hash,
  Network,
} from "lucide-react";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Image from "next/image";
import { AnimatedCodeBlock } from "@/components/AnimatedCodeBlock";

export default function HomePage() {
  const repoUrl = process.env.NEXT_PUBLIC_REPO_URL || "https://github.com/Hardonian/Settler";

  const devWorkflowSteps = [
    {
      number: 1,
      title: "Install SDK",
      description: "One command. No complex setup, no vendor lock-in.",
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
      title: "Inspect Proof + Replay",
      description:
        "Review proof artifacts, replay outcomes, and divergence signals with full trace context.",
      icon: GitBranch,
      code: "Evidence: SHA256 hash chain",
      illustration: "/illustrations/feature-human.svg",
    },
  ];

  const coreCapabilities = [
    {
      icon: Code2,
      title: "Deterministic Execution Ledger",
      description:
        "Same data and same rules produce identical results. Every time. No hidden logic, no unpredictable changes between runs.",
    },
    {
      icon: Shield,
      title: "Access Controls and Audit Trails",
      description:
        "Tenant isolation, role-based access, and audit-ready evidence trails are built in from the start.",
    },
    {
      icon: Terminal,
      title: "API and CLI First",
      description:
        "Programmatic reconciliation that integrates with your CI/CD pipeline. Reconciliation logic as code.",
    },
    {
      icon: Database,
      title: "Data Sovereignty",
      description:
        "Self-host in your infrastructure. Your data never leaves your governance perimeter unless you choose otherwise.",
    },
    {
      icon: Cpu,
      title: "Replayable Runs",
      description:
        "Re-run any reconciliation and get identical results. Debug mismatches, verify past runs, or prepare for audit in minutes.",
    },
    {
      icon: Eye,
      title: "Failure Intelligence + Remediation Guardrails",
      description:
        "Structured failure classes and operator guidance help teams remediate safely without masking root cause.",
    },
  ];

  const codeExample = `import { SettlerClient } from "@settler/sdk";

const client = new SettlerClient({
  apiKey: process.env.SETTLER_API_KEY
});

// Deterministic reconciliation with inspectable rules
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

// Get mismatches with full audit trail
const mismatches = await client.reconciliations.getMismatches(reconciliation.id);`;

  return (
    <ErrorBoundary context="Home Page">
      <main
        id="main-content"
        className="min-h-screen bg-slate-50 pb-[env(safe-area-inset-bottom)] dark:bg-slate-950 antialiased"
        aria-label="Settler homepage"
      >
        <Navigation />

        {/* Hero Section */}
        <section
          className="relative pt-16 sm:pt-20 lg:pt-28 pb-16 sm:pb-20 lg:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden"
          aria-labelledby="hero-heading"
        >
          <ParallaxBackground>
            <ParallaxBlobs count={3} />
          </ParallaxBackground>

          <div
            className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-10"
            aria-hidden="true"
          />

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <HeroAnimationWrapper>
                <div className="text-left max-w-2xl">
                  <div className="mb-5 flex justify-start">
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm">
                      <Github className="w-3.5 h-3.5" aria-hidden="true" />
                      Open-source · Apache 2.0
                    </span>
                  </div>

                  <div className="mb-6 sm:mb-8 text-left">
                    <TextRevealHeading
                      as="h1"
                      id="hero-heading"
                      text="Reconcile Financial Data. Find Every Mismatch. Prove the Results."
                      className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-bold mb-4 sm:mb-6 text-slate-900 dark:text-white tracking-tight leading-[1.1]"
                      delay={0}
                      staggerDelay={0.02}
                      splitBy="words"
                    />
                  </div>

                  <div className="mb-10 sm:mb-12">
                    <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
                      Settler matches records across Stripe, banks, ERPs, and ledgers — then
                      surfaces every mismatch with full context. Every run produces verifiable
                      evidence. Every run can be replayed.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-start items-center mb-6 sm:mb-8">
                    <Button
                      size="lg"
                      asChild
                      className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 px-8 py-6 text-lg font-semibold shadow-xl transition-all duration-200"
                    >
                      <Link
                        href="/docs/quickstart"
                        className="flex items-center justify-center gap-3"
                      >
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
                      <Link href={repoUrl} className="flex items-center justify-center gap-3">
                        <span>View on GitHub</span>
                      </Link>
                    </Button>
                  </div>

                  {/* Trust signals */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-12 sm:mb-16">
                    <span className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-500">
                      <CheckCircle2
                        className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600"
                        aria-hidden="true"
                      />
                      Apache 2.0
                    </span>
                    <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
                      ·
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-500">
                      <CheckCircle2
                        className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600"
                        aria-hidden="true"
                      />
                      Self-hostable
                    </span>
                    <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
                      ·
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-500">
                      <CheckCircle2
                        className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600"
                        aria-hidden="true"
                      />
                      TypeScript &amp; Python SDKs
                    </span>
                    <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
                      ·
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-500">
                      <CheckCircle2
                        className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600"
                        aria-hidden="true"
                      />
                      SHA-256 audit trail
                    </span>
                  </div>
                </div>
              </HeroAnimationWrapper>

              <div className="hidden lg:block relative">
                <div
                  className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full -z-10"
                  aria-hidden="true"
                />
                <Image
                  src="/illustrations/hero-visual.svg"
                  alt="Settler deterministic reconciliation engine visualization showing data flow through rules-based matching pipeline"
                  width={600}
                  height={500}
                  priority
                  className="w-full h-auto drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Core Capabilities */}
        <section
          className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900"
          aria-label="Core capabilities"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500 mb-3">
                Core Capabilities
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 text-slate-900 dark:text-white tracking-tight">
                Verifiable Execution for Operational Systems
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
                No black boxes. Deterministic runs, replay verification, and traceable
                policy-governed execution at every step.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {coreCapabilities.map((capability, index) => {
                const Icon = capability.icon;
                return (
                  <SpotlightCard
                    key={index}
                    className="p-6 sm:p-8 h-full transition-all duration-300 hover:shadow-xl"
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                      <Icon
                        className="w-6 h-6 text-slate-700 dark:text-slate-300"
                        aria-hidden="true"
                      />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-2 text-slate-900 dark:text-white">
                      {capability.title}
                    </h3>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                      {capability.description}
                    </p>
                  </SpotlightCard>
                );
              })}
            </div>
          </div>
        </section>

        {/* Developer Workflow */}
        <section
          className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950"
          aria-label="Developer workflow"
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500 mb-3">
                Developer Experience
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 text-slate-900 dark:text-white tracking-tight">
                Four Steps to Audit-Ready Reconciliation
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
                Install the SDK, define your rules, run reconciliation, review evidence. No complex
                setup required.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {devWorkflowSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div
                    key={index}
                    className="relative p-6 pt-10 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center overflow-visible"
                  >
                    <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-sm font-bold shadow-sm ring-2 ring-white dark:ring-slate-900">
                      {step.number}
                    </div>

                    <div className="w-full aspect-square relative mb-6 p-4 overflow-visible">
                      <Image
                        src={step.illustration}
                        alt={step.title}
                        fill
                        className="object-contain"
                      />
                    </div>

                    <div className="pt-2 w-full min-w-0">
                      <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white flex items-center justify-center gap-2">
                        <Icon
                          className="w-5 h-5 text-slate-700 dark:text-slate-300"
                          aria-hidden="true"
                        />
                        {step.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                        {step.description}
                      </p>
                      <code
                        className="block text-xs bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded text-slate-700 dark:text-slate-300 font-mono overflow-hidden text-ellipsis whitespace-nowrap max-w-full"
                        title={step.code}
                      >
                        {step.code}
                      </code>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Code Example */}
        <section
          className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white"
          aria-label="Code example"
        >
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10 sm:mb-12">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
                TypeScript SDK
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 tracking-tight">
                Inspectable, Testable, Version Controlled
              </h2>
              <p className="text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
                Your reconciliation rules are code. Review them in PRs, test them in CI, deploy them
                with confidence.
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
              {[
                {
                  icon: CheckCircle2,
                  title: "Type Safe",
                  desc: "Full TypeScript support with IntelliSense",
                },
                {
                  icon: RefreshCw,
                  title: "Deterministic",
                  desc: "Same inputs always produce same outputs",
                },
                {
                  icon: Shield,
                  title: "Auditable",
                  desc: "Complete evidence chain with SHA256 hashes",
                },
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

        {/* Enterprise Inevitability Narrative */}
        <section
          className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900"
          aria-label="Why this matters"
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500 mb-3">
                Why Settler
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 text-slate-900 dark:text-white tracking-tight">
                Why Teams Move Beyond Spreadsheets
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
                Manual reconciliation breaks at scale. Repeatable, API-driven reconciliation is what
                teams build toward.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {[
                {
                  icon: Target,
                  title: "Fewer Reconciliation Errors",
                  description:
                    "Reconciliation errors compound when processes are manual and results are unrepeatable. Settler eliminates drift by making every run deterministic and traceable.",
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
                    "From manual exports to version-controlled rules. From fragile scripts to replayable workflows. From hope to operational confidence.",
                },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-6 md:p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all duration-200"
                  >
                    <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-5 shadow-sm">
                      <Icon
                        className="w-5 h-5 text-slate-700 dark:text-slate-300"
                        aria-hidden="true"
                      />
                    </div>
                    <h3 className="text-lg font-semibold mb-2.5 text-slate-900 dark:text-white tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Feature Pages */}
        <section
          className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950"
          aria-label="Key features"
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500 mb-3">
                Explore
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 text-slate-900 dark:text-white tracking-tight">
                Go Deeper on Each Capability
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Each feature has its own dedicated page with detailed mechanics, interactive demos,
                and documentation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  href: "/how-it-works",
                  icon: Network,
                  label: "How It Works",
                  description:
                    "Step-by-step walkthrough of Settler's reconciliation architecture — from data ingestion through rule evaluation to evidence generation.",
                  cta: "See the architecture",
                },
                {
                  href: "/replay-lab",
                  icon: Hash,
                  label: "Replay Lab",
                  description:
                    "Replay any past reconciliation run, verify determinism via hash-diff inspection, and export signed evidence bundles for audit packages.",
                  cta: "Explore Replay Lab",
                },
                {
                  href: "/proof-explorer",
                  icon: Eye,
                  label: "Proof Explorer",
                  description:
                    "Navigate trust graphs and artifact lineage. Inspect SHA-256 hash chains and verify reconciliation runs against their original evidence DAG.",
                  cta: "View Proof Explorer",
                },
              ].map((feature) => {
                const Icon = feature.icon;
                return (
                  <Link
                    key={feature.href}
                    href={feature.href}
                    className="group p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg transition-all duration-200 flex flex-col"
                  >
                    <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 flex-shrink-0">
                      <Icon
                        className="w-5 h-5 text-slate-700 dark:text-slate-300"
                        aria-hidden="true"
                      />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2 tracking-tight">
                      {feature.label}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed flex-1 mb-4">
                      {feature.description}
                    </p>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                      {feature.cta}
                      <ArrowRight
                        className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* GitHub / Quickstart CTA */}
        <section
          className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-slate-900 dark:bg-slate-950"
          aria-label="Get started"
        >
          <div className="max-w-3xl mx-auto text-center">
            <div className="mb-5 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-300">
                <Github className="w-3.5 h-3.5" aria-hidden="true" />
                Apache 2.0 · Open Source
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight mb-4">
              Start in Minutes
            </h2>
            <p className="text-lg text-slate-400 max-w-xl mx-auto leading-relaxed mb-10">
              One SDK install. Define your rules. Run reconciliation. Review the evidence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/docs/quickstart"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-slate-900 hover:bg-slate-100 px-8 py-3.5 text-base font-semibold shadow-lg transition-all duration-200"
              >
                <BookOpen className="w-4 h-4" aria-hidden="true" />
                Read the Quickstart
              </Link>
              <Link
                href={repoUrl}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:border-slate-600 px-8 py-3.5 text-base font-medium transition-all duration-200"
              >
                <Github className="w-4 h-4" aria-hidden="true" />
                View on GitHub
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section
          className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950"
          aria-label="Common questions"
        >
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10 sm:mb-12">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500 mb-3">
                FAQ
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-slate-900 dark:text-white tracking-tight">
                Common Questions
              </h2>
            </div>
            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem
                value="what-is"
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-6"
              >
                <AccordionTrigger className="text-base sm:text-lg font-semibold py-4 hover:no-underline">
                  What is Settler?
                </AccordionTrigger>
                <AccordionContent className="text-sm sm:text-base text-slate-700 dark:text-slate-300 pb-4 leading-relaxed">
                  Settler is an open-source reconciliation engine that matches financial records
                  across Stripe, banks, ERPs, and ledgers. It surfaces every mismatch with full
                  context, generates verifiable evidence for each run, and lets you replay any run
                  to verify the results.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="deterministic"
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-6"
              >
                <AccordionTrigger className="text-base sm:text-lg font-semibold py-4 hover:no-underline">
                  What does deterministic mean?
                </AccordionTrigger>
                <AccordionContent className="text-sm sm:text-base text-slate-700 dark:text-slate-300 pb-4 leading-relaxed">
                  Deterministic means the same inputs always produce the same outputs. Given
                  identical data sources and matching rules, Settler will always identify the same
                  variances. This makes debugging, testing, and auditing tractable.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="self-host"
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-6"
              >
                <AccordionTrigger className="text-base sm:text-lg font-semibold py-4 hover:no-underline">
                  Can I self-host Settler?
                </AccordionTrigger>
                <AccordionContent className="text-sm sm:text-base text-slate-700 dark:text-slate-300 pb-4 leading-relaxed">
                  Yes. Self-hosting is a first-class deployment model. Settler is open source under
                  Apache 2.0. Your data stays in your infrastructure unless you choose to use the
                  managed cloud service.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="not"
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-6"
              >
                <AccordionTrigger className="text-base sm:text-lg font-semibold py-4 hover:no-underline">
                  What is Settler NOT?
                </AccordionTrigger>
                <AccordionContent className="text-sm sm:text-base text-slate-700 dark:text-slate-300 pb-4 leading-relaxed">
                  Settler is not accounting software, an audit tool, or compliance certification. It
                  does not make decisions or automate judgment. It surfaces mismatches and evidence
                  for human review. You decide how to act on the results.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        <Footer />
      </main>
    </ErrorBoundary>
  );
}
