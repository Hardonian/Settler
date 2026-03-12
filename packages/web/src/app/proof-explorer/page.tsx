import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ProofExplorer } from "@/components/proof/ProofExplorer";
import { ResultsPanel } from "@/components/stitch-import/ResultsPanel";
import { ProofLifecycleDiagram } from "@/components/feature-visual-proof";
import { RealityEvidencePanel } from "@/components/RealityEvidencePanel";

export const metadata = {
  title: "Proof Explorer | Settler",
  description:
    "Navigate trust graphs for execution proofs and artifact lineage. Inspect SHA-256 hash chains, verify reconciliation runs, and explore the full evidence DAG.",
};

export default function ProofExplorerPage() {
  return (
    <>
      <Navigation />
      <main id="main-content" className="min-h-screen bg-slate-50 antialiased dark:bg-slate-950">
        <section className="border-b border-slate-200 bg-white px-4 pb-8 pt-24 dark:border-slate-800 dark:bg-slate-900 sm:px-6 sm:pt-28 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500">
              Evidence &amp; Trust
            </p>
            <h1 className="mb-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl lg:text-4xl">
              Proof Explorer
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
              Navigate trust graphs for execution proofs and artifact lineage. Inspect SHA-256 hash
              chains, verify reconciliation runs, and explore the full evidence DAG.
            </p>
          </div>
        </section>

        <section className="px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="mx-auto max-w-6xl space-y-8">
            <ProofLifecycleDiagram />
            <RealityEvidencePanel scope="proof" />
            <ProofExplorer />
          </div>
        </section>

        <section className="border-t border-slate-200 px-4 py-10 dark:border-slate-800 sm:px-6 sm:py-12 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">Run Results</h2>
            <ResultsPanel />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
