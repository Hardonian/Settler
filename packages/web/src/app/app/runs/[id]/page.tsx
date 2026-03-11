import Link from "next/link";
import { headers } from "next/headers";

type RunRecord = {
  id: string;
  status?: string;
  created_at?: string;
  policy_hash?: string;
  policy?: string;
  tenant_id?: string;
};

type ReplaySummary = {
  match?: boolean;
  baseline_hash?: string;
  replay_hash?: string;
};

type EvidenceSummary = {
  run_id?: string;
  fingerprint?: string;
  policy_hash?: string;
};

async function fetchFromApi<T>(path: string): Promise<T | null> {
  const h = await headers();
  const host = h.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const res = await fetch(`${protocol}://${host}${path}`, {
    headers: { authorization: h.get("authorization") || "" },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function RunDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [run, replay, evidence] = await Promise.all([
    fetchFromApi<RunRecord>(`/api/v1/runs/${id}`),
    fetchFromApi<ReplaySummary>(`/api/v1/runs/${id}/replay`),
    fetchFromApi<EvidenceSummary>(`/api/v1/runs/${id}/evidence`),
  ]);

  if (!run) {
    return <div className="rounded border border-slate-200 bg-white p-4">Run not found.</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Run Explorer</p>
        <h1 className="text-2xl font-semibold">Run {run.id}</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded border border-slate-200 bg-white p-4 text-sm">
          <h2 className="font-semibold text-slate-900">Execution metadata</h2>
          <div className="mt-2 space-y-1 text-slate-700">
            <div>Status: {run.status ?? "unknown"}</div>
            <div>Created: {run.created_at ?? "n/a"}</div>
            <div>Tenant: {run.tenant_id ?? "n/a"}</div>
            <div>Policy: {run.policy ?? run.policy_hash ?? "n/a"}</div>
          </div>
        </section>

        <section className="rounded border border-slate-200 bg-white p-4 text-sm">
          <h2 className="font-semibold text-slate-900">Deterministic replay status</h2>
          {replay ? (
            <div className="mt-2 space-y-1 text-slate-700">
              <div>Replay verdict: {replay.match ? "hash matched" : "drift detected"}</div>
              <div>Baseline hash: {replay.baseline_hash ?? "not returned"}</div>
              <div>Replay hash: {replay.replay_hash ?? "not returned"}</div>
            </div>
          ) : (
            <p className="mt-2 text-slate-500">
              Replay summary unavailable from API. Run still accessible for investigation.
            </p>
          )}
        </section>
      </div>

      <section className="rounded border border-slate-200 bg-white p-4 text-sm">
        <h2 className="font-semibold text-slate-900">Evidence and lineage context</h2>
        {evidence ? (
          <div className="mt-2 space-y-1 text-slate-700">
            <div>Evidence run id: {evidence.run_id ?? run.id}</div>
            <div>Fingerprint: {evidence.fingerprint ?? "not returned"}</div>
            <div>Policy hash: {evidence.policy_hash ?? run.policy_hash ?? "not returned"}</div>
          </div>
        ) : (
          <p className="mt-2 text-slate-500">Evidence endpoint unavailable for this run.</p>
        )}
        <div className="mt-4 flex flex-wrap gap-4">
          <Link href={`/app/proofs/${run.id}`} className="font-medium text-blue-600">
            Open Truth Explorer for this run →
          </Link>
          <Link href={`/app/replay?runId=${run.id}`} className="font-medium text-blue-600">
            Replay this run →
          </Link>
          <Link href="/app/alerts" className="font-medium text-blue-600">
            Open Live Alerts →
          </Link>
        </div>
      </section>
    </div>
  );
}
