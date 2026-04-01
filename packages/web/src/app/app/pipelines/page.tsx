"use client";

import { GitBranch, Activity, AlertTriangle, Zap } from "lucide-react";
import PipelineTable from "@/components/stitch-import/PipelineTable";
import PipelineDrawer from "@/components/stitch-import/PipelineDrawer";
import { PageHeader } from "@/components/app/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

const quickStats = [
  { label: "Active", value: "12", icon: Activity, tone: "default" as const },
  { label: "Error Rate", value: "0.4%", icon: AlertTriangle, tone: "warn" as const },
  { label: "Throughput", value: "45k/s", icon: Zap, tone: "default" as const },
];

export default function PipelinesPage() {
  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        eyebrow="Execution Infrastructure"
        title="Pipelines"
        description="Manage reconciliation pipeline configuration and monitor execution health across all active data flows."
        icon={GitBranch}
        variant="hero"
      />

      {/* Quick stats strip */}
      <div className="grid grid-cols-3 gap-4">
        {quickStats.map((stat) => (
          <Card
            key={stat.label}
            className={`panel shadow-none ${stat.tone === "warn" ? "border-amber-500/20 bg-amber-500/5" : ""}`}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {stat.label}
                </p>
                <p
                  className={`text-2xl font-bold font-mono mt-0.5 ${
                    stat.tone === "warn" ? "text-amber-600 dark:text-amber-400" : "text-foreground"
                  }`}
                >
                  {stat.value}
                </p>
              </div>
              <stat.icon
                className={`h-5 w-5 ${
                  stat.tone === "warn" ? "text-amber-500/60" : "text-muted-foreground/40"
                }`}
                aria-hidden="true"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="panel overflow-hidden">
        <PipelineTable />
      </div>
      <PipelineDrawer />
    </div>
  );
}
