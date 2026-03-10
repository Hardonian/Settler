import Link from "next/link";

const queryModes = [
  {
    key: "Run ID",
    description: "Fetch the canonical evidence bundle for a specific reconciliation run.",
    example: "/api/v1/runs/run_01HXYZ/evidence",
  },
  {
    key: "Fingerprint",
    description: "Confirm exact deterministic output lineage for a known fingerprint.",
    example: "/api/v1/runs/:id/evidence?fingerprint=sha256:...",
  },
  {
    key: "Policy hash",
    description: "Audit which policy version was active when a run was executed.",
    example: "/api/v1/runs/:id/evidence?policy_hash=...",
  },
];

export default function EvidencePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Trust Surface
        </p>
        <h1 className="text-2xl font-semibold">Evidence Query Surface</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Evidence retrieval is tenant-scoped and designed for deterministic audit workflows. Query
          by run identifier, fingerprint, or policy hash from the run evidence endpoint.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-700">
          Endpoint:{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5">/api/v1/runs/:id/evidence</code>
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {queryModes.map((mode) => (
          <article key={mode.key} className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-900">{mode.key}</h2>
            <p className="mt-2 text-sm text-slate-600">{mode.description}</p>
            <p className="mt-3 break-all rounded bg-slate-50 p-2 font-mono text-xs text-slate-700">
              {mode.example}
            </p>
          </article>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/app/runs" className="font-medium text-blue-600">
          Open Run Explorer →
        </Link>
        <Link href="/app/proofs" className="font-medium text-blue-600">
          Open Truth Explorer →
        </Link>
        <Link href="/app/settings" className="font-medium text-blue-600">
          Review Tenant Isolation Controls →
        </Link>
      </div>
    </div>
  );
}
