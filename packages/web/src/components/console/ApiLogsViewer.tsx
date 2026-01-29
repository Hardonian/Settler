'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Download } from 'lucide-react';

interface ApiCallLog {
  id: string;
  tenantId: string;
  userId?: string;
  apiKeyId?: string;
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  body?: unknown;
  responseBody?: unknown;
  error?: string;
  userAgent?: string;
  ipAddress?: string;
}

interface ApiLogStats {
  totalCalls: number;
  byMethod: Record<string, number>;
  byStatusCode: Record<number, number>;
  byPath: Record<string, number>;
  averageResponseTime: number;
  errorRate: number;
}

export function ApiLogsViewer() {
  const [logs, setLogs] = useState<ApiCallLog[]>([]);
  const [stats, setStats] = useState<ApiLogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    method: '',
    path: '',
    statusCode: '',
    limit: '100',
  });
  
  useEffect(() => {
    loadLogs();
  }, [filters]);
  
  async function loadLogs() {
    setLoading(true);
    try {
      // Fetch logs and stats in parallel
      const logParams = new URLSearchParams();
      if (filters.method) logParams.set('method', filters.method);
      if (filters.path) logParams.set('path', filters.path);
      if (filters.statusCode) logParams.set('statusCode', filters.statusCode);
      logParams.set('limit', filters.limit);
      
      const statsParams = new URLSearchParams(logParams);
      statsParams.set('stats', 'true');
      
      const [logsResponse, statsResponse] = await Promise.all([
        fetch(`/api/console/api-logs?${logParams}`),
        fetch(`/api/console/api-logs?${statsParams}`),
      ]);
      
      const logsData = await logsResponse.json();
      const statsData = await statsResponse.json();
      
      if (logsData.logs) {
        setLogs(logsData.logs.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp),
        })));
      }
      
      if (statsData.stats) {
        setStats(statsData.stats);
      }
    } catch (error: unknown) {
      console.error('Failed to load API logs:', error);
    } finally {
      setLoading(false);
    }
  }
  
  function getStatusColor(statusCode: number): string {
    if (statusCode >= 200 && statusCode < 300) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (statusCode >= 300 && statusCode < 400) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (statusCode >= 400 && statusCode < 500) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  }
  
  function getMethodColor(method: string): string {
    const colors: Record<string, string> = {
      GET: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      POST: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      PUT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      PATCH: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    };
    return colors[method] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
  
  function exportLogs() {
    const csv = [
      ['Timestamp', 'Method', 'Path', 'Status', 'Response Time (ms)', 'Error'].join(','),
      ...logs.map(log => [
        log.timestamp.toISOString(),
        log.method,
        log.path,
        log.statusCode,
        log.responseTime,
        log.error || '',
      ].join(',')),
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-logs-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  
  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-electric-cyan mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading API logs...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Calls</CardDescription>
              <CardTitle className="text-3xl">{stats.totalCalls.toLocaleString()}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Avg Response Time</CardDescription>
              <CardTitle className="text-3xl">{Math.round(stats.averageResponseTime)}ms</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Error Rate</CardDescription>
              <CardTitle className="text-3xl">{(stats.errorRate * 100).toFixed(1)}%</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Methods</CardDescription>
              <CardTitle className="text-lg">
                {Object.keys(stats.byMethod).join(', ')}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}
      
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter API logs by method, path, or status code</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={filters.method} onValueChange={(value) => setFilters({ ...filters, method: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Methods</SelectItem>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              placeholder="Filter by path..."
              value={filters.path}
              onChange={(e) => setFilters({ ...filters, path: e.target.value })}
            />
            
            <Select value={filters.statusCode} onValueChange={(value) => setFilters({ ...filters, statusCode: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Status Codes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status Codes</SelectItem>
                <SelectItem value="200">200 OK</SelectItem>
                <SelectItem value="201">201 Created</SelectItem>
                <SelectItem value="400">400 Bad Request</SelectItem>
                <SelectItem value="401">401 Unauthorized</SelectItem>
                <SelectItem value="403">403 Forbidden</SelectItem>
                <SelectItem value="404">404 Not Found</SelectItem>
                <SelectItem value="500">500 Server Error</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex gap-2">
              <Button onClick={loadLogs} variant="outline" size="default">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={exportLogs} variant="outline" size="default">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>API Call Logs</CardTitle>
          <CardDescription>
            Recent API calls made to Settler APIs. PII has been redacted for privacy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Timestamp</th>
                  <th className="text-left p-2">Method</th>
                  <th className="text-left p-2">Path</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Response Time</th>
                  <th className="text-left p-2">Error</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-slate-500">
                      No API logs found
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-900">
                      <td className="p-2 font-mono text-xs">
                        {log.timestamp.toLocaleString()}
                      </td>
                      <td className="p-2">
                        <Badge className={getMethodColor(log.method)}>
                          {log.method}
                        </Badge>
                      </td>
                      <td className="p-2 font-mono text-xs max-w-md truncate">
                        {log.path}
                      </td>
                      <td className="p-2">
                        <Badge className={getStatusColor(log.statusCode)}>
                          {log.statusCode}
                        </Badge>
                      </td>
                      <td className="p-2">{log.responseTime}ms</td>
                      <td className="p-2 text-red-600 dark:text-red-400">
                        {log.error || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
