/**
 * Admin Runs Page
 * 
 * Reconciliation runs history, status, and drilldown.
 */

'use client';

import { useState } from 'react';
import { useAdminRuns, useAdminStream } from '@/lib/admin/hooks/use-admin-metrics';
import { ReconciliationRun } from '@/lib/admin/metrics/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlayCircle, CheckCircle2, XCircle, Clock, Search, Filter } from 'lucide-react';
import Link from 'next/link';

export default function AdminRunsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: runsData, isLoading } = useAdminRuns({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    limit: 100,
  });

  const { connectionState } = useAdminStream(['runs'], undefined, true);

  const filteredRuns = runsData?.items?.filter(run => {
    if (searchQuery && !run.name?.toLowerCase().includes(searchQuery.toLowerCase()) && !run.id.includes(searchQuery)) {
      return false;
    }
    return true;
  }) || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'running':
        return <Clock className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <PlayCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'running':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300';
    }
  };

  return (
    <div className="p-8 space-y-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Reconciliation Runs</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            History, status, and drilldown
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionState === 'connected' ? 'bg-green-500' :
              connectionState === 'reconnecting' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="text-sm text-slate-600 dark:text-slate-400">{connectionState}</span>
          </div>
          <Button>
            Run Reconcile Now
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search runs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-200 dark:border-slate-700 rounded px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Runs List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Runs ({filteredRuns.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              Loading runs...
            </div>
          ) : filteredRuns.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              No runs found
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRuns.map((run) => (
                <RunRow
                  key={run.id}
                  run={run}
                  statusIcon={getStatusIcon(run.status)}
                  statusColor={getStatusColor(run.status)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RunRow({
  run,
  statusIcon,
  statusColor,
}: {
  run: ReconciliationRun;
  statusIcon: React.ReactNode;
  statusColor: string;
}) {
  const matchedPercent = run.sourceCount + run.targetCount > 0
    ? ((run.matchedCount || 0) / (run.sourceCount + run.targetCount)) * 100
    : 0;

  return (
    <Link href={`/admin/runs/${run.id}`}>
      <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {statusIcon}
              <span className="font-medium text-slate-900 dark:text-white">
                {run.name || `Run ${run.id.slice(0, 8)}`}
              </span>
              <Badge className={statusColor}>
                {run.status}
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Matched:</span>
                <span className="ml-2 font-semibold text-slate-900 dark:text-white">
                  {run.matchedCount} ({matchedPercent.toFixed(1)}%)
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Unmatched:</span>
                <span className="ml-2 font-semibold text-slate-900 dark:text-white">
                  {(run.unmatchedSourceCount || 0) + (run.unmatchedTargetCount || 0)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Confidence:</span>
                <span className="ml-2 font-semibold text-slate-900 dark:text-white">
                  {run.confidenceAvg ? (Number(run.confidenceAvg) * 100).toFixed(1) + '%' : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Started:</span>
                <span className="ml-2 font-semibold text-slate-900 dark:text-white">
                  {new Date(run.startedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm">
            View Details
          </Button>
        </div>
      </div>
    </Link>
  );
}
