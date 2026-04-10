"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { safeFetch } from "@/lib/safe-fetch";
import { ArrowLeft, Save, Play } from "lucide-react";
import { WORKFLOWS_CAPABILITY_MESSAGE } from "@/lib/workflows/capability";
import Link from "next/link";


interface WorkflowCapabilityResponse {
  automationCapability?: {
    state?: string;
    message?: string;
  };
}

export default function NewWorkflowPage() {
  const searchParams = useSearchParams();
  searchParams?.get("template"); // Template selection will be implemented later

  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState<
    "reconciliation.completed" | "anomaly.detected" | "receipt.parsed"
  >("reconciliation.completed");
  const [actionType, setActionType] = useState<"http_webhook" | "email" | "slack">("http_webhook");
  const [actionConfig, setActionConfig] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [capabilityUnavailable, setCapabilityUnavailable] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadCapability = async () => {
      const result = await safeFetch<WorkflowCapabilityResponse>("/api/workflows");
      if (cancelled) {
        return;
      }

      if (result.success) {
        setCapabilityUnavailable(result.data?.automationCapability?.state === "unavailable");
      } else {
        setCapabilityUnavailable(true);
      }
    };

    loadCapability();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    if (capabilityUnavailable) {
      return;
    }
    if (!name.trim()) {
      alert("Please enter a workflow name");
      return;
    }

    setSaving(true);
    const result = await safeFetch("/api/workflows", {
      method: "POST",
      body: JSON.stringify({
        name,
        trigger: { type: triggerType, config: {} },
        actions: [{ type: actionType, config: actionConfig }],
      }),
    });

    if (result.success) {
      window.location.href = "/console/workflows";
    } else {
      alert(result.error?.message || "Failed to create workflow");
    }
    setSaving(false);
  };

  const handleTest = async () => {
    if (capabilityUnavailable) {
      return;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/console/workflows">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Create Workflow</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Build a workflow that triggers actions based on events
          </p>
        </div>
      </div>

      {capabilityUnavailable && (
        <Card className="border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30">
          <CardHeader>
            <CardTitle className="text-amber-900 dark:text-amber-200">Limited operability</CardTitle>
            <CardDescription className="text-amber-800 dark:text-amber-300">
              {WORKFLOWS_CAPABILITY_MESSAGE}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Workflow Builder */}
        <Card>
          <CardHeader>
            <CardTitle>Workflow Builder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="workflow-name">Workflow Name</Label>
              <Input
                id="workflow-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Notify Team on Completion"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Trigger</Label>
              <Select value={triggerType} onValueChange={(v) => setTriggerType(v as any)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reconciliation.completed">Reconciliation Completed</SelectItem>
                  <SelectItem value="anomaly.detected">Anomaly Detected</SelectItem>
                  <SelectItem value="receipt.parsed">Receipt Parsed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Action</Label>
              <Select value={actionType} onValueChange={(v) => setActionType(v as any)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="http_webhook">HTTP Webhook</SelectItem>
                  <SelectItem value="email">Email Notification</SelectItem>
                  <SelectItem value="slack">Slack Webhook</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {actionType === "http_webhook" && (
              <div>
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <Input
                  id="webhook-url"
                  value={actionConfig.url || ""}
                  onChange={(e) => setActionConfig({ ...actionConfig, url: e.target.value })}
                  placeholder="https://example.com/webhook"
                  className="mt-1"
                />
              </div>
            )}

            {actionType === "email" && (
              <div>
                <Label htmlFor="email-to">Email To</Label>
                <Input
                  id="email-to"
                  type="email"
                  value={actionConfig.to || ""}
                  onChange={(e) => setActionConfig({ ...actionConfig, to: e.target.value })}
                  placeholder="team@example.com"
                  className="mt-1"
                />
              </div>
            )}

            {actionType === "slack" && (
              <div>
                <Label htmlFor="slack-webhook">Slack Webhook URL</Label>
                <Input
                  id="slack-webhook"
                  value={actionConfig.url || ""}
                  onChange={(e) => setActionConfig({ ...actionConfig, url: e.target.value })}
                  placeholder="https://hooks.slack.com/services/..."
                  className="mt-1"
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving || capabilityUnavailable} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Workflow"}
              </Button>
              <Button variant="outline" onClick={handleTest} disabled={capabilityUnavailable}>
                <Play className="w-4 h-4 mr-2" />
                Test
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>How your workflow will work</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
                  When
                </div>
                <div className="text-blue-800 dark:text-blue-300">
                  {triggerType === "reconciliation.completed" && "A reconciliation job completes"}
                  {triggerType === "anomaly.detected" && "An anomaly is detected"}
                  {triggerType === "receipt.parsed" && "A receipt is parsed"}
                </div>
              </div>

              <div className="text-center text-slate-400">↓</div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-sm font-semibold text-green-900 dark:text-green-200 mb-2">
                  Then
                </div>
                <div className="text-green-800 dark:text-green-300">
                  {actionType === "http_webhook" &&
                    `Send HTTP webhook to ${actionConfig.url || "[URL]"}`}
                  {actionType === "email" && `Send email to ${actionConfig.to || "[email]"}`}
                  {actionType === "slack" &&
                    `Send Slack message to ${actionConfig.url ? "webhook" : "[webhook]"}`}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
