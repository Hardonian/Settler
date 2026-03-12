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
  title: "Use Cases - Settler",
  description: "Representative workflows for developers, operators, and enterprise evaluators.",
};

const useCases = [
  {
    title: "Developer integration workflow",
    description: "Implement reconciliation in product code with SDK and API endpoints.",
    bullets: ["Create run definitions", "Version matching rules", "Trigger runs in CI"],
  },
  {
    title: "Finance operations workflow",
    description: "Detect and triage mismatches with deterministic, replayable records.",
    bullets: ["Daily exception queues", "Variance review", "Export reconciliation evidence"],
  },
  {
    title: "Platform operations workflow",
    description: "Operate run infrastructure and diagnostics from the control plane.",
    bullets: ["Run monitoring", "Failure taxonomy", "Remediation playbooks"],
  },
  {
    title: "Security and audit workflow",
    description: "Provide machine-verifiable evidence and action logs to reviewers.",
    bullets: ["Tenant-scoped access", "Audit artifacts", "Replay verification"],
  },
  {
    title: "Open-source adoption workflow",
    description: "Evaluate and self-host core reconciliation workflows.",
    bullets: ["Repository quickstart", "CLI-driven demos", "Local replay checks"],
  },
  {
    title: "Enterprise evaluation workflow",
    description: "Assess packaging, governance controls, and support requirements.",
    bullets: [
      "Deployment model review",
      "Security architecture review",
      "Commercial packaging path",
    ],
  },
];

export default function UseCasesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main id="main-content" className="pt-16">
        <PageHero
          eyebrow="Use cases"
          title="Workflows for builders, operators, and evaluators"
          description="Settler supports distinct user journeys without hiding technical detail. These examples map directly to documented APIs, console surfaces, and operational artifacts in the repository."
        />
        <Section>
          <SectionHeader title="Representative scenarios" />
          <FeatureGrid>
            {useCases.map((useCase) => (
              <FeatureCard key={useCase.title} {...useCase} />
            ))}
          </FeatureGrid>
        </Section>
        <CTASection
          title="Need deeper implementation detail?"
          description="Continue into docs for API references and into roadmap for what is in-progress versus already shipped."
          primaryHref="/docs"
          primaryLabel="Open docs"
          secondaryHref="/roadmap"
          secondaryLabel="Review roadmap"
        />
      </main>
      <Footer />
    </div>
  );
}
