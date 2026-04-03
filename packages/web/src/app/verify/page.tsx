import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AnimatedPageWrapper } from "@/components/AnimatedPageWrapper";
import { Section, PageHero } from "@/components/site/primitives";
import { VisualGrid } from "@/components/site/infographics";
import VerifyClient from "./verify-client";

export const metadata = {
  title: "Verify Evidence Bundle — Settler",
  description: "Verify Settler evidence bundles locally in your browser.",
};

export default function VerifyPage() {
  return (
    <AnimatedPageWrapper aria-label="Verify evidence bundle">
      <Navigation />
      <main className="pt-24">
        <PageHero
          eyebrow="Trust but Verify"
          title="Verify Evidence Bundle"
          description="Run client-side verification to surface discrepancies between the manifest and bundle files. Independent verification ensures complete transparency."
        />

        <Section className="pb-32">
          <VerifyClient />
        </Section>

        <Section className="bg-muted/10">
          <VisualGrid />
        </Section>
      </main>
      <Footer />
    </AnimatedPageWrapper>
  );
}
