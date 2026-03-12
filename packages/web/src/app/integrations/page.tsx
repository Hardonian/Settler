import { Metadata } from "next";
import { notFound } from "next/navigation";
import { MdxPlainRenderer } from "@/components/content/MdxPlainRenderer";
import { PageLayout } from "@/components/content/PageLayout";
import { getContentPage } from "@/lib/content/pages";
import { IntegrationFlowDiagram } from "@/components/feature-visual-proof";
import { RealityEvidencePanel } from "@/components/RealityEvidencePanel";

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
    <PageLayout title={page.title} description={page.description}>
      <MdxPlainRenderer source={page.content} />
      <div className="mt-10 space-y-8">
        <IntegrationFlowDiagram />
        <RealityEvidencePanel scope="integrations" />
      </div>
    </PageLayout>
  );
}
