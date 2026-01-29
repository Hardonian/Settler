"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface SupportTicket {
  id: string;
  subject: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  severity: "low" | "medium" | "high" | "critical";
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
}

export function IssueTracker() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  useEffect(() => {
    void fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await fetch("/api/support/tickets");
      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets || []);
      }
    } catch (error) {
      console.error("Failed to fetch tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets =
    selectedStatus === "all" ? tickets : tickets.filter((t) => t.status === selectedStatus);

  const severityConfig = {
    critical: { color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/30", icon: AlertCircle },
    high: {
      color: "text-orange-600",
      bg: "bg-orange-100 dark:bg-orange-900/30",
      icon: AlertCircle,
    },
    medium: { color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30", icon: Clock },
    low: { color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30", icon: Clock },
  };

  const statusConfig = {
    open: { color: "text-blue-600", icon: Clock },
    in_progress: { color: "text-amber-600", icon: Clock },
    resolved: { color: "text-green-600", icon: CheckCircle2 },
    closed: { color: "text-slate-600", icon: XCircle },
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Support Tickets</CardTitle>
            <CardDescription>Track and manage customer issues</CardDescription>
          </div>
          <Button size="sm">New Ticket</Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">Loading...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              No tickets found
            </div>
          ) : (
            filteredTickets.map((ticket) => {
              const severity = severityConfig[ticket.severity];
              const status = statusConfig[ticket.status];
              const SeverityIcon = severity.icon;
              const StatusIcon = status.icon;

              return (
                <div
                  key={ticket.id}
                  className="flex items-start justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        severity.bg
                      )}
                    >
                      <SeverityIcon className={cn("w-5 h-5", severity.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-slate-900 dark:text-white truncate">
                          {ticket.subject}
                        </h4>
                        <Badge
                          variant={
                            ticket.severity === "critical" || ticket.severity === "high"
                              ? "destructive"
                              : "default"
                          }
                          className={cn(
                            ticket.severity === "critical" && "bg-red-600",
                            ticket.severity === "high" && "bg-orange-600"
                          )}
                        >
                          {ticket.severity}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <StatusIcon className={cn("w-4 h-4", status.color)} />
                          {ticket.status.replace("_", " ")}
                        </span>
                        <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    View
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
