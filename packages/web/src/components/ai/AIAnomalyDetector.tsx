"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Activity, TrendingDown, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { detectAllAnomalies, type Anomaly } from "@/lib/ai-anomaly-detection";
import { cn } from "@/lib/utils";

export function AIAnomalyDetector({ userId }: { userId?: string }) {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      void fetchAnomalies();
    }
  }, [userId]);

  const fetchAnomalies = async () => {
    if (!userId) return;

    try {
      const detected = await detectAllAnomalies(userId);
      setAnomalies(detected);
    } catch (error: unknown) {
      console.error("Failed to detect anomalies:", error);
    } finally {
      setLoading(false);
    }
  };

  const severityConfig = {
    critical: { color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/30", icon: AlertTriangle },
    high: {
      color: "text-orange-600",
      bg: "bg-orange-100 dark:bg-orange-900/30",
      icon: AlertTriangle,
    },
    medium: {
      color: "text-amber-600",
      bg: "bg-amber-100 dark:bg-amber-900/30",
      icon: TrendingDown,
    },
    low: { color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30", icon: Activity },
  };

  const typeIcons = {
    billing: Zap,
    usage: Activity,
    integration: AlertTriangle,
    performance: TrendingDown,
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const criticalAnomalies = anomalies.filter((a: any) => a.severity === "critical");

  return (
    <div className="space-y-4">
      {anomalies.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">
                No anomalies detected. Everything looks good! ✅
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Critical Alerts */}
          {criticalAnomalies.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Critical Issues Detected</AlertTitle>
              <AlertDescription>
                {criticalAnomalies.length} critical anomaly
                {criticalAnomalies.length === 1 ? "" : "ies"} require immediate attention.
              </AlertDescription>
            </Alert>
          )}

          {/* Anomalies List */}
          <div className="space-y-3">
            {anomalies.map((anomaly) => {
              const config = severityConfig[anomaly.severity];
              const Icon = config.icon;
              const TypeIcon = typeIcons[anomaly.type];

              return (
                <Card key={anomaly.id} className={cn("border-2", config.bg, "border-current")}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            config.bg
                          )}
                        >
                          <Icon className={cn("w-5 h-5", config.color)} />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{anomaly.title}</CardTitle>
                          <CardDescription className="mt-1">{anomaly.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge
                          variant={anomaly.severity === "critical" ? "destructive" : "default"}
                          className={cn(
                            anomaly.severity === "critical" && "bg-red-600",
                            anomaly.severity === "high" && "bg-orange-600"
                          )}
                        >
                          {anomaly.severity}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <TypeIcon className="w-3 h-3 mr-1" />
                          {anomaly.type}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Detected: {anomaly.detectedAt.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
