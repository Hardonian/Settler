import { Metadata } from "next";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Github,
  Code2,
  Shield,
  Database,
  GitBranch,
  Package,
  ArrowRight,
  CheckCircle2,
  FileCode,
  Terminal,
  Eye,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Open Source - Settler",
  description:
    "Settler is Apache 2.0 licensed. The reconciliation engine, SDK, CLI, and evidence model are fully open source. Self-host in your infrastructure, inspect the source, contribute back.",
};

const ossComponents = [
  {
    icon: Code2,
    title: "Reconciliation Engine",
    description:
      "The deterministic matching core. Configurable rules, field-level tolerance, multi-source joins. Inspect every line of matching logic.",
    link: "https://github.com/Hardonian/Settler",
    badge: "Core",
  },
  {
    icon: Terminal,
    title: "CLI",
    description:
      "Run reconciliation jobs from the command line or CI. Pack inputs, execute runs, inspect output, verify evidence hashes.",
    link: "/docs/cli",
    badge: "Tooling",
  },
  {
    icon: Package,
    title: "TypeScript SDK",
    description:
      "Typed client for creating jobs, polling runs, fetching mismatches, and exporting evidence. Integrates with any Node.js or Deno runtime.",
    link: "/docs/sdk/nodejs",
    badge: "SDK",
  },
  {
    icon: FileCode,
    title: "Evidence Model",
    description:
      "The hash-chain evidence schema is open and documented. Any system can verify Settler's output without running Settler itself.",
    link: "/proof-explorer",
    badge: "Protocol",
  },
  {
    icon: Database,
    title: "Self-Host Stack",
    description:
      "Docker Compose and Kubernetes targets ship with the repo. Self-host the full platform inside your own infrastructure.",
    link: "/docs/getting-started",
    badge: "Infrastructure",
  },
  {
    icon: Shield,
    title: "Security Model",
    description:
      "Tenant isolation, row-level security, and audit trail implementation are open for review. No security through obscurity.",
    link: "/security-and-audit",
    badge: "Security",
  },
];

const selfHostBenefits = [
  "Your financial data never leaves your network",
  "Deploy on your own cloud or on-premise infrastructure",
  "No per-seat pricing — scale without permission",
  "Audit the source code before trusting it with production data",
  "Customize matching rules and adapters for your specific data model",
  "No telemetry in self-hosted mode by default",
];

const quickStartSteps = [
  {
    step: "1",
    title: "Clone the repo",
    code: "git clone https://github.com/Hardonian/Settler.git && cd Settler",
  },
  {
    step: "2",
    title: "Install dependencies",
    code: "pnpm install",
  },
  {
    step: "3",
    title: "Run the demo",
    code: "pnpm demo",
  },
  {
    step: "4",
    title: "Inspect evidence output",
    code: "cat examples/demo-output/evidence.json",
  },
];

export default function OpenSourcePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navigation />
      <main id="main-content">
        {/* Hero */}
        <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-5">
              <Badge variant="outline">Apache 2.0</Badge>
              <Badge variant="outline">Open Source</Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-6 max-w-3xl">
              Reconciliation Infrastructure You Can Actually Inspect
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mb-8 leading-relaxed">
              Settler is fully open source. The matching engine, evidence model, CLI, SDK, and
              self-host stack are all Apache 2.0. No gated core, no hidden runtime logic.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild>
                <Link
                  href="https://github.com/Hardonian/Settler"
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-2"
                >
                  <Github className="w-4 h-4" />
                  View on GitHub
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/docs/quickstart">
                  Quickstart Guide <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* OSS Components */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              What&apos;s Open Source
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-10">
              Every component that processes, hashes, or moves your data is open source and
              auditable.
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {ossComponents.map((component) => {
                const Icon = component.icon;
                return (
                  <Link
                    key={component.title}
                    href={component.link}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 hover:border-blue-400 dark:hover:border-blue-600 transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-full px-2.5 py-0.5">
                        {component.badge}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {component.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {component.description}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Quickstart */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900 border-t border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                  Run it in 3 Minutes
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Clone, install, and run the demo path to see deterministic reconciliation
                  end-to-end. No database or API keys needed.
                </p>
                <div className="space-y-3">
                  {quickStartSteps.map((step) => (
                    <div key={step.step} className="flex gap-3 items-start">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {step.step}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                          {step.title}
                        </p>
                        <code className="block text-xs bg-slate-900 dark:bg-slate-950 text-green-400 rounded-lg p-2 font-mono">
                          {step.code}
                        </code>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <Link
                    href="/docs/quickstart"
                    className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Full quickstart guide <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Self-host benefits */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  <h3 className="font-bold text-slate-900 dark:text-white">Why Self-Host?</h3>
                </div>
                <ul className="space-y-3">
                  {selfHostBenefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Architecture */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Architecture
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  The OSS build exposes the full system architecture.
                </p>
              </div>
              <Button variant="outline" asChild size="sm">
                <Link href="/architecture">
                  <GitBranch className="w-4 h-4 mr-1.5" />
                  View Architecture
                </Link>
              </Button>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                {
                  title: "Data In",
                  description:
                    "CSV, JSON, Parquet, webhook events, or any adapter-supported source. Inputs are deterministic and version-pinned.",
                },
                {
                  title: "Engine Core",
                  description:
                    "Rules-based matching with configurable field tolerance, multi-source joins, and exception classification.",
                },
                {
                  title: "Evidence Out",
                  description:
                    "SHA-256 hash chain over the full evidence payload. Mismatch report, variance log, and replay bundle.",
                },
              ].map((block) => (
                <div
                  key={block.title}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"
                >
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-sm">
                    {block.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {block.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="rounded-2xl bg-slate-900 dark:bg-slate-800 p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-3">
                Inspect the Source Before You Trust It
              </h2>
              <p className="text-slate-400 mb-6 max-w-xl mx-auto">
                Financial infrastructure should be auditable. Read the code, run the tests, verify
                the evidence model.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button asChild>
                  <Link
                    href="https://github.com/Hardonian/Settler"
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-2"
                  >
                    <Github className="w-4 h-4" />
                    Star on GitHub
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="border-slate-600 text-white hover:bg-slate-700"
                >
                  <Link href="/security-and-audit">Security Model</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
