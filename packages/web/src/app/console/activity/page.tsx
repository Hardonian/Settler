"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Upload,
  Webhook,
  CreditCard,
} from "lucide-react";
// Simple date formatting without external dependency
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

interface ActivityEvent {
  id: string;
  type: "reconciliation" | "file_upload" | "webhook" | "billing";
  status: "success" | "failed" | "pending";
  message: string;
  workspaceId: string;
  actorId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export default function ActivityPage() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadEvents();

    if (autoRefresh) {
      const interval = setInterval(loadEvents, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
    return undefined;
  }, [autoRefresh]);

  const loadEvents = async () => {
    try {
      const result = await fetch("/api/workspace/events");
      if (result.ok) {
        const data = await result.json();
        setEvents(data.events || []);
      } else {
        // No mock data - show empty state if API fails
        setEvents([]);
      }
    } catch {
      // No mock data - show empty state on error
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: ActivityEvent["type"]) => {
    switch (type) {
      case "reconciliation":
        return RefreshCw;
      case "file_upload":
        return Upload;
      case "webhook":
        return Webhook;
      case "billing":
        return CreditCard;
      default:
        return Activity;
    }
  };

  const getStatusIcon = (status: ActivityEvent["status"]) => {
    switch (status) {
      case "success":
        return CheckCircle2;
      case "failed":
        return XCircle;
      case "pending":
        return Clock;
      default:
        return Activity;
    }
  };

  const getStatusColor = (status: ActivityEvent["status"]) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "failed":
        return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
      case "pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Activity Feed</h1>
          <p className="text-muted-foreground mt-1">
            Real-time updates on reconciliations, file uploads, webhooks, and billing.
            <span className="text-xs text-muted-foreground/70 ml-2">
              Auto-refreshes every 5 seconds when enabled.
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh
          </label>
          <Button variant="outline" size="sm" onClick={loadEvents} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Workspace-scoped activity events</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && events.length === 0 ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No activity yet"
              description="Activity events will appear here as you use Settler"
            />
          ) : (
            <div className="space-y-4">
              {events.map((event) => {
                const EventIcon = getEventIcon(event.type);
                const StatusIcon = getStatusIcon(event.status);

                return (
                  <div
                    key={event.id}
                    className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                      <EventIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-foreground">{event.message}</p>
                        <Badge className={getStatusColor(event.status)}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {event.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatTimeAgo(event.timestamp)}</span>
                        {event.metadata && (
                          <span className="text-xs">
                            {Object.entries(event.metadata)
                              .slice(0, 2)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
