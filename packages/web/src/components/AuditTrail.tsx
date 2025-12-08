"use client";

import { useState, useEffect } from "react";
import { SettlerClient } from "@settler/sdk";

interface AuditTrailProps {
  client: SettlerClient;
  apiKey: string;
  jobId?: string;
}

interface AuditLog {
  id: string;
  event: string;
  userId: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export default function AuditTrail({ client: _client, apiKey, jobId }: AuditTrailProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    loadLogs();
  }, [jobId, filter]);

  async function loadLogs() {
    try {
      setLoading(true);
      // Note: This endpoint would need to be implemented in the API
      // For now, this is a placeholder component structure
      const response = await fetch(
        `/api/v1/audit-logs${jobId ? `?job_id=${jobId}` : ""}${filter !== "all" ? `&event=${filter}` : ""}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );
      const data = await response.json();
      setLogs(data.data || []);
    } catch (error) {
      console.error("Failed to load audit logs:", error);
    } finally {
      setLoading(false);
    }
  }

  const eventIcons: Record<string, string> = {
    job_created: "➕",
    job_updated: "✏️",
    job_deleted: "🗑️",
    job_run: "▶️",
    reconciliation_completed: "✅",
    reconciliation_failed: "❌",
    webhook_created: "🔔",
    webhook_deleted: "🔕",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading audit trail...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Audit Trail</h2>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="all">All Events</option>
            <option value="job_created">Job Created</option>
            <option value="job_updated">Job Updated</option>
            <option value="job_run">Job Run</option>
            <option value="reconciliation_completed">Reconciliation Completed</option>
            <option value="reconciliation_failed">Reconciliation Failed</option>
          </select>
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {logs.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            No audit logs found
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="px-6 py-4 hover:bg-gray-50 transition">
              <div className="flex items-start gap-4">
                <div className="text-2xl">{eventIcons[log.event] || "📝"}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {log.event.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {log.metadata && (
                    <div className="mt-2 text-sm text-gray-600">
                      <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
