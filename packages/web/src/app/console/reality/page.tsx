/**
 * Reality Dashboard Page
 * 
 * Internal ops view showing all reality metrics with PROVEN/ASSUMED/BROKEN status.
 * Admin-only access.
 */

import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import { 
  DollarSign, 
  Users, 
  Shield, 
  AlertTriangle, 
  Rocket, 
  TrendingUp, 
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  Loader2
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function RealityDashboardContent() {
  try {
    const supabase = await createClient();
    let user = null;
    let authError = null;
    
    try {
      const authResult = await supabase.auth.getUser();
      user = authResult.data?.user ?? null;
      authError = authResult.error;
    } catch (error) {
      console.error('[Reality Dashboard] Auth check failed:', error);
      authError = error as Error;
    }

    if (authError || !user) {
      return (
        <div className="p-8">
          <Card>
            <CardHeader>
              <CardTitle>Unauthorized</CardTitle>
              <CardDescription>You must be logged in to view the Reality Dashboard.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      );
    }

  // Check admin access
  const isAdmin = user.user_metadata?.role === 'admin' || user.email?.endsWith('@settler.dev');
  
  if (!isAdmin) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Forbidden</CardTitle>
            <CardDescription>Admin access required to view the Reality Dashboard.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Fetch reality data
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/console/reality`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Failed to load reality metrics. Please try again later.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const data = await response.json();

  const { summary, metrics_by_category, recent_events, latest_snapshot } = data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'proven':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />PROVEN</Badge>;
      case 'assumed':
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" />ASSUMED</Badge>;
      case 'broken':
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" />BROKEN</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatValue = (value: any): string => {
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (value === null || value === undefined) {
      return 'N/A';
    }
    return String(value);
  };

  const renderMetricCard = (metric: any) => (
    <Card key={metric.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
          {getStatusBadge(metric.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-2">{formatValue(metric.value)}</div>
        <div className="text-xs text-muted-foreground">
          Source: {metric.source}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Updated: {new Date(metric.last_updated).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Reality Dashboard</h1>
        <p className="text-muted-foreground">
          Single source of truth for all reality metrics. Status: PROVEN = backed by real data, ASSUMED = estimated, BROKEN = data source failed.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_metrics}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Proven</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.proven_metrics}</div>
            <div className="text-xs text-muted-foreground">{summary.proven_percentage}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Assumed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{summary.assumed_metrics}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Broken</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.broken_metrics}</div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Reality */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5" />
          <h2 className="text-2xl font-semibold">Revenue Reality</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics_by_category.revenue?.map(renderMetricCard)}
        </div>
      </div>

      {/* User Reality */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5" />
          <h2 className="text-2xl font-semibold">User Reality</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics_by_category.user?.map(renderMetricCard)}
        </div>
      </div>

      {/* Tenant Isolation Reality */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5" />
          <h2 className="text-2xl font-semibold">Tenant Isolation Reality</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics_by_category.tenant_isolation?.map(renderMetricCard)}
        </div>
      </div>

      {/* Failure & Resilience Reality */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5" />
          <h2 className="text-2xl font-semibold">Failure & Resilience Reality</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics_by_category.failure?.map(renderMetricCard)}
        </div>
      </div>

      {/* Deployment Reality */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Rocket className="w-5 h-5" />
          <h2 className="text-2xl font-semibold">Deployment Reality</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics_by_category.deployment?.map(renderMetricCard)}
        </div>
      </div>

      {/* GTM Reality */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5" />
          <h2 className="text-2xl font-semibold">GTM Reality</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics_by_category.gtm?.map(renderMetricCard)}
        </div>
      </div>

      {/* Admin Independence Reality */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5" />
          <h2 className="text-2xl font-semibold">Admin Independence Reality</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics_by_category.admin?.map(renderMetricCard)}
        </div>
      </div>

      {/* Recent Events */}
      {recent_events && recent_events.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Recent Reality Events</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                {recent_events.slice(0, 10).map((event: any) => (
                  <div key={event.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <div className="font-medium">{event.event_name}</div>
                      <div className="text-sm text-muted-foreground">{event.category}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={event.severity === 'critical' ? 'destructive' : 'secondary'}>
                        {event.severity}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Latest Snapshot */}
      {latest_snapshot && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Latest Weekly Snapshot</h2>
          <Card>
            <CardHeader>
              <CardTitle>Week of {latest_snapshot.week_start}</CardTitle>
              <CardDescription>
                Generated: {new Date(latest_snapshot.created_at).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Risks</div>
                  <div className="text-xl font-bold">{latest_snapshot.risks?.length || 0}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Required Actions</div>
                  <div className="text-xl font-bold">{latest_snapshot.required_actions?.length || 0}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Events</div>
                  <div className="text-xl font-bold">{latest_snapshot.events_summary?.total || 0}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Metrics</div>
                  <div className="text-xl font-bold">{latest_snapshot.summary?.metrics_count || 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
  } catch (error) {
    // CRITICAL: Never throw errors - always return a valid React component
    console.error('[Reality Dashboard] Unexpected error:', error);
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Dashboard</CardTitle>
            <CardDescription>
              We encountered an error while loading the Reality Dashboard. Please try again later.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
}

export default function RealityDashboardPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    }>
      <RealityDashboardContent />
    </Suspense>
  );
}
