"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { safeFetch, maskToken } from "@/lib/safe-fetch";
import { Shield, Key, BarChart3, Siren, Wrench } from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt?: Date;
  createdAt: Date;
}

interface Policy {
  id: string;
  type: "rate_limit" | "ip_allowlist" | "webhook_signing";
  enabled: boolean;
  config: Record<string, any>;
}

interface Metrics {
  requestCount: number;
  errorRate: number;
  p95Latency: number;
  period: "day" | "week" | "month";
}

interface Insight {
  id: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  evidenceSummary: string;
  affectedScope: string;
  recommendedAction: string;
  deepLink: string;
}

export default function ControlPlanePage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [triggerStatus, setTriggerStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [keysResult, policiesResult, metricsResult] = await Promise.all([
        safeFetch<{ keys: ApiKey[] }>("/api/control-plane/keys"),
        safeFetch<{ policies: Policy[] }>("/api/control-plane/policies"),
        safeFetch<Metrics>("/api/control-plane/metrics"),
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

      const failureResult = await safeFetch<{ insights: Insight[] }>(
        "/api/control-plane/failures",
        {
          method: "POST",
          body: JSON.stringify({ incidents: [] }),
        }
      );

      if (failureResult.success && failureResult.data?.insights) {
        setInsights(failureResult.data.insights);
      }
    } catch {
      // No mock data - show empty states if API fails
      setKeys([]);
      setPolicies([]);
      setMetrics(null);
      setInsights([]);
    } finally {
      setLoading(false);
    }
  };

  const runDiagnosticsTrigger = async () => {
    const result = await safeFetch<{ triggerId: string; status: string }>(
      "/api/control-plane/triggers",
      {
        method: "POST",
        body: JSON.stringify({ triggerType: "run_diagnostics" }),
      }
    );

    if (result.success && result.data) {
      setTriggerStatus(`Diagnostics executed (${result.data.triggerId}).`);
      await loadData();
      return;
    }

    setTriggerStatus("Failed to execute diagnostics trigger.");
  };

  const handleTogglePolicy = async (policyId: string, enabled: boolean) => {
    const result = await safeFetch(`/api/control-plane/policies/${policyId}`, {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    });

    if (result.success) {
      setPolicies(policies.map((p) => (p.id === policyId ? { ...p, enabled } : p)));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground dark:text-white">Control Plane</h1>
        <p className="text-muted-foreground dark:text-muted-foreground mt-1">
          Manage API keys, policies, and observability settings.
          <span className="text-xs text-muted-foreground ml-2">
            Workspace-scoped controls for security and performance.
          </span>
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
          <TabsTrigger value="failure-intelligence">
            <Siren className="w-4 h-4 mr-2" />
            Failure Intelligence
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
                    label: "Create API Key",
                    onClick: () => (window.location.href = "/console/api-keys"),
                  }}
                />
              ) : (
                <div className="space-y-4">
                  {keys.map((key) => (
                    <div
                      key={key.id}
                      className="flex items-center justify-between p-4 bg-muted/20 dark:bg-card rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-foreground dark:text-white">
                          {key.name}
                        </div>
                        <code className="text-sm text-muted-foreground dark:text-muted-foreground">
                          {maskToken(key.keyPrefix + "****")}
                        </code>
                        {key.lastUsedAt && (
                          <div className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
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
                      className="flex items-center justify-between p-4 bg-muted/20 dark:bg-card rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-foreground dark:text-white">
                            {policy.type === "rate_limit" && "Rate Limiting"}
                            {policy.type === "ip_allowlist" && "IP Allowlist"}
                            {policy.type === "webhook_signing" && "Webhook Signing"}
                          </h3>
                          <Badge variant={policy.enabled ? "default" : "secondary"}>
                            {policy.enabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                          {policy.type === "rate_limit" &&
                            `Limit: ${policy.config.requestsPerMinute} requests/minute`}
                          {policy.type === "ip_allowlist" &&
                            `${policy.config.ips?.length || 0} IPs allowed`}
                          {policy.type === "webhook_signing" &&
                            "Require webhook signature verification"}
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
                    <div className="text-3xl font-bold text-foreground dark:text-white">
                      {metrics.requestCount.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
                      Requests ({metrics.period})
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-foreground dark:text-white">
                      {(metrics.errorRate * 100).toFixed(2)}%
                    </div>
                    <div className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
                      Error Rate
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-foreground dark:text-white">
                      {metrics.p95Latency}ms
                    </div>
                    <div className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
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

        <TabsContent value="failure-intelligence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Failure Intelligence</CardTitle>
              <CardDescription>
                Diagnosed readiness and configuration risks with action paths.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  Trigger diagnostics to refresh insights and remediation recommendations.
                </p>
                <Button variant="outline" size="sm" onClick={runDiagnosticsTrigger}>
                  <Wrench className="w-4 h-4 mr-2" />
                  Run Diagnostics
                </Button>
              </div>
              {triggerStatus && (
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                  {triggerStatus}
                </p>
              )}

              {loading ? (
                <Skeleton className="h-48" />
              ) : insights.length === 0 ? (
                <EmptyState
                  icon={Siren}
                  title="No failure intelligence yet"
                  description="Once runs and readiness diagnostics are available, insights will appear here."
                />
              ) : (
                <div className="space-y-3">
                  {insights.map((insight) => (
                    <div
                      key={insight.id}
                      className="rounded-lg border border-border dark:border-border p-4 bg-card dark:bg-background"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-medium text-foreground dark:text-white">
                          {insight.title}
                        </h3>
                        <Badge
                          variant={
                            insight.severity === "critical" || insight.severity === "high"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {insight.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-2">
                        {insight.evidenceSummary}
                      </p>
                      <p className="text-sm text-foreground dark:text-muted-foreground mt-2">
                        <span className="font-medium">Recommended action:</span>{" "}
                        {insight.recommendedAction}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                          Scope: {insight.affectedScope} · Confidence{" "}
                          {(insight.confidence * 100).toFixed(0)}%
                        </span>
                        <Button variant="outline" size="sm" asChild>
                          <a href={insight.deepLink}>Open action</a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
