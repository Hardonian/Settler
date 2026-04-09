/**
 * Operator support intake inbox — canonical rows from Prisma audit_logs (support_intake_submission).
 */

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SupportIntakeRow {
  id: string;
  submissionId: string;
  ticketNumber: string;
  tenantId: string | null;
  userId: string | null;
  categoryLabel: string;
  operatorTriagePriority: string;
  route: string | null;
  module: string | null;
  runId: string | null;
  runContextState: string | null;
  exceptionId: string | null;
  exceptionContextState: string | null;
  familyLabel: string | null;
  familyState: string | null;
  descriptionPreview: string;
  fullDescription: string;
  createdAt: string;
  sourcePath: string | null;
}

interface SupportInboxProps {
  userId: string;
}

function normalizeRow(raw: Record<string, unknown>): SupportIntakeRow {
  const id = String(raw.id ?? "");
  const submissionId = String(raw.submissionId ?? raw.submission_id ?? id);
  const ticketNumber =
    typeof raw.ticketNumber === "string"
      ? raw.ticketNumber
      : submissionId.length >= 8
        ? submissionId.slice(0, 8)
        : submissionId;

  const subject = typeof raw.subject === "string" ? raw.subject : "";
  const descPreview =
    typeof raw.descriptionPreview === "string"
      ? raw.descriptionPreview
      : subject || "(no description)";

  const categoryLabel =
    typeof raw.categoryLabel === "string"
      ? raw.categoryLabel
      : typeof raw.category === "string"
        ? raw.category
        : "—";

  const priority =
    typeof raw.operatorTriagePriority === "string"
      ? raw.operatorTriagePriority
      : typeof raw.priority === "string"
        ? raw.priority
        : "medium";

  const runCtx =
    raw.runContextState === null || raw.runContextState === undefined
      ? null
      : String(raw.runContextState);

  return {
    id,
    submissionId,
    ticketNumber,
    tenantId: typeof raw.tenantId === "string" || raw.tenantId === null ? raw.tenantId : null,
    userId: typeof raw.userId === "string" || raw.userId === null ? raw.userId : null,
    categoryLabel,
    operatorTriagePriority: priority,
    route: typeof raw.route === "string" || raw.route === null ? raw.route : null,
    module: typeof raw.module === "string" || raw.module === null ? raw.module : null,
    runId: typeof raw.runId === "string" || raw.runId === null ? raw.runId : null,
    runContextState: runCtx,
    exceptionId:
      typeof raw.exceptionId === "string" || raw.exceptionId === null ? raw.exceptionId : null,
    exceptionContextState:
      typeof raw.exceptionContextState === "string" || raw.exceptionContextState === null
        ? raw.exceptionContextState
        : null,
    familyLabel:
      typeof raw.familyLabel === "string" || raw.familyLabel === null ? raw.familyLabel : null,
    familyState:
      typeof raw.familyState === "string" || raw.familyState === null ? raw.familyState : null,
    descriptionPreview: descPreview,
    fullDescription: typeof raw.fullDescription === "string" ? raw.fullDescription : descPreview,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : "",
    sourcePath:
      typeof raw.sourcePath === "string" || raw.sourcePath === null ? raw.sourcePath : null,
  };
}

export function SupportInbox({ userId: _userId }: SupportInboxProps) {
  const [rows, setRows] = useState<SupportIntakeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [degraded, setDegraded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchIntakes() {
      try {
        const response = await fetch("/api/console/support/tickets");
        const data = (await response.json()) as Record<string, unknown>;
        if (!response.ok) {
          setDegraded(Boolean(data.degraded));
          setErrorMessage(typeof data.error === "string" ? data.error : "Failed to load inbox");
          setRows([]);
          return;
        }
        setDegraded(Boolean(data.degraded));
        setErrorMessage(null);

        const rawList = Array.isArray(data.items)
          ? data.items
          : Array.isArray(data.tickets)
            ? data.tickets
            : [];
        setRows(rawList.map((r) => normalizeRow(r as Record<string, unknown>)));
      } catch {
        setRows([]);
        setDegraded(true);
        setErrorMessage("Failed to load support inbox");
      } finally {
        setLoading(false);
      }
    }

    void fetchIntakes();
    const interval = setInterval(() => void fetchIntakes(), 30_000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-56" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const priorityVariant = (p: string) => {
    switch (p) {
      case "urgent":
      case "high":
        return "destructive" as const;
      case "medium":
        return "default" as const;
      default:
        return "secondary" as const;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Support intake</CardTitle>
        <CardDescription>
          {rows.length} submission{rows.length !== 1 ? "s" : ""} — canonical audit trail
          (tenant-scoped records).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {degraded && errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        {rows.length === 0 && !degraded ? (
          <p className="text-sm text-muted-foreground">No support intake submissions yet.</p>
        ) : rows.length === 0 ? null : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Run</TableHead>
                <TableHead>Context</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs align-top">
                    <div>{row.ticketNumber}</div>
                    <div className="text-muted-foreground normal-case mt-1 text-[11px] break-all">
                      {row.submissionId}
                    </div>
                    {row.sourcePath && (
                      <div className="text-muted-foreground normal-case mt-1">{row.sourcePath}</div>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs align-top max-w-[140px] break-all">
                    {row.tenantId ?? "—"}
                  </TableCell>
                  <TableCell className="align-top">
                    <Badge variant="outline">{row.categoryLabel}</Badge>
                    {row.route && (
                      <div className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">
                        {row.route}
                      </div>
                    )}
                    {row.module && (
                      <div className="text-xs text-muted-foreground mt-0.5">{row.module}</div>
                    )}
                  </TableCell>
                  <TableCell className="align-top">
                    <Badge variant={priorityVariant(row.operatorTriagePriority)}>
                      {row.operatorTriagePriority}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs align-top">{row.runId ?? "—"}</TableCell>
                  <TableCell className="text-xs align-top max-w-[220px]">
                    {row.runContextState && (
                      <div>
                        Run intel: <span className="font-mono">{row.runContextState}</span>
                      </div>
                    )}
                    {row.exceptionContextState && (
                      <div>
                        Exception intel:{" "}
                        <span className="font-mono">{row.exceptionContextState}</span>
                      </div>
                    )}
                    {row.familyLabel && (
                      <div className="mt-1">
                        Family:{" "}
                        <span className="font-medium">
                          {row.familyLabel}
                          {row.familyState ? ` (${row.familyState})` : ""}
                        </span>
                      </div>
                    )}
                    {row.exceptionId && (
                      <div className="text-muted-foreground mt-1 font-mono break-all">
                        Exception: {row.exceptionId}
                      </div>
                    )}
                    <div className="text-muted-foreground mt-1 whitespace-pre-wrap break-words">
                      {row.descriptionPreview}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap align-top">
                    {row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
