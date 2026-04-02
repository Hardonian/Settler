/**
 * Webhooks Management Page
 *
 * Self-service webhook configuration and management.
 * Marked as runtime-degraded-without-provider in route maturity registry.
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ConsoleErrorBoundary } from "@/components/console/ErrorBoundary";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { EmptyState } from "@/components/ui/empty-state";

interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: Date;
  lastTriggeredAt?: Date;
  failureCount: number;
}

interface WebhooksCapability {
  state?: "available" | "degraded" | "unavailable";
  reason?: string;
}

interface WebhooksListResponse {
  webhooks?: Webhook[];
  error?: string;
  capability?: WebhooksCapability;
}
const availableEvents = [
  "reconciliation.completed",
  "reconciliation.failed",
  "receipt.parsed",
  "receipt.failed",
  "feature_flag.updated",
  "usage.limit_exceeded",
  "billing.subscription_updated",
];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [capabilityState, setCapabilityState] = useState<"available" | "degraded" | "unavailable">(
    "available"
  );
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    void fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const res = await fetch("/api/console/webhooks");
      const data = (await res.json().catch(() => ({}))) as WebhooksListResponse;

      if (!res.ok) {
        setCapabilityState(data.capability?.state === "unavailable" ? "unavailable" : "degraded");
        setLoadError(data.error || "Webhook endpoints are currently unavailable.");
        setWebhooks([]);
        return;
      }

      setWebhooks(Array.isArray(data.webhooks) ? data.webhooks : []);
      setCapabilityState(data.capability?.state || "available");
    } catch {
      setCapabilityState("degraded");
      setLoadError("Network error while loading webhooks. Check connectivity and try again.");
      setWebhooks([]);
    } finally {
      setLoading(false);
    }
  };

  const createWebhook = async () => {
    setFormError(null);

    try {
      new URL(newWebhookUrl);
    } catch {
      setFormError("Enter a valid HTTPS URL.");
      return;
    }

    if (newWebhookEvents.length === 0) {
      setFormError("Select at least one event type.");
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch("/api/console/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newWebhookUrl, events: newWebhookEvents }),
      });

      if (res.ok) {
        const data = await res.json();
        setWebhooks((prev) => [...prev, data.webhook]);
        setDialogOpen(false);
        setNewWebhookUrl("");
        setNewWebhookEvents([]);
      } else {
        const err = await res.json().catch(() => ({}));
        setFormError((err as { error?: string }).error || "Failed to create webhook. Try again.");
      }
    } catch {
      setFormError("Network error. Check your connection and try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const confirmDelete = (id: string) => {
    setPendingDeleteId(id);
    setActionError(null);
  };

  const cancelDelete = () => setPendingDeleteId(null);

  const executeDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/console/webhooks/${id}`, { method: "DELETE" });
      if (res.ok) {
        setWebhooks((prev) => prev.filter((w) => w.id !== id));
        setPendingDeleteId(null);
      } else {
        setActionError("Failed to delete webhook. Try again.");
        setPendingDeleteId(null);
      }
    } catch {
      setActionError("Network error. Check your connection and try again.");
      setPendingDeleteId(null);
    }
  };

  const toggleWebhook = async (id: string, active: boolean) => {
    setTogglingId(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/console/webhooks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });
      if (res.ok) {
        setWebhooks((prev) => prev.map((w) => (w.id === id ? { ...w, active: !active } : w)));
      } else {
        setActionError("Failed to update webhook status. Try again.");
      }
    } catch {
      setActionError("Network error. Check your connection and try again.");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <ConsoleErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <ConsolePageHeader
            title="Webhooks"
            description="Configure endpoints to receive real-time event notifications from Settler."
          />
          <div className="flex-shrink-0 pt-1">
            <Button
              onClick={() => {
                setFormError(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
              Create Webhook
            </Button>
          </div>
        </div>

        {loadError && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-400/30 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-100">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {capabilityState === "unavailable"
                  ? "Webhook management is unavailable for this session."
                  : "Webhook data is currently degraded."}
              </p>
              <p className="text-sm">{loadError}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-1"
                onClick={() => void fetchWebhooks()}
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {actionError && (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
            <AlertCircle
              className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0"
              aria-hidden="true"
            />
            <p className="text-sm text-destructive">{actionError}</p>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto -mr-1 -mt-0.5 h-auto p-0 text-xs text-destructive hover:text-destructive"
              onClick={() => setActionError(null)}
            >
              Dismiss
            </Button>
          </div>
        )}

        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setFormError(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Webhook</DialogTitle>
              <DialogDescription>
                Configure a webhook endpoint to receive event notifications.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {formError && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
                  <AlertCircle
                    className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <p className="text-sm text-destructive">{formError}</p>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="url">Webhook URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://your-app.com/webhooks/settler"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Events</Label>
                <div className="space-y-1.5">
                  {availableEvents.map((event) => (
                    <label key={event} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-border"
                        checked={newWebhookEvents.includes(event)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewWebhookEvents((prev) => [...prev, event]);
                          } else {
                            setNewWebhookEvents((prev) => prev.filter((ev) => ev !== event));
                          }
                        }}
                      />
                      <code className="text-sm text-muted-foreground">{event}</code>
                    </label>
                  ))}
                </div>
              </div>
              <Button onClick={createWebhook} className="w-full" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Creating…
                  </>
                ) : (
                  "Create Webhook"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {loading ? (
          <div
            className="flex items-center justify-center min-h-[400px]"
            role="status"
            aria-label="Loading webhooks"
          >
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
          </div>
        ) : webhooks.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <EmptyState
                icon={Plus}
                title={loadError ? "Webhook data unavailable" : "No webhooks configured"}
                description={
                  loadError
                    ? "Settler could not load webhook state. Resolve connectivity or auth issues and retry."
                    : "Create a webhook to receive real-time event notifications."
                }
                action={{
                  label: "Create Webhook",
                  onClick: () => {
                    setFormError(null);
                    setDialogOpen(true);
                  },
                }}
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Configured Webhooks</CardTitle>
              <CardDescription>
                {webhooks.length} webhook{webhooks.length !== 1 ? "s" : ""} configured
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Triggered</TableHead>
                    <TableHead>Failures</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhooks.map((webhook) => (
                    <TableRow key={webhook.id}>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-0">
                          <code className="text-sm truncate max-w-[200px] text-foreground">
                            {webhook.url}
                          </code>
                          <a
                            href={webhook.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground flex-shrink-0"
                            aria-label={`Open ${webhook.url} in new tab`}
                          >
                            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {webhook.events.map((event) => (
                            <Badge key={event} variant="secondary" className="text-xs">
                              {event.split(".")[0]}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {webhook.active ? (
                          <Badge
                            variant="default"
                            className="bg-success/15 text-success border-success/30 hover:bg-success/15"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" aria-hidden="true" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="w-3 h-3 mr-1" aria-hidden="true" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {webhook.lastTriggeredAt
                          ? format(new Date(webhook.lastTriggeredAt), "PPp")
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        {webhook.failureCount > 0 ? (
                          <span className="text-destructive font-medium tabular-nums">
                            {webhook.failureCount}
                          </span>
                        ) : (
                          <span className="text-muted-foreground tabular-nums">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {pendingDeleteId === webhook.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Delete?</span>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => executeDelete(webhook.id)}
                            >
                              Confirm
                            </Button>
                            <Button variant="ghost" size="sm" onClick={cancelDelete}>
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleWebhook(webhook.id, webhook.active)}
                              disabled={togglingId === webhook.id}
                            >
                              {togglingId === webhook.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                              ) : webhook.active ? (
                                "Deactivate"
                              ) : (
                                "Activate"
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => confirmDelete(webhook.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              aria-label={`Delete webhook ${webhook.url}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </ConsoleErrorBoundary>
  );
}
