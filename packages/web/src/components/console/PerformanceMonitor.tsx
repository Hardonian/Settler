/**
 * Performance Monitor Component
 * 
 * Displays API performance metrics and monitoring.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Gauge, TrendingUp, Activity, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConsoleErrorBoundary } from './ErrorBoundary';

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  p50: number;
  p95: number;
  p99: number;
  avg: number;
  requests: number;
  errors: number;
  errorRate: number;
  throughput: number;
}

interface PerformanceSummary {
  overall: {
    avgLatency: number;
    p95Latency: number;
    p99Latency: number;
    totalRequests: number;
    errorRate: number;
    throughput: number;
  };
  byEndpoint: PerformanceMetrics[];
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d');

  useEffect(() => {
    fetchMetrics();
  }, [timeRange]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const days = timeRange === '7d' ? 7 : 30;
      const res = await fetch(`/api/console/performance?days=${days}`);
      
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      } else {
        // Handle non-200 responses gracefully
        console.error('Failed to fetch performance metrics:', res.status);
        setMetrics(null);
      }
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchMetrics();
  };

  const getLatencyColor = (latency: number) => {
    if (latency < 100) return 'text-green-600 dark:text-green-400';
    if (latency < 500) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-slate-600 dark:text-slate-400">Unable to load performance metrics.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ConsoleErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Performance Monitor</h2>
            <p className="text-slate-600 dark:text-slate-400">API performance metrics and monitoring</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as '7d' | '30d')}
              className="px-3 py-2 border rounded-md bg-white dark:bg-slate-800"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              aria-label="Refresh metrics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

      {/* Overall Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Avg Latency</CardDescription>
            <CardTitle className={`text-2xl ${getLatencyColor(metrics.overall.avgLatency)}`}>
              {metrics.overall.avgLatency.toFixed(0)}ms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Activity className="w-4 h-4" />
              <span>Average response time</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>P95 Latency</CardDescription>
            <CardTitle className={`text-2xl ${getLatencyColor(metrics.overall.p95Latency)}`}>
              {metrics.overall.p95Latency.toFixed(0)}ms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Gauge className="w-4 h-4" />
              <span>95th percentile</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Error Rate</CardDescription>
            <CardTitle className="text-2xl">
              {(metrics.overall.errorRate * 100).toFixed(2)}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              {metrics.overall.errorRate < 0.01 ? (
                <>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-green-600 dark:text-green-400">Excellent</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span className="text-amber-600 dark:text-amber-400">Monitor</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Throughput</CardDescription>
            <CardTitle className="text-2xl">
              {metrics.overall.throughput.toFixed(1)} req/s
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Requests per second
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Endpoint Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Endpoint Performance</CardTitle>
          <CardDescription>Performance metrics by endpoint</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Endpoint</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Avg</TableHead>
                <TableHead>P50</TableHead>
                <TableHead>P95</TableHead>
                <TableHead>P99</TableHead>
                <TableHead>Requests</TableHead>
                <TableHead>Error Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.byEndpoint.map((endpoint) => (
                <TableRow key={`${endpoint.method}-${endpoint.endpoint}`}>
                  <TableCell>
                    <code className="text-sm">{endpoint.endpoint}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{endpoint.method}</Badge>
                  </TableCell>
                  <TableCell className={getLatencyColor(endpoint.avg)}>
                    {endpoint.avg.toFixed(0)}ms
                  </TableCell>
                  <TableCell className={getLatencyColor(endpoint.p50)}>
                    {endpoint.p50.toFixed(0)}ms
                  </TableCell>
                  <TableCell className={getLatencyColor(endpoint.p95)}>
                    {endpoint.p95.toFixed(0)}ms
                  </TableCell>
                  <TableCell className={getLatencyColor(endpoint.p99)}>
                    {endpoint.p99.toFixed(0)}ms
                  </TableCell>
                  <TableCell>{endpoint.requests.toLocaleString()}</TableCell>
                  <TableCell>
                    {endpoint.errorRate < 0.01 ? (
                      <span className="text-green-600 dark:text-green-400">
                        {(endpoint.errorRate * 100).toFixed(2)}%
                      </span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">
                        {(endpoint.errorRate * 100).toFixed(2)}%
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    </ConsoleErrorBoundary>
  );
}
