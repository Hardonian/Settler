/**
 * Operator support intake inbox.
 *
 * Canonical view over support_intake_submitted audit records.
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

interface SupportIntakeRow {
  id: string;
  submissionId: string;
  tenantId: string | null;
  userId: string | null;
  subject: string;
  category: string | null;
  status: "submitted";
  route: string | null;
  module: string | null;
  runId: string | null;
  runContextState: string;
  createdAt: string;
}

interface SupportInboxProps {
  userId: string;
}

export function SupportInbox({ userId: _userId }: SupportInboxProps) {
  const [rows, setRows] = useState<SupportIntakeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchIntakes() {
      try {
        const response = await fetch("/api/console/support/tickets");
        if (!response.ok) throw new Error("Failed to fetch");
        const data = (await response.json()) as { items?: SupportIntakeRow[] };
        setRows(Array.isArray(data.items) ? data.items : []);
      } catch (error) {
        console.error("Failed to fetch support intakes:", error);
        setRows([]);
      } finally {
        setLoading(false);
      }
    }

    fetchIntakes();
    const interval = setInterval(fetchIntakes, 30000);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Support intake queue</CardTitle>
        <CardDescription>
          {rows.length} intake submission{rows.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No support intake submissions recorded yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Submission</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Run context</TableHead>
                <TableHead>Route/module</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">{row.submissionId}</code>
                      <p className="text-sm">{row.subject}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{row.tenantId ?? "unknown"}</TableCell>
                  <TableCell>
                    {row.category ? <Badge variant="outline">{row.category}</Badge> : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.runContextState === "ok" ? "default" : "secondary"}>
                      {row.runContextState}
                    </Badge>
                    {row.runId ? <p className="text-xs text-muted-foreground mt-1">{row.runId}</p> : null}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {row.route ?? "—"}
                    {row.module ? ` · ${row.module}` : ""}
                  </TableCell>
                  <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
