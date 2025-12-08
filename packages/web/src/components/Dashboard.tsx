"use client";

import { useState, useEffect } from "react";
import { SettlerClient } from "@settler/sdk";

interface DashboardProps {
  apiKey: string;
}

interface Job {
  id: string;
  name: string;
  status: "active" | "paused" | "archived";
  lastRun?: string;
  nextRun?: string;
  summary?: {
    matched: number;
    unmatched: number;
    accuracy: number;
  };
}

export default function Dashboard({ apiKey }: DashboardProps) {
  const [client] = useState(() => new SettlerClient({ apiKey }));
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    try {
      setLoading(true);
      const response = await client.jobs.list({ limit: 100 });
      setJobs(response.data || []);
    } catch (error) {
      console.error("Failed to load jobs:", error);
    } finally {
      setLoading(false);
    }
  }

  async function runJob(jobId: string) {
    try {
      await client.jobs.run(jobId);
      await loadJobs();
    } catch (error) {
      console.error("Failed to run job:", error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reconciliation Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Monitor and manage your reconciliation jobs
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Jobs"
            value={jobs.length}
            icon="📊"
          />
          <StatCard
            title="Active Jobs"
            value={jobs.filter((j) => j.status === "active").length}
            icon="✅"
          />
          <StatCard
            title="Archived Jobs"
            value={jobs.filter((j) => j.status === "archived").length}
            icon="📦"
          />
          <StatCard
            title="Total Matched"
            value={jobs.reduce((sum, j) => sum + (j.summary?.matched || 0), 0)}
            icon="🎯"
          />
        </div>

        {/* Jobs List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Reconciliation Jobs</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {jobs.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                No jobs found. Create your first reconciliation job to get started.
              </div>
            ) : (
              jobs.map((job) => (
                <JobRow
                  key={job.id}
                  job={job}
                  onSelect={() => setSelectedJob(job)}
                  onRun={() => runJob(job.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Job Detail Modal */}
        {selectedJob && (
          <JobDetailModal
            job={selectedJob}
            client={client}
            onClose={() => setSelectedJob(null)}
          />
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

function JobRow({
  job,
  onSelect,
  onRun,
}: {
  job: Job;
  onSelect: () => void;
  onRun: () => void;
}) {
  const statusColors = {
    active: "bg-green-100 text-green-800",
    paused: "bg-yellow-100 text-yellow-800",
    archived: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="px-6 py-4 hover:bg-gray-50 transition">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3
              className="text-lg font-medium text-gray-900 cursor-pointer hover:text-blue-600"
              onClick={onSelect}
            >
              {job.name}
            </h3>
            <span
              className={`px-2 py-1 text-xs font-semibold rounded ${statusColors[job.status]}`}
            >
              {job.status}
            </span>
          </div>
          {job.summary && (
            <div className="mt-2 flex items-center gap-6 text-sm text-gray-600">
              <span>Matched: {job.summary.matched}</span>
              <span>Unmatched: {job.summary.unmatched}</span>
              <span>Accuracy: {job.summary.accuracy.toFixed(1)}%</span>
            </div>
          )}
          {job.lastRun && (
            <p className="text-xs text-gray-500 mt-1">
              Last run: {new Date(job.lastRun).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRun}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Run Now
          </button>
          <button
            onClick={onSelect}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}

function JobDetailModal({
  job,
  client,
  onClose,
}: {
  job: Job;
  client: SettlerClient;
  onClose: () => void;
}) {
  const [report, setReport] = useState<{
    summary?: {
      matched?: number;
      unmatched?: number;
      accuracy?: number;
    };
    unmatched?: Array<{
      sourceId?: string;
      targetId?: string;
      reason?: string;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [job.id]);

  async function loadReport() {
    try {
      setLoading(true);
      const response = await client.reports.get(job.id);
      setReport(response.data);
    } catch (error) {
      console.error("Failed to load report:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{job.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-4">
          {loading ? (
            <div className="text-center py-8">Loading report...</div>
          ) : report ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded">
                    <p className="text-sm text-gray-600">Matched</p>
                    <p className="text-2xl font-bold text-green-600">
                      {report.summary?.matched || 0}
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded">
                    <p className="text-sm text-gray-600">Unmatched</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {report.summary?.unmatched || 0}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded">
                    <p className="text-sm text-gray-600">Accuracy</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {report.summary?.accuracy?.toFixed(1) || 0}%
                    </p>
                  </div>
                </div>
              </div>
              {report.unmatched && report.unmatched.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Unmatched Records</h3>
                  <div className="border border-gray-200 rounded overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Source ID
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Target ID
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Reason
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {report.unmatched.slice(0, 10).map((record, idx: number) => (
                          <tr key={idx}>
                            <td className="px-4 py-3 text-sm">{record.sourceId || "-"}</td>
                            <td className="px-4 py-3 text-sm">{record.targetId || "-"}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {record.reason || "No match found"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No report data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
