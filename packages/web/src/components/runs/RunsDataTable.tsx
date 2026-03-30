"use client";

import * as React from "react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkline } from "@/components/ui/sparkline";
import { StatusBadge, type StatusType } from "@/components/ui/status-badge";
import { ShieldCheck, ArrowRight, AlertTriangle } from "lucide-react";
import Link from "next/link";
import type { RunListItem } from "@settler/types";

interface RunsDataTableProps {
  runs: RunListItem[];
  /** 14-day daily run count series for the sparkline */
  sparkline: number[];
}

function toStatusType(status: RunListItem["status"]): StatusType {
  switch (status) {
    case "completed":
      return "completed";
    case "failed":
      return "failed";
    case "running":
      return "running";
    case "pending":
      return "pending";
    default:
      return "unknown";
  }
}

const columns: DataTableColumn<RunListItem>[] = [
  {
    key: "run_id",
    header: "Run ID",
    headerClassName: "w-[120px]",
    cellClassName: "font-mono text-xs font-bold text-primary",
    cell: (row) => `#${row.run_id.slice(0, 8)}`,
  },
  {
    key: "status",
    header: "Status",
    headerClassName: "w-[120px]",
    cell: (row) => (
      <StatusBadge
        status={toStatusType(row.status)}
        label={row.status_label || undefined}
        size="sm"
      />
    ),
  },
  {
    key: "policy",
    header: "Policy",
    cell: (row) => (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 flex-shrink-0 bg-primary/5 rounded-lg flex items-center justify-center">
          <ShieldCheck className="h-4 w-4 text-primary" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">{row.policy}</span>
          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
            {row.manual ? "Manual" : "Scheduled"}
          </span>
        </div>
      </div>
    ),
  },
  {
    key: "matched",
    header: "Matched",
    cellClassName: "text-right tabular-nums",
    headerClassName: "text-right",
    cell: (row) => (
      <span className="text-sm font-semibold text-green-600 dark:text-green-400">
        {(row.matched_records ?? 0).toLocaleString()}
      </span>
    ),
  },
  {
    key: "unmatched",
    header: "Unmatched",
    cellClassName: "text-right tabular-nums",
    headerClassName: "text-right",
    cell: (row) => {
      const val = row.unmatched_records ?? 0;
      return (
        <span
          className={`text-sm font-semibold ${val > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}
        >
          {val.toLocaleString()}
        </span>
      );
    },
  },
  {
    key: "exceptions",
    header: "Exceptions",
    cellClassName: "text-right tabular-nums",
    headerClassName: "text-right",
    cell: (row) => {
      const val = row.unresolved_exceptions ?? 0;
      if (val === 0) {
        return <span className="text-sm text-muted-foreground">—</span>;
      }
      return (
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 dark:text-red-400">
          <AlertTriangle className="w-3 h-3" aria-hidden="true" />
          {val.toLocaleString()}
        </span>
      );
    },
  },
  {
    key: "confidence",
    header: "Conf.",
    headerClassName: "w-[100px] text-right",
    cellClassName: "text-right",
    cell: (row) => {
      const conf = row.confidence ?? 1;
      const pct = Math.round(conf * 100);
      const colorClass =
        conf >= 0.98
          ? "text-green-600 dark:text-green-400"
          : conf >= 0.9
            ? "text-amber-600 dark:text-amber-400"
            : "text-red-600 dark:text-red-400";
      const indicatorClass =
        conf >= 0.98 ? "bg-green-600" : conf >= 0.9 ? "bg-amber-500" : "bg-red-500";
      return (
        <div className="flex items-center justify-end gap-2">
          <Progress
            value={conf * 100}
            indicatorClassName={indicatorClass}
            className="h-1 max-w-[48px]"
          />
          <span className={`text-xs font-bold tabular-nums ${colorClass}`}>{pct}%</span>
        </div>
      );
    },
  },
  {
    key: "created_at",
    header: "Executed",
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
    header: "",
    headerClassName: "w-[80px]",
    cellClassName: "text-right",
    cell: (row) => (
      <Button variant="ghost" size="sm" asChild className="h-8 font-semibold">
        <Link href={`/console/runs/${row.run_id}`}>
          Detail
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
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
      (r) => r.run_id.toLowerCase().includes(q) || (r.policy ?? "").toLowerCase().includes(q)
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
