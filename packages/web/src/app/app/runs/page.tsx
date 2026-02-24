import { createDeterministicRun } from "@/lib/determinism/runs";

export default function RunsPage() {
  const exampleInput = {
    tenantId: "tenant_demo",
    pipeline: "daily-settlement",
    config: {
      sources: ["bank", "processor"],
      tolerances: { amount: 0.01, fee: 0.001 },
      orderBy: ["transaction_id", "settlement_date"],
    },
  };

  const run = createDeterministicRun(exampleInput);

  return (
    <main className="min-h-screen bg-background p-6 text-text-main">
      <h1 className="text-2xl font-bold">Deterministic Runs</h1>
      <p className="mt-2 text-sm text-text-secondary">
        This run record is derived from canonicalized input and deterministic SHA-256 ID rules.
      </p>

      <section className="mt-6 rounded-xl border border-border-light bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Run Record</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div>
            <dt className="font-medium">Run ID</dt>
            <dd className="font-mono">{run.runId}</dd>
          </div>
          <div>
            <dt className="font-medium">Canonical Config Pointer</dt>
            <dd className="font-mono">{run.evidenceManifest.canonicalConfigPointer}</dd>
          </div>
          <div>
            <dt className="font-medium">Summary Pointer</dt>
            <dd className="font-mono">{run.evidenceManifest.summaryPointer}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 rounded-xl border border-border-light bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Canonical Input</h2>
        <pre className="mt-3 overflow-auto rounded-md bg-slate-950 p-4 text-xs text-emerald-200">
          {run.canonicalInput}
        </pre>
      </section>
    </main>
  );
}
