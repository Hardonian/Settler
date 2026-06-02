import { Metadata } from "next";
import Image from "next/image";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { notFound } from "next/navigation";
import { MdxPlainRenderer } from "@/components/content/MdxPlainRenderer";
import { getContentPage } from "@/lib/content/pages";
import { Section, PageHero } from "@/components/site/primitives";
import { AdapterConnectionMap, VisualGrid } from "@/components/site/infographics";
import { RealityEvidencePanel } from "@/components/RealityEvidencePanel";
import { IntegrationFlowDiagram } from "@/components/feature-visual-proof";
import { AppMarketplace } from "@/components/integrations/app-marketplace";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const page = getContentPage("integrations");
  if (!page) {
    return { title: "Integrations" };
  }
  return {
    title: page.title,
    description: page.description,
  };
}

export default function IntegrationsPage() {
  const page = getContentPage("integrations");
  if (!page) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <PageHero
        eyebrow="Ecosystem & Adapters"
        title={page.title}
        description={page.description}
        visual={
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-primary/20 shadow-2xl">
            <Image
              src="/adapter_hub_3d.png"
              alt="Adapter hub visualization"
              fill
              className="object-cover"
            />
          </div>
        }
      />

      <Section containerClassName="max-w-4xl">
        <MdxPlainRenderer source={page.content} />
      </Section>

      <Section withGrid className="bg-muted/10 border-y border-border/40">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Multi-Source Connectivity</h2>
          <p className="text-muted-foreground font-medium">
            Connect disparate financial systems into a single, deterministic reconciliation hub.
          </p>
        </div>
        <AppMarketplace />
        <div className="mt-16">
          <AdapterConnectionMap />
        </div>
      </Section>

      <Section className="py-20 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-3xl font-bold tracking-tight">Integration Lifecycle</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Every integration run follows a strict ingestion, normalization, and proofing cycle.
              Built-in diagrams ensure auditability at every stage.
            </p>
            <IntegrationFlowDiagram />
          </div>
          <RealityEvidencePanel scope="integrations" />
        </div>
      </Section>

      <Section className="bg-muted/10">
        <VisualGrid />
      </Section>

      <Footer />
    </div>
  );
}
