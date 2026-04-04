/**
 * Operator support inbox — canonical view of support submissions from AuditLog.
 * Replaces legacy SupportInbox that queried ops_support_tickets.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, ChevronDown, ChevronRight } from "lucide-react";
import {
  SUPPORT_ISSUE_CATEGORY_LABELS,
  SUPPORT_STATUS_LABELS,
  SUPPORT_SEVERITY_LABELS,
  type SupportSubmissionRecord,
  type SupportStatus,
  type SupportSeverity,
} from "@settler/types";

function severityVariant(severity: string): "destructive" | "default" | "secondary" | "outline" {
  switch (severity) {
    case "critical":
    case "high":
      return "destructive";
    case "medium":
      return "default";
    default:
      return "secondary";
  }
}

function statusVariant(status: string): "destructive" | "default" | "secondary" | "outline" {
  switch (status) {
    case "open":
      return "destructive";
    case "in_progress":
      return "default";
    case "waiting_on_tenant":
      return "outline";
    default:
      return "secondary";
  }
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + "…" : s;
}

export function OperatorSupportInbox() {
  const [submissions, setSubmissions] = useState<SupportSubmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      params.set("limit", "200");

      const response = await fetch(`/api/v1/support/submissions?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch submissions");
      const data = await response.json();
      setSubmissions(data.submissions ?? []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch support submissions:", err);
      setError("Unable to load support submissions. Check connectivity and try again.");
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    setLoading(true);
    fetchSubmissions();
    const interval = setInterval(fetchSubmissions, 30_000);
    return () => clearInterval(interval);
  }, [fetchSubmissions]);

  const handleStatusChange = async (submissionId: string, newStatus: SupportStatus) => {
    try {
      const res = await fetch("/api/v1/support/submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_id: submissionId, status: newStatus }),
      });
      if (res.ok) {
        setSubmissions((prev) =>
          prev.map((s) => (s.submissionId === submissionId ? { ...s, status: newStatus } : s))
        );
      }
    } catch {
      // silent — will re-fetch
    }
  };

  const handleSeverityChange = async (submissionId: string, newSeverity: SupportSeverity) => {
    try {
      const res = await fetch("/api/v1/support/submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_id: submissionId, severity: newSeverity }),
      });
      if (res.ok) {
        setSubmissions((prev) =>
          prev.map((s) => (s.submissionId === submissionId ? { ...s, severity: newSeverity } : s))
        );
      }
    } catch {
      // silent
    }
  };

  const handleNotesBlur = async (submissionId: string, notes: string) => {
    try {
      await fetch("/api/v1/support/submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_id: submissionId, operator_notes: notes }),
      });
    } catch {
      // silent
    }
  };

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

  const openCount = submissions.filter(
    (s) => s.status === "open" || s.status === "in_progress"
  ).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Support submissions</CardTitle>
            <CardDescription>
              {submissions.length} submission{submissions.length !== 1 ? "s" : ""}
              {openCount > 0 ? ` — ${openCount} open` : ""}
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.entries(SUPPORT_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLoading(true);
                fetchSubmissions();
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : submissions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No support submissions{statusFilter !== "all" ? ` with status "${statusFilter}"` : ""}.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Submission</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Run</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((s) => {
                const isExpanded = expandedId === s.submissionId;
                return (
                  <>
                    <TableRow
                      key={s.submissionId}
                      className="cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : s.submissionId)}
                    >
                      <TableCell>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-xs text-muted-foreground">
                          {s.submissionId.slice(0, 8)}
                        </div>
                        <div className="text-sm mt-0.5">{truncate(s.description, 80)}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {SUPPORT_ISSUE_CATEGORY_LABELS[s.category] ?? s.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={severityVariant(s.severity)}>
                          {SUPPORT_SEVERITY_LABELS[s.severity] ?? s.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(s.status)}>
                          {SUPPORT_STATUS_LABELS[s.status] ?? s.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {s.tenantId ? s.tenantId.slice(0, 8) : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {s.runId ? (
                          <span title={s.runId}>
                            {s.runId.slice(0, 8)}
                            {s.runContextState ? (
                              <span className="ml-1 text-muted-foreground">
                                ({s.runContextState})
                              </span>
                            ) : null}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(s.createdAt).toLocaleDateString()}{" "}
                        {new Date(s.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                    </TableRow>
                    {isExpanded ? (
                      <TableRow key={`${s.submissionId}-detail`}>
                        <TableCell colSpan={8} className="bg-muted/30 p-4">
                          <div className="grid grid-cols-2 gap-4 max-w-3xl">
                            <div className="col-span-2">
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                Full description
                              </p>
                              <p className="text-sm whitespace-pre-wrap">{s.description}</p>
                            </div>
                            {s.route ? (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  Route
                                </p>
                                <p className="text-sm font-mono">{s.route}</p>
                              </div>
                            ) : null}
                            {s.module ? (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  Module
                                </p>
                                <p className="text-sm">{s.module}</p>
                              </div>
                            ) : null}
                            {s.contact?.email ? (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  Contact
                                </p>
                                <p className="text-sm">{s.contact.email}</p>
                              </div>
                            ) : null}
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                Change status
                              </p>
                              <Select
                                value={s.status}
                                onValueChange={(v) =>
                                  handleStatusChange(s.submissionId, v as SupportStatus)
                                }
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(SUPPORT_STATUS_LABELS).map(([val, label]) => (
                                    <SelectItem key={val} value={val}>
                                      {label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                Change severity
                              </p>
                              <Select
                                value={s.severity}
                                onValueChange={(v) =>
                                  handleSeverityChange(s.submissionId, v as SupportSeverity)
                                }
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(SUPPORT_SEVERITY_LABELS).map(([val, label]) => (
                                    <SelectItem key={val} value={val}>
                                      {label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="col-span-2">
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                Operator notes
                              </p>
                              <Textarea
                                defaultValue={s.operatorNotes ?? ""}
                                rows={2}
                                placeholder="Internal notes for this submission…"
                                onBlur={(e) => handleNotesBlur(s.submissionId, e.target.value)}
                              />
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
