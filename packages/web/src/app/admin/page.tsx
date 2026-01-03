/**
 * Admin Dashboard Overview
 * 
 * Main overview page with KPI tiles, trend charts, exception heatmap, and activity feed.
 * FinTech-native feel with high-signal, dense but readable information.
 */

'use client';

import { useState } from 'react';
import { useAdminMetrics, useAdminStream } from '@/lib/admin/hooks/use-admin-metrics';
import { useTickScheduler } from '@/lib/admin/hooks/use-tick-scheduler';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Clock, DollarSign, Activity } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  
  // Fetch metrics
  const { data: metrics, isLoading } = useAdminMetrics(timeRange);
  
  // Connect to SSE stream
  const { connectionState, latency } = useAdminStream(['metrics'], undefined, true);

  // Throttle chart updates (4fps max)
  useTickScheduler(() => {
    // Chart updates would happen here
  }, true);

  const kpis = metrics?.kpis;

  return (
    <div className="p-8 space-y-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Real-time oversight and reconciliation operations
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionState === 'connected' ? 'bg-green-500' :
              connectionState === 'reconnecting' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {connectionState === 'connected' ? 'Live' : connectionState}
            </span>
          </div>

          {/* Time Range Selector */}
          <div className="flex gap-2">
            {(['24h', '7d', '30d'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPITile
          title="Matched %"
          value={kpis?.matchedPercent.toFixed(1) || '0.0'}
          unit="%"
          trend={kpis?.matchedPercent ? (kpis.matchedPercent > 95 ? 'up' : 'down') : undefined}
          icon={<CheckCircle2 className="w-5 h-5" />}
          isLoading={isLoading}
        />
        <KPITile
          title="Exceptions"
          value={kpis?.exceptionsCount.toLocaleString() || '0'}
          trend={kpis?.exceptionsCount ? (kpis.exceptionsCount < 10 ? 'up' : 'down') : undefined}
          icon={<AlertTriangle className="w-5 h-5" />}
          isLoading={isLoading}
          href="/admin/exceptions"
        />
        <KPITile
          title="Avg Time to Resolve"
          value={kpis?.avgTimeToResolve ? formatDuration(kpis.avgTimeToResolve) : '0ms'}
          trend={kpis?.avgTimeToResolve ? (kpis.avgTimeToResolve < 3600000 ? 'up' : 'down') : undefined}
          icon={<Clock className="w-5 h-5" />}
          isLoading={isLoading}
        />
        <KPITile
          title="Total Volume"
          value={kpis?.totalVolume.toLocaleString() || '0'}
          icon={<Activity className="w-5 h-5" />}
          isLoading={isLoading}
        />
        <KPITile
          title="Refunds"
          value={kpis?.refundsCount.toLocaleString() || '0'}
          icon={<DollarSign className="w-5 h-5" />}
          isLoading={isLoading}
        />
        <KPITile
          title="Payout Gaps"
          value={kpis?.payoutGaps.toLocaleString() || '0'}
          icon={<AlertTriangle className="w-5 h-5" />}
          isLoading={isLoading}
        />
      </div>

      {/* Exception Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Exception Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              Loading heatmap...
            </div>
          ) : metrics?.exceptionHeatmap && metrics.exceptionHeatmap.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {metrics.exceptionHeatmap.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg"
                >
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                    {item.source}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        item.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        item.severity === 'warn' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }
                    >
                      {item.severity}
                    </Badge>
                    <span className="text-lg font-semibold text-slate-900 dark:text-white">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              No exceptions in this period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              Loading activity...
            </div>
          ) : metrics?.recentActivity && metrics.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {metrics.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                  <div className="flex-1">
                    <div className="text-sm text-slate-900 dark:text-white">
                      {activity.message}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {new Date(activity.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              No recent activity
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Link href="/admin/ops">
          <Button>View Ops Console</Button>
        </Link>
        <Link href="/admin/runs">
          <Button variant="outline">View Runs</Button>
        </Link>
        <Link href="/admin/audit">
          <Button variant="outline">View Audit Trail</Button>
        </Link>
      </div>
    </div>
  );
}

function KPITile({
  title,
  value,
  unit,
  trend,
  icon,
  isLoading,
  href,
}: {
  title: string;
  value: string;
  unit?: string;
  trend?: 'up' | 'down';
  icon: React.ReactNode;
  isLoading?: boolean;
  href?: string;
}) {
  const content = (
    <Card className={href ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {title}
          </CardTitle>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-8 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        ) : (
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {value}
            </div>
            {unit && (
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {unit}
              </span>
            )}
            {trend && (
              <div className={`ml-auto ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {trend === 'up' ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}
