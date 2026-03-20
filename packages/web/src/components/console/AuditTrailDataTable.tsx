"use client";

import * as React from "react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import type { AuditLogItem } from "@/lib/domain/runs/runs-reader";

interface AuditTrailDataTableProps {
  logs: AuditLogItem[];
}

const columns: DataTableColumn<AuditLogItem>[] = [
  {
    key: "timestamp",
    header: "Timestamp",
    headerClassName: "w-[180px]",
    cellClassName: "text-[11px] font-mono whitespace-nowrap opacity-70",
    cell: (row) =>
      new Date(row.timestamp).toLocaleString([], {
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
  },
  {
    key: "action",
    header: "Action",
    headerClassName: "w-[120px]",
    cell: (row) => (
      <Badge
        variant="outline"
        className={`text-[10px] font-bold uppercase tracking-wider ${
          row.action.includes("error")
            ? "text-destructive border-destructive/30 bg-destructive/5"
            : row.action.includes("delete")
              ? "text-warning border-warning/30 bg-warning/5"
              : "text-primary border-primary/30 bg-primary/5"
        }`}
      >
        {row.action}
      </Badge>
    ),
  },
  {
    key: "resource",
    header: "Resource",
    headerClassName: "w-[150px]",
    cellClassName: "text-xs font-bold text-foreground capitalize",
    cell: (row) => row.resource.replace(/_/g, " "),
  },
  {
    key: "details",
    header: "Details",
    cellClassName: "text-xs font-medium text-muted-foreground",
    cell: (row) => row.details,
  },
  {
    key: "actor",
    header: "Actor",
    headerClassName: "w-[150px]",
    cell: (row) => (
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-3 w-3 text-primary" />
        </div>
        <span className="text-xs font-bold text-foreground">{row.actor}</span>
      </div>
    ),
  },
  {
    key: "ip",
    header: "IP",
    headerClassName: "text-right w-[100px]",
    cellClassName: "text-[10px] font-mono text-muted-foreground text-right",
    cell: (row) => row.ip,
  },
];

export function AuditTrailDataTable({ logs }: AuditTrailDataTableProps) {
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    if (!search.trim()) return logs;
    const q = search.toLowerCase();
    return logs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.resource.toLowerCase().includes(q) ||
        l.actor.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        l.ip.includes(q)
    );
  }, [logs, search]);

  return (
    <DataTable
      columns={columns}
      data={filtered}
      getRowKey={(row) => row.id}
      title="Execution & Modification Log"
      description="Recent system events and administrative actions"
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Filter by action, resource, actor…"
      emptyState={{
        title: "No audit events",
        description: "No audit events have been recorded for your tenant yet.",
      }}
      showCount
    />
  );
}
