'use client';

import { adminLogger } from '@/lib/admin/utils/logger';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import { safeFetch } from '@/lib/safe-fetch';
// Admin check will be done server-side via middleware
import { DollarSign, Users, Download, AlertCircle } from 'lucide-react';

interface KPIs {
  mrr: number;
  arr: number;
  churn: number;
  trialToPaidConversion: number;
  activeWorkspaces: number;
  runsPerDay: number;
  errorRate: number;
  cogsEstimate: number;
}

interface WorkspaceDetail {
  id: string;
  name: string;
  plan: string;
  mrr: number;
  status: string;
  createdAt: Date;
}

type DateRange = '7d' | '30d' | '90d' | 'all';

const isDateRange = (value: string): value is DateRange =>
  value === '7d' || value === '30d' || value === '90d' || value === 'all';

export default function AdminAnalyticsPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [kpisResult, workspacesResult] = await Promise.all([
        safeFetch<KPIs>(`/api/admin/analytics/kpis?range=${dateRange}`),
        safeFetch<{ workspaces: WorkspaceDetail[] }>(`/api/admin/analytics/workspaces?plan=${planFilter}`),
      ]);

      if (kpisResult.success) {
        setKpis(kpisResult.data || null);
      } else {
        adminLogger.warn('KPIs fetch failed', { error: kpisResult.error });
      }
      
      if (workspacesResult.success) {
        setWorkspaces(workspacesResult.data?.workspaces || []);
      } else {
        adminLogger.warn('Workspaces fetch failed', { error: workspacesResult.error });
      }
      
      // Only set error if both fail
      if (!kpisResult.success && !workspacesResult.success) {
        setError('Unable to load analytics data. Please try again.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      adminLogger.error('Error loading analytics data', new Error(errorMessage));
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [dateRange, planFilter]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleDateRangeChange = (value: string) => {
    if (isDateRange(value)) {
      setDateRange(value);
    }
  };

  const handleExport = () => {
    const data = {
      kpis,
      workspaces,
      exportedAt: new Date().toISOString(),
    };
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `settler-analytics-${dateRange}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Analytics</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Internal analytics dashboard (admin only)
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={handleDateRangeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-red-900 dark:text-red-200">
              Error Loading Analytics
            </h3>
          </div>
          <p className="text-sm text-red-800 dark:text-red-300 mb-4">
            {error}
          </p>
          <Button onClick={loadData} variant="outline" size="sm">
            Retry
          </Button>
        </div>
      )}

      {/* KPIs */}
      {loading ? (
        <div className="grid md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : kpis ? (
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>MRR</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-green-600" />
                ${(kpis.mrr / 1000).toFixed(1)}K
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                ARR: ${(kpis.arr / 1000).toFixed(0)}K
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Churn Rate</CardDescription>
              <CardTitle className="text-3xl">
                {(kpis.churn * 100).toFixed(2)}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Trial → Paid: {(kpis.trialToPaidConversion * 100).toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Active Workspaces</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600" />
                {kpis.activeWorkspaces}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Runs/day: {kpis.runsPerDay.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Error Rate</CardDescription>
              <CardTitle className="text-3xl">
                {(kpis.errorRate * 100).toFixed(2)}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                COGS: ${(kpis.cogsEstimate / 1000).toFixed(1)}K
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <EmptyState title="No data available" />
      )}

      {/* Workspaces */}
      <Card>
        <CardHeader>
          <CardTitle>Workspaces</CardTitle>
          <CardDescription>Drill down into workspace details</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64" />
          ) : workspaces.length === 0 ? (
            <EmptyState title="No workspaces found" />
          ) : (
            <div className="space-y-2">
              {workspaces.map((workspace) => (
                <div
                  key={workspace.id}
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                  onClick={() => window.location.href = `/admin/workspaces/${workspace.id}`}
                >
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">{workspace.name}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {workspace.plan} • ${workspace.mrr}/month • {workspace.status}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    View Details →
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
