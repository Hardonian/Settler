import { Metadata } from "next";
import { ArrowRight, Code2, Sliders, Layers, Scale, ShieldCheck } from "lucide-react";
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
  AdapterConnectionMap,
  AmbientLightOrbs,
  ArchitectureModuleShowcase,
  ExceptionTriageVisual,
  InteractiveHeroEngine,
  ReconciliationFlow,
  VisualGrid,
} from "@/components/site/HomeInfographics";

export const metadata: Metadata = {
  title: "Settler — Reconciliation intelligence + audit OS",
  description:
    "Settler turns fragmented transaction data into deterministic reconciliation runs, explainable exceptions, and replayable evidence artifacts.",
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
      "Configured runs can produce hash-linked manifests and exportable evidence for later review.",
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
    title: "Integration adapters",
    description:
      "Adapters and import paths span payment, accounting, commerce, banking, ERP, and billing systems.",
    bullets: [
      "Stripe, PayPal, Square, Shopify",
      "QuickBooks, Xero, NetSuite, SAP",
      "Plaid, TrueLayer, Chargebee, +14 more",
    ],
  },
  {
    title: "Operational controls",
    description:
      "Role-scoped workflows, review surfaces, exports, and policy controls support governed operations.",
    bullets: [
      "Approval and review workflows",
      "Advisory, evidence-linked automation",
      "Tenant-scoped operator surfaces",
    ],
  },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden">
      <AmbientLightOrbs />
      <Navigation />
      <main id="main-content" className="pt-16">
        <PageHero
          eyebrow="Reconciliation Intelligence Platform"
          title="Deterministic reconciliation. Verifiable audit evidence."
          description="Settler turns fragmented transaction flows into reproducible runs, explainable exceptions, and replayable evidence. It is built for teams that need to inspect how a reconciliation result was produced."
          actions={
            <>
              <Button asChild size="lg">
                <UiLink href="/docs/pilot" data-cta="hero_pilot" data-analytics="hero_pilot_click">
                  Plan a pilot <ArrowRight className="ml-2 h-4 w-4" />
                </UiLink>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <UiLink href="/demo/console" data-cta="hero_demo" data-analytics="hero_demo_click">
                  Explore the console
                </UiLink>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <UiLink
                  href="/security-and-audit"
                  data-cta="hero_security"
                  data-analytics="hero_security_click"
                >
                  Review security
                </UiLink>
              </Button>
            </>
          }
          visual={<InteractiveHeroEngine />}
        />

        <Section className="py-24 bg-muted/15 border-y border-border/40">
          <SectionHeader
            title="Neutral settlement truth across systems"
            description="Settler normalizes source records, applies explicit matching policy, and preserves the evidence needed to review an outcome without depending on a single processor's view."
          />
          <FeatureGrid>
            <FeatureCard
              title="Normalize"
              description="Map processor, bank, commerce, and ledger records into a consistent reconciliation model."
              bullets={[
                "Explicit source provenance",
                "Adapter-level validation",
                "Stable normalized fields",
              ]}
            />
            <FeatureCard
              title="Reconcile"
              description="Execute deterministic matching rules with declared tolerances and reviewable policy."
              bullets={[
                "Repeatable inputs and outputs",
                "Tolerance-aware decisions",
                "Explained mismatches",
              ]}
            />
            <FeatureCard
              title="Evidence"
              description="Export run context and tamper-evident artifacts for audit support and independent verification."
              bullets={["Hash-linked manifests", "Replay support", "Operator decision history"]}
            />
          </FeatureGrid>
        </Section>

        <Section className="py-24">
          <SectionHeader
            title="A pilot with explicit acceptance criteria"
            description="Start with one payout-to-bank-to-ledger workflow. Measure reproducibility, exception quality, evidence completeness, and operator review time against your own data."
          />
          <FeatureGrid>
            <FeatureCard
              title="Bound the workflow"
              description="Choose named sources, a fixed period, and a documented matching policy before execution."
              bullets={["Known input population", "Declared tolerances", "Named data owners"]}
            />
            <FeatureCard
              title="Prove repeatability"
              description="Run the same input twice and compare outputs, hashes, and exception classifications."
              bullets={["Replay the run", "Compare fingerprints", "Investigate any drift"]}
            />
            <FeatureCard
              title="Review the evidence"
              description="Have finance, engineering, and audit stakeholders inspect the same evidence package."
              bullets={["Trace source lineage", "Review decisions", "Record acceptance gaps"]}
            />
          </FeatureGrid>
        </Section>

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
                  Ingest transaction data through adapters for payment, commerce, accounting,
                  banking, and ERP systems. Custom sources connect through the adapter framework,
                  then normalize into a shared model for deterministic matching.
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

        <Section className="py-24">
          <SectionHeader
            title="Core Architecture & Shipped Modules"
            description="Review the system surfaces behind deterministic matching, reconciliation workflows, and evidence generation."
          />
          <ArchitectureModuleShowcase />

          <div className="mt-20 pt-16 border-t border-border/40">
            <h3 className="text-xl font-bold tracking-tight mb-8 text-foreground">
              Operational Capabilities Grounded in Code
            </h3>
            <FeatureGrid>
              {capabilityClusters.map((capability) => (
                <FeatureCard key={capability.title} {...capability} />
              ))}
            </FeatureGrid>
          </div>
        </Section>

        <Section className="bg-muted/20">
          <SectionHeader title="Start from your role" />
          <div className="mb-12">
            <div className="grid gap-6 md:grid-cols-2">
              {[
                {
                  role: "Developer",
                  icon: Code2,
                  href: "/docs/api",
                  badge: "TypeScript & Rust SDK",
                  desc: "SDK, CLI, and API-first integration with deterministic run semantics.",
                },
                {
                  role: "Operator",
                  icon: Sliders,
                  href: "/console",
                  badge: "Adjudication Console",
                  desc: "Exception triage, run inspection, evidence navigation, and control plane operations.",
                },
                {
                  role: "Architecture Reviewer",
                  icon: Layers,
                  href: "/docs/architecture/platform-architecture",
                  badge: "Kernel & Ledger Spec",
                  desc: "Rust kernel, control plane, ledger architecture, and tenant isolation boundaries.",
                },
                {
                  role: "CFO / Risk",
                  icon: Scale,
                  href: "/console/close",
                  badge: "Review Workflows",
                  desc: "Approval surfaces, close workflows, and evidence review for finance and risk teams.",
                },
                {
                  role: "InfoSec / Admin",
                  icon: ShieldCheck,
                  href: "/console/security/data-residency",
                  badge: "Tenant Controls",
                  desc: "Tenant boundaries, access controls, audit exports, and deployment configuration surfaces.",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <MarketingIntentCard key={item.role}>
                    <UiLink
                      href={item.href}
                      className="group block rounded-2xl border border-border/80 bg-card/70 p-6 transition-all duration-300 hover:border-primary/45 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-primary/80 bg-primary/5 border border-primary/20 px-2.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                          {item.role}
                        </h3>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {item.desc}
                      </p>
                    </UiLink>
                  </MarketingIntentCard>
                );
              })}
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
