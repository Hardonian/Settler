"use client";

import { useState, useEffect } from "react";
import { Activity, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

interface SystemHealth {
  component: string;
  status: "healthy" | "degraded" | "unhealthy";
  metrics: {
    cpu: number;
    memory: number;
    requests: number;
    errors: number;
  };
}

interface EdgeFunctionHealth {
  name: string;
  status: "healthy" | "error";
  invocations: number;
  errors: number;
  avgDuration: number;
}

interface RetryQueue {
  queueName: string;
  pending: number;
  failed: number;
  processing: number;
}

export function OperationsDashboard() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth[]>([]);
  const [edgeFunctions, setEdgeFunctions] = useState<EdgeFunctionHealth[]>([]);
  const [retryQueues, setRetryQueues] = useState<RetryQueue[]>([]);
  const [_loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOpsData();
    const interval = setInterval(fetchOpsData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchOpsData = async () => {
    try {
      const [healthRes, functionsRes, queuesRes] = await Promise.all([
        fetch("/api/ops/system-health"),
        fetch("/api/ops/edge-functions"),
        fetch("/api/ops/retry-queues"),
      ]);

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setSystemHealth(healthData.health || []);
      }

      if (functionsRes.ok) {
        const functionsData = await functionsRes.json();
        setEdgeFunctions(functionsData.functions || []);
      }

      if (queuesRes.ok) {
        const queuesData = await queuesRes.json();
        setRetryQueues(queuesData.queues || []);
      }
    } catch (error) {
      console.error("Failed to fetch ops data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="edge-functions">Edge Functions</TabsTrigger>
          <TabsTrigger value="queues">Retry Queues</TabsTrigger>
          <TabsTrigger value="errors">Error Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {systemHealth.map((health) => (
                  <Card key={health.component}>
                    <CardHeader className="pb-3">
                      <CardDescription>{health.component}</CardDescription>
                      <CardTitle className="text-2xl">
                        {health.status === "healthy"
                          ? "✓"
                          : health.status === "degraded"
                            ? "⚠"
                            : "✗"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>CPU</span>
                          <span>{health.metrics.cpu}%</span>
                        </div>
                        <Progress value={health.metrics.cpu} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Memory</span>
                          <span>{health.metrics.memory}%</span>
                        </div>
                        <Progress value={health.metrics.memory} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edge-functions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Edge Function Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {edgeFunctions.map((func) => (
                  <div
                    key={func.name}
                    className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-blue-600" />
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">
                          {func.name}
                        </h4>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {func.invocations} invocations • {func.avgDuration}ms avg
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={func.status === "healthy" ? "default" : "destructive"}>
                        {func.status}
                      </Badge>
                      {func.errors > 0 && (
                        <span className="text-sm text-red-600 dark:text-red-400">
                          {func.errors} errors
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queues" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Retry Queues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {retryQueues.map((queue) => (
                  <div
                    key={queue.queueName}
                    className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-slate-900 dark:text-white">
                        {queue.queueName}
                      </h4>
                      <Badge variant={queue.pending > 100 ? "destructive" : "default"}>
                        {queue.pending} pending
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Pending:</span>
                        <span className="ml-2 font-semibold">{queue.pending}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Processing:</span>
                        <span className="ml-2 font-semibold">{queue.processing}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Failed:</span>
                        <span className="ml-2 font-semibold text-red-600 dark:text-red-400">
                          {queue.failed}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                No recent errors
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
