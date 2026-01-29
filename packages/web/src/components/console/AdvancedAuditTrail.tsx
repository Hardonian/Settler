/**
 * Advanced Audit Trail Component
 * Enhanced audit log viewer with filtering and exports
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Download, Filter, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface AuditLog {
  id: number;
  at: string;
  actor?: string;
  action: string;
  schemaName: string;
  tableName: string;
  rowPk?: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  complianceTags?: string[];
}

export function AdvancedAuditTrail() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    actor: "",
    action: "",
    schemaName: "",
    tableName: "",
    startDate: "",
    endDate: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.actor) params.append("actor", filters.actor);
      if (filters.action) params.append("action", filters.action);
      if (filters.schemaName) params.append("schemaName", filters.schemaName);
      if (filters.tableName) params.append("tableName", filters.tableName);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const res = await fetch(`/api/v1/audit-trail/logs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch logs");

      const data = await res.json();
      setLogs(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/audit-trail/exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filters,
          exportFormat: "csv",
          expiresInDays: 7,
        }),
      });

      if (!res.ok) throw new Error("Failed to create export");

      const data = await res.json();
      // In a real implementation, you'd download the file
      alert(`Export created: ${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Advanced Audit Trail</CardTitle>
              <CardDescription>View and export audit logs with advanced filtering</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button variant="outline" onClick={handleExport} disabled={loading}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" onClick={fetchLogs} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {showFilters && (
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Actor</Label>
                    <Input
                      value={filters.actor}
                      onChange={(e) => setFilters({ ...filters, actor: e.target.value })}
                      placeholder="Filter by actor"
                    />
                  </div>
                  <div>
                    <Label>Action</Label>
                    <Input
                      value={filters.action}
                      onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                      placeholder="Filter by action"
                    />
                  </div>
                  <div>
                    <Label>Schema</Label>
                    <Input
                      value={filters.schemaName}
                      onChange={(e) => setFilters({ ...filters, schemaName: e.target.value })}
                      placeholder="Filter by schema"
                    />
                  </div>
                  <div>
                    <Label>Table</Label>
                    <Input
                      value={filters.tableName}
                      onChange={(e) => setFilters({ ...filters, tableName: e.target.value })}
                      placeholder="Filter by table"
                    />
                  </div>
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={fetchLogs}>Apply Filters</Button>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="text-center py-8">Loading audit logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No audit logs found</div>
          ) : (
            <div className="border rounded">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Schema.Table</TableHead>
                    <TableHead>Row ID</TableHead>
                    <TableHead>Compliance Tags</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {format(new Date(log.at), "MMM d, yyyy HH:mm:ss")}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.actor ? log.actor.slice(0, 8) + "..." : "System"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.action}</Badge>
                      </TableCell>
                      <TableCell>
                        {log.schemaName}.{log.tableName}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.rowPk ? log.rowPk.slice(0, 8) + "..." : "-"}
                      </TableCell>
                      <TableCell>
                        {log.complianceTags && log.complianceTags.length > 0 ? (
                          <div className="flex gap-1">
                            {log.complianceTags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{log.ipAddress || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
