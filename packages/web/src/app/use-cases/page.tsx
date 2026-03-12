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
        />
        <Section>
          <SectionHeader title="Representative scenarios" />
          <FeatureGrid>
            {useCaseIndexCards.map((useCase) => (
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
