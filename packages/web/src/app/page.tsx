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
  BilateralSettlementVisualizer,
  EnterpriseRoiCalculator,
  ExceptionTriageVisual,
  InteractiveHeroEngine,
  ReconciliationFlow,
  VisualGrid,
} from "@/components/site/HomeInfographics";
import { CognitiveVerifierInteractiveEnclave } from "@/components/site/CognitiveVerifierInteractiveEnclave";

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
      "25+ verified platform adapters spanning payments, accounting, e-commerce, banking, ERP, and subscription billing.",
    bullets: [
      "Stripe, PayPal, Square, Shopify",
      "QuickBooks, Xero, NetSuite, SAP",
      "Plaid, TrueLayer, Chargebee, +14 more",
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
    <div className="relative min-h-screen bg-background overflow-x-hidden">
      <AmbientLightOrbs />
      <Navigation />
      <main id="main-content" className="pt-16">
        <PageHero
          eyebrow="Reconciliation Intelligence Platform"
          title="Deterministic reconciliation. Verifiable audit evidence."
          description="Settler is the operating system for financial integrity. We turn fragmented transaction flows into replayable, hash-linked proof artifacts. Built for teams that require absolute precision and audit-ready certainty."
          actions={
            <>
              <Button asChild size="lg">
                <UiLink
                  href="/roi-calculator"
                  data-cta="hero_roi_calc"
                  data-analytics="hero_roi_calc_click"
                >
                  Calculate Recoverable ROI <ArrowRight className="ml-2 h-4 w-4" />
                </UiLink>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <UiLink
                  href="/realtime-dashboard"
                  data-cta="hero_telemetry"
                  data-analytics="hero_telemetry_click"
                >
                  Live Telemetry Radar
                </UiLink>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <UiLink
                  href="/revenue-recovery"
                  data-cta="hero_revenue_recovery"
                  data-analytics="hero_revenue_recovery_click"
                >
                  Revenue Recovery
                </UiLink>
              </Button>
            </>
          }
          visual={<InteractiveHeroEngine />}
        />

        {/* Flagship Innovation: Cognitive Proposer / Deterministic Verifier Enclave */}
        <Section className="py-20 bg-gradient-to-b from-background via-muted/10 to-background border-b border-border/40">
          <CognitiveVerifierInteractiveEnclave />
        </Section>

        {/* Strategic Cross-Rail Enclave Section */}
        <Section className="py-24 bg-muted/15 border-y border-border/40">
          <SectionHeader
            title="Why Stripe & PayPal Compete to Own Settler"
            description="The Universal Bilateral Settlement Enclave — neutralizing cross-rail dispute arbitrage, contractual fee creep, and batch float drag with sovereign cryptographic proofs."
          />
          <BilateralSettlementVisualizer />
        </Section>

        {/* Interactive Enterprise ROI & Leakage Calculator */}
        <Section className="py-24">
          <SectionHeader
            title="Institutional Payment Leakage & ROI Engine"
            description="Simulate your multi-processor payment volume across Stripe, PayPal, and bank clearing accounts. Uncover hidden fee creep, float drag, and audit hours reclaimed by Settler."
          />
          <EnterpriseRoiCalculator />
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
                  Ingest transaction data through 25+ verified adapters for Stripe, Shopify,
                  QuickBooks, PayPal, Square, Xero, NetSuite, Plaid, SAP, and more. Custom systems
                  connect through the adapter framework. All data normalizes into a unified schema
                  for deterministic matching.
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
            description="Explore the implemented 3D architecture modules powering deterministic matching, multi-rail orchestration, continuous close, and cryptographic evidence."
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
                  badge: "SOX-404 Compliance",
                  desc: "SOX-compliant approvals, continuous close dashboards, and liquidity metric analysis.",
                },
                {
                  role: "InfoSec / Admin",
                  icon: ShieldCheck,
                  href: "/console/security/data-residency",
                  badge: "Zero-Trust Isolation",
                  desc: "Geo-fencing, PII redaction engines, SIEM exports, and tenant observability.",
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
