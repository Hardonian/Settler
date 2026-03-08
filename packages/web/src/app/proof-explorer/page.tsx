import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ProofExplorer } from "@/components/proof/ProofExplorer";
import { ResultsPanel } from "@/components/stitch-import/ResultsPanel";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Hash, GitBranch, Eye, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Proof Explorer | Settler",
  description:
    "Inspect SHA-256 evidence chains and artifact lineage for any reconciliation run. Verify that results were not altered after the fact.",
};

const proofFeatures = [
  {
    icon: Hash,
    title: "SHA-256 Hash Chains",
    description:
      "Every run produces a hash over its full evidence payload — inputs, rules, matched records, and variances. Changing any part of the output after the run invalidates the hash.",
  },
  {
    icon: GitBranch,
    title: "Artifact Lineage",
    description:
      "Trace the full execution path: which adapter version ingested data, which rule version was evaluated, and which records contributed to each match decision.",
  },
  {
    icon: Eye,
    title: "Run-by-Run Verification",
    description:
      "Select any historical run and verify its evidence file against the stored hash. Useful for responding to audit queries without re-running reconciliation.",
  },
  {
    icon: ShieldCheck,
    title: "Export for Review",
    description:
      "Download evidence artifacts as self-contained JSON files. Attach to internal audit packages or share with external reviewers.",
  },
];

export default function ProofExplorerPage() {
  return (
    <>
      <Navigation />
      <main id="main-content" className="min-h-screen bg-slate-50 dark:bg-slate-950 antialiased">
        {/* Page header */}
        <section className="pt-24 sm:pt-28 pb-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500 mb-3">
              Evidence &amp; Verification
            </p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-4">
              Proof Explorer
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed mb-6">
              Every reconciliation run produces an evidence file: a complete record of inputs, rules
              applied, matched pairs, variances, and a SHA-256 hash over the entire payload. Proof
              Explorer lets you inspect that evidence — verify the hash, trace the artifact lineage,
              and confirm that results have not been altered after the run completed.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                asChild
                className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 px-7 py-5 font-semibold shadow-lg transition-all duration-200"
              >
                <Link href="/app/proofs" className="flex items-center gap-2">
                  Open Proof Explorer
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="px-7 py-5 border-slate-300 dark:border-slate-700 font-medium"
              >
                <Link href="/security-and-audit">Review security architecture</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* What proof means */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950">
          <div className="max-w-6xl mx-auto">
            <div className="mb-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500 mb-3">
                What the evidence model provides
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Tamper-detectable, human-reviewable evidence.
              </h2>
              <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                The evidence file is not a certification and does not constitute an audit. It is a
                machine-readable, hash-protected record of what happened in a specific run — useful
                for internal review, incident investigation, and audit support.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {proofFeatures.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={idx}
                    className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all duration-200"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                      <Icon
                        className="w-5 h-5 text-slate-700 dark:text-slate-300"
                        aria-hidden="true"
                      />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1.5 tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Explorer panel */}
        <section className="py-8 sm:py-10 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Evidence Explorer
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Inspect run artifacts, verify hashes, and trace lineage for any reconciliation run.
            </p>
            <ProofExplorer />
          </div>
        </section>

        <section className="py-10 sm:py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Run Results</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Matched records, flagged variances, and resolution history.
            </p>
            <ResultsPanel />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
