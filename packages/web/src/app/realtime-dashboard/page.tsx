/**
 * Real-time Reconciliation Dashboard
 * Next.js/React page showing live reconciliation progress
 */

'use client';

import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { useRealtimeExecution } from '@/lib/hooks/use-realtime-execution';

interface PageProps {
  params?: Record<string, string | string[] | undefined>;
  searchParams?: Record<string, string | string[] | undefined>;
}

export default function RealtimeDashboard({ params, searchParams }: PageProps) {
  const jobId = (params?.jobId as string | undefined) || (searchParams?.jobId as string | undefined) || '';
  const apiKey = (searchParams?.apiKey as string | undefined) || '';

  const { connected, execution, logs, errors } = useRealtimeExecution({
    jobId,
    apiKey,
    enabled: !!jobId && !!apiKey,
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 dark:text-green-400';
      case 'failed':
        return 'text-red-600 dark:text-red-400';
      case 'running':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  const formatDuration = (startedAt?: string, completedAt?: string) => {
    if (!startedAt) return 'N/A';
    const start = new Date(startedAt);
    const end = completedAt ? new Date(completedAt) : new Date();
    const ms = end.getTime() - start.getTime();
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        <h1 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">Reconciliation Dashboard</h1>

      {/* Connection Status */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              connected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Execution Status */}
      {execution && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-6 border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Execution Status</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-slate-600 dark:text-slate-400">Status:</span>
              <span className={`ml-2 font-semibold ${getStatusColor(execution.status)}`}>
                {execution.status?.toUpperCase()}
              </span>
            </div>
            <div>
              <span className="text-slate-600 dark:text-slate-400">Duration:</span>
              <span className="ml-2 font-semibold text-slate-900 dark:text-white">
                {formatDuration(execution.startedAt, execution.completedAt)}
              </span>
            </div>
            {execution.startedAt && (
              <div>
                <span className="text-slate-600 dark:text-slate-400">Started:</span>
                <span className="ml-2 text-slate-900 dark:text-white">
                  {new Date(execution.startedAt).toLocaleString()}
                </span>
              </div>
            )}
            {execution.completedAt && (
              <div>
                <span className="text-slate-600 dark:text-slate-400">Completed:</span>
                <span className="ml-2 text-slate-900 dark:text-white">
                  {new Date(execution.completedAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Summary */}
          {execution.summary && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-white">Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded border border-blue-200 dark:border-blue-800">
                  <div className="text-sm text-slate-600 dark:text-slate-400">Source Records</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {execution.summary.total_source_records || 0}
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded border border-green-200 dark:border-green-800">
                  <div className="text-sm text-slate-600 dark:text-slate-400">Target Records</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {execution.summary.total_target_records || 0}
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded border border-purple-200 dark:border-purple-800">
                  <div className="text-sm text-slate-600 dark:text-slate-400">Matches</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {execution.summary.matched_count || 0}
                  </div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded border border-yellow-200 dark:border-yellow-800">
                  <div className="text-sm text-slate-600 dark:text-slate-400">Unmatched Source</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {execution.summary.unmatched_source_count || 0}
                  </div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded border border-orange-200 dark:border-orange-800">
                  <div className="text-sm text-slate-600 dark:text-slate-400">Unmatched Target</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {execution.summary.unmatched_target_count || 0}
                  </div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded border border-red-200 dark:border-red-800">
                  <div className="text-sm text-slate-600 dark:text-slate-400">Errors</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {execution.summary.errors_count || 0}
                  </div>
                </div>
              </div>
              {execution.summary.accuracy_percentage !== null && (
                <div className="mt-4">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Accuracy</div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {execution.summary.accuracy_percentage?.toFixed(2)}%
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">Errors</h3>
          <div className="max-h-48 overflow-y-auto">
            {errors.map((error, idx) => (
              <div key={idx} className="text-sm text-red-700 dark:text-red-400 mb-1">
                {error}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">Activity Log</h3>
        <div className="max-h-64 overflow-y-auto font-mono text-sm text-slate-700 dark:text-slate-300">
          {logs.map((log, idx) => (
            <div key={idx} className="mb-1">
              {log}
            </div>
          ))}
        </div>
      </div>
      </div>
      <Footer />
    </div>
  );
}
