/**
 * Admin Ops Console
 * 
 * Live operations console with realtime exception triage workflow.
 * Split-pane design: list on left, detail on right.
 */

'use client';

import { useState, useMemo, useRef, useEffect } from 'react';

import { useAdminExceptions, useAdminStream } from '@/lib/admin/hooks/use-admin-metrics';
import { useKeyboardShortcuts } from '@/lib/admin/hooks/use-keyboard-shortcuts';
import { ExceptionItem } from '@/lib/admin/metrics/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle2, Clock, Search } from 'lucide-react';
import { KeyboardShortcutsHelp } from '@/lib/admin/hooks/use-keyboard-shortcuts';
import { adminLogger } from '@/lib/admin/utils/logger';

export default function AdminOpsConsole() {
  const [selectedException, setSelectedException] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const selectedIndexRef = useRef<number>(0);

  // Fetch exceptions
  const { data: exceptionsData, isLoading } = useAdminExceptions({
    limit: 100,
  });

  // Connect to SSE stream
  const { connectionState } = useAdminStream(['exceptions'], undefined, true);

  // Filter exceptions
  const filteredExceptions = useMemo(() => {
    if (!exceptionsData?.items) return [];
    
    return exceptionsData.items.filter((ex: ExceptionItem) => {
      if (statusFilter !== 'all' && ex.status !== statusFilter) return false;
      if (severityFilter !== 'all' && ex.severity !== severityFilter) return false;
      if (searchQuery && !ex.reason.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [exceptionsData, searchQuery, statusFilter, severityFilter]);

  const selectedExceptionData = useMemo(() => {
    if (!selectedException) {
      // Auto-select first exception if none selected
      if (filteredExceptions.length > 0) {
        return filteredExceptions[0];
      }
      return null;
    }
    return filteredExceptions.find((ex: ExceptionItem) => ex.id === selectedException) || null;
  }, [selectedException, filteredExceptions]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNext: () => {
      if (filteredExceptions.length === 0) return;
      selectedIndexRef.current = Math.min(
        selectedIndexRef.current + 1,
        filteredExceptions.length - 1
      );
      setSelectedException(filteredExceptions[selectedIndexRef.current]?.id || null);
    },
    onPrevious: () => {
      if (filteredExceptions.length === 0) return;
      selectedIndexRef.current = Math.max(selectedIndexRef.current - 1, 0);
      setSelectedException(filteredExceptions[selectedIndexRef.current]?.id || null);
    },
    onSelect: () => {
      if (selectedExceptionData) {
        // Already viewing details, could trigger action
      }
    },
    onResolve: () => {
      if (selectedExceptionData) {
        handleResolve(selectedExceptionData.id);
      }
    },
    onEscalate: () => {
      if (selectedExceptionData) {
        handleEscalate(selectedExceptionData.id);
      }
    },
    enabled: true,
  });

  // Update selected index when exceptions change
  useEffect(() => {
    if (selectedException && filteredExceptions.length > 0) {
      const index = filteredExceptions.findIndex((ex: ExceptionItem) => ex.id === selectedException);
      if (index >= 0) {
        selectedIndexRef.current = index;
      }
    } else if (filteredExceptions.length > 0 && !selectedException) {
      setSelectedException(filteredExceptions[0].id);
      selectedIndexRef.current = 0;
    }
  }, [filteredExceptions, selectedException]);

  const handleResolve = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/exceptions/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolutionNotes: 'Resolved via ops console' }),
      });
      if (!response.ok) {
        throw new Error('Failed to resolve exception');
      }
      // Refresh data
      window.location.reload();
    } catch (_error) {
      // Error handling would trigger toast notification
      if (error instanceof Error) {
        adminLogger.error('Failed to resolve exception', error, { exceptionId: id });
      }
    }
  };

  const handleEscalate = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/exceptions/${id}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escalationReason: 'Escalated via ops console' }),
      });
      if (!response.ok) {
        throw new Error('Failed to escalate exception');
      }
      // Refresh data
      window.location.reload();
    } catch (_error) {
      // Error handling would trigger toast notification
      if (error instanceof Error) {
        adminLogger.error('Failed to escalate exception', error, { exceptionId: id });
      }
    }
  };

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'in_review':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-900" id="main-content">
      {/* Left Panel: Exception List */}
      <div className="w-full lg:w-1/2 border-r border-slate-200 dark:border-slate-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Exception Queue
            </h2>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionState === 'connected' ? 'bg-green-500' :
                connectionState === 'reconnecting' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {connectionState}
              </span>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search exceptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-slate-200 dark:border-slate-700 rounded px-2 py-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="in_review">In Review</option>
              <option value="resolved">Resolved</option>
            </select>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="text-sm border border-slate-200 dark:border-slate-700 rounded px-2 py-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="all">All Severity</option>
              <option value="critical">Critical</option>
              <option value="warn">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-slate-500 dark:text-slate-400">
              Loading exceptions...
            </div>
          ) : filteredExceptions.length === 0 ? (
            <div className="p-4 text-center text-slate-500 dark:text-slate-400">
              No exceptions found
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredExceptions.map((ex: ExceptionItem, index: number) => (
                <button
                  key={ex.id}
                  onClick={() => {
                    setSelectedException(ex.id);
                    selectedIndexRef.current = index;
                  }}
                  className={`w-full p-4 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    selectedException === ex.id ? 'bg-slate-100 dark:bg-slate-800 ring-2 ring-blue-500' : ''
                  }`}
                  aria-selected={selectedException === ex.id}
                  role="option"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedException(ex.id);
                      selectedIndexRef.current = index;
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(ex.status)}
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {ex.reason}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>{ex.source}</span>
                        <span>•</span>
                        <span>{new Date(ex.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <Badge className={getSeverityColor(ex.severity)}>
                      {ex.severity}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Exception Detail */}
      <div className="w-full lg:w-1/2 flex flex-col">
        {selectedExceptionData ? (
          <ExceptionDetail exception={selectedExceptionData} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-slate-400">
            Select an exception to view details
          </div>
        )}
      </div>
      <KeyboardShortcutsHelp />
    </div>
  );
}

function ExceptionDetail({ exception }: { exception: ExceptionItem }) {
  const [isResolving, setIsResolving] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);

  const handleResolve = async () => {
    setIsResolving(true);
    try {
      const response = await fetch(`/api/admin/exceptions/${exception.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolutionNotes: 'Resolved via admin console' }),
      });
      if (response.ok) {
        // Toast would be shown here
        window.location.reload();
      }
    } catch (_error) {
      adminLogger.error('Failed to resolve exception', error);
    } finally {
      setIsResolving(false);
    }
  };

  const handleEscalate = async () => {
    setIsEscalating(true);
    try {
      const response = await fetch(`/api/admin/exceptions/${exception.id}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escalationReason: 'Escalated via admin console' }),
      });
      if (response.ok) {
        // Toast would be shown here
        window.location.reload();
      }
    } catch (_error) {
      adminLogger.error('Failed to escalate exception', error);
    } finally {
      setIsEscalating(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{exception.reason}</CardTitle>
            <Badge className={
              exception.severity === 'critical' ? 'bg-red-100 text-red-800' :
              exception.severity === 'warn' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            }>
              {exception.severity}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Source:</span>
                <span className="text-slate-900 dark:text-white">{exception.source}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Status:</span>
                <span className="text-slate-900 dark:text-white">{exception.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Created:</span>
                <span className="text-slate-900 dark:text-white">
                  {new Date(exception.createdAt).toLocaleString()}
                </span>
              </div>
              {exception.ruleId && (
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Rule ID:</span>
                  <span className="text-slate-900 dark:text-white font-mono text-xs">
                    {exception.ruleId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {exception.evidence && (
            <div>
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Evidence
              </h3>
              <pre className="text-xs bg-slate-100 dark:bg-slate-800 p-3 rounded overflow-auto">
                {JSON.stringify(exception.evidence, null, 2)}
              </pre>
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button 
              variant="default" 
              size="sm"
              onClick={handleResolve}
              disabled={isResolving || exception.status === 'resolved'}
            >
              {isResolving ? 'Resolving...' : 'Mark Resolved (r)'}
            </Button>
            <Button variant="outline" size="sm">
              Create Adjustment
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleEscalate}
              disabled={isEscalating}
            >
              {isEscalating ? 'Escalating...' : 'Escalate (e)'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
