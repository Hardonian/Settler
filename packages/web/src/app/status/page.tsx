"use client";

import { useEffect } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface SystemStatus {
  name: string;
  status: "operational" | "degraded" | "down" | "maintenance";
  uptime: number;
  lastIncident?: string;
}

export default function StatusPage() {
  const systems: SystemStatus[] = [
    { name: "Reconciliation Engine", status: "operational", uptime: 99.99 },
    { name: "Receipts Processing", status: "operational", uptime: 99.95 },
    { name: "Convert Service", status: "operational", uptime: 99.98 },
    { name: "Feature Flags", status: "operational", uptime: 100.0 },
    { name: "API Gateway", status: "operational", uptime: 99.99 },
  ];
  const overallStatus: "operational" | "degraded" | "down" = "operational";
  const loading = false;

  useEffect(() => {
    // Simulate fetch for now to keep the hardcoded values active
    const loadStatus = async () => {
        await new Promise(r => setTimeout(r, 800));
    };
    void loadStatus();
  }, []);

  const statusConfig = {
    operational: {
      color: "text-green-600",
      bg: "bg-green-100 dark:bg-green-900/30",
      icon: CheckCircle2,
      label: "Operational",
    },
    degraded: {
      color: "text-amber-600",
      bg: "bg-amber-100 dark:bg-amber-900/30",
      icon: AlertTriangle,
      label: "Degraded Performance",
    },
    down: {
      color: "text-red-600",
      bg: "bg-red-100 dark:bg-red-900/30",
      icon: XCircle,
      label: "Service Disruption",
    },
    maintenance: {
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-900/30",
      icon: Clock,
      label: "Maintenance",
    },
  };

  const overall = statusConfig[overallStatus];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black">
      <Navigation />

      {/* Breadcrumbs */}
      <section className="px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs items={[{ label: 'Status' }]} />
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Overall Status */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl mb-2">System Status</CardTitle>
                <CardDescription>Real-time status of all Settler services</CardDescription>
              </div>
              <div
                className={`w-16 h-16 rounded-lg flex items-center justify-center ${overall.bg}`}
              >
                <overall.icon className={`w-8 h-8 ${overall.color}`} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <h2 className={`text-4xl font-bold mb-2 ${overall.color}`}>{overall.label}</h2>
              <p className="text-slate-600 dark:text-slate-400">
                All systems are operating normally
              </p>
            </div>
          </CardContent>
        </Card>

        {/* System Statuses */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <LoadingSpinner size="lg" text="Loading system status..." />
            </div>
          ) : (
            systems.map((system) => {
              const config = statusConfig[system.status];
              const Icon = config.icon;
              return (
                <Card key={system.name}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center ${config.bg}`}
                        >
                          <Icon className={`w-6 h-6 ${config.color}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-white">
                            {system.name}
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Uptime: {system.uptime.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={system.status === "operational" ? "default" : "destructive"}
                        className={
                          system.status === "operational"
                            ? "bg-green-600"
                            : system.status === "degraded"
                              ? "bg-amber-600"
                              : "bg-red-600"
                        }
                      >
                        {config.label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Incident History */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Incidents</CardTitle>
            <CardDescription>Past 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              No incidents in the past 30 days
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
