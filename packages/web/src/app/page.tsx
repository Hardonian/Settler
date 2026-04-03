import { Metadata } from "next";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import {
  CTASection,
  FeatureCard,
  FeatureGrid,
  PageHero,
  Section,
  SectionHeader,
} from "@/components/site/primitives";
import { MarketingIntentCard } from "@/components/site/marketing-motion-wrappers";
import { Button } from "@/components/ui/button";
import { UiLink } from "@/components/ui/link";
import {
  ReconciliationFlow,
  VisualGrid,
  AdapterConnectionMap,
  ExceptionTriageVisual,
} from "@/components/site/infographics";

export const metadata: Metadata = {
  title: "Settler - Deterministic Reconciliation Platform",
  description:
    "Settler helps teams reconcile financial data with deterministic runs, replayable evidence, and operator-grade controls.",
};

const capabilityClusters = [
  {
    title: "Deterministic engine",
    description: "Rules-based matching with tolerance controls and stable outputs.",
    bullets: ["Rules as code", "Field-level tolerance", "Replay verification"],
  },
  {
    title: "Evidence and auditability",
    description: "Evidence manifests and hash-linked artifacts for each run.",
    bullets: ["Evidence JSON", "Replay reports", "Run provenance"],
  },
  {
    title: "Operator workflows",
    description: "Exception review, diagnostics, and control-plane style operations.",
    bullets: ["Exception queues", "Audit trails", "Diagnostics views"],
  },
  {
    title: "Integration layer",
    description: "Adapters for payment, commerce, accounting, and custom systems.",
    bullets: ["API and CLI execution", "Webhook support", "Custom adapters"],
  },
  {
    title: "Deployment choices",
    description: "Run open-source core yourself or evaluate managed enterprise delivery.",
    bullets: ["Apache 2.0 OSS", "Self-host workflows", "Enterprise controls"],
  },
  {
    title: "Security posture",
    description: "Tenant-aware boundaries and explicit control surfaces for operators.",
    bullets: ["Scoped access", "Policy controls", "Security architecture docs"],
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main id="main-content" className="pt-16">
        <PageHero
          eyebrow="Settler platform"
          title="Deterministic reconciliation for teams that need proof, not guesswork."
          description="Settler is built for reconciliation workflows where correctness, auditability, and operational clarity matter. Run deterministic matching, triage exceptions, and export evidence that can be replayed and reviewed."
          actions={
            <>
              <Button asChild>
                <UiLink href="/app/runs">
                  Open Console <ArrowRight className="ml-1 h-4 w-4" />
                </UiLink>
              </Button>
              <Button variant="outline" asChild>
                <UiLink href="/docs">Read docs</UiLink>
              </Button>
            </>
          }
          visual={
            <div className="relative aspect-square w-full max-w-[500px] overflow-hidden rounded-3xl border border-primary/20 shadow-2xl">
              <Image
                src="/hero_abstract_reconciliation.png"
                alt="Abstract reconciliation visualization"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent" />
            </div>
          }
        />

        <Section withGrid className="bg-muted/10 border-y border-border/40 py-24">
          <SectionHeader
            title="How it works"
            description="From raw data ingestion to verifiable evidence, Settler ensures every step is reproducible."
          />
          <div className="space-y-24">
            <ReconciliationFlow />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center pt-12">
              <div className="space-y-6 text-center lg:text-left">
                <h3 className="text-2xl font-bold tracking-tight">Connected Ecosystem</h3>
                <p className="text-muted-foreground leading-relaxed italic">
                  Seamlessly ingest data from any source through our standardized adapter layer.
                  Stripe, Adyen, and custom data warehouses map into a unified schema for
                  deterministic matching.
                </p>
              </div>
              <AdapterConnectionMap />
            </div>
          </div>
        </Section>

        <Section className="py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <ExceptionTriageVisual />
            <div className="space-y-8">
              <h2 className="text-3xl font-bold tracking-tight">Operator-Grade Triage</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Settler doesn&apos;t just find mismatches; it empowers operators to resolve them
                with institutional-grade confidence. AI-assisted review compresses resolution time
                by surfacing the exact context needed for every decision.
              </p>
              <Button asChild variant="outline">
                <UiLink href="/platform">
                  Explore Platform Controls <ArrowRight className="ml-2 h-4 w-4" />
                </UiLink>
              </Button>
            </div>
          </div>
        </Section>

        <Section>
          <SectionHeader
            title="What you can do today"
            description="Core capabilities spanning deterministic matching, evidence generation, operator workflows, and integration adapters."
          />
          <FeatureGrid>
            {capabilityClusters.map((capability) => (
              <FeatureCard key={capability.title} {...capability} />
            ))}
          </FeatureGrid>
        </Section>

        <Section className="bg-muted/20">
          <SectionHeader title="Navigate by intent" />
          <div className="mb-12">
            <div className="grid gap-6 md:grid-cols-2">
              {[
                {
                  role: "Developer",
                  href: "/docs/api",
                  desc: "SDK, CLI, and deterministic run model.",
                },
                {
                  role: "Operator",
                  href: "/app/runs",
                  desc: "Exception handling, controls, and run operations.",
                },
                {
                  role: "Architecture reviewer",
                  href: "/docs/architecture/platform-architecture",
                  desc: "System boundaries, data flow, and execution model.",
                },
                {
                  role: "Buyer / evaluator",
                  href: "/demo/console",
                  desc: "Interactive showcase console with realistic reconciliation scenarios.",
                },
              ].map((item) => (
                <MarketingIntentCard key={item.role}>
                  <UiLink
                    href={item.href}
                    className="block rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/45"
                  >
                    <h3 className="text-lg font-semibold text-foreground">{item.role}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {item.desc}
                    </p>
                  </UiLink>
                </MarketingIntentCard>
              ))}
            </div>
          </div>
          <VisualGrid className="mt-12" />
        </Section>

        <CTASection
          title="See it in action"
          description="Explore the interactive showcase console with realistic reconciliation data. No account required."
          primaryHref="/demo/console"
          primaryLabel="Open showcase console"
          secondaryHref="/docs"
          secondaryLabel="Read documentation"
        />
      </main>
      <Footer />
    </div>
  );
}
