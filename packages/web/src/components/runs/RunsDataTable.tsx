"use client";

import * as React from "react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkline } from "@/components/ui/sparkline";
import { ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { RunListItem } from "@settler/types";

interface RunsDataTableProps {
  runs: RunListItem[];
  /** 14-day daily run count series for the sparkline */
  sparkline: number[];
}

const columns: DataTableColumn<RunListItem>[] = [
  {
    key: "run_id",
    header: "Run ID",
    headerClassName: "w-[140px]",
    cellClassName: "font-mono text-xs font-bold text-primary",
    cell: (row) => `#${row.run_id.slice(0, 8)}`,
  },
  {
    key: "policy",
    header: "Policy",
    cell: (row) => (
      <div className="flex items-center gap-2">
        <div className="h-10 w-10 flex-shrink-0 bg-primary/5 rounded-lg flex items-center justify-center">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-foreground">{row.policy}</span>
          <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
            {row.manual ? "Manual" : "Scheduled"}
          </span>
        </div>
      </div>
    ),
  },
  {
    key: "matched",
    header: "Matched Content",
    cellClassName: "text-sm font-bold text-foreground",
    cell: (row) => `${(row.matched_records ?? 0).toLocaleString()} records`,
  },
  {
    key: "confidence",
    header: "Confidence",
    cell: (row) => {
      const conf = row.confidence ?? 1;
      const pct = Math.round(conf * 100);
      const colorClass =
        conf >= 0.98 ? "text-success" : conf >= 0.9 ? "text-warning" : "text-destructive";
      const indicatorClass =
        conf >= 0.98 ? "bg-success" : conf >= 0.9 ? "bg-warning" : "bg-destructive";
      return (
        <div className="flex items-center gap-2">
          <Progress
            value={conf * 100}
            indicatorClassName={indicatorClass}
            className="h-1 max-w-[60px]"
          />
          <span className={`text-xs font-bold ${colorClass}`}>{pct}%</span>
        </div>
      );
    },
  },
  {
    key: "created_at",
    header: "Executed At",
    cellClassName: "text-xs font-medium text-muted-foreground whitespace-nowrap",
    cell: (row) =>
      new Date(row.created_at).toLocaleString([], {
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
  },
  {
    key: "actions",
    header: "Actions",
    headerClassName: "text-right",
    cellClassName: "text-right",
    cell: (row) => (
      <Button variant="ghost" size="sm" asChild className="h-8 font-bold">
        <Link href={`/app/runs/${row.run_id}`}>
          Inspect
          <ArrowRight className="ml-2 h-3.5 w-3.5" />
        </Link>
      </Button>
    ),
  },
];

export function RunsDataTable({ runs, sparkline }: RunsDataTableProps) {
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    if (!search.trim()) return runs;
    const q = search.toLowerCase();
    return runs.filter(
      (r) =>
        r.run_id.toLowerCase().includes(q) ||
        (r.policy ?? "").toLowerCase().includes(q)
    );
  }, [runs, search]);

  const hasActivity = sparkline.some((v) => v > 0);

  return (
    <DataTable
      columns={columns}
      data={filtered}
      getRowKey={(row) => row.run_id}
      title="Execution History"
      description="Browse and inspect past reconciliation outcomes"
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search run ID or policy…"
      toolbar={
        hasActivity ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="hidden sm:inline">14d activity</span>
            <Sparkline
              values={sparkline}
              label="Run volume over last 14 days"
              variant="bar"
              tone="default"
              width={72}
              height={22}
            />
          </div>
        ) : null
      }
      emptyState={{
        title: "No reconciliation runs yet",
        description:
          "No runs have been executed for this tenant. Start your first reconciliation run.",
        action: { label: "Execute your first run", href: "/console/playground" },
      }}
      showCount
    />
  );
}
