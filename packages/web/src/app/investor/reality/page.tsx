/**
 * Board/Investor KPI Dashboard
 * 
 * Executive-level view showing key metrics suitable for investor presentations.
 * Read-only, privileged access. High signal, low noise.
 */

import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { getInvestorRealityData } from '@/lib/investor/reality-data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function InvestorDashboardContent() {
  const data = await getInvestorRealityData();

  if (!data) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Failed to load investor metrics. Please try again later.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }


  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number | string | null) => {
    if (value === null || value === undefined) return 'N/A';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'proven':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />PROVEN</Badge>;
      case 'assumed':
        return <Badge className="bg-yellow-500">ASSUMED</Badge>;
      case 'broken':
        return <Badge variant="destructive">BROKEN</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Board KPI Dashboard</h1>
        <p className="text-muted-foreground">
          Key performance indicators powered by the Reality System. Evidence-based metrics for investor review.
        </p>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>MRR</span>
              {getStatusBadge(data.revenue.status)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{formatCurrency(data.revenue.mrr)}</div>
            {data.revenue.mrr_growth && (
              <div className="text-sm text-green-600 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                {formatPercent(data.revenue.mrr_growth)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Active Subscriptions</span>
              {getStatusBadge(data.revenue.status)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.revenue.active_subscriptions.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground mt-1">
              Churn: {formatPercent(data.revenue.churn)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Weekly Active Users</span>
              {getStatusBadge(data.usage.status)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.usage.wau.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground mt-1">
              DAU: {data.usage.dau.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Risk Index</span>
              {data.risk_index > 0 ? (
                <Badge variant="destructive">{data.risk_index}</Badge>
              ) : (
                <Badge className="bg-green-500">0</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.risk_index}</div>
            <div className="text-sm text-muted-foreground mt-1">
              Broken invariants + critical risks
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Revenue
          </CardTitle>
          <CardDescription>Monthly Recurring Revenue and growth metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-muted-foreground mb-1">MRR</div>
              <div className="text-2xl font-bold">{formatCurrency(data.revenue.mrr)}</div>
              {data.revenue.mrr_growth && (
                <div className="text-sm text-green-600 mt-1">
                  {formatPercent(data.revenue.mrr_growth)} vs last week
                </div>
              )}
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Active Subscriptions</div>
              <div className="text-2xl font-bold">{data.revenue.active_subscriptions}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Churn Rate</div>
              <div className="text-2xl font-bold">{formatPercent(data.revenue.churn)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Usage & Engagement
          </CardTitle>
          <CardDescription>User activity and tenant engagement metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Daily Active Users</div>
              <div className="text-2xl font-bold">{data.usage.dau.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Weekly Active Users</div>
              <div className="text-2xl font-bold">{data.usage.wau.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Active Tenants</div>
              <div className="text-2xl font-bold">{data.usage.active_tenants.toLocaleString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reliability Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Reliability
          </CardTitle>
          <CardDescription>System uptime and failure metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Uptime Proxy</div>
              <div className="text-2xl font-bold">
                {data.reliability.uptime_proxy ? `${data.reliability.uptime_proxy}%` : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Critical Failure Events</div>
              <div className="text-2xl font-bold">{data.reliability.failure_events}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evidence Index */}
      <Card>
        <CardHeader>
          <CardTitle>Evidence Index</CardTitle>
          <CardDescription>Percentage of metrics that are PROVEN vs ASSUMED</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold">{data.evidence_index}%</div>
            <div className="flex-1">
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4">
                <div 
                  className="bg-green-600 h-4 rounded-full transition-all" 
                  style={{ width: `${data.evidence_index}%` }}
                ></div>
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                {data.evidence_index}% of metrics are backed by real data
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer Note */}
      <div className="mt-8 text-sm text-muted-foreground text-center">
        Last updated: {new Date(data.last_updated).toLocaleString()}
        {data.week_start && ` • Week of ${data.week_start}`}
      </div>
    </div>
  );
}

export default function InvestorRealityPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    }>
      <InvestorDashboardContent />
    </Suspense>
  );
}
