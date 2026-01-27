/**
 * Admin Monitoring Dashboard
 * 
 * Comprehensive monitoring dashboard with all key metrics.
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Clock, Users, DollarSign, Activity, Shield, Database, TrendingUp, AlertTriangle, XCircle } from 'lucide-react';
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

interface ReliabilityMetrics {
  operationStats: Array<{
    operation: string;
    totalRequests: number;
    successCount: number;
    failureCount: number;
    successRate: number;
    avgDurationMs: number;
    p95DurationMs: number;
    retryCount: number;
    deadLetterCount: number;
  }>;
  adapterErrorRates: Array<{
    adapterType: string;
    errorRate: number;
    totalRequests: number;
  }>;
  deadLetterCount: number;
  latestFailures: Array<{
    operation: string;
    error: string;
    timestamp: string;
  }>;
}

export default function MonitoringDashboard() {
  const [health, setHealth] = useState<SystemHealth & { reliability?: ReliabilityMetrics } | null>(null);
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
      } catch {
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
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-red-900 dark:text-red-200">
              Unable to Load Metrics
            </h3>
          </div>
          <p className="text-sm text-red-800 dark:text-red-300 mb-4">
            We encountered an error while loading monitoring metrics. Please try again or contact support if the problem persists.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <p className="text-xs font-mono text-red-600 dark:text-red-400 mb-4">
              {error}
            </p>
          )}
          <Button 
            onClick={() => {
              setError(null);
              setLoading(true);
              // Trigger re-fetch
              window.location.reload();
            }}
            variant="outline"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const overallSlaPercentage = sla && sla.accounts && sla.accounts.length > 0
    ? sla.accounts.reduce((sum, a) => sum + (a.sla_percentage || 0), 0) / sla.accounts.length
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
              ARPU: ${((unitEconomics?.calculated_metrics?.arpu) || 0).toFixed(2)}
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
              {((unitEconomics?.usage?.total_reconciliations_30d) || 0).toLocaleString()}
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
                    <Badge variant={(account.sla_percentage || 0) >= 95 ? 'default' : 'destructive'}>
                      {(account.sla_percentage || 0).toFixed(1)}%
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
                      <div className="font-semibold">{(account.avg_response_time_hours || 0).toFixed(1)}h</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reliability Metrics */}
      {health?.reliability && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Reliability Metrics (Last 24 Hours)</CardTitle>
              <CardDescription>
                Operation success rates, error rates, and dead-letter jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {health.reliability.operationStats.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Operation Statistics</h3>
                    <div className="space-y-2">
                      {health.reliability.operationStats.map((stats) => (
                        <div key={stats.operation} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-medium">{stats.operation}</div>
                            <Badge 
                              variant={stats.successRate >= 0.95 ? 'default' : stats.successRate >= 0.90 ? 'secondary' : 'destructive'}
                            >
                              {(stats.successRate * 100).toFixed(1)}% success
                            </Badge>
                          </div>
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-slate-500">Total</div>
                              <div className="font-semibold">{stats.totalRequests.toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-slate-500">Failures</div>
                              <div className="font-semibold text-red-600">{stats.failureCount}</div>
                            </div>
                            <div>
                              <div className="text-slate-500">Avg Duration</div>
                              <div className="font-semibold">{stats.avgDurationMs.toFixed(0)}ms</div>
                            </div>
                            <div>
                              <div className="text-slate-500">P95 Duration</div>
                              <div className="font-semibold">{stats.p95DurationMs.toFixed(0)}ms</div>
                            </div>
                          </div>
                          {(stats.retryCount > 0 || stats.deadLetterCount > 0) && (
                            <div className="mt-2 pt-2 border-t grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="text-slate-500">Retries</div>
                                <div className="font-semibold text-yellow-600">{stats.retryCount}</div>
                              </div>
                              <div>
                                <div className="text-slate-500">Dead Letters</div>
                                <div className="font-semibold text-red-600">{stats.deadLetterCount}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {health.reliability.adapterErrorRates.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Adapter Error Rates</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {health.reliability.adapterErrorRates.map((adapter) => (
                        <div key={adapter.adapterType} className="border rounded-lg p-3">
                          <div className="font-medium mb-1">{adapter.adapterType}</div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={adapter.errorRate < 0.05 ? 'default' : adapter.errorRate < 0.10 ? 'secondary' : 'destructive'}
                            >
                              {(adapter.errorRate * 100).toFixed(1)}%
                            </Badge>
                            <span className="text-xs text-slate-500">
                              {adapter.totalRequests} requests
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        Dead-Letter Jobs
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {health.reliability.deadLetterCount}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Jobs requiring manual intervention
                      </p>
                    </CardContent>
                  </Card>

                  {health.reliability.latestFailures.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Latest Failures
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {health.reliability.latestFailures.slice(0, 5).map((failure, idx) => (
                            <div key={idx} className="text-sm border-l-2 border-red-500 pl-2">
                              <div className="font-medium">{failure.operation}</div>
                              <div className="text-xs text-slate-500 truncate">{failure.error}</div>
                              <div className="text-xs text-slate-400">
                                {new Date(failure.timestamp).toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
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
