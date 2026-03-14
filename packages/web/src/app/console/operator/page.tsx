"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

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
    activity: {
      recentRuns: Array<{ run_id: string; tenant_id: string; status: string; started_at: string }>;
      failedRuns: Array<{ run_id: string; tenant_id: string; status: string; started_at: string }>;
      errorSignatures: Array<{ signature: string; occurrences_24h: number }>;
      githubIssueTriage: { mode: string; triaged: number; skipped: number; errors: string[] };
    };
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
      last_triggered_at: string;
    }>;
  } | null;
  degraded?: boolean;
  error?: string;
}

interface RunExplorerResponse {
  data: Array<{
    run_id: string;
    tenant_id: string;
    status: string;
    started_at: string;
    completed_at: string | null;
    duration_ms: number;
    match_rate: number;
    manual_review_count: number;
    error_count: number;
  }>;
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export default function OperatorControlPlanePage() {
  const [payload, setPayload] = useState<OperatorPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [ticketResult, setTicketResult] = useState("");

  const [runs, setRuns] = useState<RunExplorerResponse | null>(null);
  const [tenantFilter, setTenantFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [runPage, setRunPage] = useState(1);

  const [liveEvents, setLiveEvents] = useState<
    Array<{ id: string; level: string; message: string }>
  >([]);

  useEffect(() => {
    void loadControlPlane();
  }, []);

  useEffect(() => {
    void loadRuns();
  }, [tenantFilter, statusFilter, runPage]);

  useEffect(() => {
    const timer = setInterval(() => {
      void loadControlPlane(true);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  async function loadControlPlane(isRealtimeRefresh = false) {
    if (!isRealtimeRefresh) setLoading(true);
    const res = await fetch("/api/console/operator/control-plane?days=7");
    const data = (await res.json()) as OperatorPayload;
    setPayload(data);
    if (data.data) {
      setLiveEvents(buildLiveEvents(data.data));
    }
    if (!isRealtimeRefresh) setLoading(false);
  }

  async function loadRuns() {
    const params = new URLSearchParams({ page: String(runPage), pageSize: "8" });
    if (tenantFilter) params.set("tenantId", tenantFilter);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/console/operator/runs?${params.toString()}`);
    const data = (await res.json()) as RunExplorerResponse;
    setRuns(data);
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

  const health = payload?.data?.systemHealth;
  const recentRuns = payload?.data?.activity.recentRuns ?? [];
  const failedRuns = payload?.data?.activity.failedRuns ?? [];
  const recentErrorSpikeCount = useMemo(
    () => payload?.data?.errorIntelligence.regressions.length ?? 0,
    [payload]
  );

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading operator control plane...</p>
        </div>
      </div>
    );
  if (!payload?.data)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md text-center">
          <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">!</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Operator Control Plane Unavailable
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            {payload?.error ??
              "Unable to connect to the control plane. Please verify your environment configuration and try again."}
          </p>
          <button
            onClick={() => loadControlPlane()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Operator Control Plane
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Real-time system health, run performance, and operational intelligence. Auto-refreshes
          every 15 seconds.
        </p>
      </div>
      {payload.degraded ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 px-4 py-3">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Degraded mode:</strong> Some data sources are temporarily unavailable. Partial
            data is shown.
          </p>
        </div>
      ) : null}

      <section className="grid grid-cols-2 md:grid-cols-7 gap-3">
        <Metric label="Runs/day" value={health?.runs_per_day ?? 0} />
        <Metric
          label="Failure rate"
          value={`${Number(health?.run_failure_rate ?? 0).toFixed(2)}%`}
        />
        <Metric label="Match rate" value={`${Number(health?.match_rate ?? 0).toFixed(2)}%`} />
        <Metric
          label="Manual review"
          value={`${Number(health?.manual_review_rate ?? 0).toFixed(2)}%`}
        />
        <Metric label="API error" value={`${Number(health?.api_error_rate ?? 0).toFixed(2)}%`} />
        <Metric label="API p95" value={`${Math.round(Number(health?.api_latency_p95 ?? 0))}ms`} />
        <Metric
          label="Recon p95"
          value={`${Math.round(Number(health?.run_duration_p95 ?? 0))}ms`}
        />
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="rounded border p-4">
          <h2 className="font-semibold">Recent reconciliation runs</h2>
          <ul className="text-sm mt-2 space-y-1">
            {recentRuns.slice(0, 8).map((run) => (
              <li key={run.run_id}>
                {run.run_id.slice(0, 8)} · {run.tenant_id.slice(0, 8)} · {run.status} ·{" "}
                {new Date(run.started_at).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded border p-4">
          <h2 className="font-semibold">Operator risk signals</h2>
          <p className="text-sm mt-2">
            Manual review count pressure: {failedRuns.length} failed runs in latest window
          </p>
          <p className="text-sm">Error spikes in 24h: {recentErrorSpikeCount}</p>
          <p className="text-sm">Alert history entries: {payload.data.alerts.length}</p>
        </div>
      </section>

      <section>
        <a className="text-sm underline" href="/operator/incidents">
          Open incident queue (/operator/incidents)
        </a>
      </section>

      <section className="rounded border p-4">
        <h2 className="font-semibold mb-2">Run explorer</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          <input
            value={tenantFilter}
            onChange={(e) => {
              setRunPage(1);
              setTenantFilter(e.target.value);
            }}
            className="border rounded px-2 py-1"
            placeholder="Filter tenant"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setRunPage(1);
              setStatusFilter(e.target.value);
            }}
            className="border rounded px-2 py-1"
          >
            <option value="">All statuses</option>
            <option value="completed">completed</option>
            <option value="failed">failed</option>
            <option value="running">running</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th>Run ID</th>
                <th>Tenant</th>
                <th>Duration</th>
                <th>Match rate</th>
                <th>Manual review</th>
                <th>Errors</th>
              </tr>
            </thead>
            <tbody>
              {(runs?.data ?? []).map((run) => (
                <tr className="border-b" key={run.run_id}>
                  <td className="py-2">{run.run_id.slice(0, 8)}</td>
                  <td>{run.tenant_id.slice(0, 8)}</td>
                  <td>{Math.round(run.duration_ms)}ms</td>
                  <td>{run.match_rate.toFixed(2)}%</td>
                  <td>{run.manual_review_count}</td>
                  <td>{run.error_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex gap-2 mt-3 text-sm">
          <button
            className="border rounded px-2 py-1"
            disabled={runPage <= 1}
            onClick={() => setRunPage((p) => p - 1)}
          >
            Prev
          </button>
          <span>
            Page {runs?.pagination.page ?? 1} / {runs?.pagination.totalPages ?? 1}
          </span>
          <button
            className="border rounded px-2 py-1"
            disabled={runPage >= (runs?.pagination.totalPages ?? 1)}
            onClick={() => setRunPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </section>

      <section className="rounded border p-4">
        <h2 className="font-semibold">Real-time alert stream</h2>
        <p className="text-xs text-slate-500">Auto-refreshes every 15s</p>
        <ul className="text-sm mt-2 space-y-1">
          {liveEvents.map((event) => (
            <li key={event.id}>
              [{event.level}] {event.message}
            </li>
          ))}
          {!liveEvents.length ? <li>No live alert events.</li> : null}
        </ul>
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

function buildLiveEvents(data: NonNullable<OperatorPayload["data"]>) {
  const events: Array<{ id: string; level: string; message: string }> = [];
  const matchRate = Number(data.systemHealth?.match_rate ?? 100);
  const failureRate = Number(data.systemHealth?.run_failure_rate ?? 0);
  const apiErrorRate = Number(data.systemHealth?.api_error_rate ?? 0);

  if (failureRate >= 6) {
    events.push({
      id: "reconciliation-failures",
      level: "critical",
      message: `Reconciliation failures elevated (${failureRate.toFixed(2)}%).`,
    });
  }
  if (matchRate <= 97) {
    events.push({
      id: "match-rate-drop",
      level: "warning",
      message: `Match rate dropped to ${matchRate.toFixed(2)}%.`,
    });
  }
  if (apiErrorRate >= 2.5) {
    events.push({
      id: "api-error-spike",
      level: "critical",
      message: `API errors spiked (${apiErrorRate.toFixed(2)}%).`,
    });
  }

  for (const alert of data.alerts.slice(0, 5)) {
    events.push({
      id: alert.dedupe_key,
      level: alert.severity,
      message: `${alert.message} (last seen ${new Date(alert.last_triggered_at).toLocaleTimeString()})`,
    });
  }

  return events.slice(0, 8);
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded border p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
