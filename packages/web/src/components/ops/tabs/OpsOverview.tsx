/**
 * Ops Overview Tab
 * 
 * Health status overview with R/Y/G indicators
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface HealthStatus {
  status: 'healthy' | 'warning' | 'critical';
  message: string;
}

interface OverviewData {
  health: HealthStatus;
  totalCustomers: number;
  activeCustomers: number;
  totalUsage: number;
  errorRate: number;
  pendingJobs: number;
  failedWebhooks: number;
}

export function OpsOverview() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOverview() {
      try {
        const response = await fetch('/api/ops/overview');
        if (!response.ok) {
          throw new Error('Failed to fetch overview');
        }
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Failed to fetch ops overview:', error);
        // Set default error state
        setData({
          health: { status: 'critical', message: 'Failed to load data' },
          totalCustomers: 0,
          activeCustomers: 0,
          totalUsage: 0,
          errorRate: 0,
          pendingJobs: 0,
          failedWebhooks: 0,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchOverview();
    const interval = setInterval(fetchOverview, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>Failed to load overview data</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const healthColor =
    data.health.status === 'healthy'
      ? 'bg-green-500'
      : data.health.status === 'warning'
      ? 'bg-yellow-500'
      : 'bg-red-500';

  const healthIcon =
    data.health.status === 'healthy' ? (
      <CheckCircle2 className="h-5 w-5 text-green-600" />
    ) : data.health.status === 'warning' ? (
      <AlertTriangle className="h-5 w-5 text-yellow-600" />
    ) : (
      <AlertTriangle className="h-5 w-5 text-red-600" />
    );

  return (
    <div className="space-y-6">
      {/* Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {healthIcon}
            System Health
          </CardTitle>
          <CardDescription>{data.health.message}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${healthColor}`} />
            <Badge variant={data.health.status === 'healthy' ? 'default' : 'destructive'}>
              {data.health.status.toUpperCase()}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {data.activeCustomers} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalUsage.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.errorRate.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Jobs</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pendingJobs}</div>
            <p className="text-xs text-muted-foreground">
              {data.failedWebhooks} failed webhooks
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
