"use client";

import React from "react";
import { AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react";

interface HealthCheck {
  status: "healthy" | "unhealthy" | "degraded";
  latency?: number;
  error?: string;
  timestamp: string;
}

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  checks: {
    database: HealthCheck;
    redis?: HealthCheck;
    sentry?: HealthCheck;
    supabase?: HealthCheck;
    tigerbeetle?: HealthCheck;
    [key: string]: HealthCheck | undefined;
  };
  timestamp: string;
}

interface ControlPlaneOverviewProps {
  health: HealthStatus | null;
}

const ControlPlaneOverview: React.FC<ControlPlaneOverviewProps> = ({ health }) => {
  if (!health) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="h-12 w-12 text-muted-foreground mb-4" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-foreground mb-2">System Health Unavailable</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Unable to retrieve system health data. Check API connectivity and authentication.
        </p>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-green-500" aria-hidden="true" />;
      case "degraded":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" aria-hidden="true" />;
      case "unhealthy":
        return <XCircle className="h-5 w-5 text-red-500" aria-hidden="true" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" aria-hidden="true" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "border-green-500/20 bg-green-500/8 text-green-700 dark:text-green-400";
      case "degraded":
        return "border-yellow-500/20 bg-yellow-500/8 text-yellow-700 dark:text-yellow-400";
      case "unhealthy":
        return "border-red-500/20 bg-red-500/8 text-red-700 dark:text-red-400";
      default:
        return "border-border bg-muted/20 text-muted-foreground";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-green-500/25 bg-green-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-green-700 dark:text-green-400">
            <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
            Healthy
          </span>
        );
      case "degraded":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-yellow-500/25 bg-yellow-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-yellow-700 dark:text-yellow-400">
            <span className="h-2 w-2 rounded-full bg-yellow-500" aria-hidden="true" />
            Degraded
          </span>
        );
      case "unhealthy":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-red-500/25 bg-red-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
            <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
            Unhealthy
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Unknown
          </span>
        );
    }
  };

  const dependencies = Object.entries(health.checks).filter(
    ([_, check]) => check !== undefined
  ) as [string, HealthCheck][];

  return (
    <div className="space-y-6">
      {/* Overall System Status */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Overall System Status</h2>
          {getStatusBadge(health.status)}
        </div>

        {health.status === "unhealthy" && (
          <div className="error-well mb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <h3 className="text-sm font-bold text-foreground">System Degradation Detected</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  One or more critical dependencies are unhealthy. Review dependency status below.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dependency Health Status */}
      <div>
        <h2 className="text-base font-bold text-foreground mb-3">Service Dependencies</h2>
        <div className="space-y-3">
          {dependencies.map(([name, check]) => (
            <div key={name} className={`rounded-lg border p-4 ${getStatusColor(check.status)}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(check.status)}
                  <div>
                    <h3 className="text-sm font-bold capitalize">
                      {name === "tigerbeetle" ? "TigerBeetle Ledger" : name}
                    </h3>
                    {check.latency !== undefined && (
                      <p className="text-xs mt-0.5">Response time: {check.latency}ms</p>
                    )}
                    {check.error && <p className="text-xs mt-1 font-medium">{check.error}</p>}
                  </div>
                </div>
                <span className="text-xs capitalize font-medium">{check.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timestamp */}
      <div className="text-xs text-muted-foreground">
        Last checked: {new Date(health.timestamp).toLocaleString()}
      </div>
    </div>
  );
};

export default ControlPlaneOverview;
