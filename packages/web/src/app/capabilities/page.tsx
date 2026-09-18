import { Metadata } from "next";
import Image from "next/image";
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
import { EvidenceArtifactPreview, VisualGrid } from "@/components/site/infographics";

export const metadata: Metadata = {
  title: "Capabilities - Settler",
  description:
    "Capability map for deterministic reconciliation, evidence, controls, and integrations.",
};

const capabilityGroups = [
  {
    title: "Run orchestration",
    description: "Create, execute, and monitor reconciliation runs via API, UI, or CLI.",
    bullets: ["Scheduled or on-demand runs", "Replay from artifacts", "Execution metadata"],
  },
  {
    title: "Matching rules",
    description: "Configure reconciliation logic with deterministic outcomes.",
    bullets: ["Exact and tolerance-based matching", "Rule versions", "Normalization support"],
  },
  {
    title: "Exception workflows",
    description: "Investigate mismatches with context instead of ad-hoc spreadsheets.",
    bullets: ["Exception queues", "Reason codes", "Resolution tracking"],
  },
  {
    title: "Evidence output",
    description: "Capture proof bundles for audit and replay verification.",
    bullets: ["Evidence manifest", "Report artifacts", "Determinism checks"],
  },
  {
    title: "Control plane",
    description: "Operate tenant-safe workflows with explicit role boundaries.",
    bullets: ["Scoped API keys", "Audit logging", "Policy-gated actions"],
  },
  {
    title: "Extensibility",
    description: "Connect existing systems through adapters and APIs.",
    bullets: ["Integration adapters", "Webhook events", "SDK extension points"],
  },
];

export default function CapabilitiesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main id="main-content" className="pt-16">
        <PageHero
          eyebrow="Capabilities"
          title="A capability model grounded in real workflows"
          description="Settler combines deterministic execution, operator workflows, and evidence-first outputs so engineering, finance, and security teams can reason about reconciliation outcomes."
          visual={
            <div className="group relative aspect-square w-full max-w-[500px] mx-auto overflow-hidden rounded-3xl border border-primary/25 bg-card/70 shadow-2xl transition-all duration-500 hover:border-primary/45 hover:shadow-primary/15">
              <Image
                src="/capabilities_matrix_3d.png"
                alt="Settler 4-tier sovereign capability stack"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/15 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/10 bg-black/60 backdrop-blur-md p-3 text-xs text-white/90 flex items-center justify-between">
                <span className="font-mono text-[11px] text-cyan-300 font-semibold">
                  4-TIER CAPABILITY STACK
                </span>
                <span className="font-mono text-[11px] text-emerald-400 font-bold">
                  SHA-256 SEALED
                </span>
              </div>
            </div>
          }
        />
        <Section>
          <SectionHeader
            title="Capability clusters"
            description="These clusters reflect implemented areas across the application, API surfaces, and operational documentation."
          />
          <FeatureGrid>
            {capabilityGroups.map((group) => (
              <FeatureCard key={group.title} {...group} />
            ))}
          </FeatureGrid>
        </Section>

        <Section className="py-20 border-t border-border/40">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Cryptographic Evidence Finality
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Every reconciliation execution produces a tamper-evident, RFC 6962 SHA-256 Merkle
                root. Reports are not arbitrary spreadsheets—they are mathematically verifiable
                proof artifacts that eliminate audit sampling and provide indisputable regulatory
                truth.
              </p>
            </div>
            <EvidenceArtifactPreview />
          </div>
        </Section>

        <Section className="bg-muted/20">
          <VisualGrid />
        </Section>

        <CTASection
          title="See how these capabilities combine"
          description="Use the architecture and use-case pages to understand execution flow and persona-specific outcomes."
          primaryHref="/architecture"
          primaryLabel="Explore architecture"
          secondaryHref="/product"
          secondaryLabel="View use cases"
        />
      </main>
      <Footer />
    </div>
  );
}
