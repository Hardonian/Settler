"use client";

import React, { memo } from "react";
import { Database, User, Shield, Info } from "lucide-react";
import type { OperatorRunDetail } from "@/types/operator-run-detail";

interface RunProvenanceProps {
  provenance: OperatorRunDetail["provenance"];
  metadata?: Record<string, any>;
  traceId?: string | null;
  inputHash?: string | null;
}

export const RunProvenance = memo(function RunProvenance({
  provenance,
  metadata,
  traceId,
  inputHash,
}: RunProvenanceProps) {
  const actorId = typeof metadata?.userId === "string" ? metadata.userId : null;
  const sourceScopeId = provenance.reconJobId ?? provenance.ingestionId ?? "unlinked";
  const adapterPair = [provenance.sourceAdapter, provenance.targetAdapter]
    .filter(Boolean)
    .join(" -> ");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <SectionHeader icon={Info} label="Lifecycle Metadata" />
          <div className="space-y-3 p-4 rounded-xl border bg-card/40">
            <ProvenanceRow
              icon={Database}
              label="Source Model"
              value={provenance.sourceModel}
              id={sourceScopeId}
            />
            <ProvenanceRow
              icon={User}
              label="Initiated By"
              value={actorId ? "Captured in run metadata" : "Unavailable in canonical payload"}
              id={actorId || "not-captured"}
            />
            <ProvenanceRow
              icon={Shield}
              label="Adapter Pair"
              value={adapterPair || "Unavailable"}
              id={provenance.runKind}
            />
          </div>
        </div>

        <div className="space-y-4 font-mono">
          <SectionHeader icon={Shield} label="Cryptographic Breadcrumbs" />
          <div className="p-4 rounded-xl border bg-black/10 dark:bg-black/40 space-y-3 text-[10px]">
            <div className="flex items-center justify-between">
              <span className="opacity-50 uppercase">Trace ID</span>
              <span className="font-bold text-blue-500 truncate max-w-[200px]">
                {traceId || "unavailable"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="opacity-50 uppercase">Input Checksum</span>
              <span className="font-bold text-muted-foreground truncate max-w-[200px]">
                {inputHash ? `SHA-256:${inputHash.slice(0, 16)}` : "unavailable"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="opacity-50 uppercase">Execution Window</span>
              <span className="font-bold text-muted-foreground truncate max-w-[200px]">
                {provenance.executedAt || "unavailable"}
              </span>
            </div>
          </div>
          <div className="p-4 rounded-xl border bg-gradient-to-r from-blue-500/10 to-transparent flex items-center gap-3">
            <Shield className="w-5 h-5 text-blue-500" />
            <p className="text-[11px] leading-relaxed italic opacity-80">
              Canonical provenance is shown directly from the run-detail payload. Missing trace or
              hash values are treated as unavailable rather than inferred.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

function SectionHeader({ icon: Icon, label }: any) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="p-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      </div>
      <h3 className="text-sm font-bold uppercase tracking-widest">{label}</h3>
    </div>
  );
}

function ProvenanceRow({ icon: Icon, label, value, id }: any) {
  return (
    <div className="flex items-start gap-3 group">
      <div className="p-2 rounded-lg bg-muted border group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
        <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <div>
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm font-semibold">{value}</p>
        <p className="text-[10px] font-mono opacity-50 truncate max-w-[200px]">{id}</p>
      </div>
    </div>
  );
}
