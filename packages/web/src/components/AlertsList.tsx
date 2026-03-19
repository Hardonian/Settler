"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  History,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface Alert {
  id: string;
  type: string;
  severity: "critical" | "warning" | "info";
  message: string;
  component: string;
  timestamp: string;
  acknowledged: boolean;
  run_id?: string | null;
}

export function AlertsList({ initialAlerts }: { initialAlerts: Alert[] }) {
  const [filter, setFilter] = useState<"all" | "open" | "ack">("all");

  const filteredAlerts = initialAlerts.filter((alert) => {
    if (filter === "open") return !alert.acknowledged;
    if (filter === "ack") return alert.acknowledged;
    return true;
  });

  const getIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case "critical":
        return "border-l-destructive";
      case "warning":
        return "border-l-amber-500";
      default:
        return "border-l-blue-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-lg w-fit">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${filter === "all" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          All ({initialAlerts.length})
        </button>
        <button
          onClick={() => setFilter("open")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${filter === "open" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Open ({initialAlerts.filter((a) => !a.acknowledged).length})
        </button>
        <button
          onClick={() => setFilter("ack")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${filter === "ack" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Acknowledged ({initialAlerts.filter((a) => a.acknowledged).length})
        </button>
      </div>

      {/* Alert Feed */}
      <div className="space-y-3">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => (
            <Card
              key={alert.id}
              className={`overflow-hidden border-border/40 shadow-none transition-all hover:bg-muted/10 border-l-4 ${getSeverityStyle(alert.severity)}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4 min-w-0">
                    <div className="mt-0.5 shrink-0">{getIcon(alert.severity)}</div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {alert.type}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(alert.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {alert.message}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5 font-medium">
                          <History className="h-3 w-3" />
                          {alert.component}
                        </span>
                        {alert.run_id && (
                          <Link
                            href={`/app/runs/${alert.run_id}`}
                            className="flex items-center gap-1 text-primary hover:underline font-mono"
                          >
                            <ShieldCheck className="h-3 w-3" />
                            Run {alert.run_id.slice(0, 8)}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {alert.acknowledged ? (
                      <Badge
                        variant="outline"
                        className="bg-green-500/5 text-green-600 border-green-500/20 gap-1 px-2 py-0"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Ack
                      </Badge>
                    ) : (
                      <button className="text-xs font-bold text-primary hover:underline flex items-center gap-1 bg-primary/5 px-2 py-1 rounded">
                        Ack <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="py-12 text-center border-2 border-dashed border-border/40 rounded-xl bg-muted/20">
            <CheckCircle2 className="mx-auto h-8 w-8 text-muted-foreground/40 mb-3" />
            <h3 className="text-sm font-semibold text-foreground">No alerts found</h3>
            <p className="text-xs text-muted-foreground">
              Try adjusting your filters or check back later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
