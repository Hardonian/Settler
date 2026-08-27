"use client";

import { useState, useEffect, useCallback } from "react";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShieldCheck,
  Hash,
  RefreshCw,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Eye,
} from "lucide-react";

/* ─── Types ───────────────────────────────────────────────────── */

interface TrustMetric {
  label: string;
  value: number; // 0-100
  status: "excellent" | "good" | "warning" | "critical";
  detail: string;
}

interface TrustScoreData {
  overallScore: number;
  grade: "A+" | "A" | "B+" | "B" | "C" | "D" | "F";
  metrics: TrustMetric[];
  recentRuns: Array<{
    id: string;
    name: string;
    hashStable: boolean;
    replayParity: number;
    evidenceComplete: boolean;
    timestamp: string;
  }>;
  lastUpdated: string;
}

/* ─── Demo Data (deterministic — always returns same scores) ── */

function computeTrustScore(): TrustScoreData {
  const metrics: TrustMetric[] = [
    {
      label: "Hash Stability",
      value: 100,
      status: "excellent",
      detail: "All runs produce stable content hashes. No hash drift detected across 847 runs.",
    },
    {
      label: "Replay Parity",
      value: 98.2,
      status: "excellent",
      detail:
        "98.2% of replayed runs produce byte-for-byte identical outputs. 15 of 847 had expected schema evolution.",
    },
    {
      label: "Evidence Chain Completeness",
      value: 100,
      status: "excellent",
      detail:
        "Every run has a complete ingest → normalize → match → emit evidence chain. No orphaned steps.",
    },
    {
      label: "Proofpack Integrity",
      value: 99.6,
      status: "excellent",
      detail:
        "843 of 847 proofpacks pass offline verification. 4 used a deprecated hash format (still verifiable).",
    },
    {
      label: "Tenant Isolation",
      value: 100,
      status: "excellent",
      detail:
        "Zero cross-tenant data access detected. All 9 security invariants (INV-1 through INV-9) enforced.",
    },
    {
      label: "Exception Resolution Rate",
      value: 87,
      status: "good",
      detail: "87% of exceptions resolved within SLA window. 13% pending operator review for >48h.",
    },
  ];

  const avgScore = metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
  const grade =
    avgScore >= 98
      ? "A+"
      : avgScore >= 95
        ? "A"
        : avgScore >= 90
          ? "B+"
          : avgScore >= 85
            ? "B"
            : avgScore >= 70
              ? "C"
              : avgScore >= 50
                ? "D"
                : "F";

  const recentRuns = [
    {
      id: "run_01J8K7XMQY4D",
      name: "stripe→bank daily",
      hashStable: true,
      replayParity: 100,
      evidenceComplete: true,
      timestamp: "2 hours ago",
    },
    {
      id: "run_01J8K6WMPY3C",
      name: "shopify→quickbooks",
      hashStable: true,
      replayParity: 100,
      evidenceComplete: true,
      timestamp: "6 hours ago",
    },
    {
      id: "run_01J8K5VLOX2B",
      name: "paypal→ledger sync",
      hashStable: true,
      replayParity: 100,
      evidenceComplete: true,
      timestamp: "12 hours ago",
    },
    {
      id: "run_01J8K4UKNW1A",
      name: "stripe→bank daily",
      hashStable: true,
      replayParity: 98,
      evidenceComplete: true,
      timestamp: "1 day ago",
    },
    {
      id: "run_01J8K3TJMV0Z",
      name: "multi-source close",
      hashStable: true,
      replayParity: 100,
      evidenceComplete: true,
      timestamp: "2 days ago",
    },
  ];

  return {
    overallScore: Math.round(avgScore * 10) / 10,
    grade,
    metrics,
    recentRuns,
    lastUpdated: new Date().toISOString(),
  };
}

/* ─── Component ───────────────────────────────────────────────── */

export default function TrustScorePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TrustScoreData | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    // Simulate async load (in prod, this would hit /api/console/trust-score)
    setTimeout(() => {
      setData(computeTrustScore());
      setLoading(false);
    }, 600);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-6">
        <ConsolePageHeader
          title="Trust Scorecard"
          description="Determinism and evidence integrity metrics for your reconciliation environment."
          breadcrumbs={[{ label: "Console" }, { label: "Trust Score" }]}
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-border/40">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const gradeColor = data.grade.startsWith("A")
    ? "text-green-600 dark:text-green-400"
    : data.grade.startsWith("B")
      ? "text-blue-600 dark:text-blue-400"
      : data.grade.startsWith("C")
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  return (
    <div className="space-y-6">
      <ConsolePageHeader
        title="Trust Scorecard"
        description="Determinism and evidence integrity metrics for your reconciliation environment."
        breadcrumbs={[{ label: "Console" }, { label: "Trust Score" }]}
        actions={
          <Badge variant="success" className="gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            All invariants enforced
          </Badge>
        }
      />

      {/* Overall Score Hero */}
      <Card className="border-primary/20 bg-primary/[0.02]">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-shrink-0 text-center">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="absolute inset-0 w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-border/30"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-primary"
                    strokeDasharray={`${(data.overallScore / 100) * 327} 327`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="text-center">
                  <span className={`text-3xl font-bold ${gradeColor}`}>{data.grade}</span>
                  <p className="text-xs text-muted-foreground font-mono">{data.overallScore}%</p>
                </div>
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-bold mb-1">Platform Trust Score</h2>
              <p className="text-sm text-muted-foreground mb-3">
                Composite score across hash stability, replay parity, evidence completeness,
                proofpack integrity, tenant isolation, and exception resolution.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="gap-1 text-[10px] font-mono">
                  <Hash className="h-3 w-3" />
                  847 runs evaluated
                </Badge>
                <Badge variant="outline" className="gap-1 text-[10px] font-mono">
                  <Lock className="h-3 w-3" />
                  9/9 invariants
                </Badge>
                <Badge variant="outline" className="gap-1 text-[10px] font-mono">
                  <RefreshCw className="h-3 w-3" />
                  Last verified: now
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.metrics.map((metric) => {
          const Icon =
            metric.status === "excellent" || metric.status === "good"
              ? CheckCircle2
              : AlertTriangle;
          const valueColor =
            metric.status === "excellent"
              ? "text-green-600 dark:text-green-400"
              : metric.status === "good"
                ? "text-blue-600 dark:text-blue-400"
                : metric.status === "warning"
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-red-600 dark:text-red-400";

          return (
            <Card key={metric.label} className="border-border/40 bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                  <Icon className={`h-3.5 w-3.5 ${valueColor}`} />
                  {metric.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-bold font-mono ${valueColor}`}>
                    {metric.value}%
                  </span>
                  <Badge
                    variant={
                      metric.status === "excellent"
                        ? "success"
                        : metric.status === "good"
                          ? "info"
                          : "warning"
                    }
                    className="text-[9px] uppercase"
                  >
                    {metric.status}
                  </Badge>
                </div>
                <Progress value={metric.value} className="h-1.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">{metric.detail}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Runs Verification */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Recent Run Verification
          </CardTitle>
          <CardDescription>Last 5 reconciliation runs and their determinism status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.recentRuns.map((run) => (
              <div
                key={run.id}
                className="flex items-center justify-between rounded-lg border border-border/40 bg-card/30 p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{run.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{run.id}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge
                    variant={run.hashStable ? "success" : "destructive"}
                    className="text-[9px]"
                  >
                    <Hash className="h-2.5 w-2.5 mr-1" />
                    {run.hashStable ? "Stable" : "Drift"}
                  </Badge>
                  <Badge
                    variant={run.replayParity === 100 ? "success" : "warning"}
                    className="text-[9px]"
                  >
                    <RefreshCw className="h-2.5 w-2.5 mr-1" />
                    {run.replayParity}%
                  </Badge>
                  <Badge
                    variant={run.evidenceComplete ? "success" : "destructive"}
                    className="text-[9px]"
                  >
                    <FileCheck className="h-2.5 w-2.5 mr-1" />
                    {run.evidenceComplete ? "Complete" : "Incomplete"}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground ml-2 hidden sm:inline">
                    {run.timestamp}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
