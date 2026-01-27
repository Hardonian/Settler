/**
 * Console Usage & Metrics Page
 * 
 * Shows usage statistics and metrics across all services.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, TrendingUp, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface UsageEvent {
  id: string;
  timestamp: Date;
  service: string;
  operation: string;
  quantity: number;
  unit?: string;
}

interface UsageSummary {
  totalCalls: number;
  byService: Record<string, number>;
  byOperation: Record<string, number>;
  errorRate: number;
  period: {
    start: Date;
    end: Date;
  };
  limits?: {
    reconcile?: { current: number; limit: number; remaining: number };
    receipts?: { current: number; limit: number; remaining: number };
    featureFlags?: { current: number; limit: number; remaining: number };
    playground?: { current: number; limit: number; remaining: number };
  };
}

export default function UsagePage() {
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [events, setEvents] = useState<UsageEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  useEffect(() => {
    fetchUsageData();
  }, [timeRange]);

  const fetchUsageData = async () => {
    try {
      setLoading(true);
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      // Fetch usage data with real-time tracking
      const res = await fetch(`/api/console/usage?days=${days}`);
      if (res.ok) {
        const data = await res.json();
        setSummary({
          totalCalls: data.totalCalls || 0,
          byService: data.byService || {},
          byOperation: data.byOperation || {},
          errorRate: data.errorRate || 0,
          period: {
            start: new Date(data.period?.start || Date.now()),
            end: new Date(data.period?.end || Date.now()),
          },
          limits: data.limits || {},
        });
        setEvents(data.events || []);
      } else {
        // Handle error gracefully
        setSummary({
          totalCalls: 0,
          byService: {},
          byOperation: {},
          errorRate: 0,
          period: { start: new Date(), end: new Date() },
          limits: {},
        });
        setEvents([]);
      }
    } catch {
      console.error('Failed to fetch usage data:', error);
      // Set empty state on error
      setSummary({
        totalCalls: 0,
        byService: {},
        byOperation: {},
        errorRate: 0,
        period: { start: new Date(), end: new Date() },
        limits: {},
      });
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Usage & Metrics
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            View your API usage across all Settler services.
          </p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
          className="w-32 px-3 py-2 border rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total API Calls</CardDescription>
            <CardTitle className="text-3xl">
              {summary?.totalCalls.toLocaleString() || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Activity className="w-4 h-4" />
              <span>Last {timeRange}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Error Rate</CardDescription>
            <CardTitle className="text-3xl">
              {(summary?.errorRate || 0).toFixed(2)}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              {summary && summary.errorRate < 0.01 ? (
                <>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-green-600 dark:text-green-400">Excellent</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span className="text-amber-600 dark:text-amber-400">View</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Services</CardDescription>
            <CardTitle className="text-3xl">
              {summary ? Object.keys(summary.byService).length : 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Services with usage
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="by-service" className="w-full">
        <TabsList>
          <TabsTrigger value="by-service">By Service</TabsTrigger>
          <TabsTrigger value="by-operation">By Operation</TabsTrigger>
          <TabsTrigger value="recent">Recent Events</TabsTrigger>
        </TabsList>

        <TabsContent value="by-service" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage by Service</CardTitle>
              <CardDescription>API calls broken down by service with limits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summary && Object.entries(summary.byService).map(([service, count]) => {
                  const serviceKey = service.replace('settler-', '') as 'reconcile' | 'receipts' | 'featureFlags' | 'playground';
                  const limit = summary.limits?.[serviceKey];
                  const hasLimit = limit && limit.limit > 0;
                  const usagePercent = hasLimit ? (limit.current / limit.limit) * 100 : (count / (summary.totalCalls || 1)) * 100;
                  
                  return (
                    <div key={service} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium capitalize">
                          {service.replace('settler-', '').replace('-', ' ')}
                        </span>
                        <div className="flex items-center gap-4">
                          {hasLimit ? (
                            <>
                              <span className="text-sm text-slate-600 dark:text-slate-400">
                                {limit.current.toLocaleString()} / {limit.limit === -1 ? '∞' : limit.limit.toLocaleString()}
                              </span>
                              {limit.remaining !== -1 && (
                                <span className={`text-xs px-2 py-1 rounded ${
                                  limit.remaining < limit.limit * 0.1 
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                    : limit.remaining < limit.limit * 0.25
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                }`}>
                                  {limit.remaining.toLocaleString()} remaining
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-slate-600 dark:text-slate-400">
                              {count.toLocaleString()} calls
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            hasLimit && usagePercent > 90
                              ? 'bg-red-600'
                              : hasLimit && usagePercent > 75
                              ? 'bg-amber-600'
                              : 'bg-blue-600'
                          }`}
                          style={{
                            width: `${Math.min(usagePercent, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                {(!summary || Object.keys(summary.byService).length === 0) && (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    No usage data available for this period.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="by-operation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage by Operation</CardTitle>
              <CardDescription>Most used operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {summary && Object.entries(summary.byOperation)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 10)
                  .map(([operation, count]) => (
                    <div key={operation} className="flex items-center justify-between py-2">
                      <code className="text-sm">{operation}</code>
                      <span className="text-slate-600 dark:text-slate-400">
                        {count.toLocaleString()}
                      </span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
              <CardDescription>Latest API usage events</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Operation</TableHead>
                    <TableHead>Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="text-sm">
                        {format(new Date(event.timestamp), 'PPp')}
                      </TableCell>
                      <TableCell className="capitalize">
                        {event.service.replace('settler-', '').replace('-', ' ')}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs">{event.operation}</code>
                      </TableCell>
                      <TableCell>{event.quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
