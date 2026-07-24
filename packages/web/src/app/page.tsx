"use client";
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
import dynamic from "next/dynamic";

const ReconciliationFlow = dynamic(
  () => import("@/components/site/infographics").then((mod) => mod.ReconciliationFlow),
  { ssr: false }
);
const VisualGrid = dynamic(
  () => import("@/components/site/infographics").then((mod) => mod.VisualGrid),
  { ssr: false }
);
const AdapterConnectionMap = dynamic(
  () => import("@/components/site/infographics").then((mod) => mod.AdapterConnectionMap),
  { ssr: false }
);
const ExceptionTriageVisual = dynamic(
  () => import("@/components/site/infographics").then((mod) => mod.ExceptionTriageVisual),
  { ssr: false }
);

export const metadata: Metadata = {
  title: "Settler — Reconciliation intelligence + audit OS",
  description:
    "Settler turns messy reconciliation into deterministic audit evidence. Built for finance teams that need replayable runs, hash-linked proofpacks, and immutable operator truth.",
};

const capabilityClusters = [
  {
    title: "Deterministic reconciliation engine",
    description:
      "Rules-as-code matching with field-level tolerance controls. Same inputs always produce same outputs.",
    bullets: [
      "Configurable match policies",
      "Tolerance-aware comparison",
      "Deterministic hash verification",
    ],
  },
  {
    title: "Evidence-first output",
    description:
      "Every run produces hash-linked evidence manifests — not just reports, but verifiable proof artifacts.",
    bullets: ["Structured evidence JSON", "Run provenance chains", "Export-ready audit bundles"],
  },
  {
    title: "Exception adjudication",
    description:
      "Exceptions carry deterministic context. Operator decisions are auditable and become institutional memory.",
    bullets: [
      "State-machine triage workflow",
      "Decision audit trail",
      "Policy-aware exception context",
    ],
  },
  {
    title: "Replay and drift detection",
    description:
      "Re-execute any historical reconciliation and compare hash outcomes to detect drift.",
    bullets: ["Full run replay", "Hash-verified determinism", "Drift detection across executions"],
  },
  {
    title: "Verified integration adapters",
    description:
      "7 verified platform adapters plus a custom adapter framework for proprietary systems.",
    bullets: [
      "Stripe, Shopify, QuickBooks",
      "PayPal, Square, Xero, NetSuite",
      "Custom adapter interface",
    ],
  },
  {
    title: "Omnichannel Enterprise Suite",
    description:
      "Fully featured workspaces and APIs for CFO Maker-Checker flows, Data Residency policies, Vendor Portals, and AI Rule Discovery.",
    bullets: [
      "SOX-compliant Maker-Checker approvals",
      "Agentic AI exception resolution",
      "Isolated Auditor & Vendor portals",
    ],
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main id="main-content" className="pt-16">
        <PageHero
          eyebrow="Reconciliation Intelligence Platform"
          title="Deterministic reconciliation. Verifiable audit evidence."
          description="Settler is the operating system for financial integrity. We turn fragmented transaction flows into replayable, hash-linked proof artifacts. Built for teams that require absolute precision and audit-ready certainty."
          actions={
            <>
              <Button asChild size="lg">
                <UiLink href="/tour">
                  See it in 60 seconds <ArrowRight className="ml-2 h-4 w-4" />
                </UiLink>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <UiLink href="/demo/console">Explore operator console</UiLink>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <UiLink href="/signup">Start evaluating today</UiLink>
              </Button>
            </>
          }
          visual={
            <div className="relative aspect-square w-full max-w-[500px] overflow-hidden rounded-3xl border border-primary/20 shadow-2xl bg-slate-950/50 backdrop-blur-sm">
              <Image
                src="/hero_abstract_reconciliation.png"
                alt="Deterministic reconciliation visualization"
                fill
                className="object-cover opacity-90 transition-opacity hover:opacity-100"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-transparent" />
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
                  Ingest transaction data through verified adapters for Stripe, Shopify, QuickBooks,
                  and more. Custom systems connect through the adapter framework. All data
                  normalizes into a unified schema for deterministic matching.
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
                Exceptions carry deterministic &quot;why&quot; context and operator decisions stay
                auditable. Where AI is enabled, it is advisory, evidence-linked, and bounded —
                humans keep final authority.
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
          <SectionHeader title="Start from your role" />
          <div className="mb-12">
            <div className="grid gap-6 md:grid-cols-2">
              {[
                {
                  role: "Developer",
                  href: "/docs/api",
                  desc: "SDK, CLI, and API-first integration with deterministic run semantics.",
                },
                {
                  role: "Operator",
                  href: "/console",
                  desc: "Exception triage, run inspection, evidence navigation, and control plane operations.",
                },
                {
                  role: "Architecture reviewer",
                  href: "/docs/architecture/platform-architecture",
                  desc: "Rust kernel, control plane, ledger architecture, and tenant isolation boundaries.",
                },
                {
                  role: "CFO / Risk",
                  href: "/console/close",
                  desc: "SOX-compliant approvals, continuous close dashboards, and liquidity metric analysis.",
                },
                {
                  role: "InfoSec / Admin",
                  href: "/console/security/data-residency",
                  desc: "Geo-fencing, PII redaction engines, SIEM exports, and tenant observability.",
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
          title="See Settler in action"
          description="Explore the operator console with realistic reconciliation data, evidence artifacts, and exception workflows. No account required."
          primaryHref="/demo/console"
          primaryLabel="Explore operator console"
          secondaryHref="/docs/trust-packet"
          secondaryLabel="Read the trust packet"
        />
      </main>
      <Footer />
    </div>
  );
}
