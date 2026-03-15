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

export const metadata: Metadata = {
  title: "Product — Settler",
  description:
    "Visual overview of Settler's shipped modules, capability clusters, integration points, and packaging boundaries.",
};

export default function ProductPage() {
  return (
    <>
      <Navigation />
      <main
        id="main-content"
        className="min-h-screen bg-slate-50 px-4 pb-16 pt-24 dark:bg-slate-950 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-6xl space-y-8">
          <section>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
              Product architecture and capability proof
            </h1>
            <p className="mt-3 max-w-3xl text-slate-600 dark:text-slate-400">
              A visual view of what is currently shipped: module boundaries, capability clusters,
              integration points, and packaging boundaries.
            </p>
          </section>
          <PlatformOverviewDiagram />
          <CapabilityMap />
          <IntegrationAndPackagingMap />
          <VisualProofCTA />
          <RealityEvidencePanel scope="architecture" title="Product proof references" />
        </div>
      </main>
      <Footer />
    </>
  );
}
