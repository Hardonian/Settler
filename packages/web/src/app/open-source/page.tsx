import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GitBranch,
  Code2,
  Shield,
  Database,
  Package,
  ArrowRight,
  CheckCircle2,
  FileCode,
  Terminal,
  Eye,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Open Core - Settler",
  description:
    "Settler publishes MIT-licensed SDK, protocol, CLI, and React packages plus Apache-2.0 Rust verification crates. The hosted platform remains proprietary.",
};

const ossComponents = [
  {
    icon: Code2,
    title: "Rust Verification Kernel",
    description:
      "Apache-2.0 crates for deterministic primitives, hashing, content-addressed artifacts, and proof verification.",
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
      "Public protocol types and verification tools support independent checks of compatible evidence artifacts.",
    link: "/proof-explorer",
    badge: "Protocol",
  },
  {
    icon: Database,
    title: "Examples and Local Tooling",
    description:
      "Public examples and CLI workflows demonstrate local reconciliation and evidence verification without exposing the hosted control plane.",
    link: "/docs/getting-started",
    badge: "Infrastructure",
  },
  {
    icon: Shield,
    title: "Verification Tools",
    description:
      "WASM and CLI verification surfaces let reviewers inspect artifact integrity outside the hosted application.",
    link: "/security-and-audit",
    badge: "Security",
  },
];

const selfHostBenefits = [
  "Keep local workflows inside your chosen environment when configured that way",
  "Evaluate public packages without adopting the hosted platform",
  "Inspect the published package source and license terms",
  "Customize matching rules and adapters for your specific data model",
  "Verify compatible evidence artifacts with the public CLI or WASM tooling",
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
    <div className="min-h-screen bg-muted/20 bg-muted">
      <Navigation />
      <main id="main-content">
        {/* Hero */}
        <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-card dark:bg-background border-b border-border dark:border-border">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="border-primary/40 text-primary">
                    Open core
                  </Badge>
                  <Badge variant="outline">Explicit package boundaries</Badge>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground dark:text-white leading-tight">
                  Reconciliation Infrastructure You Can Actually Inspect
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground dark:text-muted-foreground leading-relaxed">
                  Settler publishes MIT-licensed SDK, protocol, CLI, and React packages plus
                  Apache-2.0 Rust crates. The hosted web console, control-plane API, adapters, and
                  data schema remain proprietary platform code.
                </p>
                <div className="pt-2 flex flex-wrap gap-4">
                  <Button asChild size="lg" className="font-semibold">
                    <Link
                      href="https://github.com/Hardonian/Settler"
                      target="_blank"
                      rel="noopener"
                      className="inline-flex items-center gap-2"
                    >
                      <GitBranch className="w-4 h-4" />
                      View on GitHub
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href="/docs/quickstart">
                      Quickstart Guide <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="group relative aspect-square w-full max-w-[480px] mx-auto overflow-hidden rounded-3xl border border-primary/25 bg-card/70 shadow-2xl transition-all duration-500 hover:border-primary/45 hover:shadow-primary/15">
                  <Image
                    src="/open_source_stack_3d.png"
                    alt="Settler Open-Core Sovereign Technology Stack Architecture"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/15 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/10 bg-black/60 backdrop-blur-md p-3 text-xs text-white/90 flex items-center justify-between">
                    <span className="font-mono text-[11px] text-cyan-300 font-semibold">
                      STACK: RUST + CAS + WASM
                    </span>
                    <span className="font-mono text-[11px] text-emerald-400 font-bold">
                      MIT + APACHE-2.0
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* OSS Components */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground dark:text-white mb-3">
              What&apos;s public
            </h2>
            <p className="text-muted-foreground dark:text-muted-foreground mb-10">
              Package-level licensing and repository classification define the public boundary.
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {ossComponents.map((component) => {
                const Icon = component.icon;
                return (
                  <Link
                    key={component.title}
                    href={component.link}
                    className="rounded-2xl border border-border dark:border-border bg-card dark:bg-background p-6 hover:border-blue-400 dark:hover:border-blue-600 transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground dark:text-muted-foreground bg-muted/40 dark:bg-card rounded-full px-2.5 py-0.5">
                        {component.badge}
                      </span>
                    </div>
                    <h3 className="font-bold text-foreground dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {component.title}
                    </h3>
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground leading-relaxed">
                      {component.description}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Quickstart */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-card dark:bg-background border-t border-b border-border dark:border-border">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div>
                <h2 className="text-2xl font-bold text-foreground dark:text-white mb-3">
                  Run the local demo
                </h2>
                <p className="text-muted-foreground dark:text-muted-foreground mb-6">
                  Clone, install, and run the demo path to inspect a local reconciliation and its
                  evidence output. Setup time depends on the local toolchain.
                </p>
                <div className="space-y-3">
                  {quickStartSteps.map((step) => (
                    <div key={step.step} className="flex gap-3 items-start">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {step.step}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-foreground dark:text-white mb-1">
                          {step.title}
                        </p>
                        <code className="block text-xs bg-background bg-muted text-green-400 rounded-lg p-2 font-mono">
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
              <div className="rounded-2xl border border-border dark:border-border bg-muted/20 dark:bg-card/50 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="w-5 h-5 text-muted-foreground dark:text-muted-foreground" />
                  <h3 className="font-bold text-foreground dark:text-white">
                    Why use the public packages?
                  </h3>
                </div>
                <ul className="space-y-3">
                  {selfHostBenefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground dark:text-muted-foreground">
                        {benefit}
                      </span>
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
                <h2 className="text-2xl font-bold text-foreground dark:text-white mb-2">
                  Architecture
                </h2>
                <p className="text-muted-foreground dark:text-muted-foreground">
                  Public packages expose the verification and client-side portion of the system.
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
                  className="rounded-xl border border-border dark:border-border bg-card dark:bg-background p-5"
                >
                  <h3 className="font-bold text-foreground dark:text-white mb-2 text-sm">
                    {block.title}
                  </h3>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground leading-relaxed">
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
            <div className="rounded-2xl bg-background dark:bg-card p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-3">
                Inspect the Source Before You Trust It
              </h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
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
                    <GitBranch className="w-4 h-4" />
                    Star on GitHub
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="border-border text-white hover:bg-muted"
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
