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
    <div>
      <h1 className="text-2xl font-semibold">Metrics</h1>
      <div className="mt-4 rounded border border-slate-200 bg-white p-4">
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
