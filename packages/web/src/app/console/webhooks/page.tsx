/**
 * Webhooks Management Page
 *
 * Self-service webhook configuration and management.
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ConsoleErrorBoundary } from "@/components/console/ErrorBoundary";
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
import { Plus, Trash2, ExternalLink, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";

interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: Date;
  lastTriggeredAt?: Date;
  failureCount: number;
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>([]);

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/console/webhooks");
      if (res.ok) {
        const data = await res.json();
        setWebhooks(data.webhooks || []);
      }
    } catch (err) {
      console.error("Failed to fetch webhooks:", err);
    } finally {
      setLoading(false);
    }
  };

  const createWebhook = async () => {
    // Validate URL
    try {
      new URL(newWebhookUrl);
    } catch {
      alert("Please enter a valid URL");
      return;
    }

    // Validate events
    if (newWebhookEvents.length === 0) {
      alert("Please select at least one event");
      return;
    }

    try {
      const res = await fetch("/api/console/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: newWebhookUrl,
          events: newWebhookEvents,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setWebhooks([...webhooks, data.webhook]);
        setDialogOpen(false);
        setNewWebhookUrl("");
        setNewWebhookEvents([]);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create webhook");
      }
    } catch (err) {
      console.error("Failed to create webhook:", err);
      alert("Failed to create webhook. Please try again.");
    }
  };

  const deleteWebhook = async (id: string) => {
    if (!confirm("Are you sure you want to delete this webhook?")) return;

    try {
      const res = await fetch(`/api/console/webhooks/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setWebhooks(webhooks.filter((w: any) => w.id !== id));
      } else {
        alert("Failed to delete webhook");
      }
    } catch (err) {
      console.error("Failed to delete webhook:", err);
      alert("Failed to delete webhook");
    }
  };

  const toggleWebhook = async (id: string, active: boolean) => {
    try {
      const res = await fetch(`/api/console/webhooks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });

      if (res.ok) {
        setWebhooks(webhooks.map((w) => (w.id === id ? { ...w, active: !active } : w)));
      }
    } catch (err) {
      console.error("Failed to toggle webhook:", err);
    }
  };

  const availableEvents = [
    "reconciliation.completed",
    "reconciliation.failed",
    "receipt.parsed",
    "receipt.failed",
    "feature_flag.updated",
    "usage.limit_exceeded",
    "billing.subscription_updated",
  ];

  return (
    <ConsoleErrorBoundary>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Webhooks</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Configure webhooks to receive real-time notifications about events.
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Webhook
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Webhook</DialogTitle>
                <DialogDescription>
                  Configure a webhook endpoint to receive event notifications.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="url">Webhook URL</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://your-app.com/webhooks/settler"
                    value={newWebhookUrl}
                    onChange={(e) => setNewWebhookUrl(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Events</Label>
                  <div className="space-y-2 mt-2">
                    {availableEvents.map((event) => (
                      <label key={event} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newWebhookEvents.includes(event)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewWebhookEvents([...newWebhookEvents, event]);
                            } else {
                              setNewWebhookEvents(newWebhookEvents.filter((e) => e !== event));
                            }
                          }}
                        />
                        <code className="text-sm">{event}</code>
                      </label>
                    ))}
                  </div>
                </div>
                <Button onClick={createWebhook} className="w-full">
                  Create Webhook
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : webhooks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-slate-600 dark:text-slate-400 mb-4">No webhooks configured yet.</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Webhook
              </Button>
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
                          <code className="text-sm truncate">{webhook.url}</code>
                          <a
                            href={webhook.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            <ExternalLink className="w-4 h-4" />
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
                          <Badge className="bg-green-500">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {webhook.lastTriggeredAt
                          ? format(new Date(webhook.lastTriggeredAt), "PPp")
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        {webhook.failureCount > 0 ? (
                          <span className="text-red-600">{webhook.failureCount}</span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleWebhook(webhook.id, webhook.active)}
                          >
                            {webhook.active ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteWebhook(webhook.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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
