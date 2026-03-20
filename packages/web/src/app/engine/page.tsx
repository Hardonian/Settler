import { Metadata } from "next";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package,
  Upload,
  Search,
  Terminal,
  GitBranch,
  Shield,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Engine - Settler",
  description:
    "Settler Engine: run deterministic reconciliation locally or in CI, inspect discrepancies, and export tamper-evident audit bundles. No server required.",
};

const engineSteps = [
  {
    step: "01",
    icon: Terminal,
    title: "Install the CLI",
    description: "One command. Runs anywhere Node.js runs—local machine, Docker, or CI.",
    code: "npm install -g @settler/cli",
  },
  {
    step: "02",
    icon: Package,
    title: "Create a Run Pack",
    description:
      "Bundle your input data and ruleset into a portable zip. Commit it to version control or pass it to CI.",
    code: "settler pack --inputs ./data --rules ./rules.yaml --out run.zip",
  },
  {
    step: "03",
    icon: GitBranch,
    title: "Execute the Run",
    description:
      "Deterministic matching. Same inputs and same rules always produce identical output and identical evidence hash.",
    code: "settler run run.zip --output ./results",
  },
  {
    step: "04",
    icon: Search,
    title: "Inspect Variances",
    description: "Review discrepancies with full field-level diff and variance context.",
    code: "settler inspect ./results/engine_output.json",
  },
];

const capabilities = [
  "Deterministic matching engine — same inputs always produce identical output",
  "SHA-256 hash chain over every evidence bundle",
  "Field-level variance reporting with tolerance configuration",
  "CSV, JSON, and Parquet input support",
  "No network access required — runs fully offline",
  "Compatible with any CI/CD system (GitHub Actions, GitLab, Jenkins)",
  "Import results into the Settler UI for visual review",
  "Apache 2.0 licensed — inspect, fork, audit the source",
];

export default function EngineLandingPage() {
  return (
    <div className="min-h-screen bg-muted/10 dark:bg-card">
      <Navigation />
      <main id="main-content">
        {/* Hero */}
        <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-card border-b border-border/40 dark:border-border">
          <div className="max-w-5xl mx-auto">
            <Badge variant="outline" className="mb-4">
              Open Source
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 max-w-3xl">
              Settler Engine
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mb-8 leading-relaxed">
              Run deterministic reconciliation locally or in CI. Inspect discrepancies. Export
              tamper-evident audit bundles. No server required.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild>
                <Link href="/docs/quickstart">
                  Get Started <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="https://github.com/Hardonian/Settler" target="_blank" rel="noopener">
                  View on GitHub
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-10">
              How the Engine Works
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {engineSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.step}
                    className="rounded-2xl border border-border/40 dark:border-border bg-white dark:bg-card p-6"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-muted-foreground/60 dark:text-muted-foreground uppercase tracking-widest mb-0.5">
                          Step {step.step}
                        </p>
                        <h3 className="text-base font-bold text-foreground">
                          {step.title}
                        </h3>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {step.description}
                    </p>
                    <div className="rounded-lg bg-card dark:bg-card p-3 font-mono text-xs text-green-400 overflow-x-auto">
                      {step.code}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Quick access cards */}
        <section className="py-10 px-4 sm:px-6 lg:px-8 bg-white dark:bg-card border-t border-border/40 dark:border-border">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-bold text-foreground mb-6">
              Engine Workflows
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Link
                href="/engine/create-run-pack"
                className="rounded-xl border border-border/40 dark:border-border bg-muted/20 p-5 hover:border-blue-400 dark:hover:border-blue-600 transition-colors group"
              >
                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-3" />
                <h3 className="font-semibold text-foreground mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Create Run Pack
                </h3>
                <p className="text-sm text-muted-foreground">
                  Bundle inputs and ruleset into a portable zip for local or CI runs.
                </p>
              </Link>
              <Link
                href="/engine/import-results"
                className="rounded-xl border border-border/40 dark:border-border bg-muted/20 p-5 hover:border-blue-400 dark:hover:border-blue-600 transition-colors group"
              >
                <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-3" />
                <h3 className="font-semibold text-foreground mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Import Results
                </h3>
                <p className="text-sm text-muted-foreground">
                  Upload engine output and evidence bundles to review summaries visually.
                </p>
              </Link>
              <Link
                href="/engine/view-variances"
                className="rounded-xl border border-border/40 dark:border-border bg-muted/20 p-5 hover:border-blue-400 dark:hover:border-blue-600 transition-colors group"
              >
                <Search className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-3" />
                <h3 className="font-semibold text-foreground mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  View Variances
                </h3>
                <p className="text-sm text-muted-foreground">
                  Drill into field-level discrepancies from your last engine run.
                </p>
              </Link>
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  Engine Capabilities
                </h2>
                <ul className="space-y-3">
                  {capabilities.map((cap) => (
                    <li key={cap} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{cap}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-border/40 dark:border-border bg-white dark:bg-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-amber-500" />
                  <h3 className="font-semibold text-foreground">Important Note</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Settler Engine surfaces discrepancies and produces audit-safe evidence bundles. It
                  does not guarantee compliance or correctness. Evidence outputs are tools for human
                  review, not autonomous decisions.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  For full governance workflows, human-in-the-loop review, and enterprise controls,
                  see the managed deployment options.
                </p>
                <div className="mt-4 pt-4 border-t border-border/40 dark:border-border">
                  <Link
                    href="/security-and-audit"
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    Security &amp; Audit Model <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
