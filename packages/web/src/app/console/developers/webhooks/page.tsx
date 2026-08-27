"use client";

import { useEffect, useState } from "react";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Webhook, Activity, RefreshCw, AlertTriangle } from "lucide-react";

export default function WebhookDeliveryPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        const res = await fetch("/api/v1/webhooks/logs");
        if (res.ok) {
          const json = await res.json();
          setLogs(json.data?.logs || []);
        }
      } catch (err) {
        console.error("Failed to fetch webhook logs", err);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  const handleReplay = async (endpoint: string, payload: any) => {
    try {
      await fetch("/api/v1/webhooks/replay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookId: "mock", endpoint, payload }),
      });
      alert("Webhook replay initiated.");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <ConsolePageHeader
        title="Webhook Delivery Logs"
        description="Monitor outbound event streams, inspect payloads, and manually trigger retries."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Recent Delivery Attempts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading logs...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Latency</TableHead>
                  <TableHead>Delivered At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium text-xs">{log.event}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[200px]">
                      {log.endpoint}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={log.status === 200 ? "default" : "destructive"}
                        className="flex w-fit items-center gap-1"
                      >
                        {log.status === 200 ? (
                          "200 OK"
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3" /> {log.status} Failed
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{log.latencyMs}ms</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(log.deliveredAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReplay(log.endpoint, log.payload)}
                        className="h-8"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Replay
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      <Webhook className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      No webhooks fired recently.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
