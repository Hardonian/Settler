"use client";

import { FormEvent, useEffect, useState } from "react";

interface OperatorPayload {
  data: {
    systemHealth: Record<string, number> | null;
    usage: {
      activeTenants7d: number;
      activeTenants30d: number;
      runs30d: number;
      records30d: number;
      apiRequests30d: number;
      uiRequests30d: number;
    };
    financial: {
      estimatedComputeCostPerRunUsd: number;
      estimatedComputeCost30dUsd: number;
      realizedRevenue30dProxyUsd: number;
      revenuePerRunUsd: number | null;
      marginProxyPercent: number | null;
      assumptions: string[];
      tenantEconomics: Array<{
        tenant_id: string;
        runs_30d: number;
        records_30d: number;
        estimated_mrr_usd: number;
      }>;
    };
    activity: {
      errorSignatures: Array<{ signature: string; occurrences_24h: number }>;
      githubIssueTriage: { mode: string; triaged: number; skipped: number; errors: string[] };
    };
    tenantOverview: Array<{
      tenant_id: string;
      run_count: number;
      failure_rate: number;
      manual_review_rate: number;
    }>;
    errorIntelligence: {
      top24h: Array<{ signature: string; occurrences_24h: number }>;
      newSignatures: Array<{ signature: string }>;
      regressions: Array<{ signature: string; occurrences_24h: number }>;
    };
    alerts: Array<{
      dedupe_key: string;
      metric: string;
      severity: string;
      triggered_count: number;
      message: string;
      last_value: number;
      baseline_value: number;
      last_triggered_at: string;
    }>;
    capabilities: { githubIssueTriage: boolean; stripeRevenue: boolean; slackAlerts: boolean };
  } | null;
  degraded?: boolean;
  error?: string;
}

export default function OperatorControlPlanePage() {
  const [payload, setPayload] = useState<OperatorPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [ticketResult, setTicketResult] = useState<string>("");

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/console/operator/control-plane?days=7");
    const data = (await res.json()) as OperatorPayload;
    setPayload(data);
    setLoading(false);
  }

  async function submitTicket(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = {
      subject: String(form.get("subject") ?? ""),
      description: String(form.get("description") ?? ""),
      tenantId: String(form.get("tenantId") || "") || undefined,
      runId: String(form.get("runId") || "") || undefined,
      errorSignature: String(form.get("errorSignature") || "") || undefined,
      category: "operator",
    };
    const res = await fetch("/api/console/operator/control-plane", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = (await res.json()) as {
      success: boolean;
      ticketNumber?: string;
      error?: string;
    };
    setTicketResult(
      result.success ? `Ticket created: ${result.ticketNumber}` : `Ticket failed: ${result.error}`
    );
  }

  if (loading) return <div className="p-6">Loading operator control plane…</div>;
  if (!payload?.data)
    return (
      <div className="p-6">Operator control plane unavailable: {payload?.error ?? "unknown"}</div>
    );

  const {
    systemHealth,
    usage,
    financial,
    tenantOverview,
    errorIntelligence,
    capabilities,
    alerts,
    activity,
  } = payload.data;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Operator Control Plane</h1>
      {payload.degraded ? (
        <p className="text-sm text-amber-600">Degraded mode: partial data available.</p>
      ) : null}

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
        <Metric label="Run p95" value={`${Math.round(systemHealth?.run_duration_p95 ?? 0)}ms`} />
        <Metric label="API p95" value={`${Math.round(systemHealth?.api_latency_p95 ?? 0)}ms`} />
        <Metric
          label="API error"
          value={`${Number(systemHealth?.api_error_rate ?? 0).toFixed(2)}%`}
        />
      </section>

      <section>
        <h2 className="font-semibold mb-2">Usage analytics</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Metric label="Active tenants (7d)" value={usage.activeTenants7d} />
          <Metric label="Active tenants (30d)" value={usage.activeTenants30d} />
          <Metric label="Runs (30d)" value={usage.runs30d} />
          <Metric label="Records (30d)" value={usage.records30d} />
          <Metric label="API requests (30d)" value={usage.apiRequests30d} />
          <Metric label="UI requests (30d)" value={usage.uiRequests30d} />
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Financial / unit economics</h2>
        <p>Revenue proxy (30d): ${financial.realizedRevenue30dProxyUsd}</p>
        <p>Compute cost proxy (30d): ${financial.estimatedComputeCost30dUsd}</p>
        <p>Revenue / run: {financial.revenuePerRunUsd ?? "n/a"}</p>
        <p>
          Margin proxy:{" "}
          {financial.marginProxyPercent === null
            ? "unavailable"
            : `${financial.marginProxyPercent}%`}
        </p>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Alert history (deduped)</h2>
        <ul className="text-sm space-y-1">
          {alerts.map((alert) => (
            <li key={alert.dedupe_key}>
              [{alert.severity}] {alert.message} · seen {alert.triggered_count}x ·{" "}
              {new Date(alert.last_triggered_at).toLocaleString()}
            </li>
          ))}
          {!alerts.length ? <li>No active anomalies.</li> : null}
        </ul>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Error intelligence</h2>
        <p>New signatures (24h): {errorIntelligence.newSignatures.length}</p>
        <p>Regressions: {errorIntelligence.regressions.length}</p>
        <ul className="text-sm space-y-1 mt-2">
          {errorIntelligence.top24h.map((err) => (
            <li key={err.signature}>
              {err.signature} — {err.occurrences_24h} in 24h
            </li>
          ))}
          {!errorIntelligence.top24h.length ? <li>No signatures in last 24h.</li> : null}
        </ul>
      </section>

      <section>
        <h2 className="font-semibold mb-2">GitHub triage automation</h2>
        <p>Mode: {activity.githubIssueTriage.mode}</p>
        <p>Triaged this cycle: {activity.githubIssueTriage.triaged}</p>
        <p>Skipped (dedupe/cooldown): {activity.githubIssueTriage.skipped}</p>
        {activity.githubIssueTriage.errors.length ? (
          <p className="text-red-600">{activity.githubIssueTriage.errors[0]}</p>
        ) : null}
      </section>

      <section>
        <h2 className="font-semibold mb-2">Top tenants by run volume</h2>
        <ul className="text-sm space-y-1">
          {tenantOverview.map((t) => (
            <li key={t.tenant_id}>
              {t.tenant_id} — {t.run_count} runs, failure {t.failure_rate.toFixed(2)}%, manual
              review {t.manual_review_rate.toFixed(2)}%
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Capability status</h2>
        <p>GitHub triage: {capabilities.githubIssueTriage ? "available" : "unavailable"}</p>
        <p>Stripe revenue: {capabilities.stripeRevenue ? "available" : "unavailable"}</p>
        <p>Slack alerts: {capabilities.slackAlerts ? "available" : "unavailable"}</p>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Support intake</h2>
        <form className="space-y-2 max-w-xl" onSubmit={submitTicket}>
          <input
            className="border rounded px-2 py-1 w-full"
            name="subject"
            placeholder="Subject"
            required
          />
          <textarea
            className="border rounded px-2 py-1 w-full"
            name="description"
            placeholder="Description"
            required
            rows={4}
          />
          <input
            className="border rounded px-2 py-1 w-full"
            name="tenantId"
            placeholder="tenant UUID (optional)"
          />
          <input
            className="border rounded px-2 py-1 w-full"
            name="runId"
            placeholder="run UUID (optional)"
          />
          <input
            className="border rounded px-2 py-1 w-full"
            name="errorSignature"
            placeholder="error signature (optional)"
          />
          <button className="border px-3 py-1 rounded" type="submit">
            Create support ticket
          </button>
        </form>
        {ticketResult ? <p className="text-sm mt-2">{ticketResult}</p> : null}
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
