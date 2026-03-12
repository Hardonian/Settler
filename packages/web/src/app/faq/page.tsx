import { Metadata } from "next";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { CTASection, PageHero, Section } from "@/components/site/primitives";

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
        />
        <Section>
          <div className="space-y-4">
            {faqItems.map(([question, answer]) => (
              <div key={question} className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-lg font-semibold text-foreground">{question}</h2>
                <p className="mt-2 text-muted-foreground">{answer}</p>
              </div>
            ))}
          </div>
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
