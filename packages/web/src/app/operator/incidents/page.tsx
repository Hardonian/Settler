"use client";

import { useEffect, useState } from "react";
import { RealityEvidencePanel } from "@/components/RealityEvidencePanel";

interface IncidentRecord {
  id: string;
  incident_type: string;
  severity: string;
  tenant_id: string | null;
  run_id: string | null;
  linked_run_id: string | null;
  status: string;
  summary: string;
  evidence: Record<string, unknown>;
  created_at: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
}

interface IncidentResponse {
  data: IncidentRecord[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export default function OperatorIncidentsPage() {
  const [items, setItems] = useState<IncidentRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [linkRunByIncident, setLinkRunByIncident] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    void loadIncidents();
  }, [statusFilter, page]);

  async function loadIncidents() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (statusFilter) params.set("status", statusFilter);
    try {
      const res = await fetch(`/api/operator/incidents?${params.toString()}`);
      if (!res.ok) {
        setLoadError(`Unable to load incidents (${res.status}).`);
        setItems([]);
        return;
      }
      const payload = (await res.json()) as IncidentResponse;
      setLoadError(null);
      setItems(payload.data ?? []);
    } catch {
      setLoadError("Unable to load incidents due to network/runtime error.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function acknowledge(incidentId: string) {
    await fetch("/api/operator/incidents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ incidentId, action: "acknowledge" }),
    });
    await loadIncidents();
  }

  async function linkRun(incidentId: string) {
    const runId = (linkRunByIncident[incidentId] ?? "").trim();
    if (!runId) return;

    await fetch("/api/operator/incidents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ incidentId, action: "link_run", runId }),
    });
    await loadIncidents();
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Operator Incidents</h1>
      <p className="text-sm text-slate-600">
        Track anomaly-driven incidents, acknowledge ownership, and link incidents to reconciliation
        runs.
      </p>

      <div className="flex items-center gap-2">
        <label className="text-sm">Status</label>
        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value);
          }}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="">All</option>
          <option value="open">Open</option>
          <option value="acknowledged">Acknowledged</option>
        </select>
      </div>

      {loadError ? (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {loadError}
        </div>
      ) : null}

      {loading ? (
        <div className="text-sm">Loading incidents…</div>
      ) : (
        <div className="overflow-x-auto rounded border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left">
                <th className="p-2">Type</th>
                <th className="p-2">Severity</th>
                <th className="p-2">Status</th>
                <th className="p-2">Tenant</th>
                <th className="p-2">Run</th>
                <th className="p-2">Summary</th>
                <th className="p-2">Created</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b align-top">
                  <td className="p-2 font-mono">{item.incident_type}</td>
                  <td className="p-2">{item.severity}</td>
                  <td className="p-2">{item.status}</td>
                  <td className="p-2 font-mono">{item.tenant_id?.slice(0, 8) ?? "—"}</td>
                  <td className="p-2 font-mono">
                    {(item.linked_run_id ?? item.run_id)?.slice(0, 8) ?? "—"}
                  </td>
                  <td className="p-2 max-w-[360px]">{item.summary}</td>
                  <td className="p-2">{new Date(item.created_at).toLocaleString()}</td>
                  <td className="p-2 space-y-2">
                    <button
                      type="button"
                      className="border rounded px-2 py-1"
                      onClick={() => acknowledge(item.id)}
                      disabled={item.status === "acknowledged"}
                    >
                      Acknowledge
                    </button>
                    <div className="flex gap-1">
                      <input
                        className="border rounded px-2 py-1 w-36"
                        placeholder="Run UUID"
                        value={linkRunByIncident[item.id] ?? ""}
                        onChange={(e) =>
                          setLinkRunByIncident((prev) => ({ ...prev, [item.id]: e.target.value }))
                        }
                      />
                      <button
                        type="button"
                        className="border rounded px-2 py-1"
                        onClick={() => linkRun(item.id)}
                      >
                        Link
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!items.length ? (
                <tr>
                  <td className="p-3 text-sm text-slate-500" colSpan={8}>
                    No incidents found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      <RealityEvidencePanel scope="console" title="Operator incident evidence references" />
    </div>
  );
}
