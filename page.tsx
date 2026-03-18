"use client";
import React, { useState, useEffect } from "react";

export default function InfrastructureControlPage() {
  const [stats, setStats] = useState<any[]>([]);
  const [settings, setSettings] = useState({
    max_statement_timeout_ms: 10000,
    max_worker_concurrency: 10,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/v1/operator/infrastructure/pool-stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        if (data.settings) setSettings(data.settings);
      }
      setLoading(false);
    };
    fetchData();
    // Poll every 5 seconds for live connection pooling proof
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSave = async () => {
    await fetch("/api/v1/operator/infrastructure/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    alert("Settings enforced globally. Statement timeouts are now active.");
  };

  if (loading) return <div>Loading Infrastructure Reality...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Infrastructure Controls</h1>
        <p className="text-gray-500">
          Live PgBouncer connection usage and dynamic enforcement thresholds.
        </p>
      </div>

      <div className="bg-white p-6 shadow rounded border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">
          Live Connection Pool Reality (pg_stat_activity)
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`p-4 rounded-lg border ${stat.state === "active" ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}
            >
              <p className="text-sm font-medium text-gray-500">
                {stat.state || "unknown"} {stat.is_waiting ? "(waiting on lock)" : ""}
              </p>
              <p className="text-3xl font-bold text-gray-900">{stat.count}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 shadow rounded border border-gray-200 space-y-6">
        <h2 className="text-lg font-semibold border-b pb-2">Global Constraints Enforcement</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Max Statement Timeout (ms)
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Queries exceeding this duration will be aggressively killed to protect the pool.
          </p>
          <input
            type="number"
            value={settings.max_statement_timeout_ms}
            onChange={(e) =>
              setSettings({ ...settings, max_statement_timeout_ms: parseInt(e.target.value) })
            }
            className="mt-1 block w-1/3 rounded-md border-gray-300 shadow-sm sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Background Worker Concurrency Limit
          </label>
          <p className="text-xs text-gray-500 mb-2">Maximum active workers processing the queue.</p>
          <input
            type="number"
            value={settings.max_worker_concurrency}
            onChange={(e) =>
              setSettings({ ...settings, max_worker_concurrency: parseInt(e.target.value) })
            }
            className="mt-1 block w-1/3 rounded-md border-gray-300 shadow-sm sm:text-sm"
          />
        </div>

        <button
          onClick={handleSave}
          className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700"
        >
          Enforce Global Constraints
        </button>
      </div>
    </div>
  );
}
