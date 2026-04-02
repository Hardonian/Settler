import { Metadata } from "next";
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
          visual={<EvidenceArtifactPreview />}
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
