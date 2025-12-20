'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import { safeFetch, maskToken } from '@/lib/safe-fetch';
import { Shield, Key, BarChart3 } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt?: Date;
  createdAt: Date;
}

interface Policy {
  id: string;
  type: 'rate_limit' | 'ip_allowlist' | 'webhook_signing';
  enabled: boolean;
  config: Record<string, any>;
}

interface Metrics {
  requestCount: number;
  errorRate: number;
  p95Latency: number;
  period: 'day' | 'week' | 'month';
}

export default function ControlPlanePage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [keysResult, policiesResult, metricsResult] = await Promise.all([
        safeFetch<{ keys: ApiKey[] }>('/api/control-plane/keys'),
        safeFetch<{ policies: Policy[] }>('/api/control-plane/policies'),
        safeFetch<Metrics>('/api/control-plane/metrics'),
      ]);

      if (keysResult.success) {
        setKeys(keysResult.data?.keys || []);
      }
      if (policiesResult.success) {
        setPolicies(policiesResult.data?.policies || []);
      }
      if (metricsResult.success) {
        setMetrics(metricsResult.data || null);
      }
    } catch {
      // No mock data - show empty states if API fails
      setKeys([]);
      setPolicies([]);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePolicy = async (policyId: string, enabled: boolean) => {
    const result = await safeFetch(`/api/control-plane/policies/${policyId}`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    });

    if (result.success) {
      setPolicies(policies.map(p => p.id === policyId ? { ...p, enabled } : p));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Control Plane</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage API keys, policies, and observability settings. 
            <span className="text-xs text-slate-500 ml-2">Workspace-scoped controls for security and performance.</span>
          </p>
      </div>

      <Tabs defaultValue="keys">
        <TabsList>
          <TabsTrigger value="keys">
            <Key className="w-4 h-4 mr-2" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="policies">
            <Shield className="w-4 h-4 mr-2" />
            Policies
          </TabsTrigger>
          <TabsTrigger value="observability">
            <BarChart3 className="w-4 h-4 mr-2" />
            Observability
          </TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage your API keys (masked for security)</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-32" />
              ) : keys.length === 0 ? (
                <EmptyState
                  icon={Key}
                  title="No API keys"
                  description="Create an API key to get started"
                  action={{
                    label: 'Create API Key',
                    onClick: () => window.location.href = '/console/api-keys',
                  }}
                />
              ) : (
                <div className="space-y-4">
                  {keys.map((key) => (
                    <div
                      key={key.id}
                      className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">{key.name}</div>
                        <code className="text-sm text-slate-600 dark:text-slate-400">
                          {maskToken(key.keyPrefix + '****')}
                        </code>
                        {key.lastUsedAt && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Last used: {new Date(key.lastUsedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href="/console/api-keys">Manage</a>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Policies</CardTitle>
              <CardDescription>Workspace security policies</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64" />
              ) : (
                <div className="space-y-6">
                  {policies.map((policy) => (
                    <div
                      key={policy.id}
                      className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-slate-900 dark:text-white">
                            {policy.type === 'rate_limit' && 'Rate Limiting'}
                            {policy.type === 'ip_allowlist' && 'IP Allowlist'}
                            {policy.type === 'webhook_signing' && 'Webhook Signing'}
                          </h3>
                          <Badge variant={policy.enabled ? 'default' : 'secondary'}>
                            {policy.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {policy.type === 'rate_limit' && `Limit: ${policy.config.requestsPerMinute} requests/minute`}
                          {policy.type === 'ip_allowlist' && `${policy.config.ips?.length || 0} IPs allowed`}
                          {policy.type === 'webhook_signing' && 'Require webhook signature verification'}
                        </p>
                      </div>
                      <Switch
                        checked={policy.enabled}
                        onCheckedChange={(enabled) => handleTogglePolicy(policy.id, enabled)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="observability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Observability</CardTitle>
              <CardDescription>Request metrics and performance</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64" />
              ) : metrics ? (
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">
                      {metrics.requestCount.toLocaleString()}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Requests ({metrics.period})
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">
                      {(metrics.errorRate * 100).toFixed(2)}%
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Error Rate
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">
                      {metrics.p95Latency}ms
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      P95 Latency
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="No metrics yet"
                  description="Metrics will appear here as you make API requests"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
