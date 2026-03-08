import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  GitBranch,
  CheckCircle2,
  Clock,
  Hash,
  RefreshCw,
  Shield,
  Terminal,
} from "lucide-react";

export const metadata = {
  title: "Deterministic Replay Lab | Settler",
  description:
    "Inspect replay timelines with expected-vs-observed hash diffs. Verify determinism, debug mismatches, and audit past reconciliation runs.",
};

const capabilities = [
  {
    icon: RefreshCw,
    title: "Exact Replay",
    description:
      "Re-run any historical reconciliation with the same data snapshot and rules configuration. Same inputs, guaranteed same outputs.",
  },
  {
    icon: Hash,
    title: "Hash Diff Inspection",
    description:
      "Compare expected vs. observed SHA-256 hashes at every step in the execution timeline. Pinpoint exactly where and why drift occurred.",
  },
  {
    icon: GitBranch,
    title: "Timeline Visualization",
    description:
      "Navigate the full execution DAG — match passes, rule evaluations, variance flags — as an interactive timeline with full context.",
  },
  {
    icon: Shield,
    title: "Audit Evidence Export",
    description:
      "Export replay results as a signed, self-contained evidence bundle. Attach to audit packages or share with reviewers.",
  },
];

const terminalLines = [
  { prefix: "$", text: "settler replay --run-id rec_01HX9K2W --snapshot HEAD", type: "cmd" },
  { prefix: "→", text: "Loading execution snapshot run rec_01HX9K2W...", type: "info" },
  {
    prefix: "→",
    text: "Rules: v2.4.1 · Adapter: stripe + postgres · Records: 14,822",
    type: "info",
  },
  { prefix: "→", text: "Replaying 3 reconciliation passes...", type: "info" },
  { prefix: "✓", text: "Pass 1/3 complete — 14,691 matched (SHA256: a3f9c1...)", type: "success" },
  { prefix: "✓", text: "Pass 2/3 complete — 128 flagged  (SHA256: b72d4e...)", type: "success" },
  { prefix: "✓", text: "Pass 3/3 complete — 3 escalated  (SHA256: 9e1a0f...)", type: "success" },
  { prefix: "→", text: "Hash chain verified. Determinism confirmed.", type: "info" },
  {
    prefix: "✓",
    text: "Evidence bundle written to ./replay-evidence-rec_01HX9K2W.json",
    type: "success",
  },
];

export default function ReplayLabPage() {
  return (
    <>
      <Navigation />
      <main id="main-content" className="min-h-screen bg-slate-50 dark:bg-slate-950 antialiased">
        {/* Hero */}
        <section className="pt-24 sm:pt-28 lg:pt-36 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500 mb-4">
              Deterministic Replay
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white tracking-tight mb-5 leading-[1.1]">
              Replay Lab
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed mb-8">
              Validate determinism with timeline replay and hash-diff inspection from real execution
              receipts. Re-run any past reconciliation, verify its outputs, and export the evidence.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                asChild
                className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 px-7 py-5 font-semibold shadow-lg transition-all duration-200"
              >
                <Link href="/app/replay" className="flex items-center gap-2">
                  Open Replay Surface
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="px-7 py-5 border-slate-300 dark:border-slate-700 font-medium"
              >
                <Link href="/docs/replay-lab">Read the Docs</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950">
          <div className="max-w-6xl mx-auto">
            <div className="mb-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500 mb-3">
                What Replay Lab Does
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Verify every run. Debug any mismatch. Prove the results.
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {capabilities.map((cap, idx) => {
                const Icon = cap.icon;
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
                      {cap.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {cap.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Terminal preview */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
                CLI Preview
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                Replay from the terminal
              </h2>
              <p className="text-slate-400 leading-relaxed max-w-2xl">
                The Settler CLI makes any past run replayable. Pass a run ID and the CLI will
                reconstruct the execution, verify the hash chain, and confirm determinism.
              </p>
            </div>

            {/* Terminal window */}
            <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-900 border-b border-slate-800">
                <div className="w-3 h-3 rounded-full bg-red-500/80" aria-hidden="true" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" aria-hidden="true" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" aria-hidden="true" />
                <div className="ml-3 flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                  <span className="text-xs text-slate-500 font-mono">settler-cli</span>
                </div>
              </div>
              <div className="p-5 font-mono text-sm space-y-2 leading-relaxed">
                {terminalLines.map((line, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span
                      className={
                        line.type === "cmd"
                          ? "text-slate-500 flex-shrink-0 w-4"
                          : line.type === "success"
                            ? "text-green-400 flex-shrink-0 w-4"
                            : "text-blue-400 flex-shrink-0 w-4"
                      }
                    >
                      {line.prefix}
                    </span>
                    <span
                      className={
                        line.type === "cmd"
                          ? "text-slate-200"
                          : line.type === "success"
                            ? "text-slate-300"
                            : "text-slate-500"
                      }
                    >
                      {line.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
              {[
                {
                  icon: Clock,
                  title: "Point-in-time replay",
                  desc: "Any past run, reconstructed exactly",
                },
                {
                  icon: CheckCircle2,
                  title: "Determinism verified",
                  desc: "Hash chain confirms identical output",
                },
                {
                  icon: Shield,
                  title: "Evidence bundle",
                  desc: "Signed export ready for audit packages",
                },
              ].map((f, idx) => {
                const Icon = f.icon;
                return (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-slate-300" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{f.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{f.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-4">
              Ready to replay a run?
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed max-w-xl mx-auto">
              Open the control-plane replay surface to inspect a specific run, or read the docs to
              learn how replay integrates with your CI pipeline.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                asChild
                className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 px-8 font-semibold shadow-lg"
              >
                <Link href="/app/replay" className="flex items-center gap-2">
                  Open Replay Surface
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="px-8 border-slate-300 dark:border-slate-700"
              >
                <Link href="/docs/replay-lab">Read the Docs</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
