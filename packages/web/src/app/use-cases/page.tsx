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
import { RuleExecutionVisual, VisualGrid } from "@/components/site/infographics";
import { useCaseIndexCards } from "@/content/useCases";

export const metadata: Metadata = {
  title: "Use Cases - Settler",
  description: "Representative workflows for developers, operators, and enterprise evaluators.",
};

export default function UseCasesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main id="main-content" className="pt-16">
        <PageHero
          eyebrow="Use cases"
          title="Workflows for builders, operators, and evaluators"
          description="Settler supports distinct user journeys without hiding technical detail. These examples map directly to documented APIs, console surfaces, and operational artifacts in the repository."
          visual={
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-primary/20 shadow-2xl">
              <Image
                src="/rule_trace_3d.png"
                alt="Use case orchestration"
                fill
                className="object-cover"
              />
            </div>
          }
        />

        <Section>
          <SectionHeader title="Representative scenarios" />
          <FeatureGrid>
            {useCaseIndexCards.map((useCase) => (
              <FeatureCard key={useCase.title} {...useCase} />
            ))}
          </FeatureGrid>
        </Section>

        <Section className="py-24 border-t border-border/40">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <RuleExecutionVisual />
            <div className="space-y-8">
              <h2 className="text-3xl font-bold tracking-tight">Deterministic Execution Paths</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Every use case maps to a set of immutable rules. Whether you are reconciling complex
                marketplace fees or high-volume payment streams, the execution path remains
                inspectable and reproducible.
              </p>
            </div>
          </div>
        </Section>

        <Section className="bg-muted/10">
          <VisualGrid />
        </Section>

        <CTASection
          title="Need deeper implementation detail?"
          description="Continue into docs for API references and into changelog for shipped work and near-term updates."
          primaryHref="/docs"
          primaryLabel="Open docs"
          secondaryHref="/changelog"
          secondaryLabel="Review changelog"
        />
      </main>
      <Footer />
    </div>
  );
}
