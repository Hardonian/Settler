"use client";

import { useState, useEffect } from "react";
import { FileText, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    void fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch("/api/admin/audit-logs");
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error: unknown) {
      // Error fetching audit logs - handled by error state
      if (process.env.NODE_ENV === 'development') {
         
        console.error("Failed to fetch audit logs:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(
    (log) =>
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Audit Logs
            </CardTitle>
            <CardDescription>View all system access and changes</CardDescription>
          </div>
          <Button size="sm" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground dark:text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 border border-border dark:border-border rounded-lg text-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{log.action}</Badge>
                    <span className="text-muted-foreground dark:text-muted-foreground">{log.resource}</span>
                  </div>
                  <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground dark:text-muted-foreground">
                  User: {log.userId} • IP: {log.ipAddress}
                </div>
                {log.details && (
                  <div className="mt-2 text-xs text-muted-foreground dark:text-muted-foreground">
                    {log.details}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
