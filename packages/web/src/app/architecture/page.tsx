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

export const metadata: Metadata = {
  title: "Architecture - Settler",
  description:
    "Architecture overview of Settler covering ingestion, deterministic matching, evidence generation, and operator control surfaces.",
};

const layers = [
  {
    title: "Ingestion and adapters",
    description: "Connect external systems and normalize records into reconciliation inputs.",
    bullets: ["Provider adapters", "Schema normalization", "Tenant-scoped ingestion"],
  },
  {
    title: "Deterministic reconciliation kernel",
    description: "Apply rules in a stable execution path to produce matched and unmatched sets.",
    bullets: ["Rules engine", "Tolerance logic", "Deterministic output contract"],
  },
  {
    title: "Evidence and replay",
    description:
      "Generate artifacts that can be replayed and compared for determinism verification.",
    bullets: ["Evidence manifests", "Replay outputs", "Hash-based provenance"],
  },
  {
    title: "Operator control plane",
    description: "Surface run state, exception queues, diagnostics, and governance controls.",
    bullets: ["Run observability", "Exception remediation", "Audit and policy views"],
  },
  {
    title: "APIs, SDK, and CLI",
    description: "Provide programmable interfaces for integration and automation.",
    bullets: ["REST APIs", "TypeScript SDK", "CLI workflows"],
  },
  {
    title: "Deployment boundaries",
    description: "Support OSS self-hosted operation and enterprise packaging options.",
    bullets: ["Repository deployment", "Environment isolation", "Packaging separation"],
  },
];

export default function ArchitecturePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main id="main-content" className="pt-16">
        <PageHero
          eyebrow="Architecture"
          title="System layers built for deterministic execution and operational trust"
          description="This architecture view maps implemented concerns across adapter ingestion, deterministic run logic, replay evidence, and operational governance."
        />
        <Section>
          <SectionHeader
            title="Layered model"
            description="Each layer has explicit responsibilities to keep reconciliation outcomes reproducible and reviewable."
          />
          <FeatureGrid>
            {layers.map((layer) => (
              <FeatureCard key={layer.title} {...layer} />
            ))}
          </FeatureGrid>
        </Section>
        <CTASection
          title="Cross-check architecture with operations"
          description="Use the security and use-case pages to map architecture boundaries to governance workflows."
          primaryHref="/security-and-audit"
          primaryLabel="View security model"
          secondaryHref="/product"
          secondaryLabel="View use cases"
        />
      </main>
      <Footer />
    </div>
  );
}
