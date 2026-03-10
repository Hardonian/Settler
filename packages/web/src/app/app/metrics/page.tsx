import { headers } from "next/headers";

async function getTop() {
  const h = await headers();
  const host = h.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const res = await fetch(
    `${protocol}://${host}/api/v1/metrics/top?kind=slow_routes&window=7d&limit=10`,
    {
      headers: { authorization: h.get("authorization") || "" },
      cache: "no-store",
    }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.rows || [];
}

export default async function MetricsPage() {
  const rows = await getTop();
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Runtime Event Model
        </p>
        <h1 className="text-2xl font-semibold">Runtime Event Signals</h1>
        <p className="mt-1 text-sm text-slate-600">
          Event-derived route telemetry for operator triage. This surface currently focuses on top
          slow routes and should be read as partial runtime event visibility.
        </p>
      </div>

      <div className="rounded border border-slate-200 bg-white p-4">
        <div className="mb-2 text-sm text-slate-600">Top slow routes (7d)</div>
        <ul className="space-y-2 text-sm">
          {rows.length === 0 ? (
            <li className="text-slate-500">No metrics found.</li>
          ) : (
            rows.map((row: any) => (
              <li key={row.route}>
                {row.route}: {Math.round(Number(row.avg_latency_ms ?? 0))}ms avg
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
