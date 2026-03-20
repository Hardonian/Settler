"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Cloud,
  Database,
  Snowflake,
  ArrowRight,
  Play,
  Copy,
  Calendar,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ReasonForChangeDialog } from "@/components/shared/ReasonForChangeDialog";

const stats = [
  { label: "Total", value: 12 },
  { label: "Healthy", value: 9, color: "text-emerald-700", border: "border-l-emerald-500" },
  { label: "Failing", value: 3, color: "text-red-700", border: "border-l-red-500" },
];

const connections = [
  {
    id: "stripe-prod",
    name: "Stripe Payments",
    env: "Production Environment",
    icon: CreditCard,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
    status: "Healthy",
    errorRate: "0.1%",
    freshness: "2m ago",
  },
  {
    id: "snowflake-analytics",
    name: "Snowflake Warehouse",
    env: "Analytics DB",
    icon: Snowflake,
    iconBg: "bg-sky-500/10",
    iconColor: "text-sky-500",
    status: "Error",
    errorRate: "12%",
    freshness: "4h ago",
    isCritical: true,
  },
  {
    id: "salesforce-crm",
    name: "Salesforce CRM",
    env: "Sales Data",
    icon: Cloud,
    iconBg: "bg-blue-400/10",
    iconColor: "text-blue-400",
    status: "Syncing",
    errorRate: "--",
    freshness: "--",
  },
  {
    id: "prod-postgres",
    name: "Production Postgres",
    env: "User Data",
    icon: Database,
    iconBg: "bg-indigo-500/10",
    iconColor: "text-indigo-500",
    status: "Healthy",
    errorRate: "0.02%",
    freshness: "10m ago",
  },
];

export function ConnectionsPanel() {
  const [selectedConnection, setSelectedConnection] = useState<(typeof connections)[0] | null>(
    null
  );
  const [isReasonDialogOpen, setIsReasonDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const handleAction = (action: string) => {
    setPendingAction(action);
    setIsReasonDialogOpen(true);
  };

  const confirmAction = (reason: string) => {
    console.warn(`Action ${pendingAction} executed with reason: ${reason}`);
    // In production, wire to API
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground dark:text-white">
              Connections
            </h1>
            <p className="text-muted-foreground dark:text-muted-foreground mt-1">
              Manage your data sources and destinations.
            </p>
          </div>
          <Button className="rounded-full w-12 h-12 p-0 shadow-lg shadow-primary-600/20">
            <Plus className="w-6 h-6" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className={cn("p-4 border-l-4", stat.border)}>
              <span
                className={cn(
                  "text-xs font-bold uppercase tracking-wider",
                  stat.color || "text-muted-foreground"
                )}
              >
                {stat.label}
              </span>
              <div className="text-2xl font-bold text-foreground dark:text-white mt-1">
                {stat.value}
              </div>
            </Card>
          ))}
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Input
          className="pl-10 h-12 bg-card dark:bg-background border-border dark:border-border rounded-xl"
          placeholder="Search connections by name, ID, or environment..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {connections.map((conn) => {
          const Icon = conn.icon;
          return (
            <Card
              key={conn.id}
              className={cn(
                "group p-5 cursor-pointer hover:shadow-md transition-all active:scale-[0.99] border-border dark:border-border",
                conn.status === "Error" && "border-red-200 dark:border-red-900/50 bg-red-50/10"
              )}
              onClick={() => setSelectedConnection(conn)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center border",
                      conn.iconBg,
                      conn.iconColor
                    )}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground dark:text-white leading-tight">
                      {conn.name}
                    </h3>
                    <p className="text-xs font-medium text-muted-foreground dark:text-muted-foreground mt-1">
                      {conn.env}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    conn.status === "Healthy"
                      ? "success"
                      : conn.status === "Error"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {conn.status === "Healthy" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                  {conn.status === "Error" && <AlertTriangle className="w-3 h-3 mr-1" />}
                  {conn.status === "Syncing" && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
                  {conn.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-border">
                <div className="flex gap-8">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Error Rate
                    </span>
                    <span
                      className={cn(
                        "font-mono text-sm font-semibold mt-1",
                        conn.status === "Error"
                          ? "text-red-600"
                          : "text-foreground dark:text-muted-foreground"
                      )}
                    >
                      {conn.errorRate}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Freshness
                    </span>
                    <span
                      className={cn(
                        "font-mono text-sm font-semibold mt-1",
                        conn.status === "Error"
                          ? "text-red-600"
                          : "text-foreground dark:text-muted-foreground"
                      )}
                    >
                      {conn.freshness}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary-500 transition-colors" />
              </div>
            </Card>
          );
        })}
      </div>

      <Sheet
        open={!!selectedConnection}
        onOpenChange={(open) => !open && setSelectedConnection(null)}
      >
        <SheetContent className="sm:max-w-md overflow-y-auto">
          {selectedConnection && (
            <div className="space-y-8 py-6">
              <SheetHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <SheetTitle className="text-2xl font-bold">
                      {selectedConnection.name}
                    </SheetTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          selectedConnection.status === "Healthy" ? "bg-emerald-500" : "bg-red-500"
                        )}
                      />
                      <span className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                        {selectedConnection.status} • Last synced {selectedConnection.freshness}
                      </span>
                    </div>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                      Credentials
                    </h3>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-primary-600"
                      onClick={() => handleAction("edit_credentials")}
                    >
                      Edit
                    </Button>
                  </div>
                  <Card className="p-4 bg-muted/20 dark:bg-background border-border dark:border-border group relative">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">
                        API Key
                      </span>
                      <span className="font-mono text-sm text-foreground dark:text-muted-foreground">
                        sk_live_••••••••••••••••
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                    >
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </Card>
                  <Card className="p-4 bg-muted/20 dark:bg-background border-border dark:border-border">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">
                        Environment
                      </span>
                      <span className="font-mono text-sm text-foreground dark:text-muted-foreground">
                        Production
                      </span>
                    </div>
                  </Card>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                    Sync Schedule
                  </h3>
                  <div className="flex items-center gap-4 bg-muted/20 dark:bg-background p-4 rounded-xl border border-border dark:border-border">
                    <div className="w-10 h-10 rounded-lg bg-card dark:bg-card border border-border dark:border-border flex items-center justify-center text-primary-500 shadow-sm">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground dark:text-white">
                        Daily at 00:00 UTC
                      </p>
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                        Next run in 14h 32m
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-auto h-8 w-8 text-muted-foreground hover:text-primary-500"
                      onClick={() => handleAction("edit_schedule")}
                    >
                      <EditIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                    Schema Preview
                  </h3>
                  <div className="border border-border dark:border-border rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                    <div className="bg-card dark:bg-background px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-muted/20 dark:hover:bg-card/50 transition-colors">
                      <span className="text-sm font-bold font-mono text-foreground dark:text-muted-foreground">
                        Charges
                      </span>
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="bg-muted/20/50 dark:bg-background/50 p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-xs text-muted-foreground dark:text-muted-foreground">
                          id
                        </span>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          string
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-xs text-muted-foreground dark:text-muted-foreground">
                          amount
                        </span>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          int64
                        </Badge>
                      </div>
                    </div>
                    <div className="bg-card dark:bg-background px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-muted/20 dark:hover:bg-card/50 transition-colors">
                      <span className="text-sm font-bold font-mono text-foreground dark:text-muted-foreground">
                        Refunds
                      </span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-12"
                  onClick={() => handleAction("test_connection")}
                >
                  Test Connection
                </Button>
                <Button
                  className="flex-1 h-12 bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/20 gap-2"
                  onClick={() => handleAction("run_sync")}
                >
                  <Play className="w-4 h-4 fill-current" />
                  Run Sync
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <ReasonForChangeDialog
        isOpen={isReasonDialogOpen}
        onClose={() => setIsReasonDialogOpen(false)}
        onConfirm={confirmAction}
        title={`Confirm ${pendingAction
          ?.split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ")}`}
      />
    </div>
  );
}

function EditIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}
