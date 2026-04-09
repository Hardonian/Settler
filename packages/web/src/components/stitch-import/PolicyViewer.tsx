"use client";

import React, { useState } from "react";
import { Plus, Scale, ShieldAlert, ShieldCheck, ChevronRight, History, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Policy {
  id: string;
  name: string;
  version: string;
  status: "active" | "deprecated";
  driftCount: number;
  updatedAt: string;
}

export default function PolicyViewer({ initialPolicies }: { initialPolicies: Policy[] }) {
  const [policies] = useState<Policy[]>(initialPolicies);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Policy Posture Monitoring
        </h3>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
            {policies.length} TOTAL
          </Badge>
          <Badge
            variant="outline"
            className="bg-emerald-500/5 text-emerald-600 border-emerald-500/20"
          >
            {policies.filter((p) => p.status === "active").length} ACTIVE
          </Badge>
        </div>
      </div>

      <div className="space-y-3">
        {policies.length > 0 ? (
          policies.map((policy) => (
            <Card
              key={policy.id}
              className="group overflow-hidden border-border/40 shadow-none hover:bg-muted/10 transition-all border-l-2 border-l-transparent hover:border-l-primary/40"
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={cn(
                        "p-2 rounded-lg shrink-0",
                        policy.status === "active"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {policy.status === "active" ? (
                        <ShieldCheck className="h-5 w-5" />
                      ) : (
                        <Scale className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-bold text-foreground truncate">
                          {policy.name}
                        </h4>
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase font-bold tracking-widest px-1.5 h-4 border-muted-foreground/20"
                        >
                          {policy.version}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          Updated {new Date(policy.updatedAt).toLocaleDateString()}
                        </span>
                        {policy.driftCount > 0 && (
                          <span
                            className={cn(
                              "flex items-center gap-1 font-bold",
                              policy.driftCount > 5 ? "text-destructive" : "text-amber-600"
                            )}
                          >
                            <ShieldAlert className="h-3 w-3" />
                            {policy.driftCount} drift events
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right mr-4 hidden sm:block">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                        Status
                      </p>
                      <Badge
                        className={cn(
                          "text-[10px] font-bold uppercase",
                          policy.status === "active"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-muted/100/10 text-muted-foreground border-slate-500/20"
                        )}
                      >
                        {policy.status.toUpperCase()}
                      </Badge>
                    </div>
                    <button
                      title="View Policy Details"
                      className="rounded-lg p-2 text-muted-foreground hover:bg-primary/5 hover:text-primary transition-all"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="py-20 text-center border-2 border-dashed border-border/40 rounded-2xl bg-muted/20">
            <Info className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-base font-bold text-foreground">No Policies Found</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1 leading-relaxed">
              Your workspace posture is currently undefined. Connect a reconciliation policy to see
              live enforcement.
            </p>
            <button className="mt-6 rounded-lg bg-primary px-6 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2 mx-auto">
              <Plus className="h-4 w-4" />
              Define New Posture
            </button>
          </div>
        )}
      </div>

      <Card className="bg-primary/5 border-primary/20 shadow-none mt-8">
        <CardContent className="p-4 flex gap-3 items-start">
          <History className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-primary uppercase tracking-widest">
              Policy History Audit
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              All contract version rotations and policy overrides are recorded in the immutable
              trust log for post-mortem evidence.
            </p>
            <button className="text-[10px] font-bold text-primary hover:underline">
              View Full Audit History →
            </button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
