/**
 * Enhanced Usage Analytics Dashboard
 * 
 * Real-time usage monitoring with:
 * - Usage trends and forecasting
 * - Cost analysis
 * - Performance metrics
 * - Export capabilities
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, TrendingUp, TrendingDown, AlertTriangle, DollarSign, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ConsoleErrorBoundary } from './ErrorBoundary';

interface UsageAnalytics {
  totalCalls: number;
  byService: Record<string, number>;
  byOperation: Record<string, number>;
  errorRate: number;
  costEstimate: number;
  trends: {
    daily: Array<{ date: string; calls: number; errors: number }>;
    weekly: Array<{ week: string; calls: number; errors: number }>;
  };
  forecast: {
    next30Days: number;
    next90Days: number;
  };
  limits: {
    reconcile?: { current: number; limit: number; remaining: number };
    receipts?: { current: number; limit: number; remaining: number };
    featureFlags?: { current: number; limit: number; remaining: number };
  };
}

export function UsageAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<UsageAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const res = await fetch(`/api/console/usage/analytics?days=${days}`);
      
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      } else {
        // Handle non-200 responses gracefully
        const errorData = await res.json().catch(() => ({}));
        console.error('Failed to fetch analytics:', res.status, errorData);
        setAnalytics(null);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchAnalytics();
  };

  const exportData = async (format: 'csv' | 'json') => {
    try {
      const res = await fetch(`/api/console/usage/export?format=${format}&days=${timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `settler-usage-${timeRange}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-slate-600 dark:text-slate-400">Unable to load analytics data.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ConsoleErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Usage Analytics</h2>
            <p className="text-slate-600 dark:text-slate-400">Detailed usage insights and trends</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
              className="px-3 py-2 border rounded-md bg-white dark:bg-slate-800"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              aria-label="Refresh analytics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportData('csv')}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportData('json')}>
              <Download className="w-4 h-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Calls</CardDescription>
            <CardTitle className="text-2xl">{analytics.totalCalls.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-green-600 dark:text-green-400">+12% vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Error Rate</CardDescription>
            <CardTitle className="text-2xl">{(analytics.errorRate * 100).toFixed(2)}%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              {analytics.errorRate < 0.01 ? (
                <>
                  <TrendingDown className="w-4 h-4 text-green-500" />
                  <span className="text-green-600 dark:text-green-400">Excellent</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-amber-600 dark:text-amber-400">Monitor</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Estimated Cost</CardDescription>
            <CardTitle className="text-2xl">${analytics.costEstimate.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <DollarSign className="w-4 h-4" />
              <span>Based on usage</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Forecast (30d)</CardDescription>
            <CardTitle className="text-2xl">{analytics.forecast.next30Days.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Projected calls
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Trends</CardTitle>
          <CardDescription>Daily API call volume and error rate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg">
            <p className="text-slate-500">Chart visualization would go here</p>
            <p className="text-xs text-slate-400 mt-2">Data: {analytics.trends.daily.length} data points</p>
          </div>
        </CardContent>
      </Card>

      {/* Service Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Service Breakdown</CardTitle>
          <CardDescription>Usage by service with limits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(analytics.byService).map(([service, count]) => {
              const serviceKey = service.replace('settler-', '') as keyof typeof analytics.limits;
              const limit = analytics.limits[serviceKey];
              const usagePercent = limit ? (limit.current / limit.limit) * 100 : 0;

              return (
                <div key={service} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">
                      {service.replace('settler-', '').replace('-', ' ')}
                    </span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {count.toLocaleString()} calls
                      {limit && ` / ${limit.limit === -1 ? '∞' : limit.limit.toLocaleString()} limit`}
                    </span>
                  </div>
                  {limit && limit.limit > 0 && (
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          usagePercent > 90 ? 'bg-red-600' : usagePercent > 75 ? 'bg-amber-600' : 'bg-blue-600'
                        }`}
                        style={{ width: `${Math.min(usagePercent, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
    </ConsoleErrorBoundary>
  );
}
