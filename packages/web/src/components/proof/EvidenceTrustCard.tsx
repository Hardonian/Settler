"use client";

import React from "react";
import { ShieldCheck, ChevronRight, Fingerprint, RefreshCw, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip } from "@/components/ui/Tooltip";

export interface EvidenceTrustCardProps {
  exceptionId: string;
  completenessScore: number;
  evidenceCount: number;
  missingEvidence: string[];
  isActionable: boolean;
  reliabilityScore?: number;
}

export function EvidenceTrustCard({
  exceptionId,
  completenessScore,
  evidenceCount,
  missingEvidence,
  isActionable,
  reliabilityScore = 0.85, // Default for demo if not provided
}: EvidenceTrustCardProps) {
  const scorePercentage = Math.round(completenessScore * 100);
  const isHealthy = completenessScore >= 0.8;
  const isWarning = completenessScore > 0.4 && completenessScore < 0.8;
  const isCritical = completenessScore <= 0.4;

  return (
    <Card className="panel glass border-l-4 border-l-primary/40 overflow-hidden group hover:shadow-xl transition-all duration-300">
      <CardHeader className="bg-primary/5 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg ${isHealthy ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}
            >
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-xs font-black uppercase tracking-widest">
                Truth Intelligence
              </CardTitle>
              <CardDescription className="text-[10px] font-medium uppercase tracking-tighter opacity-70">
                PROVENANCE PKG: {exceptionId.slice(0, 12).toUpperCase()}
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`text-[10px] font-black tracking-widest ${isHealthy ? "border-success/20 bg-success/5 text-success" : "border-warning/20 bg-warning/5 text-warning"}`}
          >
            {isActionable ? "ACTIONABLE" : "DEGRADED"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Metric Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Completeness
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black italic tracking-tighter">
                {scorePercentage}%
              </span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase">
                pkg depth
              </span>
            </div>
            <Progress value={scorePercentage} className="h-1 mt-2" />
          </div>
          <div className="space-y-1 text-right">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Artifacts
            </p>
            <div className="flex items-baseline justify-end gap-1">
              <span className="text-2xl font-black italic tracking-tighter">{evidenceCount}</span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase">
                linked
              </span>
            </div>
            <div className="flex justify-end gap-1 mt-2">
              {[...Array(Math.min(5, evidenceCount))].map((_, i) => (
                <div key={i} className="h-1 w-2 rounded-full bg-primary/40" />
              ))}
            </div>
          </div>
        </div>

        {/* Gap Analysis */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
            <Fingerprint className="h-3 w-3" /> Gap Analysis
          </p>
          <div className="space-y-2">
            {missingEvidence.length > 0 ? (
              missingEvidence.map((evidence, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-warning/5 border border-warning/10 group/item hover:bg-warning/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                    <span className="text-xs font-semibold text-foreground/80 lowercase">
                      {evidence.replace(/_/g, " ")}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[8px] font-black uppercase text-warning border-warning/20"
                  >
                    Pending
                  </Badge>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-success/5 border border-success/10">
                <ShieldCheck className="h-3.5 w-3.5 text-success" />
                <span className="text-xs font-semibold text-foreground/80">
                  Full evidence chain verified
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Audit Footer */}
        <div className="pt-4 border-t border-border/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border border-border/50 px-2 py-1 rounded-md bg-muted/40">
            <RefreshCw className="h-3 w-3" /> {Math.round(reliabilityScore * 100)}% RELIABILITY
          </div>
          <button className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors group/btn">
            Inspect Proof{" "}
            <ChevronRight className="h-3 w-3 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
