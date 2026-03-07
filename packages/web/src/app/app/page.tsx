import { headers } from "next/headers";
import Link from "next/link";

async function getRuns() {
  const h = await headers();
  const host = h.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const res = await fetch(`${protocol}://${host}/api/v1/runs?limit=20`, {
    headers: { authorization: h.get("authorization") || "" },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.rows || [];
}

export default async function AppPage() {
  const runs = await getRuns();
  const mismatches = runs.filter((run: { status?: string }) => run.status !== "succeeded");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Overview</h1>

      <section className="rounded border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Runs</h2>
          <Link href="/app/runs" className="text-sm text-blue-600 hover:underline">
            View all
          </Link>
        </div>
        {runs.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">
            No runs yet. Start your first reconciliation run to populate run history.
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {runs.slice(0, 5).map((run: { run_id: string; created_at: string; status: string }) => (
              <li key={run.run_id} className="rounded border border-slate-100 p-2">
                <div className="font-mono text-xs">{run.run_id}</div>
                <div className="text-slate-600">{run.created_at}</div>
                <div className="font-medium">Status: {run.status}</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Detected Mismatches</h2>
          <Link href="/app/mismatches" className="text-sm text-blue-600 hover:underline">
            Open mismatches
          </Link>
        </div>
        {mismatches.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">
            No mismatches detected in recent runs.
          </p>
        ) : (
          <p className="mt-2 text-sm text-slate-700">
            {mismatches.length} recent run(s) need review. Open the mismatch view to triage by run.
          </p>
        )}
      </section>

      <section className="rounded border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Evidence</h2>
        <p className="mt-2 text-sm text-slate-600">
          Every run stores verifiable evidence. Open Evidence to inspect run fingerprints and proofs.
        </p>
        <Link href="/app/evidence" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
          Go to Evidence
        </Link>
      </section>

      <section className="rounded border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Policies</h2>
        <p className="mt-2 text-sm text-slate-600">
          Rule checks are applied during runs to keep outcomes deterministic and reviewable.
        </p>
        <Link href="/app/policies" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
          Go to Policies
        </Link>
      </section>
    </div>
  );
}
