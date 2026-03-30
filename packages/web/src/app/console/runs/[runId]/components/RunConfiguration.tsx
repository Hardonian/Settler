"use client";

import React, { memo } from "react";
import { Database, Filter, Hash, ShieldCheck, FileText, AlertTriangle } from "lucide-react";
import type { OperatorRunDetail } from "@/types/operator-run-detail";

interface RunConfigurationProps {
  config: OperatorRunDetail["config"];
  configDrift: OperatorRunDetail["configDrift"];
}

export const RunConfiguration = memo(function RunConfiguration({
  config,
  configDrift,
}: RunConfigurationProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ConfigCard
          icon={Database}
          label="Source Adapter"
          value={config.sourceAdapter || "Unknown"}
          subtext={`Model: ${config.configSource}`}
        />
        <ConfigCard
          icon={Database}
          label="Target Adapter"
          value={config.targetAdapter || "Unknown"}
          subtext={`Model: ${config.configSource}`}
        />
        <ConfigCard
          icon={Filter}
          label="Strategy"
          value={config.reconStrategy || "Default Engine"}
          subtext={`Template: ${config.templateId || "None"}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        <div className="space-y-4">
          <SectionHeader
            icon={ShieldCheck}
            label="Security & Compliance"
            sublabel="Config capture & validation state"
          />
          <div className="space-y-3 p-4 rounded-xl border bg-card/30">
            <SecurityRow
              label="Snapshot Status"
              value={config.snapshotId ? "Encrypted & Immutable" : "Transient"}
              id={config.snapshotId || "local-01"}
              status="verified"
            />
            <SecurityRow
              label="Input Hash"
              value="Cryptographic Integrity"
              id={config.inputHash || "sha256:unknown"}
              status="verified"
            />
            <div className="pt-2">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-2 px-1">
                Validation Rules ({config.validationRuleCount})
              </p>
              <div className="flex flex-wrap gap-1.5 font-mono text-[9px]">
                {config.validationRuleLabels.length > 0 ? (
                  config.validationRuleLabels.map((lbl) => (
                    <span
                      key={lbl}
                      className="px-2 py-0.5 rounded border bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                    >
                      {lbl}
                    </span>
                  ))
                ) : (
                  <span className="italic opacity-50 px-1">No rule labels provided.</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <SectionHeader
            icon={FileText}
            label="Drift Analysis"
            sublabel="Current deployment vs Captured snapshot"
          />
          <div className="p-4 rounded-xl border bg-card/30 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Drift Signal</span>
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase transition-all ${
                  configDrift.status === "detected"
                    ? "text-red-600 bg-red-500/10 border-red-500/20 animate-pulse"
                    : configDrift.status === "indeterminate"
                      ? "text-yellow-600 bg-yellow-500/10 border-yellow-500/20"
                      : "text-green-600 bg-green-500/10 border-green-500/20"
                }`}
              >
                {configDrift.status === "detected" && <AlertTriangle className="w-3.5 h-3.5" />}
                {configDrift.status.toUpperCase()}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <span className="text-xs text-muted-foreground">Affected Adapter</span>
                <span className="text-xs font-mono font-bold capitalize">
                  {configDrift.adapter}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <span className="text-xs text-muted-foreground">Definition Drift</span>
                <span className="text-xs font-mono font-bold">
                  {config.definitionDriftDetected ? "DETECTED" : "NONE"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-muted-foreground">Summary Basis</span>
                <span className="text-xs font-mono font-bold">{config.summaryBasis}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

function ConfigCard({ icon: Icon, label, value, subtext }: any) {
  return (
    <div className="p-4 rounded-xl border bg-card transition-all hover:shadow-md hover:border-blue-500/40 transform hover:-translate-y-1 group">
      <div className="flex items-center gap-3 mb-2 opacity-70 group-hover:opacity-100 transition-opacity">
        <Icon className="w-4 h-4 text-blue-500" />
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
      </div>
      <div>
        <p className="text-lg font-bold truncate tracking-tight">{value}</p>
        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{subtext}</p>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, label, sublabel }: any) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="p-1.5 rounded-lg bg-muted border">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div>
        <h3 className="text-sm font-bold tracking-tight leading-none mb-1">{label}</h3>
        <p className="text-[11px] text-muted-foreground leading-none">{sublabel}</p>
      </div>
    </div>
  );
}

function SecurityRow({ label, value, id, status }: any) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex flex-col">
        <span className="text-xs font-semibold">{label}</span>
        <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[200px] border-b border-dashed border-muted-foreground/0 group-hover:border-muted-foreground/40 transition-all cursor-help">
          {id}
        </span>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-[11px] font-bold text-green-600 dark:text-green-500 flex items-center gap-1">
          {status === "verified" && <ShieldCheck className="w-3.5 h-3.5" />}
          {value}
        </span>
      </div>
    </div>
  );
}
