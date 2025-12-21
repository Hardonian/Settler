/**
 * Admin Monitoring Dashboard
 * 
 * Comprehensive monitoring dashboard with all key metrics.
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle2, Clock, Users, DollarSign, Activity, Shield, Database, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SystemHealth {
  status: string;
  metrics: {
    active_customers: number;
    active_subscriptions: number;
    open_support_tickets: number;
    sla_violations: number;
    timestamp: string;
  };
}

interface SLAMetrics {
  period: {
    start: string;
    end: string;
  };
  accounts: Array<{
    billing_account_id: string;
    tier: string;
    total_tickets: number;
    sla_met: number;
    sla_missed: number;
    sla_percentage: number;
    avg_response_time_hours: number;
  }>;
  violations: {
    current: number;
    alerts_sent: number;
  };
}

interface UnitEconomics {
  mrr: number;
  active_subscriptions: number;
  plan_distribution: Record<string, number>;
  usage: {
    total_reconciliations_30d: number;
  };
  calculated_metrics: {
    arpu: number;
    cost_per_reconciliation: number;
  };
}

interface OperationalMetrics {
  support: {
    total: number;
    open: number;
    resolved: number;
    sla_met: number;
    sla_missed: number;
    by_priority: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  };
  period: {
    start: string;
    end: string;
  };
}

interface BusinessMetrics {
  customers: {
    total: number;
    active: number;
    churned_30d: number;
    churn_rate: number;
  };
  timestamp: string;
}

export default function MonitoringDashboard() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [sla, setSla] = useState<SLAMetrics | null>(null);
  const [unitEconomics, setUnitEconomics] = useState<UnitEconomics | null>(null);
  const [operational, setOperational] = useState<OperationalMetrics | null>(null);
  const [business, setBusiness] = useState<BusinessMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true);
        setError(null);

        // Fetch all metrics in parallel
        const [healthRes, slaRes, unitEconRes, operationalRes, businessRes] = await Promise.all([
          fetch('/api/admin/monitoring/health'),
          fetch('/api/admin/monitoring/sla'),
          fetch('/api/admin/monitoring/unit-economics'),
          fetch('/api/admin/monitoring/operational'),
          fetch('/api/admin/monitoring/business'),
        ]);

        if (!healthRes.ok || !slaRes.ok || !unitEconRes.ok || !operationalRes.ok || !businessRes.ok) {
          throw new Error('Failed to fetch metrics');
        }

        const [healthData, slaData, unitEconData, operationalData, businessData] = await Promise.all([
          healthRes.json(),
          slaRes.json(),
          unitEconRes.json(),
          operationalRes.json(),
          businessRes.json(),
        ]);

        setHealth(healthData);
        setSla(slaData);
        setUnitEconomics(unitEconData);
        setOperational(operationalData);
        setBusiness(businessData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load metrics');
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
    // Refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading metrics: {error}</p>
        </div>
      </div>
    );
  }

  const overallSlaPercentage = sla && sla.accounts.length > 0
    ? sla.accounts.reduce((sum, a) => sum + a.sla_percentage, 0) / sla.accounts.length
    : 0;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Monitoring Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Real-time system health and business metrics
        </p>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {health?.status === 'healthy' ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-2xl font-bold text-green-600">Healthy</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-2xl font-bold text-red-600">Degraded</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Active Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health?.metrics.active_customers || 0}</div>
            <p className="text-xs text-slate-500 mt-1">
              {health?.metrics.active_subscriptions || 0} active subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              SLA Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallSlaPercentage.toFixed(1)}%
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {sla?.violations.current || 0} current violations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Open Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health?.metrics.open_support_tickets || 0}</div>
            <p className="text-xs text-slate-500 mt-1">
              {health?.metrics.sla_violations || 0} SLA violations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Business Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Monthly Recurring Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(unitEconomics?.mrr || 0).toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              ARPU: ${(unitEconomics?.calculated_metrics.arpu || 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Churn Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(business?.customers.churn_rate || 0).toFixed(2)}%
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {business?.customers.churned_30d || 0} churned (30d)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Database className="w-4 h-4" />
              Usage (30d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(unitEconomics?.usage.total_reconciliations_30d || 0).toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-1">Reconciliations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Plan Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unitEconomics?.plan_distribution && Object.entries(unitEconomics.plan_distribution).map(([plan, count]) => (
                <div key={plan} className="flex justify-between items-center">
                  <Badge variant="outline">{plan}</Badge>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Support Metrics */}
      {operational && (
        <Card>
          <CardHeader>
            <CardTitle>Support Metrics (Last 30 Days)</CardTitle>
            <CardDescription>
              {new Date(operational.period.start).toLocaleDateString()} - {new Date(operational.period.end).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-slate-500">Total Tickets</div>
                <div className="text-2xl font-bold">{operational.support.total}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Open</div>
                <div className="text-2xl font-bold text-amber-600">{operational.support.open}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">SLA Met</div>
                <div className="text-2xl font-bold text-green-600">{operational.support.sla_met}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">SLA Missed</div>
                <div className="text-2xl font-bold text-red-600">{operational.support.sla_missed}</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="text-sm font-semibold mb-2">By Priority</div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-slate-500">Critical</div>
                  <div className="text-lg font-bold text-red-600">{operational.support.by_priority.critical}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">High</div>
                  <div className="text-lg font-bold text-orange-600">{operational.support.by_priority.high}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Medium</div>
                  <div className="text-lg font-bold text-yellow-600">{operational.support.by_priority.medium}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Low</div>
                  <div className="text-lg font-bold text-blue-600">{operational.support.by_priority.low}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SLA Details */}
      {sla && sla.accounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>SLA Compliance by Tier</CardTitle>
            <CardDescription>
              {new Date(sla.period.start).toLocaleDateString()} - {new Date(sla.period.end).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sla.accounts.map((account) => (
                <div key={account.billing_account_id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold">{account.tier}</div>
                      <div className="text-sm text-slate-500">
                        {account.total_tickets} tickets
                      </div>
                    </div>
                    <Badge variant={account.sla_percentage >= 95 ? 'default' : 'destructive'}>
                      {account.sla_percentage.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                    <div>
                      <div className="text-slate-500">SLA Met</div>
                      <div className="font-semibold text-green-600">{account.sla_met}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">SLA Missed</div>
                      <div className="font-semibold text-red-600">{account.sla_missed}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Avg Response</div>
                      <div className="font-semibold">{account.avg_response_time_hours.toFixed(1)}h</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Updated */}
      <div className="text-xs text-slate-500 text-center">
        Last updated: {health?.metrics.timestamp ? new Date(health.metrics.timestamp).toLocaleString() : 'Never'}
        {' • '}
        Auto-refresh: 30s
      </div>
    </div>
  );
}
