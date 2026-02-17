import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Shield, Eye, GitBranch, Target, CheckCircle } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About - Settler",
  description:
    "Settler builds reconciliation infrastructure for modern finance operations. Deterministic, inspectable, and designed for human-in-the-loop workflows.",
};

const principles = [
  {
    icon: Eye,
    title: "Determinism Over Heuristics",
    description:
      "Every reconciliation produces identical results given identical inputs. No hidden logic. No probabilistic drift. Decisions are reproducible and auditable.",
  },
  {
    icon: Shield,
    title: "Governance by Default",
    description:
      "Tenant isolation, audit trails, and policy-based access controls are structural properties of the platform, not optional features layered on afterward.",
  },
  {
    icon: GitBranch,
    title: "Rules as Code",
    description:
      "Matching rules are version-controlled, testable, and deployable through standard CI/CD pipelines. Reconciliation logic receives the same rigor as application code.",
  },
  {
    icon: Target,
    title: "Human-in-the-Loop",
    description:
      "Settler surfaces variances and evidence for human review. It compresses uncertainty without replacing judgment. Final authority remains with operators.",
  },
];

const milestones = [
  {
    label: "Foundation",
    description: "Deterministic reconciliation engine and canonical data model established.",
  },
  {
    label: "Adapter Ecosystem",
    description: "Native adapters for Stripe, Shopify, PayPal, and extensible integration framework deployed.",
  },
  {
    label: "Enterprise Readiness",
    description: "Tenant isolation, RBAC, SOC 2 readiness, and governance boundary controls completed.",
  },
  {
    label: "Open Source",
    description: "Core engine, SDK, and all adapters released under Apache 2.0 license.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navigation />

      {/* Hero */}
      <section
        className="px-4 sm:px-6 lg:px-8 pt-12 pb-16 md:pt-16 md:pb-24"
        aria-labelledby="about-heading"
      >
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-6 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-2 text-sm font-medium">
                About Settler
              </Badge>
              <h1
                id="about-heading"
                className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-slate-900 dark:text-white leading-tight tracking-tight"
              >
                Reconciliation Infrastructure for Modern Finance Operations
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                Settler builds the deterministic reconciliation layer that serious financial
                infrastructure demands. API-first, inspectable at every step, and designed
                for teams that require operational confidence over automated guesswork.
              </p>
              <p className="text-base text-slate-500 dark:text-slate-500 leading-relaxed">
                Manual reconciliation is a phase. Deterministic, API-based reconciliation
                is the stable end-state that mature financial operations evolve toward.
                Settler accelerates that transition.
              </p>
            </div>
            <div className="relative rounded-2xl overflow-hidden">
              <Image
                src="https://images.pexels.com/photos/4342124/pexels-photo-4342124.jpeg"
                alt="Professional team collaborating on financial infrastructure strategy"
                width={600}
                height={400}
                className="w-full h-auto rounded-2xl object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent rounded-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Operating Principles */}
      <section
        className="px-4 sm:px-6 lg:px-8 py-16 md:py-24 bg-white dark:bg-slate-900"
        aria-label="Operating principles"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-slate-900 dark:text-white tracking-tight">
              Operating Principles
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              These are not aspirational values. They are structural properties of how Settler operates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {principles.map((principle, index) => {
              const Icon = principle.icon;
              return (
                <div
                  key={index}
                  className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center mb-5">
                    <Icon className="w-6 h-6 text-slate-700 dark:text-slate-300" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">
                    {principle.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {principle.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* The Operational Maturity Narrative */}
      <section
        className="px-4 sm:px-6 lg:px-8 py-16 md:py-24 bg-slate-50 dark:bg-slate-950"
        aria-label="Operational maturity"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-slate-900 dark:text-white tracking-tight">
              The Evolution of Financial Infrastructure
            </h2>
          </div>

          <div className="space-y-6">
            {milestones.map((milestone, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800"
              >
                <div className="w-10 h-10 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1 text-slate-900 dark:text-white">
                    {milestone.label}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {milestone.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Audit Narrative */}
      <section
        className="px-4 sm:px-6 lg:px-8 py-16 md:py-24 bg-white dark:bg-slate-900"
        aria-label="Audit commitment"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 text-slate-900 dark:text-white tracking-tight">
            Audit-Ready by Design
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Every decision traceable. Every workflow reproducible. Every adjustment reviewable.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { text: "Every reconciliation run produces deterministic, hashable evidence" },
              { text: "Complete audit trails with traceable rule paths and variance sets" },
              { text: "Reviewable decisions with human-in-the-loop approval workflows" },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800"
              >
                <CheckCircle className="w-8 h-8 text-slate-700 dark:text-slate-300 mx-auto mb-4" aria-hidden="true" />
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-20 bg-slate-900 text-white" aria-label="Get started">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 tracking-tight">
            Explore the Platform
          </h2>
          <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            Review the documentation, explore the API, or discuss your reconciliation architecture
            with our team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              asChild
              className="w-full sm:w-auto bg-white text-slate-900 hover:bg-slate-100 px-8 py-6 text-lg font-semibold"
            >
              <Link href="/docs/quickstart" className="flex items-center justify-center gap-2">
                Read Quickstart <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="w-full sm:w-auto px-8 py-6 text-lg border-2 border-slate-600 bg-transparent text-white hover:bg-slate-800"
            >
              <Link href="/contact">Discuss Your Architecture</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
