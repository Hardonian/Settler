/**
 * Admin Exceptions Page
 * 
 * Exception queue management with workflow states and batch actions.
 */

'use client';

import { useState } from 'react';
import { useAdminExceptions, useAdminStream } from '@/lib/admin/hooks/use-admin-metrics';
import { ExceptionItem } from '@/lib/admin/metrics/types';
import { exportExceptionsToCSV, exportExceptionsToJSON, downloadFile } from '@/lib/admin/utils/export';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle2, Clock, Search, Filter, Download, FileDown } from 'lucide-react';
import { NoExceptionsEmptyState, NoResultsEmptyState } from '@/components/admin/empty-states';

export default function AdminExceptionsPage() {
  const [selectedExceptions, setSelectedExceptions] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: exceptionsData, isLoading } = useAdminExceptions({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    severity: severityFilter !== 'all' ? severityFilter : undefined,
    limit: 100,
  });

  const { connectionState } = useAdminStream(['exceptions'], undefined, true);

  const filteredExceptions = exceptionsData?.items?.filter(ex => {
    if (searchQuery && !ex.reason.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }) || [];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'warn':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedExceptions);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedExceptions(newSet);
  };

  return (
    <div className="p-8 space-y-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Exceptions</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Queue management and triage workflow
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
          {selectedExceptions.size > 0 && (
            <Button variant="outline" size="sm">
              Batch Actions ({selectedExceptions.size})
            </Button>
          )}
          <div className="relative group">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg p-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => {
                  if (filteredExceptions.length > 0) {
                    const csv = exportExceptionsToCSV(filteredExceptions);
                    downloadFile(csv, `exceptions-${new Date().toISOString().split('T')[0]}.csv`);
                  }
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 rounded flex items-center gap-2"
              >
                <FileDown className="w-4 h-4" />
                Export as CSV
              </button>
              <button
                onClick={() => {
                  if (filteredExceptions.length > 0) {
                    exportExceptionsToJSON(filteredExceptions);
                  }
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 rounded flex items-center gap-2"
              >
                <FileDown className="w-4 h-4" />
                Export as JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search exceptions..."
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
              <option value="new">New</option>
              <option value="in_review">In Review</option>
              <option value="resolved">Resolved</option>
              <option value="exported">Exported</option>
            </select>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="border border-slate-200 dark:border-slate-700 rounded px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="all">All Severity</option>
              <option value="critical">Critical</option>
              <option value="warn">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Exception List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Exception Queue ({filteredExceptions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              Loading exceptions...
            </div>
          ) : filteredExceptions.length === 0 ? (
            searchQuery || statusFilter !== 'all' || severityFilter !== 'all' ? (
              <NoResultsEmptyState searchQuery={searchQuery} />
            ) : (
              <NoExceptionsEmptyState />
            )
          ) : (
            <div className="space-y-2">
              {filteredExceptions.map((ex) => (
                <ExceptionRow
                  key={ex.id}
                  exception={ex}
                  selected={selectedExceptions.has(ex.id)}
                  onSelect={() => toggleSelection(ex.id)}
                  severityColor={getSeverityColor(ex.severity)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ExceptionRow({
  exception,
  selected,
  onSelect,
  severityColor,
}: {
  exception: ExceptionItem;
  selected: boolean;
  onSelect: () => void;
  severityColor: string;
}) {
  return (
    <div
      className={`p-4 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
        selected ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' : ''
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={selected}
              onChange={onSelect}
              onClick={(e) => e.stopPropagation()}
              className="rounded"
            />
            <span className="font-medium text-slate-900 dark:text-white">
              {exception.reason}
            </span>
            <Badge className={severityColor}>
              {exception.severity}
            </Badge>
            <Badge variant="outline">
              {exception.status}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            <span>Source: {exception.source}</span>
            <span>•</span>
            <span>Created: {new Date(exception.createdAt).toLocaleString()}</span>
            {exception.slaTimer && (
              <>
                <span>•</span>
                <span>SLA: {formatDuration(exception.slaTimer)}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/exceptions/${exception.id}`}>
            <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
              View
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}
