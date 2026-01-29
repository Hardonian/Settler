'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Download, TrendingUp, Users, Activity } from 'lucide-react';
import Link from 'next/link';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  billingAccounts?: Array<{
    id: string;
    status: string;
    email?: string;
    userId: string;
  }>;
  metrics?: {
    apiCalls: number;
    activeUsers: number;
  };
}

export function TenantsObservabilityDashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [includeMetrics] = useState(true);
  
  useEffect(() => {
    loadTenants();
  }, [includeMetrics]);
  
  async function loadTenants() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (includeMetrics) {
        params.set('includeMetrics', 'true');
      }
      
      const response = await fetch(`/api/console/tenants?${params}`);
      const data = await response.json();
      
      if (data.tenants) {
        setTenants(data.tenants);
      }
    } catch (error: unknown) {
      console.error('Failed to load tenants:', error);
    } finally {
      setLoading(false);
    }
  }
  
  function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      suspended: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
  
  function exportTenants() {
    const csv = [
      ['ID', 'Name', 'Slug', 'Status', 'Created At', 'API Calls', 'Active Users'].join(','),
      ...tenants.map(tenant => [
        tenant.id,
        tenant.name,
        tenant.slug,
        tenant.status,
        tenant.createdAt,
        tenant.metrics?.apiCalls || 0,
        tenant.metrics?.activeUsers || 0,
      ].join(',')),
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tenants-observability-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  
  // Calculate aggregate metrics
  const aggregateMetrics = tenants.reduce((acc, tenant) => {
    acc.totalTenants++;
    if (tenant.status === 'active') acc.activeTenants++;
    if (tenant.metrics) {
      acc.totalApiCalls += tenant.metrics.apiCalls || 0;
      acc.totalActiveUsers += tenant.metrics.activeUsers || 0;
    }
    return acc;
  }, {
    totalTenants: 0,
    activeTenants: 0,
    totalApiCalls: 0,
    totalActiveUsers: 0,
  });
  
  if (loading && tenants.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-electric-cyan mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading tenant observability...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Aggregate Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Tenants</CardDescription>
            <CardTitle className="text-3xl">{aggregateMetrics.totalTenants}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {aggregateMetrics.activeTenants} active
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total API Calls</CardDescription>
            <CardTitle className="text-3xl">{aggregateMetrics.totalApiCalls.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <TrendingUp className="w-4 h-4" />
              <span>Across all tenants</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Users</CardDescription>
            <CardTitle className="text-3xl">{aggregateMetrics.totalActiveUsers}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <Users className="w-4 h-4" />
              <span>Total active</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Avg API Calls/Tenant</CardDescription>
            <CardTitle className="text-3xl">
              {aggregateMetrics.totalTenants > 0
                ? Math.round(aggregateMetrics.totalApiCalls / aggregateMetrics.totalTenants).toLocaleString()
                : 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
      
      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tenant List</CardTitle>
              <CardDescription>
                All tenants with their metrics. PII has been redacted for privacy compliance.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={loadTenants} variant="outline" size="default">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={exportTenants} variant="outline" size="default">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      {/* Tenants Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Tenant Name</th>
                  <th className="text-left p-4">Slug</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Created</th>
                  <th className="text-left p-4">API Calls</th>
                  <th className="text-left p-4">Active Users</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-slate-500">
                      No tenants found
                    </td>
                  </tr>
                ) : (
                  tenants.map((tenant) => (
                    <tr key={tenant.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-900">
                      <td className="p-4 font-medium">{tenant.name}</td>
                      <td className="p-4 font-mono text-xs">{tenant.slug}</td>
                      <td className="p-4">
                        <Badge className={getStatusColor(tenant.status)}>
                          {tenant.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-xs text-slate-600 dark:text-slate-400">
                        {new Date(tenant.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        {tenant.metrics ? (
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-blue-600" />
                            {tenant.metrics.apiCalls.toLocaleString()}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="p-4">
                        {tenant.metrics ? (
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-green-600" />
                            {tenant.metrics.activeUsers}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/console/admin/tenants/${tenant.id}`}>
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
