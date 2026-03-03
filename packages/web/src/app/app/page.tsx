import { headers } from "next/headers";

async function getSummary() {
  const h = await headers();
  const host = h.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const res = await fetch(`${protocol}://${host}/api/v1/metrics/summary?window=7d`, {
    headers: { authorization: h.get("authorization") || "" },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function AppPage() {
  const summary = await getSummary();
  const cards = [
    ["Runs (24h)", summary?.runs_total ?? 0],
    ["Success rate", `${Math.round((Number(summary?.success_rate ?? 0) || 0) * 100)}%`],
    ["Replay verified", `${Math.round((Number(summary?.replay_verified_rate ?? 0) || 0) * 100)}%`],
    ["Avg latency", `${Math.round(Number(summary?.avg_latency ?? 0))}ms`],
    ["Rate-limited", `${Math.round((Number(summary?.rate_limited_rate ?? 0) || 0) * 100)}%`],
    ["Cache hit", `${Math.round((Number(summary?.cache_hit_rate ?? 0) || 0) * 100)}%`],
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold">Overview</h1>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded border border-slate-200 bg-white p-4">
            <div className="text-sm text-slate-600">{label}</div>
            <div className="mt-2 text-2xl font-semibold">{String(value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
