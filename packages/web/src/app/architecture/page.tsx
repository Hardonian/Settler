import { Metadata } from "next";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { RealityEvidencePanel } from "@/components/RealityEvidencePanel";
import {
  CapabilityMap,
  IntegrationAndPackagingMap,
  PlatformOverviewDiagram,
  WorkflowJourneyDiagram,
} from "@/components/public-visual-proof";

export const metadata: Metadata = {
  title: "Architecture - Settler",
  description:
    "Platform architecture diagrams for Settler covering product surfaces, control plane boundaries, workflows, capability clusters, and packaging boundaries.",
};

export default function ArchitecturePage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-slate-50 px-4 pb-16 pt-24 dark:bg-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <section>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
              Architecture proof layer
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              How Settler is assembled in production
            </h1>
            <p className="mt-4 max-w-3xl text-slate-600 dark:text-slate-400">
              These visuals are grounded in repository modules, route structure, and shipped product
              surfaces. They describe current-state architecture and current-state workflows.
            </p>
          </section>

          <PlatformOverviewDiagram />
          <WorkflowJourneyDiagram />
          <CapabilityMap />
          <IntegrationAndPackagingMap />
          <RealityEvidencePanel scope="architecture" />
        </div>
      </main>
      <Footer />
    </>
  );
}
