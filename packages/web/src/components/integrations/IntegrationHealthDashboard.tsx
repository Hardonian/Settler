"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface IntegrationHealth {
  integrationId: string;
  name: string;
  status: "healthy" | "degraded" | "down" | "unknown";
  lastSync: string;
  successRate: number;
  avgResponseTime: number;
  errorCount: number;
  warnings: string[];
}

export function IntegrationHealthDashboard() {
  const [integrations, setIntegrations] = useState<IntegrationHealth[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchIntegrationHealth();
    const interval = setInterval(() => {
      void fetchIntegrationHealth();
    }, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchIntegrationHealth = async () => {
    try {
      const response = await fetch("/api/integrations/health");
      if (response.ok) {
        const data = await response.json();
        setIntegrations(data.integrations || []);
        setError(null);
      } else {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setIntegrations([]);
        setError(payload.error || "Failed to fetch integration health");
      }
    } catch (error: unknown) {
      console.error("Failed to fetch integration health:", error);
      setIntegrations([]);
      setError(error instanceof Error ? error.message : "Failed to fetch integration health");
    } finally {
      setLoading(false);
    }
  };

  const statusConfig = {
    healthy: {
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-100 dark:bg-green-900/30",
    },
    degraded: {
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-100 dark:bg-amber-900/30",
    },
    down: { icon: XCircle, color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/30" },
    unknown: { icon: Clock, color: "text-muted-foreground", bg: "bg-muted/40" },
  };

  const overallHealth =
    integrations.length > 0
      ? integrations.filter((i: any) => i.status === "healthy").length / integrations.length
      : 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-border dark:bg-border rounded w-3/4"></div>
            <div className="h-4 bg-border dark:bg-border rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-red-600 dark:text-red-400">
            Integration health is unavailable: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Health */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Health Overview</CardTitle>
          <CardDescription>Real-time status of all connected integrations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Overall Health</span>
                <span className="text-sm font-bold text-foreground">
                  {(overallHealth * 100).toFixed(0)}%
                </span>
              </div>
              <Progress value={overallHealth * 100} className="h-2" />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {integrations.filter((i: any) => i.status === "healthy").length}
                </div>
                <div className="text-xs text-muted-foreground">Healthy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {integrations.filter((i: any) => i.status === "degraded").length}
                </div>
                <div className="text-xs text-muted-foreground">Degraded</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {integrations.filter((i: any) => i.status === "down").length}
                </div>
                <div className="text-xs text-muted-foreground">Down</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-muted-foreground">
                  {integrations.filter((i: any) => i.status === "unknown").length}
                </div>
                <div className="text-xs text-muted-foreground">Unknown</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Integrations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((integration) => {
          const config = statusConfig[integration.status];
          const Icon = config.icon;
          return (
            <Card key={integration.integrationId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{integration.name}</CardTitle>
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      config.bg
                    )}
                  >
                    <Icon className={cn("w-5 h-5", config.color)} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge
                    variant={
                      integration.status === "healthy"
                        ? "default"
                        : integration.status === "degraded"
                          ? "default"
                          : "destructive"
                    }
                    className={cn(
                      integration.status === "healthy" && "bg-green-600",
                      integration.status === "degraded" && "bg-amber-600"
                    )}
                  >
                    {integration.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Success Rate:</span>
                  <span className="font-medium">{integration.successRate}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Avg Response:</span>
                  <span className="font-medium">{integration.avgResponseTime}ms</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Sync:</span>
                  <span className="font-medium">
                    {new Date(integration.lastSync).toLocaleString()}
                  </span>
                </div>
                {integration.warnings.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/40 dark:border-border">
                    <div className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">
                      Warnings:
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {integration.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
