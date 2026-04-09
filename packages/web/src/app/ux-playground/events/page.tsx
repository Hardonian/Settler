/**
 * UX Events Dev View
 *
 * Internal route for inspecting recent UX events.
 * Only available in development mode.
 */

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getRecentEvents, getEventStats, clearEvents } from "@/lib/ux-events/logger";
import type { UXEventType } from "@/lib/ux-events/types";
import { Reveal } from "@/components/motion/Reveal";

export default function UXEventsPage() {
  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Not Available</CardTitle>
            <CardDescription>This view is only available in development mode.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return <UXEventsContent />;
}

function UXEventsContent() {
  const [events, setEvents] = useState<UXEventType[]>([]);
  const [stats, setStats] = useState(getEventStats());
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const updateEvents = () => {
      setEvents(getRecentEvents(100));
      setStats(getEventStats());
    };

    updateEvents();

    if (autoRefresh) {
      const interval = setInterval(updateEvents, 1000);
      return () => clearInterval(interval);
    }

    return undefined;
  }, [autoRefresh]);

  const getEventColor = (type: string) => {
    switch (type) {
      case "flow_completed":
      case "step_completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "error_occurred":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "retry_attempted":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "flow_started":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <Reveal variant="fadeUp">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
              UX Events Inspector
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Development view of recent UX interaction events
            </p>
          </div>
        </Reveal>

        {/* Stats */}
        <Reveal variant="fadeUp" delay={0.1}>
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Event Statistics</CardTitle>
                  <CardDescription>Summary of tracked events</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      clearEvents();
                      setEvents([]);
                      setStats(getEventStats());
                    }}
                  >
                    Clear Events
                  </Button>
                  <Button
                    variant={autoRefresh ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAutoRefresh(!autoRefresh)}
                  >
                    {autoRefresh ? "Auto-refresh: ON" : "Auto-refresh: OFF"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {stats.total}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Total Events</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {Object.keys(stats.byType).length}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Event Types</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {events.length}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Displayed</div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(stats.byType).map(([type, count]) => (
                  <Badge key={type} className={getEventColor(type)}>
                    {type}: {count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </Reveal>

        {/* Events List */}
        <Reveal variant="fadeUp" delay={0.2}>
          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
              <CardDescription>Most recent UX interaction events (newest first)</CardDescription>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <div className="text-center py-8 text-slate-600 dark:text-slate-400">
                  No events yet. Interact with the app to see events here.
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Badge className={getEventColor(event.type)}>{event.type}</Badge>
                        <span className="text-xs text-slate-500">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                        {event.route && (
                          <div>
                            <span className="font-semibold">Route:</span> {event.route}
                          </div>
                        )}
                        {"flowId" in event && (
                          <div>
                            <span className="font-semibold">Flow:</span> {event.flowId}
                          </div>
                        )}
                        {"stepId" in event && (
                          <div>
                            <span className="font-semibold">Step:</span> {event.stepId}
                            {"stepName" in event && ` (${event.stepName})`}
                          </div>
                        )}
                        {"errorMessage" in event && (
                          <div>
                            <span className="font-semibold">Error:</span> {event.errorMessage}
                          </div>
                        )}
                        {"duration" in event && event.duration !== undefined && (
                          <div>
                            <span className="font-semibold">Duration:</span> {event.duration}ms
                          </div>
                        )}
                      </div>
                      <details className="mt-2">
                        <summary className="text-xs text-slate-500 cursor-pointer">
                          View raw JSON
                        </summary>
                        <pre className="mt-2 text-xs bg-slate-100 dark:bg-slate-900 p-2 rounded overflow-auto">
                          {JSON.stringify(event, null, 2)}
                        </pre>
                      </details>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}
