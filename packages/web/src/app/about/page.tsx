import { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, Shield, Eye, GitBranch, Target, CheckCircle } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Section } from "@/components/marketing/Section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UiLink } from "@/components/ui/link";

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
    description:
      "Native adapters for Stripe, Shopify, PayPal, and extensible integration framework deployed.",
  },
  {
    label: "Enterprise Readiness",
    description:
      "Tenant isolation, RBAC, SOC 2 readiness, and governance boundary controls completed.",
  },
  {
    label: "Open Source",
    description: "Core engine, SDK, and all adapters released under Apache 2.0 license.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <Section className="pt-20" containerClassName="max-w-5xl" aria-labelledby="about-heading">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <Badge className="mb-6 px-4 py-2 text-sm font-medium">About Settler</Badge>
            <h1
              id="about-heading"
              className="mb-6 text-fluid-4xl font-bold leading-tight tracking-tight text-foreground"
            >
              Reconciliation Infrastructure for Modern Finance Operations
            </h1>
            <p className="mb-6 text-lg leading-relaxed text-muted-foreground">
              Settler builds the deterministic reconciliation layer that serious financial
              infrastructure demands. API-first, inspectable at every step, and designed for teams
              that require operational confidence over automated guesswork.
            </p>
            <p className="text-base leading-relaxed text-muted-foreground">
              Manual reconciliation is a phase. Deterministic, API-based reconciliation is the
              stable end-state that mature financial operations evolve toward. Settler accelerates
              that transition.
            </p>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-border">
            <Image
              src="https://images.pexels.com/photos/4342124/pexels-photo-4342124.jpeg"
              alt="Professional team collaborating on financial infrastructure strategy"
              width={600}
              height={400}
              className="h-auto w-full rounded-2xl object-cover"
              priority
              unoptimized
            />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-slate-900/30 to-transparent" />
          </div>
        </div>
      </Section>

      <Section className="bg-muted/20" aria-label="Operating principles">
        <div className="mb-12 text-center md:mb-16">
          <h2 className="mb-4 text-fluid-3xl font-bold tracking-tight text-foreground">Operating Principles</h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
            These are not aspirational values. They are structural properties of how Settler
            operates.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {principles.map((principle) => {
            const Icon = principle.icon;
            return (
              <div key={principle.title} className="rounded-2xl border border-border bg-card p-8">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                  <Icon className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-foreground">{principle.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{principle.description}</p>
              </div>
            );
          })}
        </div>
      </Section>

      <Section aria-label="Operational maturity" containerClassName="max-w-4xl">
        <div className="mb-12 text-center md:mb-16">
          <h2 className="mb-4 text-fluid-3xl font-bold tracking-tight text-foreground">
            The Evolution of Financial Infrastructure
          </h2>
        </div>

        <div className="space-y-6">
          {milestones.map((milestone, index) => (
            <div key={milestone.label} className="flex items-start gap-4 rounded-xl border border-border bg-card p-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">
                {index + 1}
              </div>
              <div>
                <h3 className="mb-1 text-lg font-semibold text-foreground">{milestone.label}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{milestone.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section className="bg-muted/20" aria-label="Audit commitment" containerClassName="max-w-4xl text-center">
        <h2 className="mb-6 text-fluid-3xl font-bold tracking-tight text-foreground">Audit-Ready by Design</h2>
        <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Every decision traceable. Every workflow reproducible. Every adjustment reviewable.
        </p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            { text: "Every reconciliation run produces deterministic, hashable evidence" },
            { text: "Complete audit trails with traceable rule paths and variance sets" },
            { text: "Reviewable decisions with human-in-the-loop approval workflows" },
          ].map((item) => (
            <div key={item.text} className="rounded-xl border border-border bg-card p-6">
              <CheckCircle className="mx-auto mb-4 h-8 w-8 text-primary-600" aria-hidden="true" />
              <p className="text-sm leading-relaxed text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="bg-slate-900 text-white" containerClassName="max-w-4xl text-center" aria-label="Get started">
        <h2 className="mb-4 text-fluid-3xl font-bold tracking-tight">Explore the Platform</h2>
        <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-slate-300">
          Review the documentation, explore the API, or discuss your reconciliation architecture
          with our team.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" asChild className="w-full bg-white px-8 py-6 text-lg font-semibold text-slate-900 hover:bg-slate-100 sm:w-auto">
            <UiLink href="/docs/quickstart">
              Read Quickstart <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </UiLink>
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="w-full border-slate-600 bg-transparent px-8 py-6 text-lg text-white hover:bg-slate-800 sm:w-auto"
          >
            <UiLink href="/contact">Discuss Your Architecture</UiLink>
          </Button>
        </div>
      </Section>

      <Footer />
    </div>
  );
}
