import { Metadata } from "next";
import Image from "next/image";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { CTASection, PageHero, Section } from "@/components/site/primitives";
import { VisualGrid } from "@/components/site/infographics";

export const metadata: Metadata = {
  title: "FAQ - Settler",
  description: "Frequently asked questions about Settler capabilities, packaging, and deployment.",
};

const faqItems = [
  [
    "Is Settler open source?",
    "Yes. Core reconciliation components in this repository are Apache 2.0 licensed, with enterprise packaging documented separately.",
  ],
  [
    "What is deterministic in Settler?",
    "Given the same inputs and rules, the run output and evidence hash should remain stable and replayable.",
  ],
  [
    "Does Settler replace accounting software?",
    "No. Settler focuses on reconciliation workflows between systems, not general ledger ownership.",
  ],
  [
    "How do teams run Settler?",
    "Teams can run local demos, self-host open-source workflows, or evaluate managed enterprise deployment paths.",
  ],
  [
    "How should roadmap items be interpreted?",
    "Roadmap items are planned work only. They are not represented as delivered capabilities until implemented.",
  ],
];

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main id="main-content" className="pt-16">
        <PageHero
          eyebrow="FAQ"
          title="Common product and architecture questions"
          description="Answers are constrained to documented product behavior and packaging boundaries."
          visual={
            <div className="relative aspect-square w-full max-w-[400px] overflow-hidden rounded-3xl border border-primary/20 shadow-xl lg:ml-auto">
              <Image
                src="/evidence_artifact_3d.png"
                alt="Evidence artifact visualization"
                fill
                className="object-cover"
              />
            </div>
          }
        />
        <Section withGrid>
          <div className="space-y-4">
            {faqItems.map(([question, answer]) => (
              <div
                key={question}
                className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <h2 className="text-lg font-semibold text-foreground">{question}</h2>
                <p className="mt-2 text-muted-foreground leading-relaxed italic border-l-2 border-primary/30 pl-4">
                  {answer}
                </p>
              </div>
            ))}
          </div>
        </Section>

        <Section className="bg-muted/10">
          <VisualGrid />
        </Section>

        <CTASection
          title="Still evaluating fit?"
          description="Use platform, capabilities, architecture, and contact pages for a complete review path."
          primaryHref="/platform"
          primaryLabel="Review platform"
          secondaryHref="/contact"
          secondaryLabel="Contact team"
        />
      </main>
      <Footer />
    </div>
  );
}
