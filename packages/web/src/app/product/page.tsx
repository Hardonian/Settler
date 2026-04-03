import { Metadata } from "next";
import Image from "next/image";
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
import {
  ReconciliationFlow,
  AdapterConnectionMap,
  VisualGrid,
} from "@/components/site/infographics";

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
          visual={
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-primary/20 shadow-2xl">
              <Image
                src="/platform_core_3d.png"
                alt="Settler platform core"
                fill
                className="object-cover"
              />
            </div>
          }
        />

        <Section className="py-20 lg:py-32">
          <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight">The Settlement Pipeline</h2>
            <p className="text-muted-foreground font-medium">
              Deterministic matching with bit-perfect reproducibility and audit-grade evidence.
            </p>
          </div>
          <ReconciliationFlow />
        </Section>

        <Section withGrid className="bg-muted/10 border-y border-border/40 py-24">
          <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight">Adapter & Ingestion Layer</h2>
            <p className="text-muted-foreground font-medium">
              Standardized connectors for existing financial infrastructure and data sources.
            </p>
          </div>
          <AdapterConnectionMap />
        </Section>

        <Section className="py-20 space-y-24">
          <div className="space-y-12">
            <div className="text-center space-y-4 max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Global Control Plane
              </h2>
              <p className="text-muted-foreground font-medium italic">
                Platform-wide orchestration and regional synchronization boundaries.
              </p>
            </div>
            <PlatformOverviewDiagram />
          </div>

          <div className="space-y-12">
            <div className="text-center space-y-4 max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Capability Clusters
              </h2>
              <p className="text-muted-foreground font-medium italic">
                Functional boundaries and interface definitions.
              </p>
            </div>
            <CapabilityMap />
          </div>

          <IntegrationAndPackagingMap />
        </Section>

        <Section className="bg-muted/10">
          <VisualGrid />
        </Section>

        <Section className="py-20 bg-muted/5">
          <VisualProofCTA />
          <div className="mt-20">
            <RealityEvidencePanel scope="architecture" title="Product proof references" />
          </div>
        </Section>
      </main>
      <Footer />
    </PublicPageShell>
  );
}
