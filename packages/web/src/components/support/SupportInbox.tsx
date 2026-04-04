/**
 * Operator inbox — canonical support intake rows (Prisma audit_logs).
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
  category: string;
  categoryLabel: string;
  operatorTriagePriority: string;
  route: string | null;
  module: string | null;
  runId: string | null;
  runContextState: string | null;
  descriptionPreview: string;
  fullDescription: string;
  createdAt: string;
  sourcePath: string | null;
}

interface SupportInboxProps {
  userId: string;
}

export function SupportInbox({ userId: _userId }: SupportInboxProps) {
  const [rows, setRows] = useState<SupportIntakeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [degraded, setDegraded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTickets() {
      try {
        const response = await fetch("/api/support/tickets");
        const data = await response.json();
        if (!response.ok) {
          setDegraded(Boolean(data.degraded));
          setErrorMessage(typeof data.error === "string" ? data.error : "Failed to load inbox");
          setRows([]);
          return;
        }
        setDegraded(Boolean(data.degraded));
        setErrorMessage(null);
        setRows(data.tickets || []);
      } catch {
        setRows([]);
        setDegraded(true);
        setErrorMessage("Failed to load support inbox");
      } finally {
        setLoading(false);
      }
    }
    void fetchTickets();
    const interval = setInterval(fetchTickets, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
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
                    <div className="text-muted-foreground mt-1 whitespace-pre-wrap break-words">
                      {row.descriptionPreview}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap align-top">
                    {new Date(row.createdAt).toLocaleString()}
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
