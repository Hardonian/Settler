import Link from 'next/link';

export default function EngineLandingPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold text-white">Settler Engine (OSS)</h1>
        <p className="text-base text-white/70">
          Run deterministic reconciliation locally or in CI, then import results into the OSS UI to surface
          discrepancies without any server dependency.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/engine/create-run-pack"
          className="rounded-xl border border-white/10 bg-white/5 p-4 text-white transition hover:border-white/20"
        >
          <h2 className="text-lg font-semibold">Create Run Pack</h2>
          <p className="mt-2 text-sm text-white/70">
            Bundle inputs + ruleset into a portable zip for local or CI runs.
          </p>
        </Link>
        <Link
          href="/engine/import-results"
          className="rounded-xl border border-white/10 bg-white/5 p-4 text-white transition hover:border-white/20"
        >
          <h2 className="text-lg font-semibold">Import Results</h2>
          <p className="mt-2 text-sm text-white/70">
            Upload engine_output.json and evidence bundles to review summaries.
          </p>
        </Link>
        <Link
          href="/engine/view-variances"
          className="rounded-xl border border-white/10 bg-white/5 p-4 text-white transition hover:border-white/20"
        >
          <h2 className="text-lg font-semibold">View Variances</h2>
          <p className="mt-2 text-sm text-white/70">
            Drill into discrepancies captured from your last import.
          </p>
        </Link>
      </div>
      <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-4 text-sm text-amber-100">
        Settler OSS surfaces discrepancies and provides audit-safe evidence bundles. It does not guarantee
        compliance or correctness.
      </div>
    </div>
  );
}
