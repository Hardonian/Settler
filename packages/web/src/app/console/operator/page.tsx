"use client";

import { useEffect, useState } from "react";

interface Payload {
  data: any;
  degraded?: boolean;
  error?: string;
}

export default function OperatorControlPlanePage() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/console/operator/control-plane?days=7");
      const data = await res.json();
      setPayload(data);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="p-6">Loading operator control plane…</div>;
  if (!payload?.data)
    return (
      <div className="p-6">Operator control plane unavailable: {payload?.error ?? "unknown"}</div>
    );

  const { systemHealth, usage, financial, tenantOverview, errorIntelligence, capabilities } =
    payload.data;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Operator Control Plane</h1>
      {payload.degraded && (
        <p className="text-sm text-amber-600">Degraded mode: partial data available.</p>
      )}

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric label="Runs/day" value={systemHealth?.runs_per_day ?? 0} />
        <Metric
          label="Failure rate"
          value={`${Number(systemHealth?.run_failure_rate ?? 0).toFixed(2)}%`}
        />
        <Metric label="Match rate" value={`${Number(systemHealth?.match_rate ?? 0).toFixed(2)}%`} />
        <Metric
          label="Manual review"
          value={`${Number(systemHealth?.manual_review_rate ?? 0).toFixed(2)}%`}
        />
        <Metric label="Run p50" value={`${Math.round(systemHealth?.run_duration_p50 ?? 0)}ms`} />
        <Metric label="Run p95" value={`${Math.round(systemHealth?.run_duration_p95 ?? 0)}ms`} />
        <Metric label="API p50" value={`${Math.round(systemHealth?.api_latency_p50 ?? 0)}ms`} />
        <Metric
          label="API error"
          value={`${Number(systemHealth?.api_error_rate ?? 0).toFixed(2)}%`}
        />
      </section>

      <section>
        <h2 className="font-semibold mb-2">Usage Analytics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Metric label="Active tenants (7d)" value={usage.activeTenants7d} />
          <Metric label="Active tenants (30d)" value={usage.activeTenants30d} />
          <Metric label="Runs (30d)" value={usage.runs30d} />
          <Metric label="Records (30d)" value={usage.records30d} />
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Financial / Unit Economics</h2>
        <p>Estimated compute/run: ${financial.estimatedComputeCostPerRunUsd}</p>
        <p>Estimated compute cost (30d): ${financial.estimatedComputeCost30dUsd}</p>
        <p>Margin proxy: {financial.marginProxy}</p>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Top Error Signatures</h2>
        <ul className="text-sm space-y-1">
          {errorIntelligence.top24h.map((err: any) => (
            <li key={String(err.signature)}>
              {String(err.signature)} — {String(err.occurrences_24h)} in 24h
            </li>
          ))}
          {!errorIntelligence.top24h.length && <li>No error signatures in last 24h.</li>}
        </ul>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Top Tenants (30d run volume)</h2>
        <ul className="text-sm space-y-1">
          {tenantOverview.map((t: any) => (
            <li key={String(t.tenant_id)}>
              {String(t.tenant_id)} — {String(t.run_count)} runs,{" "}
              {Number(t.failure_rate).toFixed(2)}% failures
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Capability Status</h2>
        <p>GitHub triage: {capabilities.githubIssueTriage ? "available" : "unavailable"}</p>
        <p>Stripe revenue: {capabilities.stripeRevenue ? "available" : "unavailable"}</p>
        <p>Slack alerts: {capabilities.slackAlerts ? "available" : "unavailable"}</p>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Support Intake</h2>
        <button
          className="border px-3 py-1 rounded"
          onClick={async () => {
            await fetch("/api/console/operator/control-plane", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                subject: "Operator ticket",
                description: "Created from control plane",
              }),
            });
            alert("Support ticket submitted");
          }}
        >
          Create support ticket
        </button>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded border p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
