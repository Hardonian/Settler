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

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 text-sm font-medium text-slate-700">Top slow routes (7d)</div>
        {rows.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-slate-500 mb-1">No metrics found for this period.</p>
            <p className="text-xs text-slate-400">
              Metrics are collected from API route telemetry. Data will appear once routes begin
              receiving traffic.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {rows.map((row: any) => (
              <div key={row.route} className="flex items-center justify-between py-2">
                <code className="text-sm text-slate-700 font-mono">{row.route}</code>
                <span className="text-sm font-medium text-slate-900">
                  {Math.round(Number(row.avg_latency_ms ?? 0))}ms
                  <span className="text-xs text-slate-500 ml-1">avg</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
