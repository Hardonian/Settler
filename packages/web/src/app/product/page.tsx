import { Metadata } from "next";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { RealityEvidencePanel } from "@/components/RealityEvidencePanel";
import {
  CapabilityMap,
  IntegrationAndPackagingMap,
  PlatformOverviewDiagram,
  VisualProofCTA,
} from "@/components/public-visual-proof";
import { PageHero, PublicPageShell, Section } from "@/components/site/primitives";

export const metadata: Metadata = {
  title: "Product — Settler",
  description:
    "Visual overview of Settler's shipped modules, capability clusters, integration points, and packaging boundaries.",
};

export default function ProductPage() {
  return (
    <PublicPageShell>
      <Navigation />
      <main id="main-content" className="pt-16">
        <PageHero
          eyebrow="Product"
          title="Architecture and capability proof"
          description="A visual view of what is currently shipped: module boundaries, capability clusters, integration points, and packaging boundaries."
        />
        <Section className="py-16 sm:py-20">
          <div className="space-y-16">
            <PlatformOverviewDiagram />
            <CapabilityMap />
            <IntegrationAndPackagingMap />
            <VisualProofCTA />
            <RealityEvidencePanel scope="architecture" title="Product proof references" />
          </div>
        </Section>
      </main>
      <Footer />
    </PublicPageShell>
  );
}
