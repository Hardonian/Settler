import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ProofExplorer } from "@/components/proof/ProofExplorer";

export const metadata = {
  title: "Proof Explorer | Settler",
  description:
    "Navigate trust graphs for execution proofs and artifact lineage. Inspect SHA-256 hash chains, verify reconciliation runs, and explore the full evidence DAG.",
};

export default function ProofExplorerPage() {
  return (
    <>
      <Navigation />
      <main id="main-content" className="min-h-screen bg-slate-50 dark:bg-slate-950 antialiased">
        {/* Page header */}
        <section className="pt-24 sm:pt-28 pb-8 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500 mb-3">
              Evidence &amp; Trust
            </p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-3">
              Proof Explorer
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              Navigate trust graphs for execution proofs and artifact lineage. Inspect SHA-256 hash
              chains, verify reconciliation runs, and explore the full evidence DAG.
            </p>
          </div>
        </section>

        {/* Explorer panel */}
        <section className="py-8 sm:py-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <ProofExplorer />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
