/**
 * Admin Webhook Inbox
 *
 * View and monitor Stripe webhook events for debugging and observability.
 */

import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/shared/db/prismaClient";
import { redirect } from "next/navigation";
import { CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { adminLogger } from "@/lib/admin/utils/logger";

export const dynamic = "force-dynamic";

interface WebhookEvent {
  id: string;
  eventId: string;
  type: string;
  status: "received" | "processed" | "failed";
  receivedAt: Date;
  processedAt: Date | null;
  error: string | null;
  billingAccountId: string | null;
}

async function getWebhookEvents(limit: number = 50): Promise<WebhookEvent[]> {
  try {
    const events = await prisma.stripeEvent.findMany({
      take: limit,
      orderBy: { receivedAt: "desc" },
      select: {
        id: true,
        eventId: true,
        type: true,
        status: true,
        receivedAt: true,
        processedAt: true,
        error: true,
        billingAccountId: true,
      },
    });

    return events.map(
      (e: {
        id: string;
        eventId: string;
        type: string;
        status: string;
        receivedAt: Date;
        processedAt: Date | null;
        error: string | null;
        billingAccountId: string | null;
      }) => ({
        id: e.id,
        eventId: e.eventId,
        type: e.type,
        status: e.status as "received" | "processed" | "failed",
        receivedAt: e.receivedAt,
        processedAt: e.processedAt,
        error: e.error,
        billingAccountId: e.billingAccountId,
      })
    );
  } catch (_error) {
    adminLogger.error("Error fetching webhook events", error);
    return [];
  }
}

async function getWebhookStats() {
  try {
    const [total, processed, failed, pending] = await Promise.all([
      prisma.stripeEvent.count(),
      prisma.stripeEvent.count({ where: { status: "processed" } }),
      prisma.stripeEvent.count({ where: { status: "failed" } }),
      prisma.stripeEvent.count({ where: { status: "received" } }),
    ]);

    return { total, processed, failed, pending };
  } catch (_error) {
    adminLogger.error("Error fetching webhook stats", error);
    return { total: 0, processed: 0, failed: 0, pending: 0 };
  }
}

async function WebhookInboxContent() {
  try {
    // Check admin access
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      redirect("/signup");
    }

    // Use proper super admin check
    const { isSuperAdmin } = await import("@/lib/auth/super-admin");
    const isAdmin = await isSuperAdmin();

    if (!isAdmin) {
      redirect("/signup?next=" + encodeURIComponent("/admin/webhooks"));
    }
  } catch (_error) {
    adminLogger.error("Auth check error in webhooks page", error);
    redirect("/signup");
  }

  let events: WebhookEvent[] = [];
  let stats = { total: 0, processed: 0, failed: 0, pending: 0 };

  try {
    [events, stats] = await Promise.all([getWebhookEvents(50), getWebhookStats()]);
  } catch (_error) {
    adminLogger.error("Error loading webhooks data", error);
    // Continue with empty data - error already logged
  }

  const statusConfig = {
    processed: {
      color: "text-green-600",
      bg: "bg-green-100 dark:bg-green-900/30",
      icon: CheckCircle2,
      label: "Processed",
    },
    failed: {
      color: "text-red-600",
      bg: "bg-red-100 dark:bg-red-900/30",
      icon: XCircle,
      label: "Failed",
    },
    received: {
      color: "text-amber-600",
      bg: "bg-amber-100 dark:bg-amber-900/30",
      icon: Clock,
      label: "Pending",
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Webhook Inbox</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Monitor Stripe webhook events and debug issues
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Processed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.processed.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Failed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {stats.pending.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
          <CardDescription>Last 50 webhook events</CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 dark:text-slate-400 mb-2">No webhook events found</p>
              <p className="text-sm text-slate-400 dark:text-slate-500">
                Webhook events will appear here once Stripe sends events to your endpoint.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {events.map((event) => {
                const config = statusConfig[event.status];
                const Icon = config.icon;
                return (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.bg}`}
                      >
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-slate-900 dark:text-white">
                            {event.type}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {event.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                          <div>
                            Event ID: <code className="text-xs">{event.eventId}</code>
                          </div>
                          <div>
                            Received {formatDistanceToNow(event.receivedAt, { addSuffix: true })}
                          </div>
                          {event.billingAccountId && (
                            <div>
                              Account:{" "}
                              <code className="text-xs">
                                {event.billingAccountId.substring(0, 8)}...
                              </code>
                            </div>
                          )}
                        </div>
                        {event.error && (
                          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-800 dark:text-red-200">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span className="break-all">{event.error}</span>
                            </div>
                          </div>
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

export default function AdminWebhooksPage() {
  return (
    <div className="p-8">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">Loading webhook events...</p>
            </div>
          </div>
        }
      >
        <WebhookInboxContent />
      </Suspense>
    </div>
  );
}
