import React from "react";
import {
  Search,
  Fingerprint,
  RefreshCw,
  Play,
  CheckCircle,
  Network,
  ArrowRight,
  Shield,
  Scale,
  Terminal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Trace Explorer | Settler",
  description: "Distributed correlation and execution lineage tracking.",
};

export default function TracesPage() {
  return (
    <div className="space-y-8 pb-8">
      <div className="max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70 mb-2">
          System Diagnostics
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Trace Explorer</h1>
        <p className="mt-4 text-base text-muted-foreground leading-relaxed">
          Correlate events across distributed reconciliation pipelines. Use Trace IDs to
          reconstructed request-response lifecycles, identifying bottlenecks and provenance failures
          in the data trust graph.
        </p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            className="pl-10 h-10 rounded-xl border-border/40 bg-card/50"
            placeholder="Enter Trace ID (e.g. 8f7a-2b1c-9d3e)..."
          />
        </div>
        <Button className="h-10 rounded-xl font-bold px-6">Explore Trace</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/40 bg-card/50 overflow-hidden">
            <CardContent className="p-0">
              <div className="p-6 border-b border-border/40 flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Fingerprint className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold font-mono">TRACE #8F7A-2B1C</h2>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                      Initiated Today, 10:42:15 AM
                    </p>
                  </div>
                </div>
                <Badge variant="success">
                  COMPLETED
                </Badge>
              </div>

              <div className="p-8">
                <div className="relative pl-8">
                  {/* Vertical Line */}
                  <div className="absolute left-[39px] top-6 bottom-6 w-0.5 bg-border" />

                  <div className="space-y-12">
                    {/* Step 1 */}
                    <div className="relative flex gap-6">
                      <div className="relative z-10 w-6 h-6 rounded-full bg-primary border-4 border-background flex items-center justify-center -ml-3 mt-1">
                        <RefreshCw className="h-3 w-3 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="text-sm font-bold text-foreground">
                            Data Ingestion (Sync)
                          </h4>
                          <span className="text-[10px] font-mono text-muted-foreground">42ms</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Snapshotted 1,402 records from{" "}
                          <code className="text-primary font-bold">internal_postgres</code>. Schema
                          version validated against policy{" "}
                          <code className="text-foreground font-bold">v2.1.0</code>.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="relative flex gap-6">
                      <div className="relative z-10 w-6 h-6 rounded-full bg-primary border-4 border-background flex items-center justify-center -ml-3 mt-1">
                        <Play className="h-3 w-3 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="text-sm font-bold text-foreground">
                            Reconciliation Execution
                          </h4>
                          <span className="text-[10px] font-mono text-muted-foreground">158ms</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Matched 1,398 items with 100% confidence. Identified 4 potential drift
                          events. Replay fingerprint generated:{" "}
                          <code className="text-foreground">6e72...a2f1</code>.
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="relative flex gap-6">
                      <div className="relative z-10 w-6 h-6 rounded-full bg-emerald-500 border-4 border-background flex items-center justify-center -ml-3 mt-1">
                        <CheckCircle className="h-3 w-3 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="text-sm font-bold text-foreground">Governance Review</h4>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            0ms (Auto)
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Auto-approved based on confidence scoring. Post-mortem evidence exported
                          to S3.
                        </p>
                        <div className="mt-3 p-3 rounded-lg bg-muted/40 font-mono text-[10px] text-muted-foreground border border-border/40">
                          {`{ "status": "ok", "drift_count": 4, "verifiable": true }`}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/40 bg-card/50">
            <CardContent className="p-6">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Contextual Trust
              </h3>
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-border/40 space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Pipeline
                  </p>
                  <p className="text-sm font-bold text-foreground flex items-center justify-between">
                    Daily_Settle_v4
                    <Network className="h-4 w-4 text-primary" />
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-border/40 space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Compliance Scope
                  </p>
                  <p className="text-sm font-bold text-foreground flex items-center justify-between">
                    SOX-Verifiable
                    <Scale className="h-4 w-4 text-emerald-500" />
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20 shadow-none">
            <CardContent className="p-6">
              <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Lineage Discovery
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Settler uses content-addressable storage for all trace payloads, ensuring zero-drift
                between the log and the actual data states.
              </p>
              <Button
                variant="ghost"
                className="w-full justify-between text-[10px] font-bold h-8 text-primary hover:text-primary hover:bg-primary/10"
              >
                EXPORT LINEAGE PROOF
                <ArrowRight className="h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
